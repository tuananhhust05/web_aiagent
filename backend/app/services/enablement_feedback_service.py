"""
Enablement Feedback Service
Handles cross-meeting aggregation, pattern detection, and feedback generation
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
import statistics
from app.models.enablement_feedback import (
    UserCallMetric,
    DetectedPattern,
    EnablementFeedbackCard,
    EnablementFeedbackResponse,
    AggregationResult,
    FeedbackType,
    FeedbackTheme,
    PatternCategory,
    FeedbackEvidence,
)


class EnablementFeedbackService:
    """
    Service for generating enablement feedback from meeting data.
    Implements the PRD architecture:
    1. Normalized Metrics Layer
    2. Aggregation Engine
    3. Pattern Detection
    4. Feedback Generation
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    # ========================================================================
    # 1. NORMALIZED METRICS LAYER
    # ========================================================================
    
    async def extract_and_store_metrics(self, meeting_id: str, user_id: str) -> Optional[UserCallMetric]:
        """
        Extract normalized metrics from a meeting and store them.
        This creates the normalized metrics layer from raw meeting data.
        """
        # Get meeting data
        meeting = await self.db.meetings.find_one({"_id": meeting_id, "user_id": user_id})
        if not meeting:
            return None
        
        # Get feedback data if available
        feedback = meeting.get("feedback_analysis", {})
        metrics_data = feedback.get("metrics", [])
        
        # Extract metrics from feedback
        talk_ratio = None
        questions_count = None
        filler_words = None
        
        for metric in metrics_data:
            label = metric.get("label", "").lower()
            value_str = metric.get("value", "")
            
            if "talk ratio" in label or "talk time" in label:
                # Extract percentage
                try:
                    talk_ratio = float(value_str.replace("%", "").strip()) / 100.0
                except:
                    pass
            elif "question" in label:
                try:
                    questions_count = int(value_str.split()[0])
                except:
                    pass
            elif "filler" in label:
                try:
                    filler_words = int(value_str.split()[0])
                except:
                    pass
        
        # Get sentiment from meeting
        sentiment_avg = None
        if "sentiment_avg" in meeting:
            sentiment_avg = meeting["sentiment_avg"]
        
        # Get quality score
        quality_score = feedback.get("quality_score")
        
        # Create normalized metric
        metric = UserCallMetric(
            user_id=user_id,
            meeting_id=meeting_id,
            talk_ratio=talk_ratio,
            questions_count=questions_count,
            filler_words_count=filler_words,
            sentiment_avg=sentiment_avg,
            quality_score=quality_score,
            created_at=meeting.get("created_at", datetime.utcnow()),
        )
        
        # Store in database
        metric_dict = metric.dict(by_alias=True, exclude={"id"})
        metric_dict["_id"] = f"{user_id}_{meeting_id}"
        
        await self.db.user_call_metrics.update_one(
            {"_id": metric_dict["_id"]},
            {"$set": metric_dict},
            upsert=True
        )
        
        return metric
    
    # ========================================================================
    # 2. AGGREGATION ENGINE
    # ========================================================================
    
    async def aggregate_metrics(
        self,
        user_id: str,
        days: int = 30,
        min_calls: int = 5
    ) -> Optional[AggregationResult]:
        """
        Aggregate metrics across a time window.
        Returns None if insufficient data.
        """
        window_end = datetime.utcnow()
        window_start = window_end - timedelta(days=days)
        
        # Get all metrics in window
        metrics_cursor = self.db.user_call_metrics.find({
            "user_id": user_id,
            "created_at": {"$gte": window_start, "$lte": window_end}
        })
        
        metrics = await metrics_cursor.to_list(length=None)
        
        if len(metrics) < min_calls:
            return None
        
        # Extract values for aggregation
        talk_ratios = [m["talk_ratio"] for m in metrics if m.get("talk_ratio") is not None]
        questions = [m["questions_count"] for m in metrics if m.get("questions_count") is not None]
        discovery_times = [m["discovery_duration_seconds"] for m in metrics if m.get("discovery_duration_seconds") is not None]
        sentiments = [m["sentiment_avg"] for m in metrics if m.get("sentiment_avg") is not None]
        
        # Calculate aggregations
        result = AggregationResult(
            user_id=user_id,
            window_start=window_start,
            window_end=window_end,
            total_calls=len(metrics),
        )
        
        # Talk ratio aggregation
        if talk_ratios:
            result.talk_ratio_median = statistics.median(talk_ratios)
            result.talk_ratio_variance = statistics.variance(talk_ratios) if len(talk_ratios) > 1 else 0
            result.calls_high_talk_ratio = sum(1 for tr in talk_ratios if tr > 0.6)
        
        # Questions aggregation
        if questions:
            result.questions_mean = statistics.mean(questions)
            result.calls_low_questions = sum(1 for q in questions if q < 3)
        
        # Discovery aggregation
        if discovery_times:
            result.discovery_mean_seconds = statistics.mean(discovery_times)
            result.calls_short_discovery = sum(1 for d in discovery_times if d < 240)
        
        # Objection aggregation
        objections_detected = sum(1 for m in metrics if m.get("objection_detected"))
        if len(metrics) > 0:
            result.objection_frequency = objections_detected / len(metrics)
        
        objections_handled = sum(1 for m in metrics if m.get("objection_handled"))
        if objections_detected > 0:
            result.objection_handled_rate = objections_handled / objections_detected
        
        # Sentiment aggregation
        if sentiments:
            result.sentiment_avg = statistics.mean(sentiments)
            # Simple trend: compare first half vs second half
            if len(sentiments) >= 4:
                mid = len(sentiments) // 2
                first_half_avg = statistics.mean(sentiments[:mid])
                second_half_avg = statistics.mean(sentiments[mid:])
                result.sentiment_trend_slope = second_half_avg - first_half_avg
        
        return result
    
    # ========================================================================
    # 3. PATTERN DETECTION
    # ========================================================================
    
    async def detect_patterns(
        self,
        user_id: str,
        aggregation: AggregationResult
    ) -> List[DetectedPattern]:
        """
        Detect patterns from aggregated metrics.
        A pattern exists when the same signal appears in X% of calls.
        """
        patterns = []
        
        # Pattern 1: High talk ratio
        if aggregation.talk_ratio_median and aggregation.talk_ratio_median > 0.6:
            pct = (aggregation.calls_high_talk_ratio / aggregation.total_calls) * 100
            if pct >= 65:  # Appears in 65%+ of calls
                pattern = DetectedPattern(
                    user_id=user_id,
                    pattern_id="talk_ratio_high",
                    category=PatternCategory.COMMUNICATION,
                    confidence=min(pct / 100, 0.95),
                    evidence_count=aggregation.calls_high_talk_ratio,
                    total_calls_analyzed=aggregation.total_calls,
                    pattern_description=f"Talk ratio exceeds 60% in {pct:.0f}% of calls",
                    threshold_met=True,
                    first_seen=aggregation.window_start,
                    analysis_window_days=30,
                )
                patterns.append(pattern)
        
        # Pattern 2: Low questions
        if aggregation.questions_mean and aggregation.questions_mean < 3:
            pct = (aggregation.calls_low_questions / aggregation.total_calls) * 100
            if pct >= 60:
                pattern = DetectedPattern(
                    user_id=user_id,
                    pattern_id="questions_low",
                    category=PatternCategory.DISCOVERY,
                    confidence=min(pct / 100, 0.90),
                    evidence_count=aggregation.calls_low_questions,
                    total_calls_analyzed=aggregation.total_calls,
                    pattern_description=f"Fewer than 3 questions asked in {pct:.0f}% of calls",
                    threshold_met=True,
                    first_seen=aggregation.window_start,
                    analysis_window_days=30,
                )
                patterns.append(pattern)
        
        # Pattern 3: Short discovery phase
        if aggregation.discovery_mean_seconds and aggregation.discovery_mean_seconds < 240:
            pct = (aggregation.calls_short_discovery / aggregation.total_calls) * 100
            if pct >= 65:
                pattern = DetectedPattern(
                    user_id=user_id,
                    pattern_id="discovery_short",
                    category=PatternCategory.DISCOVERY,
                    confidence=min(pct / 100, 0.88),
                    evidence_count=aggregation.calls_short_discovery,
                    total_calls_analyzed=aggregation.total_calls,
                    pattern_description=f"Discovery phase under 4 minutes in {pct:.0f}% of calls",
                    threshold_met=True,
                    first_seen=aggregation.window_start,
                    analysis_window_days=30,
                )
                patterns.append(pattern)
        
        # Pattern 4: Declining sentiment
        if aggregation.sentiment_trend_slope and aggregation.sentiment_trend_slope < -0.1:
            pattern = DetectedPattern(
                user_id=user_id,
                pattern_id="sentiment_declining",
                category=PatternCategory.ENGAGEMENT,
                confidence=0.75,
                evidence_count=aggregation.total_calls,
                total_calls_analyzed=aggregation.total_calls,
                pattern_description="Sentiment shows declining trend over time",
                threshold_met=True,
                first_seen=aggregation.window_start,
                analysis_window_days=30,
            )
            patterns.append(pattern)
        
        return patterns
    
    # ========================================================================
    # 4. FEEDBACK GENERATION
    # ========================================================================
    
    def generate_feedback_from_patterns(
        self,
        patterns: List[DetectedPattern],
        aggregation: AggregationResult
    ) -> Tuple[List[EnablementFeedbackCard], List[EnablementFeedbackCard], List[EnablementFeedbackCard]]:
        """
        Generate feedback cards from detected patterns.
        Returns (observations, risk_signals, improvements)
        """
        observations = []
        risk_signals = []
        improvements = []
        
        for pattern in patterns:
            if pattern.pattern_id == "talk_ratio_high":
                # This is an observation + improvement opportunity
                obs_card = EnablementFeedbackCard(
                    id=f"obs_{pattern.pattern_id}",
                    type=FeedbackType.OBSERVATION,
                    theme=FeedbackTheme.COMMUNICATION,
                    title="You tend to talk more than the prospect",
                    description=f"In {pattern.evidence_count} out of {pattern.total_calls_analyzed} recent calls, your talk ratio exceeded 60%. The ideal range is 40-50% to ensure prospects feel heard.",
                    evidence=FeedbackEvidence(
                        calls_analyzed=pattern.total_calls_analyzed,
                        calls_above_threshold=pattern.evidence_count,
                        metric_average=aggregation.talk_ratio_median,
                    ),
                    confidence=pattern.confidence,
                    suggestions=[
                        "Ask more open-ended questions to encourage prospect participation",
                        "Practice active listening and pause after asking questions",
                        "Aim for a 40-50% talk ratio in your next 5 calls"
                    ],
                    priority=3,
                )
                observations.append(obs_card)
                
                imp_card = EnablementFeedbackCard(
                    id=f"imp_{pattern.pattern_id}",
                    type=FeedbackType.IMPROVEMENT,
                    theme=FeedbackTheme.COMMUNICATION,
                    title="Balance talk time with prospect engagement",
                    description="Reducing your talk ratio will create more space for prospect input and build stronger rapport.",
                    evidence=FeedbackEvidence(
                        calls_analyzed=pattern.total_calls_analyzed,
                        calls_above_threshold=pattern.evidence_count,
                    ),
                    confidence=pattern.confidence,
                    suggestions=[
                        "Set a timer reminder to check talk ratio mid-call",
                        "Use the '3 questions before pitching' rule",
                        "Record yourself and review talk patterns"
                    ],
                    priority=2,
                )
                improvements.append(imp_card)
            
            elif pattern.pattern_id == "questions_low":
                obs_card = EnablementFeedbackCard(
                    id=f"obs_{pattern.pattern_id}",
                    type=FeedbackType.OBSERVATION,
                    theme=FeedbackTheme.DISCOVERY,
                    title="Limited questions during discovery",
                    description=f"You asked fewer than 3 questions in {pattern.evidence_count} of your last {pattern.total_calls_analyzed} calls. Top performers typically ask 5-8 discovery questions.",
                    evidence=FeedbackEvidence(
                        calls_analyzed=pattern.total_calls_analyzed,
                        calls_below_threshold=pattern.evidence_count,
                        metric_average=aggregation.questions_mean,
                    ),
                    confidence=pattern.confidence,
                    suggestions=[
                        "Prepare 5-7 discovery questions before each call",
                        "Use SPIN selling framework (Situation, Problem, Implication, Need-payoff)",
                        "Follow up on prospect answers with clarifying questions"
                    ],
                    priority=3,
                )
                observations.append(obs_card)
                
                risk_card = EnablementFeedbackCard(
                    id=f"risk_{pattern.pattern_id}",
                    type=FeedbackType.RISK_SIGNAL,
                    theme=FeedbackTheme.DISCOVERY,
                    title="Insufficient discovery may impact deal quality",
                    description="Without adequate discovery questions, you may miss critical pain points and decision criteria.",
                    evidence=FeedbackEvidence(
                        calls_analyzed=pattern.total_calls_analyzed,
                        calls_below_threshold=pattern.evidence_count,
                    ),
                    confidence=pattern.confidence,
                    suggestions=[
                        "Block 10-15 minutes for discovery in your call structure",
                        "Don't pitch until you've uncovered at least 3 pain points"
                    ],
                    priority=2,
                )
                risk_signals.append(risk_card)
            
            elif pattern.pattern_id == "discovery_short":
                obs_card = EnablementFeedbackCard(
                    id=f"obs_{pattern.pattern_id}",
                    type=FeedbackType.OBSERVATION,
                    theme=FeedbackTheme.DISCOVERY,
                    title="Discovery phase is often short",
                    description=f"In {pattern.evidence_count} of your recent calls, discovery lasted less than 4 minutes. Research shows 8-12 minutes of discovery correlates with higher close rates.",
                    evidence=FeedbackEvidence(
                        calls_analyzed=pattern.total_calls_analyzed,
                        calls_below_threshold=pattern.evidence_count,
                        metric_average=aggregation.discovery_mean_seconds,
                    ),
                    confidence=pattern.confidence,
                    suggestions=[
                        "Spend at least 8 minutes understanding pains before presenting",
                        "Delay solution presentation until discovery is complete",
                        "Use a discovery checklist to ensure thorough coverage"
                    ],
                    priority=3,
                )
                observations.append(obs_card)
            
            elif pattern.pattern_id == "sentiment_declining":
                risk_card = EnablementFeedbackCard(
                    id=f"risk_{pattern.pattern_id}",
                    type=FeedbackType.RISK_SIGNAL,
                    theme=FeedbackTheme.ENGAGEMENT,
                    title="Prospect sentiment trending downward",
                    description="Recent calls show declining sentiment scores, which may indicate engagement issues or misalignment.",
                    evidence=FeedbackEvidence(
                        calls_analyzed=pattern.total_calls_analyzed,
                        metric_average=aggregation.sentiment_avg,
                    ),
                    confidence=pattern.confidence,
                    suggestions=[
                        "Review recent call recordings for tone and pacing issues",
                        "Increase personalization and relevance in your messaging",
                        "Check if you're addressing the right pain points"
                    ],
                    priority=1,
                )
                risk_signals.append(risk_card)
        
        return observations, risk_signals, improvements
    
    # ========================================================================
    # MAIN ENTRY POINT
    # ========================================================================
    
    async def generate_enablement_feedback(
        self,
        user_id: str,
        days: int = 30,
        min_calls: int = 5
    ) -> EnablementFeedbackResponse:
        """
        Main entry point: Generate complete enablement feedback for a user.
        
        This implements the full pipeline:
        1. Aggregate metrics across time window
        2. Detect patterns
        3. Generate feedback cards
        """
        # Step 1: Aggregate metrics
        aggregation = await self.aggregate_metrics(user_id, days, min_calls)
        
        if not aggregation:
            # Not enough data - return empty response
            return EnablementFeedbackResponse(
                user_id=user_id,
                analyzed_from=datetime.utcnow() - timedelta(days=days),
                analyzed_to=datetime.utcnow(),
                total_calls_analyzed=0,
                analysis_window_days=days,
                observations=[],
                risk_signals=[],
                improvements=[],
            )
        
        # Step 2: Detect patterns
        patterns = await self.detect_patterns(user_id, aggregation)
        
        # Step 3: Generate feedback cards
        observations, risk_signals, improvements = self.generate_feedback_from_patterns(
            patterns, aggregation
        )
        
        # Determine overall trend
        overall_trend = "stable"
        if aggregation.sentiment_trend_slope:
            if aggregation.sentiment_trend_slope > 0.05:
                overall_trend = "improving"
            elif aggregation.sentiment_trend_slope < -0.05:
                overall_trend = "declining"
        
        # Determine top strength and opportunity
        top_strength = None
        top_opportunity = None
        
        if aggregation.talk_ratio_median and aggregation.talk_ratio_median <= 0.5:
            top_strength = "Balanced talk ratio - you give prospects space to engage"
        elif aggregation.questions_mean and aggregation.questions_mean >= 5:
            top_strength = "Strong discovery - you ask plenty of questions"
        
        if improvements:
            top_opportunity = improvements[0].title
        elif risk_signals:
            top_opportunity = risk_signals[0].title
        
        return EnablementFeedbackResponse(
            user_id=user_id,
            analyzed_from=aggregation.window_start,
            analyzed_to=aggregation.window_end,
            total_calls_analyzed=aggregation.total_calls,
            analysis_window_days=days,
            observations=sorted(observations, key=lambda x: x.priority, reverse=True),
            risk_signals=sorted(risk_signals, key=lambda x: x.priority, reverse=True),
            improvements=sorted(improvements, key=lambda x: x.priority, reverse=True),
            overall_quality_trend=overall_trend,
            top_strength=top_strength,
            top_opportunity=top_opportunity,
        )

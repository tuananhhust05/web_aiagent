"""
Models for Enablement / General Feedback System
Cross-meeting, longitudinal feedback for skill-level intelligence
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class FeedbackType(str, Enum):
    """Type of feedback card"""
    OBSERVATION = "observation"
    RISK_SIGNAL = "risk_signal"
    IMPROVEMENT = "improvement"


class FeedbackTheme(str, Enum):
    """Theme categories for feedback"""
    COMMUNICATION = "communication"
    DISCOVERY = "discovery"
    OBJECTION_HANDLING = "objection_handling"
    CLOSING = "closing"
    PACING = "pacing"
    ENGAGEMENT = "engagement"


class PatternCategory(str, Enum):
    """Pattern detection categories"""
    COMMUNICATION = "communication"
    DISCOVERY = "discovery"
    OBJECTION = "objection"
    PACING = "pacing"


# ============================================================================
# Normalized Metrics Layer
# ============================================================================

class UserCallMetric(BaseModel):
    """
    Normalized metrics for a single call.
    This layer sits between raw call data and aggregation.
    """
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    meeting_id: str
    
    # Communication metrics
    talk_ratio: Optional[float] = Field(None, description="Talk ratio 0.0-1.0")
    avg_monologue_seconds: Optional[float] = Field(None, description="Average monologue duration")
    questions_count: Optional[int] = Field(None, description="Number of questions asked")
    filler_words_count: Optional[int] = Field(None, description="Number of filler words")
    
    # Discovery metrics
    discovery_duration_seconds: Optional[int] = Field(None, description="Time spent on discovery")
    decision_maker_mentioned: Optional[bool] = Field(None, description="Whether decision maker was mentioned")
    
    # Objection metrics
    objection_detected: Optional[bool] = Field(None, description="Whether objection was detected")
    objection_types: Optional[List[str]] = Field(default_factory=list, description="Types of objections")
    objection_handled: Optional[bool] = Field(None, description="Whether objection was handled")
    
    # Sentiment & quality
    sentiment_avg: Optional[float] = Field(None, description="Average sentiment 0.0-1.0")
    quality_score: Optional[int] = Field(None, description="Overall quality score 0-100")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True
        populate_by_name = True


# ============================================================================
# Pattern Detection Layer
# ============================================================================

class DetectedPattern(BaseModel):
    """
    A detected pattern across multiple calls.
    Represents a consistent behavior or issue.
    """
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    pattern_id: str = Field(..., description="Unique identifier for pattern type")
    category: PatternCategory
    
    # Pattern evidence
    confidence: float = Field(..., description="Confidence score 0.0-1.0")
    evidence_count: int = Field(..., description="Number of calls supporting this pattern")
    total_calls_analyzed: int = Field(..., description="Total calls in analysis window")
    
    # Pattern details
    pattern_description: str
    threshold_met: bool = Field(..., description="Whether pattern meets significance threshold")
    
    # Time tracking
    first_seen: datetime
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    analysis_window_days: int = Field(30, description="Days of data analyzed")
    
    class Config:
        from_attributes = True
        populate_by_name = True


# ============================================================================
# Enablement Feedback Generation
# ============================================================================

class FeedbackEvidence(BaseModel):
    """Evidence supporting a feedback item"""
    calls_analyzed: int
    calls_below_threshold: Optional[int] = None
    calls_above_threshold: Optional[int] = None
    metric_average: Optional[float] = None
    metric_median: Optional[float] = None


class EnablementFeedbackCard(BaseModel):
    """
    A single feedback card shown in the enablement sidebar.
    Provides coaching-oriented insights across meetings.
    """
    id: str = Field(..., description="Unique feedback card ID")
    type: FeedbackType
    theme: FeedbackTheme
    
    # Content
    title: str = Field(..., description="Short title for the feedback")
    description: str = Field(..., description="Detailed description")
    
    # Evidence
    evidence: FeedbackEvidence
    confidence: float = Field(..., description="Confidence score 0.0-1.0")
    
    # Actionable suggestions
    suggestions: List[str] = Field(default_factory=list, description="Actionable coaching suggestions")
    
    # Priority (higher = more important)
    priority: int = Field(1, description="Priority for display order")


class EnablementFeedbackResponse(BaseModel):
    """
    Complete response for enablement feedback sidebar.
    Contains aggregated insights across multiple meetings.
    """
    user_id: str
    
    # Analysis metadata
    analyzed_from: datetime
    analyzed_to: datetime
    total_calls_analyzed: int
    analysis_window_days: int
    
    # Feedback cards grouped by type
    observations: List[EnablementFeedbackCard] = Field(default_factory=list)
    risk_signals: List[EnablementFeedbackCard] = Field(default_factory=list)
    improvements: List[EnablementFeedbackCard] = Field(default_factory=list)
    
    # Overall summary
    overall_quality_trend: Optional[str] = Field(None, description="'improving', 'stable', or 'declining'")
    top_strength: Optional[str] = None
    top_opportunity: Optional[str] = None
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Aggregation Results
# ============================================================================

class AggregationResult(BaseModel):
    """
    Aggregated metrics across a time window.
    Used internally for pattern detection.
    """
    user_id: str
    window_start: datetime
    window_end: datetime
    
    # Aggregated values
    total_calls: int
    
    # Talk ratio aggregation
    talk_ratio_median: Optional[float] = None
    talk_ratio_variance: Optional[float] = None
    calls_high_talk_ratio: int = 0  # talk_ratio > 0.6
    
    # Questions aggregation
    questions_mean: Optional[float] = None
    calls_low_questions: int = 0  # questions < 3
    
    # Discovery aggregation
    discovery_mean_seconds: Optional[float] = None
    calls_short_discovery: int = 0  # discovery < 240 seconds (4 min)
    
    # Objection aggregation
    objection_frequency: float = 0.0  # % of calls with objections
    objection_handled_rate: Optional[float] = None  # % of objections handled
    
    # Sentiment
    sentiment_avg: Optional[float] = None
    sentiment_trend_slope: Optional[float] = None  # Positive = improving
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

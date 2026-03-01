"""
Q&A Engine Service
AI-driven, knowledge-grounded system for extracting and answering questions from calls.

Flow:
1. Call Insights -> Extract questions/objections from transcript
2. Knowledge Module -> Ground answers in uploaded documents
3. AI Fallback -> Generate answer if no knowledge found
4. Store in Q&A Engine -> Draft status, pending review
"""
import asyncio
import aiohttp
import json
import logging
from typing import Optional, Dict, List, Any, Tuple
from datetime import datetime
from bson import ObjectId

from app.core.config import settings
from app.core.database import get_database, get_weaviate
from app.services.vectorization import vectorize_text

logger = logging.getLogger(__name__)

# Knowledge categories to search for grounding
KNOWLEDGE_CATEGORIES = [
    {"mongo": "AtlasProductInfo", "weaviate": "AtlasProductInfo", "name": "Product Info"},
    {"mongo": "AtlasPricingPlan", "weaviate": "AtlasPricingPlan", "name": "Pricing"},
    {"mongo": "AtlasObjectionHandling", "weaviate": "AtlasObjectionHandling", "name": "Objection Handling"},
    {"mongo": "AtlasCompetitiveIntel", "weaviate": "AtlasCompetitiveIntel", "name": "Competitive Intel"},
    {"mongo": "AtlasCustomerFaqs", "weaviate": "AtlasCustomerFaqs", "name": "FAQs"},
    {"mongo": "AtlasCompanyPolicies", "weaviate": "AtlasCompanyPolicies", "name": "Company Policies"},
]


async def extract_questions_from_transcript(
    transcript: str,
    call_id: Optional[str] = None,
    meeting_id: Optional[str] = None,
    meeting_title: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Step 1: Extract questions and objections from call transcript using AI.
    
    Returns list of:
    {
        "question_text": str,
        "objection_type": str,  # pricing, feature, timing, competitor, general
        "classification": str,  # product, service, general
        "confidence": float,
        "context": str,  # surrounding context from transcript
    }
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not configured, cannot extract questions")
        return []
    
    if not transcript or len(transcript.strip()) < 50:
        logger.info("Transcript too short to extract questions")
        return []
    
    # Truncate to save API costs - ~1500 tokens worth of text
    max_chars = 4000
    if len(transcript) > max_chars:
        transcript = transcript[-max_chars:]
    
    prompt = f"""Extract ONLY real BUSINESS questions from this sales call transcript.

VALID questions (extract these):
- Questions about product features, pricing, plans, capabilities
- Questions about implementation, integration, support
- Objections about cost, timing, competitors
- Concerns about security, reliability, scalability

INVALID (DO NOT extract):
- Casual chat: "see you tomorrow", "have dinner", "how are you"
- Scheduling: "what time", "when can we meet"
- Personal talk: "I miss", "I thought", "I haven't another topic"
- Greetings, small talk, pleasantries

TRANSCRIPT:
{transcript}

Return JSON: {{"questions": [{{"question_text": "What is your pricing?", "objection_type": "pricing", "classification": "service", "confidence": 0.9}}]}}

Rules:
- Max 3 questions
- Only BUSINESS-related questions about product/service
- Return {{"questions": []}} if no valid business questions found"""

    try:
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",  # Use smaller model to save tokens
            "messages": [
                {"role": "system", "content": "You extract customer questions from sales transcripts. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 500,
            "response_format": {"type": "json_object"}
        }
        
        # Retry logic for rate limits
        max_retries = 2
        for attempt in range(max_retries + 1):
            async with aiohttp.ClientSession() as session:
                async with session.post(groq_url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=60)) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        data = json.loads(content)
                        questions = data.get("questions", [])
                        
                        # Add source metadata
                        for q in questions:
                            q["source_call_id"] = call_id
                            q["source_meeting_id"] = meeting_id
                            q["source_meeting_title"] = meeting_title
                        
                        logger.info(f"✅ [Q&A Engine] Extracted {len(questions)} questions from transcript")
                        return questions
                    elif response.status == 429 and attempt < max_retries:
                        # Rate limited - wait and retry
                        wait_time = 3 * (attempt + 1)  # 3s, 6s
                        logger.warning(f"⚠️ [Q&A Engine] Rate limited, waiting {wait_time}s before retry...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        error = await response.text()
                        logger.error(f"❌ [Q&A Engine] Groq API error: {response.status} - {error}")
                        return []
        return []
    except Exception as e:
        logger.error(f"❌ [Q&A Engine] Error extracting questions: {e}")
        return []


async def search_knowledge_for_answer(
    question: str,
    organization_id: str,
    top_k: int = 5,
) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    """
    Step 2: Search Knowledge base for relevant content to ground the answer.
    
    Returns:
    - grounded_context: Combined relevant text from knowledge base
    - sources: List of source documents with metadata
    """
    weaviate_client = get_weaviate()
    if not weaviate_client:
        logger.warning("Weaviate not available for knowledge grounding")
        return None, []
    
    try:
        # Vectorize the question
        question_vector = vectorize_text(question)
        if not question_vector:
            return None, []
        
        all_results = []
        
        # Search across all knowledge categories
        for cat in KNOWLEDGE_CATEGORIES:
            try:
                collection = weaviate_client.collections.get(cat["weaviate"])
                
                # Vector search
                results = collection.query.near_vector(
                    near_vector=question_vector,
                    limit=top_k,
                    return_metadata=["distance"],
                )
                
                for obj in results.objects:
                    props = obj.properties
                    distance = obj.metadata.distance if obj.metadata else 1.0
                    similarity = 1 - distance  # Convert distance to similarity
                    
                    if similarity > 0.5:  # Only include relevant results
                        all_results.append({
                            "content": props.get("content", ""),
                            "doc_id": props.get("doc_id"),
                            "category": cat["name"],
                            "similarity": similarity,
                        })
            except Exception as e:
                logger.debug(f"Could not search {cat['weaviate']}: {e}")
                continue
        
        if not all_results:
            return None, []
        
        # Sort by similarity and take top results
        all_results.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = all_results[:top_k]
        
        # Combine content for grounding
        grounded_context = "\n\n".join([
            f"[{r['category']}] {r['content']}"
            for r in top_results
        ])
        
        # Get source document info
        db = get_database()
        sources = []
        seen_docs = set()
        
        for r in top_results:
            doc_id = r.get("doc_id")
            if doc_id and doc_id not in seen_docs:
                seen_docs.add(doc_id)
                # Try to find doc name from any category
                for cat in KNOWLEDGE_CATEGORIES:
                    doc = await db[cat["mongo"]].find_one({"_id": doc_id})
                    if doc:
                        sources.append({
                            "doc_id": doc_id,
                            "doc_name": doc.get("name", "Unknown"),
                            "category": cat["name"],
                            "similarity": r["similarity"],
                        })
                        break
        
        logger.info(f"✅ [Q&A Engine] Found {len(top_results)} relevant knowledge chunks")
        return grounded_context, sources
        
    except Exception as e:
        logger.error(f"❌ [Q&A Engine] Error searching knowledge: {e}")
        return None, []


async def generate_grounded_answer(
    question: str,
    grounded_context: Optional[str],
    classification: str = "general",
) -> Tuple[str, float, bool]:
    """
    Step 3: Generate answer using AI, grounded in knowledge if available.
    
    Returns:
    - answer: The generated answer
    - confidence: AI confidence in the answer
    - is_grounded: Whether answer is based on knowledge
    """
    if not settings.GROQ_API_KEY:
        return "Unable to generate answer - AI not configured", 0.0, False
    
    is_grounded = bool(grounded_context and len(grounded_context) > 50)
    
    # Truncate context to save tokens
    if grounded_context and len(grounded_context) > 1500:
        grounded_context = grounded_context[:1500]
    
    if is_grounded:
        prompt = f"""Answer using ONLY this knowledge:

{grounded_context}

Question: {question}

Return JSON: {{"answer": "2-3 sentences", "confidence": 0.85, "sources_used": true}}"""
    else:
        prompt = f"""Generate a brief general response to: {question}

Return JSON: {{"answer": "2-3 sentences, suggest contact sales for details", "confidence": 0.5, "sources_used": false}}"""

    try:
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",  # Use smaller model to save tokens
            "messages": [
                {"role": "system", "content": "You are a sales assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 500,
            "response_format": {"type": "json_object"}
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(groq_url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    data = json.loads(content)
                    
                    answer = data.get("answer", "Unable to generate answer")
                    confidence = float(data.get("confidence", 0.5))
                    
                    logger.info(f"✅ [Q&A Engine] Generated {'grounded' if is_grounded else 'fallback'} answer")
                    return answer, confidence, is_grounded
                else:
                    error = await response.text()
                    logger.error(f"❌ [Q&A Engine] Groq API error: {error}")
                    return "Unable to generate answer", 0.0, False
    except Exception as e:
        logger.error(f"❌ [Q&A Engine] Error generating answer: {e}")
        return "Unable to generate answer", 0.0, False


async def generate_simple_answer(
    question: str,
    classification: str = "general",
) -> Tuple[str, float]:
    """
    Generate a simple draft answer for a question (no knowledge lookup).
    Returns: (answer, confidence)
    """
    if not settings.GROQ_API_KEY:
        return "Please provide an answer for this question.", 0.0
    
    prompt = f"""Generate a brief, professional answer template for this sales question:

Question: {question}
Category: {classification}

Create a helpful answer that:
- Addresses the question directly
- Is professional and friendly
- Can be customized by sales team later

Return JSON: {{"answer": "2-3 sentence answer", "confidence": 0.6}}"""

    try:
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a sales assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 300,
            "response_format": {"type": "json_object"}
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(groq_url, json=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    data = json.loads(content)
                    
                    answer = data.get("answer", "Please provide an answer for this question.")
                    confidence = float(data.get("confidence", 0.5))
                    
                    logger.info(f"✅ [Q&A Engine] Generated simple answer")
                    return answer, confidence
                else:
                    error = await response.text()
                    logger.error(f"❌ [Q&A Engine] Groq API error: {error}")
                    return "Please provide an answer for this question.", 0.0
    except Exception as e:
        logger.error(f"❌ [Q&A Engine] Error generating simple answer: {e}")
        return "Please provide an answer for this question.", 0.0


async def process_transcript_to_qna(
    transcript: str,
    organization_id: str,
    user_id: str,
    user_name: str,
    call_id: Optional[str] = None,
    meeting_id: Optional[str] = None,
    meeting_title: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Full pipeline: Extract questions from transcript, ground in knowledge, generate answers, store in Q&A Engine.
    
    Returns list of created Q&A records.
    """
    db = get_database()
    qna_coll = db.atlas_qna
    created_qnas = []
    
    # Step 1: Extract questions from transcript
    questions = await extract_questions_from_transcript(
        transcript=transcript,
        call_id=call_id,
        meeting_id=meeting_id,
        meeting_title=meeting_title,
    )
    
    if not questions:
        logger.info("[Q&A Engine] No questions extracted from transcript")
        return []
    
    now = datetime.utcnow()
    
    for q in questions:
        question_text = q.get("question_text", "")
        if not question_text:
            continue
        
        # Check if similar question already exists
        existing = await qna_coll.find_one({
            "organization_id": organization_id,
            "question": {"$regex": question_text[:50], "$options": "i"}
        })
        if existing:
            logger.info(f"[Q&A Engine] Similar question already exists, skipping: {question_text[:50]}...")
            continue
        
        # Generate answer directly (no knowledge lookup for now)
        answer, ai_confidence = await generate_simple_answer(
            question=question_text,
            classification=q.get("classification", "general"),
        )
        
        # Step 4: Store in Q&A Engine (draft status, pending review)
        qna_doc = {
            "organization_id": organization_id,
            "created_by_user_id": user_id,
            "created_by_user_name": user_name,
            "question": question_text,
            "answer": answer,
            "classification": q.get("classification", "general"),
            "topic": q.get("objection_type"),
            "product_tag": None,
            "service_tag": None,
            "status": "draft",  # Pending review
            "origin": "ai_call_extracted",
            "is_grounded": False,
            "grounding_confidence": None,
            "ai_confidence": ai_confidence,
            "source_call_id": call_id,
            "source_meeting_id": meeting_id,
            "source_meeting_title": meeting_title,
            "source_doc_id": None,
            "source_doc_name": None,
            "usage_count": 0,
            "last_used_at": None,
            "growth_percent": None,
            "friction_score": q.get("confidence", 0.5),
            "recurring_intensity": None,
            "approved_by_user_id": None,
            "approved_by_user_name": None,
            "approved_at": None,
            "created_at": now,
            "updated_at": now,
        }
        
        result = await qna_coll.insert_one(qna_doc)
        qna_doc["_id"] = result.inserted_id
        qna_doc["id"] = str(result.inserted_id)
        
        created_qnas.append(qna_doc)
        logger.info(f"✅ [Q&A Engine] Created Q&A: {question_text[:50]}...")
    
    logger.info(f"✅ [Q&A Engine] Pipeline complete: {len(created_qnas)} Q&As created from transcript")
    return created_qnas


async def extract_qna_from_meeting(meeting_id: str, user_id: str, user_name: str) -> List[Dict[str, Any]]:
    """
    Extract Q&A from a specific meeting's transcript.
    """
    db = get_database()
    
    # Get meeting
    meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    if not meeting:
        logger.warning(f"[Q&A Engine] Meeting {meeting_id} not found")
        return []
    
    # transcript_lines is an array like: [{speaker, role, time, text}, ...]
    transcript_lines = meeting.get("transcript_lines", [])
    if not transcript_lines:
        logger.info(f"[Q&A Engine] Meeting {meeting_id} has no transcript_lines")
        return []
    
    # Convert transcript_lines to text format
    transcript_parts = []
    for line in transcript_lines:
        speaker = line.get("speaker", "Unknown")
        role = line.get("role", "")
        text = line.get("text", "")
        time = line.get("time", "")
        
        if role:
            transcript_parts.append(f"[{speaker} ({role}) - {time}]: {text}")
        else:
            transcript_parts.append(f"[{speaker} - {time}]: {text}")
    
    transcript = "\n".join(transcript_parts)
    
    if len(transcript.strip()) < 50:
        logger.info(f"[Q&A Engine] Meeting {meeting_id} transcript too short ({len(transcript)} chars)")
        return []
    
    logger.info(f"[Q&A Engine] Processing meeting {meeting_id} with {len(transcript_lines)} transcript lines ({len(transcript)} chars)")
    
    # Get company_id from user (for organization isolation)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    # Use company_id if available, otherwise use user_id as org_id
    org_id = str(user.get("company_id")) if user and user.get("company_id") else str(user_id)
    logger.info(f"[Q&A Engine] User {user_id} -> org_id={org_id}, company_id={user.get('company_id') if user else 'N/A'}")
    
    return await process_transcript_to_qna(
        transcript=transcript,
        organization_id=org_id,
        user_id=user_id,
        user_name=user_name,
        meeting_id=meeting_id,
        meeting_title=meeting.get("title", ""),
    )

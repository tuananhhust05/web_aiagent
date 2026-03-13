"""
AI Sales Copilot Service
Analyzes customer conversations and provides insights, recommendations, and sales scripts.
"""
import asyncio
import aiohttp
import json
import logging
import re
from typing import Optional, Dict, List, Any
from app.core.config import settings
from app.core.database import get_database
from datetime import datetime

logger = logging.getLogger(__name__)

# Rough token estimation: ~4 characters per token
def estimate_tokens(text: str) -> int:
    """Estimate token count from text (rough approximation: ~4 chars per token)"""
    return len(text) // 4

def truncate_text_from_start(text: str, max_tokens: int) -> str:
    """Truncate text from the start if it exceeds max_tokens"""
    estimated_tokens = estimate_tokens(text)
    if estimated_tokens <= max_tokens:
        return text
    
    # Calculate how many characters to remove from start
    excess_tokens = estimated_tokens - max_tokens
    excess_chars = excess_tokens * 4  # Rough estimate
    
    # Remove from start, but try to cut at a newline or sentence boundary
    truncated = text[excess_chars:]
    
    # Try to find a good cut point (newline or sentence end)
    for delimiter in ['\n\n', '\n', '. ', '! ', '? ']:
        idx = truncated.find(delimiter)
        if idx > 0 and idx < len(truncated) * 0.3:  # Don't cut too much
            truncated = truncated[idx + len(delimiter):]
            break
    
    return truncated


async def analyze_conversation_with_ai(
    conversation_history: List[Dict[str, Any]],
    customer_profile: Optional[Dict[str, Any]] = None,
    campaign_context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Analyze conversation history using Groq LLM to extract:
    - Customer needs
    - Buying intent and interest level
    - Pain points
    - Recommended next actions
    - Suggested responses
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [AI COPILOT] GROQ_API_KEY not configured")
            return None

        # Prepare conversation context
        conversation_text = ""
        for msg in conversation_history:
            msg_type = msg.get("type", "incoming")
            content = msg.get("content", "")
            timestamp = msg.get("created_at", "")
            role = "Customer" if msg_type == "incoming" else "Sales Rep"
            conversation_text += f"[{role} - {timestamp}]: {content}\n"

        # Prepare customer profile context
        customer_context = ""
        if customer_profile:
            customer_context = f"""
Customer Profile:
- Name: {customer_profile.get('first_name', '')} {customer_profile.get('last_name', '')}
- Company: {customer_profile.get('company', 'N/A')}
- Job Title: {customer_profile.get('job_title', 'N/A')}
- Email: {customer_profile.get('email', 'N/A')}
- Phone: {customer_profile.get('phone', 'N/A')}
"""

        # Prepare campaign context with full call script
        campaign_context_text = ""
        if campaign_context:
            call_script = campaign_context.get('call_script', 'N/A')
            campaign_context_text = f"""
Campaign Context:
- Campaign Name: {campaign_context.get('name', 'N/A')}
- Campaign Type: {campaign_context.get('type', 'N/A')}
- Call Script (Initial message sent to customer):
{call_script}
"""

        # Create comprehensive prompt
        prompt = f"""You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand customers and make better sales decisions.

{customer_context}

{campaign_context_text}

Conversation History:
{conversation_text}

Analyze this conversation and provide insights in the following JSON format:
{{
    "customer_needs": ["need1", "need2", "need3"],
    "buying_intent": "high|medium|low",
    "interest_level": "very_high|high|medium|low|very_low",
    "pain_points": ["pain1", "pain2"],
    "sentiment": "positive|neutral|negative",
    "funnel_stage": "lead|qualified|negotiation|close",
    "key_topics": ["topic1", "topic2", "topic3"],
    "objections": ["objection1", "objection2"],
    "recommended_actions": [
        {{
            "action": "action_description",
            "priority": "high|medium|low",
            "reason": "why this action is recommended"
        }}
    ],
    "suggested_responses": [
        {{
            "situation": "when to use this response",
            "response": "the suggested response text",
            "tone": "professional|friendly|empathetic"
        }}
    ],
    "next_best_questions": [
        "question1",
        "question2",
        "question3"
    ],
    "product_recommendations": [
        {{
            "product": "product_name",
            "reason": "why recommend this product",
            "fit_score": "high|medium|low"
        }}
    ],
    "summary": "Brief summary of the conversation and customer state"
}}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Be specific and actionable
- Base insights on actual conversation content
- Provide realistic recommendations
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",  # Using more capable model for analysis
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Copilot. Analyze sales conversations and provide actionable insights in JSON format. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,  # Lower temperature for more consistent analysis
            "max_tokens": settings.AI_COPILOT_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}  # Force JSON response
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        
                        # Parse JSON response
                        try:
                            insights = json.loads(content)
                            print(f"✅ [AI COPILOT] Analysis completed successfully")
                            return insights
                        except json.JSONDecodeError as e:
                            print(f"❌ [AI COPILOT] Failed to parse JSON response: {e}")
                            print(f"   - Response content: {content[:500]}")
                            return None
                    else:
                        print(f"⚠️ [AI COPILOT] No choices in response")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [AI COPILOT] API error: {response.status}")
                    print(f"   - Error: {error_text}")
                    return None

    except Exception as e:
        print(f"❌ [AI COPILOT] Error analyzing conversation: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def suggest_sales_script(
    conversation_history: List[Dict[str, Any]],
    situation: str,
    customer_profile: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Suggest a sales script or response for a specific situation.
    """
    try:
        if not settings.GROQ_API_KEY:
            return None

        conversation_text = "\n".join([
            f"[{'Customer' if msg.get('type') == 'incoming' else 'Sales Rep'}]: {msg.get('content', '')}"
            for msg in conversation_history[-5:]  # Last 5 messages for context
        ])

        customer_name = 'N/A'
        customer_company = 'N/A'
        if customer_profile:
            first_name = customer_profile.get('first_name', '')
            last_name = customer_profile.get('last_name', '')
            customer_name = f"{first_name} {last_name}".strip() if first_name or last_name else 'N/A'
            customer_company = customer_profile.get('company', 'N/A')

        prompt = f"""You are an AI Sales Copilot. Generate a professional, empathetic sales response.

Conversation Context:
{conversation_text}

Situation: {situation}

Customer Profile:
- Name: {customer_name}
- Company: {customer_company}

Generate a concise, professional response (2-3 sentences max) that:
- Addresses the situation appropriately
- Maintains a warm, helpful tone
- Moves the conversation forward
- Is personalized to the customer

Response:"""

        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Copilot. Generate professional, empathetic sales responses. Keep responses concise (2-3 sentences)."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 200
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        return choices[0].get("message", {}).get("content", "").strip()
                    return None
                return None

    except Exception as e:
        print(f"❌ [AI COPILOT] Error suggesting script: {str(e)}")
        return None


async def analyze_with_followup(
    conversation_history: List[Dict[str, Any]],
    previous_analysis: Optional[Dict[str, Any]],
    user_question: str,
    customer_profile: Optional[Dict[str, Any]] = None,
    campaign_context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Analyze conversation with follow-up question from user.
    Combines conversation history, previous analysis, and user question.
    Manages token limits by truncating from start if needed.
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [AI COPILOT] GROQ_API_KEY not configured")
            return None

        # Prepare conversation context
        conversation_text = ""
        for msg in conversation_history:
            msg_type = msg.get("type", "incoming")
            content = msg.get("content", "")
            timestamp = msg.get("created_at", "")
            role = "Customer" if msg_type == "incoming" else "Sales Rep"
            conversation_text += f"[{role} - {timestamp}]: {content}\n"

        # Prepare customer profile context
        customer_context = ""
        if customer_profile:
            customer_context = f"""
Customer Profile:
- Name: {customer_profile.get('first_name', '')} {customer_profile.get('last_name', '')}
- Company: {customer_profile.get('company', 'N/A')}
- Job Title: {customer_profile.get('job_title', 'N/A')}
- Email: {customer_profile.get('email', 'N/A')}
- Phone: {customer_profile.get('phone', 'N/A')}
"""

        # Prepare campaign context with full call script
        campaign_context_text = ""
        if campaign_context:
            call_script = campaign_context.get('call_script', 'N/A')
            campaign_context_text = f"""
Campaign Context:
- Campaign Name: {campaign_context.get('name', 'N/A')}
- Campaign Type: {campaign_context.get('type', 'N/A')}
- Call Script (Initial message sent to customer):
{call_script}
"""

        # Prepare previous analysis context
        previous_analysis_text = ""
        if previous_analysis:
            previous_analysis_text = f"""
Previous AI Analysis:
{json.dumps(previous_analysis, indent=2, ensure_ascii=False)}
"""

        # Prepare user question
        user_question_text = f"""
User's Follow-up Question:
{user_question}
"""

        # Combine all context
        full_context = f"""{customer_context}

{campaign_context_text}

Conversation History:
{conversation_text}

{previous_analysis_text}

{user_question_text}"""

        # Check token limit and truncate if needed
        estimated_tokens = estimate_tokens(full_context)
        if estimated_tokens > settings.AI_COPILOT_MAX_INPUT_TOKENS:
            print(f"⚠️ [AI COPILOT] Input exceeds token limit ({estimated_tokens} > {settings.AI_COPILOT_MAX_INPUT_TOKENS}), truncating from start...")
            # Truncate conversation history from start, but keep other context
            conversation_estimated = estimate_tokens(conversation_text)
            if conversation_estimated > 0:
                # Calculate how much to truncate from conversation
                excess_tokens = estimated_tokens - settings.AI_COPILOT_MAX_INPUT_TOKENS
                # Reserve tokens for other context (customer, campaign, analysis, question)
                other_context = f"{customer_context}\n\n{campaign_context_text}\n\n{previous_analysis_text}\n\n{user_question_text}"
                other_tokens = estimate_tokens(other_context)
                available_for_conversation = settings.AI_COPILOT_MAX_INPUT_TOKENS - other_tokens - 500  # Reserve buffer
                
                if available_for_conversation > 0:
                    conversation_text = truncate_text_from_start(conversation_text, available_for_conversation)
                    print(f"✅ [AI COPILOT] Truncated conversation to fit token limit")
                else:
                    # If other context is too large, truncate it too
                    print(f"⚠️ [AI COPILOT] Other context is large, truncating previous analysis...")
                    if previous_analysis_text:
                        prev_analysis_json = json.dumps(previous_analysis, indent=2, ensure_ascii=False)
                        truncated_analysis = truncate_text_from_start(prev_analysis_json, 2000)  # Limit analysis to ~2000 tokens
                        previous_analysis_text = f"\nPrevious AI Analysis:\n{truncated_analysis}\n"
                
                # Rebuild full context
                full_context = f"""{customer_context}

{campaign_context_text}

Conversation History:
{conversation_text}

{previous_analysis_text}

{user_question_text}"""

        # Create prompt for follow-up analysis
        prompt = f"""You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand customers and make better sales decisions.

{full_context}

Based on the conversation history, previous analysis, and the user's follow-up question, provide a comprehensive answer that:
1. Addresses the user's specific question
2. References relevant parts of the conversation
3. Incorporates insights from the previous analysis
4. Provides actionable recommendations

Return your response in JSON format:
{{
    "answer": "Direct answer to the user's question",
    "key_insights": ["insight1", "insight2", "insight3"],
    "recommendations": [
        {{
            "action": "action_description",
            "priority": "high|medium|low",
            "reason": "why this action is recommended"
        }}
    ],
    "relevant_conversation_points": ["point1", "point2"],
    "summary": "Brief summary of the analysis"
}}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Be specific and actionable
- Base insights on actual conversation content
- Directly answer the user's question
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",  # Using more capable model for follow-up analysis
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Copilot. Analyze sales conversations and provide actionable insights in JSON format. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": settings.AI_COPILOT_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        
                        # Parse JSON response
                        try:
                            insights = json.loads(content)
                            print(f"✅ [AI COPILOT] Follow-up analysis completed successfully")
                            return insights
                        except json.JSONDecodeError as e:
                            print(f"❌ [AI COPILOT] Failed to parse JSON response: {e}")
                            print(f"   - Response content: {content[:500]}")
                            return None
                    else:
                        print(f"⚠️ [AI COPILOT] No choices in response")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [AI COPILOT] API error: {response.status}")
                    print(f"   - Error: {error_text}")
                    return None

    except Exception as e:
        print(f"❌ [AI COPILOT] Error in follow-up analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def analyze_campaign_with_ai(
    all_conversations: List[Dict[str, Any]],
    campaign_context: Optional[Dict[str, Any]] = None,
    customer_profiles: Optional[List[Dict[str, Any]]] = None
) -> Optional[Dict[str, Any]]:
    """
    Analyze entire campaign at macro level using Groq LLM.
    Aggregates all conversations, customer profiles, and campaign context.
    Provides macro-level insights about the campaign performance.
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [AI COPILOT] GROQ_API_KEY not configured")
            return None

        # Prepare aggregated conversation summary
        total_conversations = len(all_conversations)
        total_messages = sum(len(conv.get('messages', [])) for conv in all_conversations)
        
        # Group conversations by contact
        conversations_by_contact = {}
        for conv in all_conversations:
            contact = conv.get('contact', 'Unknown')
            if contact not in conversations_by_contact:
                conversations_by_contact[contact] = []
            conversations_by_contact[contact].extend(conv.get('messages', []))
        
        # Prepare conversation summaries (sample from each contact to avoid token overflow)
        conversation_summaries = []
        for contact, messages in list(conversations_by_contact.items())[:50]:  # Limit to 50 contacts
            if messages:
                # Take sample messages (first, middle, last)
                sample_size = min(10, len(messages))
                sample_messages = []
                if len(messages) <= sample_size:
                    sample_messages = messages
                else:
                    # Take first few, middle few, and last few
                    step = len(messages) // sample_size
                    sample_messages = [messages[i] for i in range(0, len(messages), step)][:sample_size]
                    sample_messages.extend(messages[-3:])  # Add last 3
                    sample_messages = list(dict.fromkeys(sample_messages))  # Remove duplicates
                
                conversation_text = ""
                for msg in sample_messages:
                    msg_type = msg.get("type", "incoming")
                    content = msg.get("content", "")
                    timestamp = msg.get("created_at", "")
                    role = "Customer" if msg_type == "incoming" else "Sales Rep"
                    conversation_text += f"[{role} - {timestamp}]: {content}\n"
                
                conversation_summaries.append(f"Contact: {contact}\n{conversation_text}")

        conversations_text = "\n\n---\n\n".join(conversation_summaries)

        # Prepare campaign context with full call script
        campaign_context_text = ""
        if campaign_context:
            call_script = campaign_context.get('call_script', 'N/A')
            campaign_context_text = f"""
Campaign Context:
- Campaign Name: {campaign_context.get('name', 'N/A')}
- Campaign Type: {campaign_context.get('type', 'N/A')}
- Call Script (Initial message sent to customers):
{call_script}
"""

        # Prepare customer profiles summary
        customer_profiles_text = ""
        if customer_profiles:
            unique_companies = {}
            job_titles = {}
            for profile in customer_profiles[:100]:  # Limit to 100 profiles
                company = profile.get('company', '')
                job_title = profile.get('job_title', '')
                if company:
                    unique_companies[company] = unique_companies.get(company, 0) + 1
                if job_title:
                    job_titles[job_title] = job_titles.get(job_title, 0) + 1
            
            customer_profiles_text = f"""
Customer Profiles Summary:
- Total Contacts: {len(customer_profiles)}
- Unique Companies: {len(unique_companies)}
- Top Companies: {', '.join(list(unique_companies.keys())[:5])}
- Top Job Titles: {', '.join(list(job_titles.keys())[:5])}
"""

        # Combine all context
        full_context = f"""{campaign_context_text}

{customer_profiles_text}

Campaign Statistics:
- Total Conversations: {total_conversations}
- Total Messages: {total_messages}
- Average Messages per Conversation: {total_messages / total_conversations if total_conversations > 0 else 0:.1f}

Sample Conversations (representative samples from {min(50, len(conversations_by_contact))} contacts):
{conversations_text}"""

        # Check token limit and truncate if needed
        estimated_tokens = estimate_tokens(full_context)
        if estimated_tokens > settings.AI_COPILOT_MAX_INPUT_TOKENS:
            print(f"⚠️ [AI COPILOT] Campaign input exceeds token limit ({estimated_tokens} > {settings.AI_COPILOT_MAX_INPUT_TOKENS}), truncating...")
            # Truncate conversations from start
            available_tokens = settings.AI_COPILOT_MAX_INPUT_TOKENS - estimate_tokens(f"{campaign_context_text}\n\n{customer_profiles_text}\n\nCampaign Statistics:...") - 1000
            if available_tokens > 0:
                conversations_text = truncate_text_from_start(conversations_text, available_tokens)
                full_context = f"""{campaign_context_text}

{customer_profiles_text}

Campaign Statistics:
- Total Conversations: {total_conversations}
- Total Messages: {total_messages}
- Average Messages per Conversation: {total_messages / total_conversations if total_conversations > 0 else 0:.1f}

Sample Conversations (truncated to fit token limit):
{conversations_text}"""
                print(f"✅ [AI COPILOT] Truncated campaign conversations to fit token limit")

        # Create prompt for campaign-level analysis
        prompt = f"""You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand campaign performance at a macro level.

{full_context}

Analyze this entire campaign and provide macro-level insights in the following JSON format:
{{
    "campaign_summary": "Overall summary of the campaign performance and customer engagement",
    "total_conversations": {total_conversations},
    "total_messages": {total_messages},
    "engagement_rate": "high|medium|low",
    "response_rate": "high|medium|low",
    "overall_sentiment": "positive|neutral|negative",
    "common_customer_needs": ["need1", "need2", "need3"],
    "common_pain_points": ["pain1", "pain2", "pain3"],
    "common_objections": ["objection1", "objection2"],
    "key_topics_discussed": ["topic1", "topic2", "topic3"],
    "funnel_distribution": {{
        "lead": "percentage",
        "qualified": "percentage",
        "negotiation": "percentage",
        "close": "percentage"
    }},
    "buying_intent_distribution": {{
        "high": "percentage",
        "medium": "percentage",
        "low": "percentage"
    }},
    "campaign_strengths": ["strength1", "strength2"],
    "campaign_weaknesses": ["weakness1", "weakness2"],
    "recommended_improvements": [
        {{
            "improvement": "improvement_description",
            "priority": "high|medium|low",
            "reason": "why this improvement is recommended"
        }}
    ],
    "top_performing_aspects": ["aspect1", "aspect2"],
    "areas_for_optimization": ["area1", "area2"],
    "call_script_effectiveness": "effective|moderate|needs_improvement",
    "call_script_feedback": "Feedback on how well the call script resonates with customers",
    "next_steps_recommendations": [
        {{
            "action": "action_description",
            "priority": "high|medium|low",
            "reason": "why this action is recommended"
        }}
    ]
}}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Provide macro-level insights (not individual conversation details)
- Base insights on aggregated data from all conversations
- Focus on campaign-wide patterns and trends
- Provide actionable recommendations for campaign optimization
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",  # Using more capable model for campaign analysis
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Copilot. Analyze sales campaigns at a macro level and provide actionable insights in JSON format. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": settings.AI_COPILOT_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)  # Longer timeout for campaign analysis
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        
                        # Parse JSON response
                        try:
                            insights = json.loads(content)
                            print(f"✅ [AI COPILOT] Campaign analysis completed successfully")
                            return insights
                        except json.JSONDecodeError as e:
                            print(f"❌ [AI COPILOT] Failed to parse JSON response: {e}")
                            print(f"   - Response content: {content[:500]}")
                            return None
                    else:
                        print(f"⚠️ [AI COPILOT] No choices in response")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [AI COPILOT] API error: {response.status}")
                    print(f"   - Error: {error_text}")
                    return None

    except Exception as e:
        print(f"❌ [AI COPILOT] Error analyzing campaign: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def analyze_campaign_with_followup(
    all_conversations: List[Dict[str, Any]],
    previous_analysis: Optional[Dict[str, Any]],
    user_question: str,
    campaign_context: Optional[Dict[str, Any]] = None,
    customer_profiles: Optional[List[Dict[str, Any]]] = None
) -> Optional[Dict[str, Any]]:
    """
    Analyze campaign with follow-up question from user.
    Combines all conversations, previous analysis, and user question.
    Provides macro-level insights based on the follow-up question.
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [AI COPILOT] GROQ_API_KEY not configured")
            return None

        # Prepare aggregated conversation summary (similar to analyze_campaign_with_ai)
        total_conversations = len(all_conversations)
        total_messages = sum(len(conv.get('messages', [])) for conv in all_conversations)
        
        # Group conversations by contact
        conversations_by_contact = {}
        for conv in all_conversations:
            contact = conv.get('contact', 'Unknown')
            if contact not in conversations_by_contact:
                conversations_by_contact[contact] = []
            conversations_by_contact[contact].extend(conv.get('messages', []))
        
        # Prepare conversation summaries (sample from each contact to avoid token overflow)
        conversation_summaries = []
        for contact, messages in list(conversations_by_contact.items())[:50]:  # Limit to 50 contacts
            if messages:
                # Take sample messages (first, middle, last)
                sample_size = min(10, len(messages))
                sample_messages = []
                if len(messages) <= sample_size:
                    sample_messages = messages
                else:
                    # Take first few, middle few, and last few
                    step = len(messages) // sample_size
                    sample_messages = [messages[i] for i in range(0, len(messages), step)][:sample_size]
                    sample_messages.extend(messages[-3:])  # Add last 3
                    sample_messages = list(dict.fromkeys(sample_messages))  # Remove duplicates
                
                conversation_text = ""
                for msg in sample_messages:
                    msg_type = msg.get("type", "incoming")
                    content = msg.get("content", "")
                    timestamp = msg.get("created_at", "")
                    role = "Customer" if msg_type == "incoming" else "Sales Rep"
                    conversation_text += f"[{role} - {timestamp}]: {content}\n"
                
                conversation_summaries.append(f"Contact: {contact}\n{conversation_text}")

        conversations_text = "\n\n---\n\n".join(conversation_summaries)

        # Prepare campaign context with full call script
        campaign_context_text = ""
        if campaign_context:
            call_script = campaign_context.get('call_script', 'N/A')
            campaign_context_text = f"""
Campaign Context:
- Campaign Name: {campaign_context.get('name', 'N/A')}
- Campaign Type: {campaign_context.get('type', 'N/A')}
- Call Script (Initial message sent to customers):
{call_script}
"""

        # Prepare customer profiles summary
        customer_profiles_text = ""
        if customer_profiles:
            unique_companies = {}
            job_titles = {}
            for profile in customer_profiles[:100]:  # Limit to 100 profiles
                company = profile.get('company', '')
                job_title = profile.get('job_title', '')
                if company:
                    unique_companies[company] = unique_companies.get(company, 0) + 1
                if job_title:
                    job_titles[job_title] = job_titles.get(job_title, 0) + 1
            
            customer_profiles_text = f"""
Customer Profiles Summary:
- Total Contacts: {len(customer_profiles)}
- Unique Companies: {len(unique_companies)}
- Top Companies: {', '.join(list(unique_companies.keys())[:5])}
- Top Job Titles: {', '.join(list(job_titles.keys())[:5])}
"""

        # Prepare previous analysis context
        previous_analysis_text = ""
        if previous_analysis:
            previous_analysis_text = f"""
Previous Campaign Analysis:
{json.dumps(previous_analysis, indent=2, ensure_ascii=False)}
"""

        # Prepare user question
        user_question_text = f"""
User's Follow-up Question:
{user_question}
"""

        # Combine all context
        full_context = f"""{campaign_context_text}

{customer_profiles_text}

Campaign Statistics:
- Total Conversations: {total_conversations}
- Total Messages: {total_messages}
- Average Messages per Conversation: {total_messages / total_conversations if total_conversations > 0 else 0:.1f}

{previous_analysis_text}

Sample Conversations (representative samples from {min(50, len(conversations_by_contact))} contacts):
{conversations_text}

{user_question_text}"""

        # Check token limit and truncate if needed
        estimated_tokens = estimate_tokens(full_context)
        if estimated_tokens > settings.AI_COPILOT_MAX_INPUT_TOKENS:
            print(f"⚠️ [AI COPILOT] Campaign follow-up input exceeds token limit ({estimated_tokens} > {settings.AI_COPILOT_MAX_INPUT_TOKENS}), truncating...")
            # Truncate conversations from start, but keep other context
            other_context = f"{campaign_context_text}\n\n{customer_profiles_text}\n\nCampaign Statistics:...\n\n{previous_analysis_text}\n\n{user_question_text}"
            other_tokens = estimate_tokens(other_context)
            available_tokens = settings.AI_COPILOT_MAX_INPUT_TOKENS - other_tokens - 1000
            if available_tokens > 0:
                conversations_text = truncate_text_from_start(conversations_text, available_tokens)
                full_context = f"""{campaign_context_text}

{customer_profiles_text}

Campaign Statistics:
- Total Conversations: {total_conversations}
- Total Messages: {total_messages}
- Average Messages per Conversation: {total_messages / total_conversations if total_conversations > 0 else 0:.1f}

{previous_analysis_text}

Sample Conversations (truncated to fit token limit):
{conversations_text}

{user_question_text}"""
                print(f"✅ [AI COPILOT] Truncated campaign conversations to fit token limit")
            else:
                # If other context is too large, truncate previous analysis
                print(f"⚠️ [AI COPILOT] Other context is large, truncating previous analysis...")
                if previous_analysis_text:
                    prev_analysis_json = json.dumps(previous_analysis, indent=2, ensure_ascii=False)
                    truncated_analysis = truncate_text_from_start(prev_analysis_json, 2000)  # Limit analysis to ~2000 tokens
                    previous_analysis_text = f"\nPrevious Campaign Analysis:\n{truncated_analysis}\n"
                    full_context = f"""{campaign_context_text}

{customer_profiles_text}

Campaign Statistics:
- Total Conversations: {total_conversations}
- Total Messages: {total_messages}
- Average Messages per Conversation: {total_messages / total_conversations if total_conversations > 0 else 0:.1f}

{previous_analysis_text}

Sample Conversations:
{conversations_text}

{user_question_text}"""

        # Create prompt for campaign-level follow-up analysis
        prompt = f"""You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand campaign performance at a macro level.

{full_context}

Based on the campaign data, previous analysis, and the user's follow-up question, provide a comprehensive answer that:
1. Addresses the user's specific question about the campaign
2. References relevant patterns and trends from all conversations
3. Incorporates insights from the previous analysis
4. Provides actionable recommendations at the campaign level

Return your response in JSON format:
{{
    "answer": "Direct answer to the user's question about the campaign",
    "key_insights": ["insight1", "insight2", "insight3"],
    "recommendations": [
        {{
            "action": "action_description",
            "priority": "high|medium|low",
            "reason": "why this action is recommended"
        }}
    ],
    "relevant_campaign_patterns": ["pattern1", "pattern2"],
    "summary": "Brief summary of the analysis"
}}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Be specific and actionable
- Base insights on aggregated campaign data
- Focus on macro-level patterns and trends
- Directly answer the user's question about the campaign
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",  # Using more capable model for campaign follow-up analysis
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Copilot. Analyze sales campaigns at a macro level and provide actionable insights in JSON format. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": settings.AI_COPILOT_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)  # Longer timeout for campaign analysis
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        
                        # Parse JSON response
                        try:
                            insights = json.loads(content)
                            print(f"✅ [AI COPILOT] Campaign follow-up analysis completed successfully")
                            return insights
                        except json.JSONDecodeError as e:
                            print(f"❌ [AI COPILOT] Failed to parse JSON response: {e}")
                            print(f"   - Response content: {content[:500]}")
                            return None
                    else:
                        print(f"⚠️ [AI COPILOT] No choices in response")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [AI COPILOT] API error: {response.status}")
                    print(f"   - Error: {error_text}")
                    return None

    except Exception as e:
        print(f"❌ [AI COPILOT] Error in campaign follow-up analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


# ---------------------------------------------------------------------------
# Chunked Playbook Analysis helpers
# ---------------------------------------------------------------------------

# Groq free-tier TPM limit is 8000 tokens.  We keep each chunk small so that
# prompt + completion together stay well under the limit even after the system
# message and instruction overhead (~600 tokens).
_CHUNK_MAX_CHARS = 5000          # ~1 250 tokens per chunk
_CHUNK_OVERLAP_CHARS = 400       # small overlap so context isn't lost at edges
_GROQ_MODEL = "llama-3.1-8b-instant"
_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Retry / back-off parameters for 429 rate-limit errors
_MAX_RETRIES = 5
_INITIAL_BACKOFF_SEC = 6.0       # Groq asks for ~5.5 s in the error body
_BACKOFF_MULTIPLIER = 1.5


def _preprocess_transcript(transcript: str) -> str:
    """Light cleanup: collapse multiple blank lines, strip trailing spaces."""
    text = re.sub(r"\n{3,}", "\n\n", transcript)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip()


def _chunk_transcript(transcript: str) -> List[str]:
    """
    Split a transcript into overlapping chunks of roughly _CHUNK_MAX_CHARS.
    Splits prefer newline boundaries so we don't cut mid-sentence.
    """
    if len(transcript) <= _CHUNK_MAX_CHARS:
        return [transcript]

    chunks: List[str] = []
    start = 0
    while start < len(transcript):
        end = start + _CHUNK_MAX_CHARS

        # If this isn't the last chunk, try to break at a newline
        if end < len(transcript):
            # look backward from `end` for a newline
            nl = transcript.rfind("\n", start, end)
            if nl > start + _CHUNK_MAX_CHARS // 2:
                end = nl + 1  # include the newline itself

        chunk = transcript[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # next chunk starts with overlap
        start = end - _CHUNK_OVERLAP_CHARS if end < len(transcript) else end

    return chunks


async def _call_groq_with_retry(
    payload: dict,
    *,
    timeout_sec: float = 60,
) -> Optional[dict]:
    """
    POST to Groq chat/completions with automatic retry on 429.
    Returns parsed JSON body of the assistant message, or None.
    """
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    backoff = _INITIAL_BACKOFF_SEC
    last_error = ""

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    _GROQ_URL,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout_sec),
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        choices = result.get("choices") or []
                        if not choices:
                            logger.warning(f"[Playbook] Groq returned no choices (attempt {attempt})")
                            return None
                        content = choices[0].get("message", {}).get("content", "").strip()
                        try:
                            return json.loads(content)
                        except json.JSONDecodeError:
                            # try extracting first {...}
                            s = content.find("{")
                            e = content.rfind("}")
                            if s != -1 and e > s:
                                return json.loads(content[s : e + 1])
                            logger.error(f"[Playbook] JSON parse failed (attempt {attempt}): {content[:300]}")
                            return None

                    if resp.status == 429:
                        error_body = await resp.text()
                        # Try to extract wait time from error body
                        wait = backoff
                        m = re.search(r"try again in ([\d.]+)s", error_body, re.IGNORECASE)
                        if m:
                            wait = max(float(m.group(1)) + 0.5, backoff)
                        logger.warning(
                            f"[Playbook] Rate limited (429) attempt {attempt}/{_MAX_RETRIES}. "
                            f"Waiting {wait:.1f}s ..."
                        )
                        await asyncio.sleep(wait)
                        backoff *= _BACKOFF_MULTIPLIER
                        last_error = f"429: {error_body[:200]}"
                        continue

                    # Other HTTP errors – don't retry
                    error_text = await resp.text()
                    logger.error(f"[Playbook] Groq API error {resp.status}: {error_text[:300]}")
                    return None

        except asyncio.TimeoutError:
            logger.warning(f"[Playbook] Groq request timeout (attempt {attempt}/{_MAX_RETRIES})")
            await asyncio.sleep(backoff)
            backoff *= _BACKOFF_MULTIPLIER
            last_error = "timeout"
            continue
        except Exception as exc:
            logger.error(f"[Playbook] Groq request exception (attempt {attempt}): {exc}")
            return None

    logger.error(f"[Playbook] All {_MAX_RETRIES} retries exhausted. Last error: {last_error}")
    return None


def _build_chunk_prompt(
    chunk_text: str,
    chunk_index: int,
    total_chunks: int,
    playbook_name: str,
    rules_text: str,
) -> str:
    """Build the prompt for analyzing one transcript chunk."""
    return f"""You are an expert sales coach.
You will evaluate a PORTION of a sales call transcript against a Sales Playbook.

Sales Playbook: {playbook_name}

Playbook Rules:
{rules_text}

Transcript chunk {chunk_index + 1} of {total_chunks}:
\"\"\"{chunk_text}\"\"\"

TASK:
For EACH rule, look for evidence in THIS chunk that the seller satisfied or violated the rule.

For each rule return:
- "passed": true if THIS chunk contains clear evidence the rule was satisfied; false otherwise.
- "what_you_said": the most relevant QUOTE or short summary (1-2 sentences) from THIS chunk. Empty string if nothing relevant.
- "confidence": "high", "medium", or "low" – how confident you are based on this chunk alone.

Return ONLY valid JSON:
{{
  "rules": [
    {{
      "rule_id": "<id>",
      "label": "<label>",
      "passed": true/false,
      "what_you_said": "<quote or empty>",
      "confidence": "high|medium|low"
    }}
  ],
  "dimension_scores": {{
    "Handled objections": 0-100,
    "Personalized demo": 0-100,
    "Intro Banter": 0-100,
    "Set Agenda": 0-100,
    "Demo told a story": 0-100
  }}
}}
"""


def _build_merge_prompt(
    chunk_results: List[dict],
    playbook_name: str,
    rules_text: str,
    total_chunks: int,
) -> str:
    """Build the final merge / summarization prompt."""
    # Compact representation of per-chunk findings
    findings_parts: List[str] = []
    for i, cr in enumerate(chunk_results):
        findings_parts.append(f"--- Chunk {i + 1}/{total_chunks} ---")
        for r in (cr.get("rules") or []):
            label = r.get("label", "?")
            passed = r.get("passed", False)
            quote = r.get("what_you_said") or ""
            conf = r.get("confidence", "low")
            findings_parts.append(
                f"  Rule \"{label}\": passed={passed}, confidence={conf}"
                + (f", quote=\"{quote[:120]}\"" if quote else "")
            )
        dim = cr.get("dimension_scores") or {}
        if dim:
            dim_str = ", ".join(f"{k}={v}" for k, v in dim.items())
            findings_parts.append(f"  dimension_scores: {dim_str}")
    findings_text = "\n".join(findings_parts)

    return f"""You are an expert sales coach performing a FINAL evaluation.

The transcript of a sales call was split into {total_chunks} chunks and each was
evaluated against the playbook rules below.  Your job is to MERGE the per-chunk
findings into ONE coherent final evaluation.

Sales Playbook: {playbook_name}

Playbook Rules:
{rules_text}

Per-chunk findings:
{findings_text}

MERGE RULES:
- A rule is "passed" if ANY chunk provides HIGH or MEDIUM confidence evidence it was satisfied.
- Pick the BEST "what_you_said" quote across chunks for each rule.
- Provide a new "what_you_should_say" suggestion (1-3 sentences) for each rule.
- Compute an overall_score 0-100 and a coaching_summary (1-3 sentences).
- dimension_scores: average the per-chunk scores, rounding to int.

Return ONLY valid JSON:
{{
  "rules": [
    {{
      "rule_id": "<id>",
      "label": "<label>",
      "description": "<rule description if any>",
      "passed": true/false,
      "what_you_said": "<best quote>",
      "what_you_should_say": "<suggestion>"
    }}
  ],
  "overall_score": 0-100,
  "coaching_summary": "1-3 sentences.",
  "dimension_scores": {{
    "Handled objections": 0-100,
    "Personalized demo": 0-100,
    "Intro Banter": 0-100,
    "Set Agenda": 0-100,
    "Demo told a story": 0-100
  }}
}}
"""


async def analyze_call_against_playbook(
    *,
    transcript: str,
    playbook_name: str,
    rules: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Analyze a call transcript against a sales playbook template.

    Flow:
      1. Preprocess transcript
      2. Chunk transcript into small pieces (~1 250 tokens each)
      3. Analyze each chunk against the rules (with retry + rate-limit back-off)
      4. Merge chunk results into a single coherent evaluation
      5. Return the merged result

    Returns structured JSON with per-rule evaluation, overall_score,
    coaching_summary, and dimension_scores.
    """
    try:
        if not settings.GROQ_API_KEY:
            logger.warning("[Playbook] GROQ_API_KEY not configured")
            return None

        masked_key = (
            settings.GROQ_API_KEY[:8] + "..." + settings.GROQ_API_KEY[-4:]
            if len(settings.GROQ_API_KEY) > 12
            else "***too_short***"
        )
        logger.info(
            f"[Playbook] Analysis starting (chunked): "
            f"key={masked_key}, playbook={playbook_name}, "
            f"rules={len(rules)}, transcript={len(transcript)} chars"
        )

        # ---- Step 1: Preprocess ----
        transcript = _preprocess_transcript(transcript)

        # ---- Step 2: Chunk ----
        chunks = _chunk_transcript(transcript)
        logger.info(
            f"[Playbook] Step 2/5: Transcript split into {len(chunks)} chunk(s) "
            f"(sizes: {[len(c) for c in chunks]})"
        )

        # Format rules text (shared across all prompts)
        rules_text_lines = []
        for idx, rule in enumerate(rules, start=1):
            label = rule.get("label") or ""
            description = rule.get("description") or ""
            rule_id = rule.get("id") or ""
            rules_text_lines.append(
                f"- Rule {idx} (id={rule_id}): {label}\n  Description: {description}"
            )
        rules_text = "\n".join(rules_text_lines) if rules_text_lines else "No rules defined."

        # ---- Step 3: Analyze each chunk (sequentially to respect rate limits) ----
        chunk_results: List[dict] = []
        for ci, chunk in enumerate(chunks):
            prompt = _build_chunk_prompt(chunk, ci, len(chunks), playbook_name, rules_text)
            payload = {
                "model": _GROQ_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert B2B sales coach. Always respond with valid JSON only.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 1200,
                "response_format": {"type": "json_object"},
            }

            logger.info(f"[Playbook] Step 3/5: Analyzing chunk {ci + 1}/{len(chunks)} ({len(chunk)} chars) ...")
            result = await _call_groq_with_retry(payload)

            if result:
                chunk_results.append(result)
                logger.info(f"[Playbook] Chunk {ci + 1}/{len(chunks)} done")
            else:
                logger.warning(f"[Playbook] Chunk {ci + 1}/{len(chunks)} failed - skipping")

            # Small delay between chunks to stay comfortably under rate limit
            if ci < len(chunks) - 1:
                await asyncio.sleep(3.0)

        if not chunk_results:
            logger.error("[Playbook] All chunks failed - cannot produce playbook analysis")
            return None

        # ---- Step 4: If only one chunk, we can enhance it directly ----
        if len(chunk_results) == 1 and len(chunks) == 1:
            # Single-chunk fast path: add what_you_should_say directly
            single = chunk_results[0]
            # If the single chunk already has all fields, return it
            has_summary = bool(single.get("coaching_summary"))
            has_score = single.get("overall_score") is not None
            if has_summary and has_score:
                logger.info("[Playbook] Step 5/5: Single-chunk analysis complete (fast path)")
                return single
            # Otherwise fall through to merge which will add coaching_summary etc.

        # ---- Step 5: Merge results ----
        merge_prompt = _build_merge_prompt(chunk_results, playbook_name, rules_text, len(chunks))
        merge_payload = {
            "model": _GROQ_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert B2B sales coach. Always respond with valid JSON only.",
                },
                {"role": "user", "content": merge_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 1500,
            "response_format": {"type": "json_object"},
        }

        logger.info(f"[Playbook] Step 4/5: Merging {len(chunk_results)} chunk results ...")
        # Allow extra retries for the merge step
        await asyncio.sleep(4.0)  # rate-limit buffer before merge call
        merged = await _call_groq_with_retry(merge_payload)

        if merged:
            logger.info("[Playbook] Step 5/5: Playbook analysis completed successfully (chunked)")
            return merged

        # If merge fails, attempt to produce a best-effort result from chunks
        logger.warning("[Playbook] Merge call failed - assembling best-effort result from chunks")
        return _assemble_fallback(chunk_results, rules)

    except Exception as e:
        logger.error(f"[Playbook] Error in analyze_call_against_playbook: {str(e)}", exc_info=True)
        return None


def _assemble_fallback(
    chunk_results: List[dict],
    original_rules: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Best-effort merge when the LLM merge call fails.
    OR-merges passed flags, picks the longest what_you_said, averages dimension scores.
    """
    # Build a map: rule_id/label -> aggregated data
    rule_map: Dict[str, dict] = {}
    for rule in original_rules:
        key = rule.get("id") or rule.get("label") or ""
        rule_map[key] = {
            "rule_id": rule.get("id") or "",
            "label": rule.get("label") or "",
            "description": rule.get("description") or "",
            "passed": False,
            "what_you_said": "",
            "what_you_should_say": "",
        }

    for cr in chunk_results:
        for r in (cr.get("rules") or []):
            key = r.get("rule_id") or r.get("label") or ""
            if key not in rule_map:
                continue
            if r.get("passed"):
                rule_map[key]["passed"] = True
            quote = (r.get("what_you_said") or "").strip()
            if len(quote) > len(rule_map[key]["what_you_said"]):
                rule_map[key]["what_you_said"] = quote

    # Average dimension scores
    dim_keys = ["Handled objections", "Personalized demo", "Intro Banter", "Set Agenda", "Demo told a story"]
    dim_totals: Dict[str, List[int]] = {k: [] for k in dim_keys}
    for cr in chunk_results:
        ds = cr.get("dimension_scores") or {}
        for k in dim_keys:
            v = ds.get(k)
            if v is not None:
                try:
                    dim_totals[k].append(int(v))
                except (TypeError, ValueError):
                    pass
    dimension_scores = {}
    for k in dim_keys:
        vals = dim_totals[k]
        if vals:
            dimension_scores[k] = round(sum(vals) / len(vals))

    rules_out = list(rule_map.values())
    passed_count = sum(1 for r in rules_out if r["passed"])
    total = max(len(rules_out), 1)
    overall_score = round(100 * passed_count / total)

    return {
        "rules": rules_out,
        "overall_score": overall_score,
        "coaching_summary": f"{passed_count}/{total} playbook rules satisfied (best-effort merge).",
        "dimension_scores": dimension_scores if dimension_scores else None,
    }


async def generate_goal_todo_items(
    goal_name: str,
    goal_description: Optional[str],
    prospects: List[Dict[str, Any]],
    campaign_context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Generate AI-powered To-Do items for a campaign goal.
    Analyzes goal title/description and prospects to create actionable tasks.
    Returns structured to-do items with messages ready to send.
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [Atlas] GROQ_API_KEY not configured")
            return None

        # Prepare goal context
        goal_context = f"""
Campaign Goal:
- Name: {goal_name}
- Description: {goal_description or 'No description provided'}
"""

        # Prepare prospects summary
        prospects_text = ""
        if prospects:
            prospects_summary = []
            for prospect in prospects[:50]:  # Limit to 50 prospects
                name = f"{prospect.get('first_name', '')} {prospect.get('last_name', '')}".strip()
                company = prospect.get('company', 'N/A')
                email = prospect.get('email', 'N/A')
                phone = prospect.get('phone', 'N/A')
                whatsapp = prospect.get('whatsapp_number', 'N/A')
                telegram = prospect.get('telegram_username', 'N/A')
                linkedin = prospect.get('linkedin_profile', 'N/A')
                
                prospect_info = f"Name: {name}, Company: {company}"
                if email != 'N/A':
                    prospect_info += f", Email: {email}"
                if phone != 'N/A':
                    prospect_info += f", Phone: {phone}"
                if whatsapp != 'N/A':
                    prospect_info += f", WhatsApp: {whatsapp}"
                if telegram != 'N/A':
                    prospect_info += f", Telegram: {telegram}"
                if linkedin != 'N/A':
                    prospect_info += f", LinkedIn: {linkedin}"
                
                prospects_summary.append(prospect_info)
            
            prospects_text = f"""
Prospects ({len(prospects)} total):
{chr(10).join(prospects_summary)}
"""

        # Prepare campaign context if available
        campaign_context_text = ""
        if campaign_context:
            campaign_context_text = f"""
Related Campaigns Context:
- Total Campaigns: {campaign_context.get('total_campaigns', 0)}
- Active Campaigns: {campaign_context.get('active_campaigns', 0)}
- Sample Call Script: {campaign_context.get('sample_call_script', 'N/A')[:200]}
"""

        # Combine all context
        full_context = f"""{goal_context}

{prospects_text}

{campaign_context_text}"""

        # Create prompt for to-do generation
        prompt = f"""You are an Atlas, an intelligent assistant that helps salespeople manage their sales activities efficiently.

{full_context}

Based on the campaign goal (title and description) and prospects, generate a comprehensive To-Do list with actionable items. For each prospect, create specific tasks that will help achieve the goal.

CRITICAL REQUIREMENTS:
1. For each prospect, create 3-5 actionable tasks
2. Each action MUST have:
   - "what": Clear, specific description of what to do (e.g., "Send follow-up email about product demo", "Schedule discovery call")
   - "when": Specific timing (e.g., "Today", "Tomorrow", "In 2 days", "Next week", "Within 3 days")
   - "channel": One of: "email", "whatsapp", "linkedin", "call", "video_call"
   - "priority": "high", "medium", or "low"
   - "reason": Brief explanation why this action is recommended for achieving the goal

3. For actions with channel "email", "whatsapp", or "linkedin":
   - MUST include "message" field with complete, ready-to-send message
   - Message should be personalized, professional, goal-oriented
   - Message should be complete and ready to send (not a template with placeholders)
   - Do NOT include "call_script" for these channels

4. For actions with channel "call" or "video_call":
   - MUST include "call_script" field with detailed script and topics to cover
   - MUST include "topics" array with key topics to discuss
   - Do NOT include "message" for these channels

5. Actions should be prioritized based on:
   - Goal alignment (how well it helps achieve the goal)
   - Urgency (time-sensitive actions first)
   - Prospect's available contact methods (prefer channels they have)

Return your response in JSON format:
{{
    "todo_items": [
        {{
            "prospect_id": "prospect_id_from_list",
            "prospect_name": "Full Name from prospect data",
            "prospect_company": "Company Name from prospect data",
            "actions": [
                {{
                    "id": "unique_action_id_1",
                    "what": "Clear, specific description of what to do",
                    "when": "Today|Tomorrow|In 2 days|Next week|Within 3 days",
                    "channel": "email|whatsapp|linkedin|call|video_call",
                    "priority": "high|medium|low",
                    "message": "Complete, ready-to-send message (ONLY for email/whatsapp/linkedin, leave empty for call/video_call)",
                    "call_script": "Detailed script with topics to cover (ONLY for call/video_call, leave empty for email/whatsapp/linkedin)",
                    "topics": ["topic1", "topic2", "topic3"] (ONLY for call/video_call, empty array for others),
                    "reason": "Why this action is recommended for achieving the goal"
                }}
            ]
        }}
    ],
    "summary": "Overall strategy summary for achieving this goal (2-3 sentences)"
}}

IMPORTANT RULES:
- Return ONLY valid JSON, no additional text before or after
- Create 3-5 actions per prospect
- For email/whatsapp/linkedin: MUST have "message", NO "call_script" or "topics"
- For call/video_call: MUST have "call_script" and "topics", NO "message"
- Messages must be complete and ready to send (personalized with prospect name/company)
- Base all recommendations on the goal's title and description
- Prioritize actions that directly contribute to achieving the goal
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an Atlas. Generate actionable to-do items for salespeople in JSON format. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,  # Slightly higher for creativity in message generation
            "max_tokens": settings.AI_COPILOT_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        
                        try:
                            todo_data = json.loads(content)
                            print(f"✅ [Atlas] To-do items generated successfully")
                            return todo_data
                        except json.JSONDecodeError as e:
                            print(f"❌ [Atlas] Failed to parse JSON response: {e}")
                            print(f"   - Response content: {content[:500]}")
                            return None
                    else:
                        print(f"⚠️ [Atlas] No choices in response")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [Atlas] API error: {response.status}")
                    print(f"   - Error: {error_text}")
                    return None

    except Exception as e:
        print(f"❌ [Atlas] Error generating to-do items: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


async def chat_with_sales_coach(
    goal_name: str,
    goal_description: Optional[str],
    user_question: str,
    context: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Chat with Atlas - allows user to ask questions, request message variations,
    prepare for calls, simulate prospect responses, etc.
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [Atlas] GROQ_API_KEY not configured")
            return None

        # Prepare goal context
        goal_context = f"""
Campaign Goal:
- Name: {goal_name}
- Description: {goal_description or 'No description provided'}
"""

        # Prepare additional context if available
        context_text = ""
        if context:
            if context.get('todo_items'):
                context_text += f"\nCurrent To-Do Items: {len(context.get('todo_items', []))} items\n"
            if context.get('prospect_info'):
                prospect = context['prospect_info']
                context_text += f"\nProspect Info:\n- Name: {prospect.get('name', 'N/A')}\n- Company: {prospect.get('company', 'N/A')}\n"
            if context.get('message'):
                context_text += f"\nMessage to review: {context['message']}\n"
            if context.get('call_script'):
                context_text += f"\nCall script to review: {context['call_script']}\n"

        # Create prompt for sales coach chat
        prompt = f"""You are an Atlas, a personal sales coach that helps salespeople improve their sales performance.

{goal_context}

{context_text}

User's Question/Request:
{user_question}

Provide a helpful, coaching-style response. You can:
- Explain why certain follow-ups are suggested
- Provide different versions of messages
- Help prepare for calls
- Simulate prospect responses
- Give strategic advice
- Answer questions about sales best practices

Return your response in JSON format:
{{
    "answer": "Your coaching response to the user's question",
    "suggestions": ["suggestion1", "suggestion2"],
    "message_variations": [
        {{
            "version": "professional",
            "message": "Professional version of the message"
        }},
        {{
            "version": "friendly",
            "message": "Friendly version of the message"
        }}
    ],
    "call_preparation": {{
        "key_points": ["point1", "point2"],
        "potential_objections": ["objection1", "objection2"],
        "responses": ["response1", "response2"]
    }},
    "simulated_response": "How the prospect might respond (if requested)"
}}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- Be conversational and coaching-oriented
- Provide actionable advice
- If user asks for message variations, include them in message_variations
- If user asks to prepare for a call, include call_preparation
- If user asks to simulate prospect response, include simulated_response
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an Atlas. Provide helpful, coaching-style responses in JSON format. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.8,  # Higher temperature for more conversational responses
            "max_tokens": settings.AI_COPILOT_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    choices = result.get("choices", [])
                    
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        
                        try:
                            coach_response = json.loads(content)
                            print(f"✅ [Atlas] Chat response generated successfully")
                            return coach_response
                        except json.JSONDecodeError as e:
                            print(f"❌ [Atlas] Failed to parse JSON response: {e}")
                            print(f"   - Response content: {content[:500]}")
                            return None
                    else:
                        print(f"⚠️ [Atlas] No choices in response")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [Atlas] API error: {response.status}")
                    print(f"   - Error: {error_text}")
                    return None

    except Exception as e:
        print(f"❌ [Atlas] Error in sales coach chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

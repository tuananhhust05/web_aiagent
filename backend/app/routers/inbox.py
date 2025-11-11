from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import aiohttp
import asyncio
import re

from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.core.config import settings
from app.models.user import UserResponse
from app.models.inbox import InboxResponseCreate, InboxResponse


router = APIRouter()


async def process_customer_response_with_groq(call_script: str, customer_response: str) -> Optional[str]:
    """
    Process customer response using Groq LLM.
    Takes the call_script (initial message sent to customer) and customer_response,
    then calls Groq API to generate an appropriate response.
    """
    print("=" * 80)
    print("🔵 [GROQ LLM] Starting customer response processing")
    print("=" * 80)
    
    try:
        # Check if Groq API key is configured
        print(f"🔑 [GROQ LLM] Checking GROQ_API_KEY configuration...")
        if not settings.GROQ_API_KEY:
            print("⚠️ [GROQ LLM] GROQ_API_KEY not configured, skipping LLM processing")
            return None
        
        api_key_preview = f"{settings.GROQ_API_KEY[:10]}..." if len(settings.GROQ_API_KEY) > 10 else "***"
        print(f"✅ [GROQ LLM] GROQ_API_KEY found: {api_key_preview}")
        
        # Prepare prompt for Groq
        print(f"📝 [GROQ LLM] Preparing prompt...")
        print(f"   - Call Script Length: {len(call_script)} characters")
        print(f"   - Call Script Preview: {call_script[:150]}...")
        print(f"   - Customer Response Length: {len(customer_response)} characters")
        print(f"   - Customer Response: {customer_response[:150]}...")
        
        prompt = f"""You are an AI assistant helping to generate a short, emotional opening line for an AI voice call in a marketing campaign.

The initial message sent to the customer was:
"{call_script}"

The customer responded with:
"{customer_response}"

Based on the initial message and the customer's response, generate ONLY a short, emotional opening sentence (1-2 sentences maximum) that will be used to start an AI voice call. 

IMPORTANT REQUIREMENTS:
- Return ONLY the opening sentence(s), nothing else
- Do NOT include explanations, descriptions, or any additional text
- Keep it short, conversational, and emotionally engaging
- Make it relevant to the customer's response
- Use a warm, friendly, and enthusiastic tone
- Maximum 2 sentences

Generate ONLY the opening line for the call:

"""
        
        print(f"📋 [GROQ LLM] Prompt prepared, total length: {len(prompt)} characters")
        
        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.1-8b-instant",  # Using a fast Groq model
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI assistant specialized in generating short, emotional opening lines for AI voice calls. Your task is to create ONLY a brief opening sentence (1-2 sentences max) that is warm, engaging, and relevant to the customer's response. Never include explanations or additional text - only return the opening line itself."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.8,
            "max_tokens": 100
        }
        
        print(f"🌐 [GROQ LLM] Calling Groq API...")
        print(f"   - URL: {groq_url}")
        print(f"   - Model: {payload['model']}")
        print(f"   - Temperature: {payload['temperature']}")
        print(f"   - Max Tokens: {payload['max_tokens']}")
        print(f"   - Messages Count: {len(payload['messages'])}")
        
        async with aiohttp.ClientSession() as session:
            print(f"⏱️  [GROQ LLM] Sending request to Groq API (timeout: 30s)...")
            async with session.post(
                groq_url,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                print(f"📡 [GROQ LLM] Response received - Status: {response.status}")
                
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ [GROQ LLM] Successfully received response from Groq API")
                    print(f"   - Response keys: {list(result.keys())}")
                    
                    choices = result.get("choices", [])
                    print(f"   - Choices count: {len(choices)}")
                    
                    if choices:
                        ai_response_raw = choices[0].get("message", {}).get("content", "").strip()
                        
                        # Clean up response: extract only the opening line
                        # Strategy: Find text within quotes, extract first 1-2 sentences, remove everything else
                        ai_response = ai_response_raw
                        
                        # Step 1: Find text within quotes (most reliable method)
                        # Look for pattern: "text here" - match everything between first and last quote
                        quote_match = re.search(r'["\'](.*?)["\']', ai_response, re.DOTALL)
                        if quote_match:
                            quoted_text = quote_match.group(1).strip()
                            # Normalize whitespace (newlines, multiple spaces)
                            quoted_text = re.sub(r'\s+', ' ', quoted_text)
                            quoted_text = re.sub(r'\n+', ' ', quoted_text).strip()
                            
                            # Only use quoted text if it looks valid (starts with capital, has reasonable length)
                            if len(quoted_text) > 10 and quoted_text[0].isupper():
                                ai_response = quoted_text
                        
                        # Step 2: If no valid quoted text found, try to extract from beginning
                        if len(ai_response) > 500 or 'This script' in ai_response or 'This opening' in ai_response:
                            # Response is too long or contains explanations, need to extract
                            # Remove all prefixes first
                            ai_response = re.sub(r'^.*?Call Script.*?:', '', ai_response, flags=re.IGNORECASE | re.DOTALL).strip()
                            ai_response = re.sub(r'^.*?Opening.*?:', '', ai_response, flags=re.IGNORECASE | re.DOTALL).strip()
                            ai_response = re.sub(r'^\*{0,2}Call Script\*{0,2}.*?:', '', ai_response, flags=re.IGNORECASE | re.DOTALL).strip()
                            
                            # Remove leading quotes
                            ai_response = re.sub(r'^["\']+', '', ai_response).strip()
                            
                            # Cut off at first explanation marker
                            explanation_markers = [
                                r'\n\s*This script',
                                r'\n\s*This opening',
                                r'\n\s*\d+\.\s+[A-Z]',
                                r'\s+This script',
                                r'\s+This opening',
                            ]
                            for marker in explanation_markers:
                                match = re.search(marker, ai_response, re.IGNORECASE)
                                if match:
                                    ai_response = ai_response[:match.start()].strip()
                                    break
                        
                        # Step 3: Extract only first 1-2 sentences
                        # Split by sentence endings (. ! ?) but keep the punctuation
                        sentence_endings = re.finditer(r'[.!?]+', ai_response)
                        sentence_positions = []
                        for match in sentence_endings:
                            sentence_positions.append(match.end())
                        
                        if len(sentence_positions) >= 2:
                            # Take first 2 sentences
                            ai_response = ai_response[:sentence_positions[1]].strip()
                        elif len(sentence_positions) == 1:
                            # Take first sentence
                            ai_response = ai_response[:sentence_positions[0]].strip()
                        # If no sentence endings found, keep as is (might be a single sentence)
                        
                        # Step 4: Final cleanup
                        # Remove any remaining explanatory text patterns
                        ai_response = re.sub(r'\s+This script.*$', '', ai_response, flags=re.IGNORECASE).strip()
                        ai_response = re.sub(r'\s+This opening.*$', '', ai_response, flags=re.IGNORECASE).strip()
                        ai_response = re.sub(r'\s+This line.*$', '', ai_response, flags=re.IGNORECASE).strip()
                        
                        # Normalize whitespace
                        ai_response = re.sub(r'\s+', ' ', ai_response).strip()
                        
                        # Ensure proper ending punctuation
                        if ai_response and not ai_response[-1] in '.!?':
                            ai_response += '.'
                        
                        print(f"✅ [GROQ LLM] AI Response generated successfully")
                        print(f"   - Raw Response Length: {len(ai_response_raw)} characters")
                        print(f"   - Cleaned Response Length: {len(ai_response)} characters")
                        print(f"   - Raw Response Preview: {ai_response_raw[:200]}...")
                        
                        # Log full AI-generated content in a highlighted section
                        print("\n" + "=" * 80)
                        print("🎯 [GROQ LLM] AI-GENERATED CALL SCRIPT")
                        print("=" * 80)
                        print("📋 Input Information:")
                        print(f"   - Original Call Script: {call_script}")
                        print(f"   - Customer Response: {customer_response}")
                        print("\n🤖 Raw AI Response (before cleaning):")
                        print("-" * 80)
                        print(ai_response_raw)
                        print("-" * 80)
                        print("\n✨ Cleaned Opening Line (to be used for voice calls):")
                        print("-" * 80)
                        print(ai_response)
                        print("-" * 80)
                        print(f"📊 Summary:")
                        print(f"   - Cleaned Script Length: {len(ai_response)} characters")
                        print(f"   - This opening line will be used as prompt for AI voice calls")
                        print("=" * 80 + "\n")
                        
                        return ai_response
                    else:
                        print(f"⚠️ [GROQ LLM] No choices in response")
                        print(f"   - Full Response: {result}")
                        return None
                else:
                    error_text = await response.text()
                    print(f"❌ [GROQ LLM] API error occurred")
                    print(f"   - Status Code: {response.status}")
                    print(f"   - Error Text: {error_text}")
                    print("=" * 80)
                    return None
                    
    except aiohttp.ClientError as e:
        print(f"❌ [GROQ LLM] HTTP Client Error: {str(e)}")
        print(f"   - Error Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("=" * 80)
        return None
    except Exception as e:
        print(f"❌ [GROQ LLM] Unexpected error: {str(e)}")
        print(f"   - Error Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("=" * 80)
        return None


async def trigger_campaign_calls(campaign: dict, user_id: Optional[str], groq_response: Optional[str] = None):
    """
    Trigger AI voice calls for all contacts in a campaign after receiving a message.
    Uses Groq response as call prompt if provided, otherwise uses campaign call_script.
    Only executes the first channel in the campaign's flow.
    """
    print("=" * 80)
    print("🟢 [CAMPAIGN CALLS] Starting campaign calls trigger")
    print("=" * 80)
    
    db = get_database()
    
    try:
        campaign_id = str(campaign.get("_id", ""))
        campaign_name = campaign.get("name", "Unknown")
        
        print(f"📋 [CAMPAIGN CALLS] Campaign Info:")
        print(f"   - Campaign ID: {campaign_id}")
        print(f"   - Campaign Name: {campaign_name}")
        print(f"   - User ID: {user_id}")
        
        # Get campaign flow (default to ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        flow = campaign.get("flow", ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        if not flow or len(flow) == 0:
            flow = ['telegram', 'ai_voice', 'whatsapp', 'linkedin']
        
        print(f"🔄 [CAMPAIGN CALLS] Campaign flow: {flow}")
        print(f"📞 [CAMPAIGN CALLS] Triggering AI voice calls for all contacts in campaign (triggered by inbox message)")
        
        # Get all contacts for this campaign
        all_contact_ids = list(campaign.get("contacts", []))
        print(f"👥 [CAMPAIGN CALLS] Contact IDs from campaign: {len(all_contact_ids)}")
        
        if not all_contact_ids:
            print(f"⚠️ [CAMPAIGN CALLS] No contacts found in campaign, exiting")
            print("=" * 80)
            return
        
        # Determine call script: use Groq response if available, otherwise use campaign call_script
        if groq_response:
            call_script = groq_response
            print(f"📝 [CAMPAIGN CALLS] Using Groq-generated call script:")
            print(f"   - Source: Groq LLM Response (AI-generated based on customer response)")
            print(f"   - Length: {len(call_script)} characters")
            print(f"   - Preview: {call_script[:200]}...")
        else:
            call_script = campaign.get("call_script", settings.AI_CALL_DEFAULT_PROMPT)
            print(f"📝 [CAMPAIGN CALLS] Using campaign call script:")
            print(f"   - Source: Campaign call_script (original from campaign)")
            print(f"   - Length: {len(call_script)} characters")
            print(f"   - Preview: {call_script[:200]}...")
        
        # Log full call script content that will be used for calls
        print("\n" + "=" * 80)
        print("📞 [CAMPAIGN CALLS] CALL SCRIPT TO BE USED FOR VOICE CALLS")
        print("=" * 80)
        print("📋 Full Call Script Content:")
        print("-" * 80)
        print(call_script)
        print("-" * 80)
        print(f"📊 Script Details:")
        print(f"   - Source: {'Groq LLM (AI-generated)' if groq_response else 'Campaign (original)'}")
        print(f"   - Length: {len(call_script)} characters")
        print(f"   - Will be sent to: {settings.AI_CALL_API_URL}")
        print(f"   - Usage: This script will be used as prompt for all AI voice calls in this campaign")
        print("=" * 80 + "\n")
        
        # Query contacts from database
        print(f"🔍 [CAMPAIGN CALLS] Querying contacts from database...")
        contacts_cursor = db.contacts.find({"_id": {"$in": all_contact_ids}})
        contacts = await contacts_cursor.to_list(length=None)
        print(f"✅ [CAMPAIGN CALLS] Found {len(contacts)} contacts in database")
        
        calls_made_count = 0
        calls_failed_count = 0
        calls_skipped_count = 0
        
        # Make AI calls for all contacts sequentially
        for idx, contact in enumerate(contacts, 1):
            contact_id = str(contact.get("_id", ""))
            phone = contact.get("phone", "N/A")
            name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
            
            print(f"\n📞 [CAMPAIGN CALLS] Processing contact {idx}/{len(contacts)}:")
            print(f"   - Contact ID: {contact_id}")
            print(f"   - Name: {name}")
            print(f"   - Phone: {phone}")
            
            if phone and phone != "N/A":
                try:
                    # Prepare AI call API payload
                    ai_call_payload = {
                        "number": phone,
                        "prompt": call_script
                    }
                    
                    print(f"🤖 [CAMPAIGN CALLS] Calling AI API for {name} ({phone})...")
                    print(f"   - Payload: {ai_call_payload}")
                    
                    # Make async HTTP request to AI call API
                    async with aiohttp.ClientSession() as session:
                        print(f"⏱️  [CAMPAIGN CALLS] Sending request to AI Call API (timeout: 30s)...")
                        async with session.post(
                            settings.AI_CALL_API_URL,
                            json=ai_call_payload,
                            headers={"Content-Type": "application/json"},
                            timeout=aiohttp.ClientTimeout(total=30)
                        ) as response:
                            print(f"📡 [CAMPAIGN CALLS] Response received - Status: {response.status}")
                            
                            if response.status == 200:
                                ai_response = await response.json()
                                print(f"✅ [CAMPAIGN CALLS] AI call initiated successfully for {name}")
                                print(f"   - AI Response: {ai_response}")
                                
                                # Create call record in database
                                call_doc = {
                                    "_id": str(ObjectId()),
                                    "user_id": user_id,
                                    "contact_id": contact_id,
                                    "campaign_id": campaign_id,
                                    "phone_number": phone,
                                    "call_type": "outbound",
                                    "status": "connecting",
                                    "created_at": datetime.utcnow(),
                                    "updated_at": datetime.utcnow(),
                                    "notes": f"Auto-triggered call from inbox response for campaign {campaign_name}"
                                }
                                
                                print(f"💾 [CAMPAIGN CALLS] Creating call record in database...")
                                print(f"   - Call Doc: {call_doc}")
                                
                                # Insert call record
                                await db.calls.insert_one(call_doc)
                                print(f"✅ [CAMPAIGN CALLS] Call record created successfully for {name}")
                                calls_made_count += 1
                                
                            else:
                                error_text = await response.text()
                                print(f"❌ [CAMPAIGN CALLS] AI call failed for {name}")
                                print(f"   - Status Code: {response.status}")
                                print(f"   - Error Text: {error_text}")
                                calls_failed_count += 1
                                
                except aiohttp.ClientError as e:
                    print(f"❌ [CAMPAIGN CALLS] HTTP Client Error for {name}: {str(e)}")
                    print(f"   - Error Type: {type(e).__name__}")
                    calls_failed_count += 1
                except Exception as e:
                    print(f"❌ [CAMPAIGN CALLS] Failed to call AI API for {name}: {str(e)}")
                    print(f"   - Error Type: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
                    calls_failed_count += 1
            else:
                print(f"⚠️ [CAMPAIGN CALLS] Contact {name} does not have phone number, skipping")
                calls_skipped_count += 1
        
        print("\n" + "=" * 80)
        print(f"📊 [CAMPAIGN CALLS] Campaign Calls Summary:")
        print(f"   - Total Contacts: {len(contacts)}")
        print(f"   - Calls Initiated: {calls_made_count}")
        print(f"   - Calls Failed: {calls_failed_count}")
        print(f"   - Calls Skipped: {calls_skipped_count}")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ [CAMPAIGN CALLS] Error triggering campaign calls: {str(e)}")
        print(f"   - Error Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("=" * 80)


@router.post("/receive", response_model=InboxResponse)
async def receive_response(
    data: InboxResponseCreate,
):
    """
    Receive a response from any platform.
    Simple case: platform = "telegram" -> find contact by telegram_username == contact,
    then find a campaign that includes this contact _id in its contacts array.
    """
    print("\n" + "=" * 80)
    print("🟡 [INBOX RECEIVE] New message received")
    print("=" * 80)
    print(f"📥 [INBOX RECEIVE] Request Data:")
    print(f"   - Platform: {data.platform}")
    print(f"   - Contact: {data.contact}")
    print(f"   - Content Length: {len(data.content)} characters")
    print(f"   - Content: {data.content[:200]}...")
    
    db = get_database()

    contact_id: Optional[str] = None
    campaign_id: Optional[str] = None
    user_id: Optional[str] = None
    campaign: Optional[dict] = None

    # Resolve contact and campaign based on platform
    print(f"\n🔍 [INBOX RECEIVE] Resolving contact and campaign...")
    print(f"   - Platform: {data.platform.lower()}")
    
    if data.platform.lower() == "telegram":
        print(f"   - Searching for contact with telegram_username: {data.contact}")
        contact = await db.contacts.find_one({
            "telegram_username": data.contact,
        })
        
        if contact:
            contact_id = contact["_id"]
            user_id = contact.get("user_id")
            print(f"✅ [INBOX RECEIVE] Contact found:")
            print(f"   - Contact ID: {contact_id}")
            print(f"   - User ID: {user_id}")
            print(f"   - Contact Name: {contact.get('first_name', '')} {contact.get('last_name', '')}")
            
            print(f"\n🔍 [INBOX RECEIVE] Searching for campaign containing this contact...")
            campaign_query = {
                "contacts": {"$in": [contact_id]},
                **({"user_id": user_id} if user_id else {}),
            }
            print(f"   - Campaign Query: {campaign_query}")
            
            campaign = await db.campaigns.find_one(campaign_query)
            
            if campaign:
                campaign_id = str(campaign["_id"])
                print(f"✅ [INBOX RECEIVE] Campaign found:")
                print(f"   - Campaign ID: {campaign_id}")
                print(f"   - Campaign Name: {campaign.get('name', 'Unknown')}")
                print(f"   - Campaign Status: {campaign.get('status', 'Unknown')}")
            else:
                print(f"⚠️ [INBOX RECEIVE] No campaign found for this contact")
        else:
            print(f"⚠️ [INBOX RECEIVE] Contact not found with telegram_username: {data.contact}")
    else:
        print(f"⚠️ [INBOX RECEIVE] Platform '{data.platform}' not yet supported for contact resolution")

    # Insert inbox record
    print(f"\n💾 [INBOX RECEIVE] Creating inbox record...")
    inbox_doc = {
        "_id": str(datetime.utcnow().timestamp()).replace(".", ""),
        "user_id": user_id,
        "platform": data.platform,
        "contact": data.contact,
        "content": data.content,
        "campaign_id": campaign_id,
        "contact_id": contact_id,
        "created_at": datetime.utcnow(),
    }
    
    print(f"   - Inbox Doc ID: {inbox_doc['_id']}")
    print(f"   - Inbox Doc: {inbox_doc}")

    await db.inbox_responses.insert_one(inbox_doc)
    inbox_doc["id"] = inbox_doc["_id"]
    print(f"✅ [INBOX RECEIVE] Inbox record created successfully")
    
    # If campaign is found, process customer response with Groq LLM
    if campaign_id and campaign:
        print(f"\n📞 [INBOX RECEIVE] Campaign found - Processing message...")
        print(f"   - Campaign ID: {campaign_id}")
        print(f"   - Campaign Name: {campaign.get('name', 'Unknown')}")
        
        # Get call_script from campaign (the initial message sent to customer)
        call_script = campaign.get("call_script", settings.AI_CALL_DEFAULT_PROMPT)
        customer_response = data.content  # The response from customer
        
        print(f"\n📝 [INBOX RECEIVE] Message Details:")
        print(f"   - Call Script Length: {len(call_script)} characters")
        print(f"   - Call Script Preview: {call_script[:150]}...")
        print(f"   - Customer Response Length: {len(customer_response)} characters")
        print(f"   - Customer Response: {customer_response[:150]}...")
        
        # Process customer response with Groq LLM to generate call script
        print(f"\n🤖 [INBOX RECEIVE] Processing customer response with Groq LLM to generate call script...")
        print(f"   - Purpose: Generate call prompt based on customer response")
        groq_response = await process_customer_response_with_groq(call_script, customer_response)
        
        if groq_response:
            print(f"\n✅ [INBOX RECEIVE] Groq LLM generated call script successfully")
            print(f"   - Response Length: {len(groq_response)} characters")
            print(f"   - Response Preview: {groq_response[:200]}...")
            print(f"   - This will be used as prompt for AI voice calls")
            
            # Log full AI-generated content with context
            print("\n" + "=" * 80)
            print("🎯 [INBOX RECEIVE] AI-GENERATED CALL SCRIPT SUMMARY")
            print("=" * 80)
            print("📥 Input Data:")
            print(f"   - Original Call Script (from campaign):")
            print(f"     {call_script}")
            print(f"\n   - Customer Response (from Telegram):")
            print(f"     {customer_response}")
            print("\n🤖 AI-Generated Call Script (created by Groq LLM):")
            print("-" * 80)
            print(groq_response)
            print("-" * 80)
            print(f"📊 Generated Content Details:")
            print(f"   - Length: {len(groq_response)} characters")
            print(f"   - Will be used as: AI voice call prompt")
            print(f"   - Status: Ready to use for campaign calls")
            print("=" * 80 + "\n")
            
            # Update inbox record with Groq response
            print(f"\n💾 [INBOX RECEIVE] Updating inbox record with Groq response...")
            update_result = await db.inbox_responses.update_one(
                {"_id": inbox_doc["_id"]},
                {"$set": {"groq_response": groq_response}}
            )
            print(f"   - Update Result: matched={update_result.matched_count}, modified={update_result.modified_count}")
            inbox_doc["groq_response"] = groq_response
            print(f"✅ [INBOX RECEIVE] Inbox record updated with Groq response")
        else:
            print(f"\n⚠️ [INBOX RECEIVE] Groq LLM processing failed or skipped")
            print(f"   - Will use campaign call_script instead for calls")
        print(f"   - Groq response: {groq_response}")
        # Trigger AI voice calls for all contacts in campaign
        # Use Groq response as call prompt if available
        print(f"\n🚀 [INBOX RECEIVE] Triggering AI voice calls for all contacts in campaign...")
        if groq_response:
            print(f"   - Using Groq-generated call script for calls")
        else:
            print(f"   - Using campaign call_script for calls (Groq response not available)")
        print(f"   - This will run asynchronously in background")
        
        # Trigger calls asynchronously (don't wait for completion)
        # Pass groq_response to be used as call prompt
        task = asyncio.create_task(trigger_campaign_calls(campaign, user_id, groq_response))
        print(f"   - Background task created: {task}")
    else:
        print(f"\n⚠️ [INBOX RECEIVE] No campaign found - Skipping Groq LLM and campaign calls")
        if not contact_id:
            print(f"   - Reason: Contact not found")
        elif not campaign_id:
            print(f"   - Reason: Campaign not found for contact")
    
    print(f"\n✅ [INBOX RECEIVE] Request processed successfully")
    print(f"   - Returning InboxResponse")
    print("=" * 80 + "\n")
    
    return InboxResponse(**inbox_doc)


@router.get("/by-campaign/{campaign_id}", response_model=List[InboxResponse])
async def get_responses_by_campaign(
    campaign_id: str,
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Return inbox responses for a specific campaign."""
    db = get_database()

    cursor = db.inbox_responses.find({
        "campaign_id": campaign_id,
        "user_id": current_user.id,
    }).skip(skip).limit(limit).sort("created_at", -1)

    items = await cursor.to_list(length=limit)
    responses: List[InboxResponse] = []
    for item in items:
        item["id"] = item["_id"]
        responses.append(InboxResponse(**item))
    return responses



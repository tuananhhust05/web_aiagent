from fastapi import APIRouter, HTTPException, Depends, Path, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.rag_document import RAGDocumentResponse, RAGDocumentStatus
from app.core.config import settings
from app.core.database import get_database, get_weaviate
from app.services.pdf_processor import process_pdf_to_chunks
from app.services.vectorization import vectorize_texts, vectorize_text
import httpx
import os
import traceback
import tempfile
import shutil
from typing import Optional, List
import json
import base64
from datetime import datetime
import uuid
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# Try to import Weaviate Filter (for delete operations)
try:
    from weaviate.classes.query import Filter
    WEAVIATE_FILTER_AVAILABLE = True
except ImportError:
    WEAVIATE_FILTER_AVAILABLE = False

router = APIRouter()

@router.get("/knowledge-base")
async def get_knowledge_base_list(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get list of knowledge bases from ElevenLabs API
    """
    try:
        print("key ...", settings.ELEVENLABS_API_KEY)
        print("agent_id ...", settings.ELEVENLABS_AGENT_ID)
        # Check if API key is configured
        if not settings.ELEVENLABS_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        # Call ElevenLabs API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/convai/knowledge-base",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY
                },
                timeout=30.0
            )
            
            if not response.is_success:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch knowledge base: {response.text}"
                )
            
            data = response.json()
            return data
            
    except httpx.TimeoutException:
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when calling ElevenLabs API"
        )
    except httpx.RequestError as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to ElevenLabs API: {str(e)}"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/agent/config")
async def get_agent_config(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get current agent configuration from ElevenLabs API
    """
    try:
        print("key ...", settings.ELEVENLABS_API_KEY)
        print("agent_id ...", settings.ELEVENLABS_AGENT_ID)
        
        # Check if API key and agent ID are configured
        if not settings.ELEVENLABS_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        if not settings.ELEVENLABS_AGENT_ID:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs Agent ID not configured"
            )
        
        # Call ElevenLabs API to get agent configuration
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.elevenlabs.io/v1/convai/agents/{settings.ELEVENLABS_AGENT_ID}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY
                },
                timeout=30.0
            )
            
            if not response.is_success:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to get agent configuration: {response.text}"
                )
            
            data = response.json()
            return data
            
    except httpx.TimeoutException:
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when calling ElevenLabs API"
        )
    except httpx.RequestError as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to ElevenLabs API: {str(e)}"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/voices")
async def get_voices(current_user: UserResponse = Depends(get_current_active_user)):
    """
    Get list of voices from ElevenLabs API
    Only returns voices with category "clone" or "cloned"
    """
    try:
        print(f"🎤 [ELEVENLABS] Starting voices request for user: {current_user.email}")
        
        if not settings.ELEVENLABS_API_KEY:
            print("❌ [ELEVENLABS] API key not configured")
            raise HTTPException(
                status_code=500,
                detail="ElevenLabs API key not configured"
            )

        print(f"✅ [ELEVENLABS] API key configured (length: {len(settings.ELEVENLABS_API_KEY)})")
        print("🌐 [ELEVENLABS] Making request to: https://api.elevenlabs.io/v1/voices")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY
                },
                timeout=30.0
            )

            print(f"📡 [ELEVENLABS] Response status: {response.status_code}")
            print(f"📡 [ELEVENLABS] Response headers: {dict(response.headers)}")

            if not response.is_success:
                print(f"❌ [ELEVENLABS] Request failed with status {response.status_code}")
                print(f"❌ [ELEVENLABS] Error response: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch voices: {response.text}"
                )

            voices_data = response.json()
            print(f"📊 [ELEVENLABS] Raw response data: {voices_data}")
            print(f"📊 [ELEVENLABS] Total voices received: {len(voices_data.get('voices', []))}")
            
            # Log all voice categories for analysis
            all_voices = voices_data.get("voices", [])
            categories = {}
            for voice in all_voices:
                category = voice.get("category", "unknown")
                categories[category] = categories.get(category, 0) + 1
            print(f"📊 [ELEVENLABS] Voice categories breakdown: {categories}")
            
            # Filter voices with category "clone" or "cloned"
            clone_voices = [
                voice for voice in all_voices
                if voice.get("category") in ["clone", "cloned"]
            ]

            print(f"🎯 [ELEVENLABS] Filtered clone/cloned voices: {len(clone_voices)}")
            # print(f"🎯 [ELEVENLABS] Clone/cloned voices details: {[{'id': v.get('voice_id'), 'name': v.get('name'), 'category': v.get('category')} for v in clone_voices]}")

            # Enrich with uploaded source samples stored in DB for playback
            try:
                db = get_database()
                voice_ids = [v.get("voice_id") for v in clone_voices if v.get("voice_id")]
                uploads_by_voice: dict[str, list] = {}
                if voice_ids:
                    cursor = db.voices_uploads.find({
                        "user_id": current_user.id,
                        "voice_id": {"$in": voice_ids}
                    })
                    uploads = await cursor.to_list(length=None)
                    for up in uploads:
                        vid = up.get("voice_id")
                        if not vid:
                            continue
                        uploads_by_voice.setdefault(vid, []).append({
                            "filename": up.get("filename"),
                            "content_type": up.get("content_type"),
                            "size_bytes": up.get("size_bytes"),
                            "uploaded_base64": up.get("uploaded_base64"),
                            "created_at": up.get("created_at"),
                        })
                # Attach to voices
                for v in clone_voices:
                    vid = v.get("voice_id")
                    if vid and vid in uploads_by_voice:
                        v["source_samples"] = uploads_by_voice[vid]
            except Exception as e:
                print(f"⚠️  [ELEVENLABS] Failed to enrich voices with source samples: {str(e)}")
                traceback.print_exc()

            result = {
                "voices": clone_voices,
                "total": len(clone_voices)
            }
            
            print(f"✅ [ELEVENLABS] Returning {len(clone_voices)} clone/cloned voices to user: {current_user.email}")
            return result

    except httpx.TimeoutException:
        print("⏰ [ELEVENLABS] Request timeout when fetching voices")
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when fetching voices"
        )
    except httpx.RequestError as e:
        print(f"🌐 [ELEVENLABS] Request error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Request error: {str(e)}"
        )
    except Exception as e:
        print(f"💥 [ELEVENLABS] Internal server error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/voices/upload")
async def upload_voice(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Upload a voice file to ElevenLabs for voice cloning
    """
    try:
        print(f"🎤 [ELEVENLABS] Starting voice upload for user: {current_user.email}")
        print(f"📁 [ELEVENLABS] File: {file.filename}, Size: {file.size}, Content-Type: {file.content_type}")
        print(f"📝 [ELEVENLABS] Voice name: {name}, Description: {description}")
        
        if not settings.ELEVENLABS_API_KEY:
            print("❌ [ELEVENLABS] API key not configured")
            raise HTTPException(
                status_code=500,
                detail="ElevenLabs API key not configured"
            )

        # Validate file type
        allowed_types = [
            "audio/wav", "audio/wave", "audio/x-wav",
            "audio/mp3", "audio/mpeg", 
            "audio/mp4", "audio/m4a",
            "audio/ogg", "audio/vorbis",
            "audio/flac"
        ]
        
        if file.content_type not in allowed_types:
            print(f"❌ [ELEVENLABS] Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )

        # Read file content to enforce custom 5MB limit and for DB storage
        file_bytes = await file.read()
        actual_size = len(file_bytes) if file_bytes else 0

        # Validate file size (custom limit 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if actual_size > max_size:
            print(f"❌ [ELEVENLABS] File too large: {actual_size} bytes (limit 5MB)")
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 5MB limit"
            )

        print(f"✅ [ELEVENLABS] File validation passed")

        # Prepare form data for ElevenLabs API
        files_data = {
            "files": (file.filename, file_bytes, file.content_type)
        }
        
        form_data = {
            "name": name
        }
        
        if description:
            form_data["description"] = description
        
        form_data = {
            "name": name,
            "description": description or f"Voice clone created",  # Always include description
            "labels": json.dumps({  # Add labels like the website does
                "accent": "neutral",  # or detect from audio
                "age": "middle_aged",  # or specify based on your needs
                "gender": "neutral",   # or detect from audio
                "use case": "general"
            })
        }

        print(f"🌐 [ELEVENLABS] Making request to: https://api.elevenlabs.io/v1/voices/add")
        print(f"📤 [ELEVENLABS] Form data: {form_data}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/voices/add",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY
                },
                files=files_data,
                data=form_data,
                timeout=60.0  # Longer timeout for file upload
            )

            print(f"📡 [ELEVENLABS] Response status: {response.status_code}")
            print(f"📡 [ELEVENLABS] Response headers: {dict(response.headers)}")

            if not response.is_success:
                print(f"❌ [ELEVENLABS] Upload failed with status {response.status_code}")
                print(f"❌ [ELEVENLABS] Error response: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to upload voice: {response.text}"
                )

            result = response.json()
            print(f"✅ [ELEVENLABS] Voice uploaded successfully: {result}")
            print(f"✅ [ELEVENLABS] Voice ID: {result.get('voice_id', 'unknown')}")
            
            # Store uploaded source sample (base64) with voice_id for later playback
            try:
                db = get_database()
                voice_id = result.get("voice_id") or (result.get("voice") or {}).get("voice_id")
                if not voice_id:
                    print("⚠️  [ELEVENLABS] No voice_id in response; skip storing source sample")
                else:
                    source_doc = {
                        "_id": f"{current_user.id}:{voice_id}:{file.filename}:{actual_size}",
                        "user_id": current_user.id,
                        "voice_id": voice_id,
                        "name": name,
                        "description": description,
                        "filename": file.filename,
                        "content_type": file.content_type,
                        "size_bytes": actual_size,
                        "uploaded_base64": base64.b64encode(file_bytes).decode("utf-8"),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                    }
                    await db.voices_uploads.update_one(
                        {"_id": source_doc["_id"]},
                        {"$set": source_doc},
                        upsert=True
                    )
                    print(f"💾 [ELEVENLABS] Stored uploaded source sample (base64) for voice_id={voice_id}")
            except Exception as e:
                print(f"⚠️  [ELEVENLABS] Failed to store uploaded source sample: {str(e)}")
                traceback.print_exc()
            
            return result

    except httpx.TimeoutException:
        print("⏰ [ELEVENLABS] Request timeout when uploading voice")
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when uploading voice"
        )
    except httpx.RequestError as e:
        print(f"🌐 [ELEVENLABS] Request error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Request error: {str(e)}"
        )
    except Exception as e:
        print(f"💥 [ELEVENLABS] Internal server error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.patch("/agent/config")
async def update_agent_config(
    language: str = None,
    prompt: str = None,
    first_message: str = None,
    voice_id: str = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Update agent configuration (language, prompt, first_message)
    Only sends the fields that are provided (partial update)
    """
    try:
        print("key ...", settings.ELEVENLABS_API_KEY)
        print("agent_id ...", settings.ELEVENLABS_AGENT_ID)
        print("updating with:", {"language": language, "prompt": prompt, "first_message": first_message, "voice_id": voice_id})
        
        # Check if API key and agent ID are configured
        if not settings.ELEVENLABS_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        if not settings.ELEVENLABS_AGENT_ID:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs Agent ID not configured"
            )
        
        # Check if at least one field is provided
        if language is None and prompt is None and first_message is None and voice_id is None:
            raise HTTPException(
                status_code=400,
                detail="At least one field (language, prompt, first_message, voice_id) must be provided"
            )
        
        # Build update payload - only include fields that are provided
        update_payload = {
            "conversation_config": {
                "agent": {}
            }
        }
        
        # Handle TTS configuration
        tts_config = {}
        
        # If voice_id is provided, use it
        if voice_id is not None:
            tts_config["voice_id"] = voice_id
            print(f"🎤 [ELEVENLABS] Setting voice_id: {voice_id}")
        
        # Only add language if provided
        if language is not None:
            update_payload["conversation_config"]["agent"]["language"] = language
            
            # Auto-update TTS model based on language (only if voice_id not provided)
            # if voice_id is None:
            if language == "en":
                # English uses eleven_turbo_v2_2
                tts_config["model_id"] = "eleven_turbo_v2"
                # tts_config.update({
                #     "model_id": "eleven_turbo_v2",
                #     "voice_id": "argXMgapsx1khkzmCuhc",
                #     "supported_voices": [],
                #     "agent_output_audio_format": "ulaw_8000",
                #     "optimize_streaming_latency": 3,
                #     "stability": 0.5,
                #     "speed": 1.0,
                #     "similarity_boost": 0.8,
                #     "pronunciation_dictionary_locators": []
                # })
            else:
                # Other languages use eleven_turbo_v2_5
                tts_config["model_id"] = "eleven_turbo_v2_5"
        
        # Add TTS config if we have any TTS settings
        if tts_config:
            update_payload["conversation_config"]["tts"] = tts_config
            
        # Only add first_message if provided
        if first_message is not None:
            update_payload["conversation_config"]["agent"]["first_message"] = first_message
            
        # Only add prompt if provided
        if prompt is not None:
            update_payload["conversation_config"]["agent"]["prompt"] = {
                "prompt": prompt
            }
        
        print("Sending payload:", update_payload)
        
        # Call ElevenLabs API to update agent configuration
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"https://api.elevenlabs.io/v1/convai/agents/{settings.ELEVENLABS_AGENT_ID}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json=update_payload,
                timeout=30.0
            )
            print("response status:", response.status_code)
            print("response headers:", dict(response.headers))
            print("response content:", response.text)
            
            # Try to parse JSON if content-type is JSON
            try:
                if response.headers.get("content-type", "").startswith("application/json"):
                    response_json = response.json()
                    print("response json:", response_json)
                else:
                    print("response json: Not JSON content")
            except Exception as e:
                print("response json: Failed to parse JSON -", str(e))
            
            if not response.is_success:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to update agent configuration: {response.text}"
                )
            
            data = response.json()
            return {
                "message": "Agent configuration updated successfully",
                "updated_fields": {
                    "language": language,
                    "prompt": prompt,
                    "first_message": first_message
                },
                "sent_payload": update_payload
            }
            
    except httpx.TimeoutException:
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when calling ElevenLabs API"
        )
    except httpx.RequestError as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to ElevenLabs API: {str(e)}"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/knowledge-base/upload")
async def upload_knowledge_base(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Upload a knowledge base file to ElevenLabs API
    First uploads the file, then adds it to agent configuration
    """
    try:
        print("key ...", settings.ELEVENLABS_API_KEY)
        print("agent_id ...", settings.ELEVENLABS_AGENT_ID)
        print("uploading file:", file.filename)
        
        # Check if API key and agent ID are configured
        if not settings.ELEVENLABS_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        if not settings.ELEVENLABS_AGENT_ID:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs Agent ID not configured"
            )
        
        # Validate file type (PDF and DOCX)
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['pdf', 'docx']:
            raise HTTPException(
                status_code=400,
                detail="Only PDF and DOCX files are supported"
            )
        
        # Create temporary file to store uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            # Copy uploaded file to temporary file
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
        
        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Upload file to ElevenLabs
                print("Step 1: Uploading file to ElevenLabs...")
                
                # Determine MIME type based on file extension
                mime_type = 'application/pdf' if file_extension == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                
                with open(temp_file_path, 'rb') as f:
                    files = {'file': (file.filename, f, mime_type)}
                    headers = {'xi-api-key': settings.ELEVENLABS_API_KEY}
                    
                    upload_response = await client.post(
                        "https://api.elevenlabs.io/v1/convai/knowledge-base/file",
                        files=files,
                        headers=headers,
                        timeout=60.0
                    )
                
                if not upload_response.is_success:
                    raise HTTPException(
                        status_code=upload_response.status_code,
                        detail=f"Failed to upload file to ElevenLabs: {upload_response.text}"
                    )
                
                upload_data = upload_response.json()
                knowledge_base_id = upload_data.get('id')
                knowledge_base_name = upload_data.get('name')
                
                print(f"File uploaded successfully. ID: {knowledge_base_id}, Name: {knowledge_base_name}")
                
                # Step 2: Get current agent configuration
                print("Step 2: Getting agent configuration...")
                agent_response = await client.get(
                    f"https://api.elevenlabs.io/v1/convai/agents/{settings.ELEVENLABS_AGENT_ID}",
                    headers={
                        "xi-api-key": settings.ELEVENLABS_API_KEY
                    },
                    timeout=30.0
                )
                
                if not agent_response.is_success:
                    raise HTTPException(
                        status_code=agent_response.status_code,
                        detail=f"Failed to get agent configuration: {agent_response.text}"
                    )
                
                agent_data = agent_response.json()
                print("Agent data retrieved successfully")
                
                # Step 3: Add new knowledge base to agent configuration
                print("Step 3: Adding knowledge base to agent configuration...")
                current_knowledge_base = agent_data.get("conversation_config", {}).get("agent", {}).get("prompt", {}).get("knowledge_base", [])
                
                # Create new knowledge base entry
                new_knowledge_base_entry = {
                    "type": "file",
                    "name": knowledge_base_name,
                    "id": knowledge_base_id,
                    "usage_mode": "auto"
                }
                
                # Add to existing knowledge base list
                updated_knowledge_base = current_knowledge_base + [new_knowledge_base_entry]
                
                print(f"Original knowledge base count: {len(current_knowledge_base)}")
                print(f"Updated knowledge base count: {len(updated_knowledge_base)}")
                
                # Step 4: Update agent configuration
                print("Step 4: Updating agent configuration...")
                update_payload = {
                    "conversation_config": {
                        "agent": {
                            "prompt": {
                                "knowledge_base": updated_knowledge_base
                            }
                        }
                    }
                }
                
                update_response = await client.patch(
                    f"https://api.elevenlabs.io/v1/convai/agents/{settings.ELEVENLABS_AGENT_ID}",
                    headers={
                        "xi-api-key": settings.ELEVENLABS_API_KEY,
                        "Content-Type": "application/json"
                    },
                    json=update_payload,
                    timeout=30.0
                )
                
                if not update_response.is_success:
                    raise HTTPException(
                        status_code=update_response.status_code,
                        detail=f"Failed to update agent configuration: {update_response.text}"
                    )
                
                print("Agent configuration updated successfully")
                
                return {
                    "message": "Knowledge base uploaded and added to agent successfully",
                    "knowledge_base_id": knowledge_base_id,
                    "knowledge_base_name": knowledge_base_name,
                    "agent_updated": True,
                    "knowledge_base_added_to_agent": True
                }
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                print("Temporary file cleaned up")
            
    except httpx.TimeoutException:
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when calling ElevenLabs API"
        )
    except httpx.RequestError as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to ElevenLabs API: {str(e)}"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/knowledge-base/{knowledge_id}")
async def delete_knowledge_base(
    knowledge_id: str = Path(..., description="Knowledge base ID to delete"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Delete a knowledge base from ElevenLabs API
    First removes it from agent configuration, then deletes the knowledge base
    """
    try:
        print("key ...", settings.ELEVENLABS_API_KEY)
        print("agent_id ...", settings.ELEVENLABS_AGENT_ID)
        print("delete URL ...", f"https://api.elevenlabs.io/v1/convai/knowledge-base/{knowledge_id}")
        
        # Check if API key and agent ID are configured
        if not settings.ELEVENLABS_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs API key not configured"
            )
        
        if not settings.ELEVENLABS_AGENT_ID:
            raise HTTPException(
                status_code=500, 
                detail="ElevenLabs Agent ID not configured"
            )
        
        async with httpx.AsyncClient() as client:
            # Step 1: Get current agent configuration
            print("Step 1: Getting agent configuration...")
            agent_response = await client.get(
                f"https://api.elevenlabs.io/v1/convai/agents/{settings.ELEVENLABS_AGENT_ID}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY
                },
                timeout=30.0
            )
            
            if not agent_response.is_success:
                raise HTTPException(
                    status_code=agent_response.status_code,
                    detail=f"Failed to get agent configuration: {agent_response.text}"
                )
            
            agent_data = agent_response.json()
            print("Agent data retrieved successfully")
            
            # Step 2: Remove knowledge base from agent configuration
            print("Step 2: Removing knowledge base from agent configuration...")
            current_knowledge_base = agent_data.get("conversation_config", {}).get("agent", {}).get("prompt", {}).get("knowledge_base", [])
            
            # Filter out the knowledge base to be deleted
            updated_knowledge_base = [
                kb for kb in current_knowledge_base 
                if kb.get("id") != knowledge_id
            ]
            
            print(f"Original knowledge base count: {len(current_knowledge_base)}")
            print(f"Updated knowledge base count: {len(updated_knowledge_base)}")
            
            # Step 3: Update agent configuration
            print("Step 3: Updating agent configuration...")
            update_payload = {
                "conversation_config": {
                    "agent": {
                        "prompt": {
                            "knowledge_base": updated_knowledge_base
                        }
                    }
                }
            }
            
            update_response = await client.patch(
                f"https://api.elevenlabs.io/v1/convai/agents/{settings.ELEVENLABS_AGENT_ID}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json=update_payload,
                timeout=30.0
            )
            
            if not update_response.is_success:
                raise HTTPException(
                    status_code=update_response.status_code,
                    detail=f"Failed to update agent configuration: {update_response.text}"
                )
            
            print("Agent configuration updated successfully")
            
            # Step 4: Delete the knowledge base
            print("Step 4: Deleting knowledge base...")
            delete_response = await client.delete(
                f"https://api.elevenlabs.io/v1/convai/knowledge-base/{knowledge_id}",
                headers={
                    "xi-api-key": settings.ELEVENLABS_API_KEY
                },
                timeout=30.0
            )
            
            if not delete_response.is_success:
                raise HTTPException(
                    status_code=delete_response.status_code,
                    detail=f"Failed to delete knowledge base: {delete_response.text}"
                )
            
            print("Knowledge base deleted successfully")
            
            return {
                "message": "Knowledge base deleted successfully", 
                "deleted_id": knowledge_id,
                "agent_updated": True,
                "knowledge_base_removed_from_agent": True
            }
            
    except httpx.TimeoutException:
        traceback.print_exc()
        raise HTTPException(
            status_code=408,
            detail="Request timeout when calling ElevenLabs API"
        )
    except httpx.RequestError as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Error connecting to ElevenLabs API: {str(e)}"
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# RAG Sales Coach Document Management Endpoints
RAG_DOCUMENTS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "rag_documents")
)
os.makedirs(RAG_DOCUMENTS_DIR, exist_ok=True)

async def process_document_background(doc_id: str, file_path: str, user_id: str):
    """
    Background task to process PDF document
    """
    db = get_database()
    logger.info(f"🔄 [RAG] Starting background processing for document {doc_id}")
    
    try:
        # Step 1: Extract text and create chunks
        logger.info(f"📄 [RAG] Step 1: Extracting text from PDF: {file_path}")
        chunks = process_pdf_to_chunks(file_path, max_tokens=512)
        logger.info(f"✅ [RAG] Step 1: Created {len(chunks)} chunks from PDF")
        
        if not chunks:
            raise Exception("No chunks extracted from PDF")
        
        # Step 2: Vectorize chunks
        logger.info(f"🔢 [RAG] Step 2: Vectorizing {len(chunks)} chunks...")
        chunk_texts = [chunk[0] for chunk in chunks]
        vectors = vectorize_texts(chunk_texts)
        logger.info(f"✅ [RAG] Step 2: Vectorized {len(vectors)} chunks (vector dim: {len(vectors[0]) if vectors else 0})")
        
        # Step 3: Insert into Weaviate
        logger.info(f"💾 [RAG] Step 3: Inserting into Weaviate...")
        weaviate_client = get_weaviate()
        if not weaviate_client:
            raise Exception("Weaviate client not available")
        
        collection = weaviate_client.collections.get("DataAiSaleCoach")
        logger.info(f"✅ [RAG] Step 3a: Got Weaviate collection 'DataAiSaleCoach'")
        
        # Prepare data objects
        data_objects = []
        for idx, (chunk_text, chunk_index) in enumerate(chunks):
            data_objects.append({
                "user_id": user_id,
                "doc_id": doc_id,
                "content": chunk_text,
                "chunk_index": chunk_index
            })
        
        logger.info(f"📦 [RAG] Step 3b: Prepared {len(data_objects)} data objects for insertion")
        
        # Insert with vectors
        inserted_count = 0
        with collection.batch.dynamic() as batch:
            for idx, data_obj in enumerate(data_objects):
                try:
                    batch.add_object(
                        properties=data_obj,
                        vector=vectors[idx]
                    )
                    inserted_count += 1
                    if (idx + 1) % 10 == 0:
                        logger.info(f"📤 [RAG] Step 3c: Inserted {idx + 1}/{len(data_objects)} objects...")
                except Exception as e:
                    logger.error(f"❌ [RAG] Error inserting object {idx}: {e}")
                    raise
        
        logger.info(f"✅ [RAG] Step 3: Successfully inserted {inserted_count} objects into Weaviate")
        
        # Step 4: Update document status
        logger.info(f"💾 [RAG] Step 4: Updating document status in MongoDB...")
        await db.rag_documents.update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "status": RAGDocumentStatus.PROCESSED,
                    "total_chunks": len(chunks),
                    "processed_at": datetime.utcnow()
                }
            }
        )
        logger.info(f"✅ [RAG] Document {doc_id} processed successfully! Total chunks: {len(chunks)}")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ [RAG] Error processing document {doc_id}: {error_msg}")
        traceback.print_exc()
        
        # Update document status to failed
        try:
            await db.rag_documents.update_one(
                {"_id": doc_id},
                {
                    "$set": {
                        "status": RAGDocumentStatus.FAILED,
                        "error_message": error_msg,
                        "processed_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"💾 [RAG] Updated document {doc_id} status to FAILED")
        except Exception as update_error:
            logger.error(f"❌ [RAG] Failed to update document status: {update_error}")

@router.post("/sales-coach/documents")
async def upload_rag_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Upload a PDF document for RAG Sales Coach
    - Stores the file for later download
    - Creates a record in MongoDB
    - Processes PDF in background: extracts text, chunks it, vectorizes, and inserts into Weaviate
    """
    try:
        logger.info(f"📤 [RAG] Starting upload for user {current_user.id}, file: {file.filename}")
        
        # Validate file type (only PDF)
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension != 'pdf':
            logger.warning(f"❌ [RAG] Invalid file type: {file_extension}")
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )
        
        # Read file content
        logger.info(f"📖 [RAG] Reading file content...")
        file_bytes = await file.read()
        file_size = len(file_bytes)
        logger.info(f"✅ [RAG] File read: {file_size} bytes")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}.pdf"
        file_path = os.path.join(RAG_DOCUMENTS_DIR, unique_filename)
        logger.info(f"💾 [RAG] Saving file to: {file_path}")
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        logger.info(f"✅ [RAG] File saved successfully")
        
        # Create document record in MongoDB
        db = get_database()
        doc_id = str(ObjectId())
        logger.info(f"📝 [RAG] Creating document record with ID: {doc_id}")
        
        document_doc = {
            "_id": doc_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "user_id": current_user.id,
            "status": RAGDocumentStatus.PROCESSING,
            "total_chunks": 0,
            "error_message": None,
            "uploaded_at": datetime.utcnow(),
            "processed_at": None
        }
        
        await db.rag_documents.insert_one(document_doc)
        logger.info(f"✅ [RAG] Document record created in MongoDB")
        
        # Add background task to process PDF
        logger.info(f"🚀 [RAG] Adding background task to process PDF...")
        background_tasks.add_task(
            process_document_background,
            doc_id,
            file_path,
            current_user.id
        )
        logger.info(f"✅ [RAG] Background task added, returning response")
        
        return {
            "id": doc_id,
            "filename": file.filename,
            "status": RAGDocumentStatus.PROCESSING,
            "total_chunks": 0,
            "message": "Document uploaded successfully. Processing in background..."
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [RAG] Upload error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/sales-coach/documents")
async def get_rag_documents(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get list of RAG documents for the current user
    """
    try:
        db = get_database()
        cursor = db.rag_documents.find({"user_id": current_user.id}).sort("uploaded_at", -1)
        documents = await cursor.to_list(length=None)
        
        result = []
        for doc in documents:
            result.append({
                "id": str(doc["_id"]),
                "name": doc.get("original_filename", doc.get("filename", "")),
                "size": doc.get("file_size", 0),
                "uploadedAt": doc.get("uploaded_at", datetime.utcnow()).isoformat(),
                "status": doc.get("status", RAGDocumentStatus.PROCESSING),
                "type": "pdf",
                "pages": 0,  # We don't track pages separately
                "total_chunks": doc.get("total_chunks", 0),
                "error_message": doc.get("error_message")
            })
        
        return result
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/sales-coach/documents/{document_id}/download")
async def download_rag_document(
    document_id: str = Path(..., description="Document ID to download"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Download a RAG document file
    """
    try:
        db = get_database()
        doc = await db.rag_documents.find_one({
            "_id": document_id,
            "user_id": current_user.id
        })
        
        if not doc:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        file_path = doc.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="File not found on server"
            )
        
        original_filename = doc.get("original_filename", doc.get("filename", "document.pdf"))
        
        return FileResponse(
            path=file_path,
            filename=original_filename,
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/sales-coach/documents/{document_id}")
async def delete_rag_document(
    document_id: str = Path(..., description="Document ID to delete"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Delete a RAG document and its associated data from Weaviate and MongoDB
    - Deletes all chunks with matching doc_id from Weaviate
    - Deletes the document record from MongoDB
    - Deletes the physical file from disk
    """
    try:
        logger.info(f"🗑️ [RAG] Starting deletion of document {document_id} for user {current_user.id}")
        
        db = get_database()
        doc = await db.rag_documents.find_one({
            "_id": document_id,
            "user_id": current_user.id
        })
        
        if not doc:
            logger.warning(f"❌ [RAG] Document {document_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        logger.info(f"✅ [RAG] Found document: {doc.get('original_filename', 'unknown')}")
        
        # Step 1: Delete from Weaviate
        chunks_deleted = 0
        try:
            logger.info(f"💾 [RAG] Step 1: Deleting chunks from Weaviate for doc_id={document_id}...")
            weaviate_client = get_weaviate()
            if not weaviate_client:
                logger.warning(f"⚠️ [RAG] Weaviate client not available, skipping Weaviate deletion")
            else:
                collection = weaviate_client.collections.get("DataAiSaleCoach")
                
                # Count chunks before deletion
                try:
                    if WEAVIATE_FILTER_AVAILABLE:
                        # Use Filter API if available
                        result = collection.query.fetch_objects(
                            where=Filter.by_property("doc_id").equal(document_id),
                            limit=10000  # Large limit to get all
                        )
                        chunks_deleted = len(result.objects) if result.objects else 0
                        logger.info(f"📊 [RAG] Found {chunks_deleted} chunks to delete in Weaviate")
                        
                        if chunks_deleted > 0:
                            # Delete using delete_many
                            collection.data.delete_many(
                                where=Filter.by_property("doc_id").equal(document_id)
                            )
                            logger.info(f"✅ [RAG] Deleted {chunks_deleted} chunks from Weaviate using delete_many")
                    else:
                        # Fallback: query and delete in batches
                        total_deleted = 0
                        batch_size = 1000
                        offset = 0
                        
                        while True:
                            results = collection.query.fetch_objects(
                                where={"path": ["doc_id"], "operator": "Equal", "valueString": document_id},
                                limit=batch_size,
                                offset=offset
                            )
                            
                            if not results.objects or len(results.objects) == 0:
                                break
                            
                            uuids_to_delete = [obj.uuid for obj in results.objects]
                            logger.info(f"📤 [RAG] Deleting batch of {len(uuids_to_delete)} chunks (offset={offset})...")
                            
                            for uuid_to_delete in uuids_to_delete:
                                try:
                                    collection.data.delete_by_id(uuid_to_delete)
                                    total_deleted += 1
                                except Exception as del_error:
                                    logger.warning(f"⚠️ [RAG] Failed to delete chunk {uuid_to_delete}: {del_error}")
                            
                            if len(results.objects) < batch_size:
                                break
                            
                            offset += batch_size
                        
                        chunks_deleted = total_deleted
                        logger.info(f"✅ [RAG] Deleted {chunks_deleted} chunks from Weaviate (batch method)")
                        
                except Exception as count_error:
                    logger.warning(f"⚠️ [RAG] Error counting/deleting chunks: {count_error}")
                    # Try to delete anyway
                    if WEAVIATE_FILTER_AVAILABLE:
                        try:
                            collection.data.delete_many(
                                where=Filter.by_property("doc_id").equal(document_id)
                            )
                            logger.info(f"✅ [RAG] Attempted bulk delete from Weaviate")
                        except:
                            pass
                            
        except Exception as e:
            logger.error(f"❌ [RAG] Error deleting from Weaviate: {e}")
            traceback.print_exc()
            # Continue with other deletions even if Weaviate fails
        
        # Step 2: Delete physical file
        logger.info(f"📁 [RAG] Step 2: Deleting physical file...")
        file_path = doc.get("file_path")
        file_deleted = False
        if file_path and os.path.exists(file_path):
            try:
                os.unlink(file_path)
                file_deleted = True
                logger.info(f"✅ [RAG] Deleted file: {file_path}")
            except Exception as e:
                logger.warning(f"⚠️ [RAG] Failed to delete file {file_path}: {e}")
        else:
            logger.info(f"ℹ️ [RAG] File not found or path not set: {file_path}")
        
        # Step 3: Delete from MongoDB
        logger.info(f"💾 [RAG] Step 3: Deleting document record from MongoDB...")
        result = await db.rag_documents.delete_one({"_id": document_id})
        
        if result.deleted_count > 0:
            logger.info(f"✅ [RAG] Deleted document record from MongoDB")
        else:
            logger.warning(f"⚠️ [RAG] No document record deleted from MongoDB")
        
        logger.info(f"✅ [RAG] Document {document_id} deletion completed. Chunks: {chunks_deleted}, File: {file_deleted}, MongoDB: {result.deleted_count > 0}")
        
        return {
            "message": "Document deleted successfully",
            "id": document_id,
            "chunks_deleted": chunks_deleted,
            "file_deleted": file_deleted,
            "mongodb_deleted": result.deleted_count > 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [RAG] Error deleting document: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/sales-coach/search")
async def search_rag_documents(
    query: str = Form(..., description="Search query text"),
    limit: int = Form(5, description="Number of results to return (max 5)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Search RAG documents using semantic search
    - Vectorizes the query text
    - Searches in Weaviate for similar chunks
    - Returns top N most relevant results (max 5)
    """
    try:
        # Validate limit
        if limit > 5:
            limit = 5
        if limit < 1:
            limit = 5
        
        logger.info(f"🔍 [RAG] Starting semantic search for user {current_user.id}")
        logger.info(f"📝 [RAG] Query: {query[:100]}...")
        logger.info(f"📊 [RAG] Limit: {limit}")
        
        # Step 1: Vectorize query text
        logger.info(f"🔢 [RAG] Step 1: Vectorizing query text...")
        query_vector = vectorize_text(query)
        logger.info(f"✅ [RAG] Step 1: Query vectorized (dimension: {len(query_vector)})")
        
        # Step 2: Search in Weaviate
        logger.info(f"💾 [RAG] Step 2: Searching in Weaviate...")
        weaviate_client = get_weaviate()
        if not weaviate_client:
            raise HTTPException(
                status_code=503,
                detail="Weaviate client not available"
            )
        
        collection = weaviate_client.collections.get("DataAiSaleCoach")
        logger.info(f"✅ [RAG] Step 2a: Got Weaviate collection 'DataAiSaleCoach'")
        
        # Perform vector similarity search
        # Only search chunks belonging to the current user
        try:
            from weaviate.classes.query import MetadataQuery
            
            logger.info(f"🔍 [RAG] Step 2a: Filtering by user_id={current_user.id}")
            
            if WEAVIATE_FILTER_AVAILABLE:
                # Use Filter API for user filtering
                logger.info(f"✅ [RAG] Step 2b: Using Weaviate Filter API to filter by user_id")
                results = collection.query.near_vector(
                    near_vector=query_vector,
                    limit=limit,
                    filters=Filter.by_property("user_id").equal(current_user.id),
                    return_metadata=MetadataQuery(distance=True)
                )
                logger.info(f"✅ [RAG] Step 2c: Weaviate query completed with filter")
            else:
                # Fallback: query without filter (will filter in post-processing)
                logger.info(f"⚠️ [RAG] Step 2b: Filter API not available, using post-processing filter")
                results = collection.query.near_vector(
                    near_vector=query_vector,
                    limit=limit * 2,  # Get more results to filter by user_id
                    return_metadata=MetadataQuery(distance=True)
                )
                
                # Filter by user_id in post-processing
                if results.objects:
                    logger.info(f"🔍 [RAG] Step 2c: Filtering {len(results.objects)} results by user_id={current_user.id}")
                    filtered_objects = [
                        obj for obj in results.objects 
                        if obj.properties.get("user_id") == current_user.id
                    ]
                    logger.info(f"✅ [RAG] Step 2d: Filtered to {len(filtered_objects)} results for user {current_user.id}")
                    # Limit to requested number
                    filtered_objects = filtered_objects[:limit]
                    # Create a new result object with filtered results
                    class FilteredResults:
                        def __init__(self, objects):
                            self.objects = objects
                    results = FilteredResults(filtered_objects)
            
            logger.info(f"✅ [RAG] Step 2: Found {len(results.objects) if results.objects else 0} results for user {current_user.id}")
            
            # Step 3: Format results
            logger.info(f"📦 [RAG] Step 3: Formatting results...")
            formatted_results = []
            
            if results.objects:
                # Get document info from MongoDB for each result
                # IMPORTANT: Also filter by user_id to ensure security
                db = get_database()
                doc_ids = list(set([obj.properties.get("doc_id") for obj in results.objects if obj.properties.get("doc_id")]))
                
                logger.info(f"📚 [RAG] Step 3a: Fetching metadata for {len(doc_ids)} documents (user_id={current_user.id})")
                
                # Fetch document metadata - filter by both doc_ids AND user_id for security
                doc_metadata = {}
                if doc_ids:
                    cursor = db.rag_documents.find({
                        "_id": {"$in": doc_ids},
                        "user_id": current_user.id  # Additional security: ensure documents belong to current user
                    })
                    docs = await cursor.to_list(length=None)
                    logger.info(f"✅ [RAG] Step 3b: Found {len(docs)} documents belonging to user {current_user.id}")
                    
                    for doc in docs:
                        doc_metadata[str(doc["_id"])] = {
                            "filename": doc.get("original_filename", doc.get("filename", "Unknown")),
                            "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None
                        }
                    
                    # Verify all doc_ids have metadata (security check)
                    missing_docs = set(doc_ids) - set(doc_metadata.keys())
                    if missing_docs:
                        logger.warning(f"⚠️ [RAG] Security: {len(missing_docs)} document(s) not found or belong to different user: {missing_docs}")
                
                # Format results - only include results that belong to current user
                for obj in results.objects:
                    props = obj.properties
                    doc_id = props.get("doc_id")
                    obj_user_id = props.get("user_id", "")
                    
                    # Security check: Skip if user_id doesn't match (shouldn't happen with filter, but double-check)
                    if obj_user_id != current_user.id:
                        logger.warning(f"⚠️ [RAG] Security: Skipping result with mismatched user_id. Expected: {current_user.id}, Got: {obj_user_id}")
                        continue
                    
                    # Only include if document metadata exists (belongs to current user)
                    if doc_id not in doc_metadata:
                        logger.warning(f"⚠️ [RAG] Security: Skipping result with doc_id {doc_id} - document not found or belongs to different user")
                        continue
                    
                    # Calculate similarity score (1 - distance, higher is better)
                    distance = None
                    similarity_score = None
                    if obj.metadata and hasattr(obj.metadata, 'distance'):
                        distance = obj.metadata.distance
                        # Distance is typically 0-2 for cosine similarity (normalized vectors)
                        # Convert to similarity score (0-1, higher is better)
                        similarity_score = max(0, 1 - (distance / 2))
                    
                    result_item = {
                        "content": props.get("content", ""),
                        "doc_id": doc_id,
                        "chunk_index": props.get("chunk_index", 0),
                        "user_id": obj_user_id,
                        "similarity_score": round(similarity_score, 4) if similarity_score is not None else None,
                        "distance": round(distance, 4) if distance is not None else None,
                        "document": doc_metadata.get(doc_id, {
                            "filename": "Unknown",
                            "uploaded_at": None
                        })
                    }
                    formatted_results.append(result_item)
            
            logger.info(f"✅ [RAG] Step 3: Formatted {len(formatted_results)} results")
            logger.info(f"✅ [RAG] Semantic search completed successfully")
            
            return {
                "query": query,
                "total_results": len(formatted_results),
                "limit": limit,
                "results": formatted_results
            }
            
        except Exception as search_error:
            logger.error(f"❌ [RAG] Error searching in Weaviate: {search_error}")
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Error searching in Weaviate: {str(search_error)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [RAG] Error in semantic search: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

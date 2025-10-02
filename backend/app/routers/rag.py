from fastapi import APIRouter, HTTPException, Depends, Path, UploadFile, File, Form
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.core.config import settings
import httpx
import os
import traceback
import tempfile
import shutil
from typing import Optional
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
            print(f"🎯 [ELEVENLABS] Clone/cloned voices details: {[{'id': v.get('voice_id'), 'name': v.get('name'), 'category': v.get('category')} for v in clone_voices]}")

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

        # Validate file size (max 25MB for ElevenLabs)
        max_size = 25 * 1024 * 1024  # 25MB
        if file.size and file.size > max_size:
            print(f"❌ [ELEVENLABS] File too large: {file.size} bytes")
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 25MB limit"
            )

        print(f"✅ [ELEVENLABS] File validation passed")

        # Prepare form data for ElevenLabs API
        files_data = {
            "files": (file.filename, await file.read(), file.content_type)
        }
        
        form_data = {
            "name": name
        }
        
        if description:
            form_data["description"] = description

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

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import httpx
from app.core.auth import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# WhatsApp external API base URL
WHATSAPP_API_BASE = "http://54.79.147.183:8501"

@router.post("/conversations/member")
async def get_whatsapp_conversations(
    request_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get WhatsApp conversations for a member"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{WHATSAPP_API_BASE}/webhook/conversations/member",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"WhatsApp API error: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="WhatsApp API timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="WhatsApp API unavailable")
    except Exception as e:
        print(f"❌ Error calling WhatsApp conversations API: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp API error: {str(e)}")

@router.post("/conversations/messages")
async def get_whatsapp_messages(
    request_data: dict,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get WhatsApp messages for a conversation"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{WHATSAPP_API_BASE}/webhook/conversations/messages",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"WhatsApp API error: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="WhatsApp API timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="WhatsApp API unavailable")
    except Exception as e:
        print(f"❌ Error calling WhatsApp messages API: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp API error: {str(e)}")

@router.post("/rag/upload")
async def upload_whatsapp_rag_file(
    file: bytes,
    current_user: UserResponse = Depends(get_current_user)
):
    """Upload RAG file for WhatsApp training"""
    try:
        # Note: This is a simplified version. In practice, you'd need to handle file uploads properly
        # with FastAPI's UploadFile and FormData
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": file}
            response = await client.post(
                f"{WHATSAPP_API_BASE}/rag/upload",
                files=files
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"WhatsApp RAG API error: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="WhatsApp RAG API timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="WhatsApp RAG API unavailable")
    except Exception as e:
        print(f"❌ Error calling WhatsApp RAG API: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp RAG API error: {str(e)}")

# Alternative RAG upload endpoint with proper file handling
from fastapi import File, UploadFile

@router.post("/rag/upload-file")
async def upload_whatsapp_rag_file_proper(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """Upload RAG file for WhatsApp training (proper file handling)"""
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Read file content
        file_content = await file.read()
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (file.filename, file_content, "application/pdf")}
            response = await client.post(
                f"{WHATSAPP_API_BASE}/rag/upload",
                files=files
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"WhatsApp RAG API error: {response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="WhatsApp RAG API timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="WhatsApp RAG API unavailable")
    except Exception as e:
        print(f"❌ Error calling WhatsApp RAG API: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp RAG API error: {str(e)}")

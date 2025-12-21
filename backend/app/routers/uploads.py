from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid


router = APIRouter(prefix="/api", tags=["File Upload"])


UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
)


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a single file and return public URL with `/upload` prefix.
    """
    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Generate unique filename but keep original extension
    _, ext = os.path.splitext(file.filename or "")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cannot save file: {e}")

    # Public URL path (FastAPI static mount at `/upload`)
    public_url = f"/upload/{unique_name}"

    return {
        "filename": file.filename,
        "stored_name": unique_name,
        "url": public_url,
    }




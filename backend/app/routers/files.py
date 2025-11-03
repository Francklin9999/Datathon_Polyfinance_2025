"""
File upload router - handles file uploads for regulatory documents
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import uuid
from datetime import datetime

from app.services.aws_s3_service import S3Service
from app.services.aws_config import is_aws_configured

router = APIRouter()

# File upload directory (fallback for local storage)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file (PDF, HTML, XML, DOCX)
    Returns file URL for use in analysis
    """
    # Validate file type
    allowed_extensions = {".pdf", ".html", ".xml", ".docx", ".txt", ".csv"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to AWS S3 if configured, otherwise save locally
        if is_aws_configured():
            try:
                s3_result = S3Service.upload_file(
                    file_content=content,
                    filename=file.filename,
                    prefix="uploads/"
                )
                return {
                    "file_url": s3_result.get("url", ""),
                    "s3_key": s3_result.get("s3_key", ""),
                    "s3_bucket": s3_result.get("s3_bucket", ""),
                    "file_id": file_id,
                    "filename": file.filename,
                    "size": len(content),
                    "uploaded_at": datetime.now().isoformat(),
                    "storage": "aws_s3"
                }
            except Exception as s3_error:
                # Fallback to local storage if S3 fails
                pass
        
        # Local storage fallback
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        file_url = f"/uploads/{filename}"
        
        return {
            "file_url": file_url,
            "file_id": file_id,
            "filename": file.filename,
            "size": len(content),
            "uploaded_at": datetime.now().isoformat(),
            "storage": "local"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@router.get("/{file_id}")
async def get_file_info(file_id: str):
    """
    Get file information by ID
    """
    # In production, query database or storage
    return {
        "file_id": file_id,
        "status": "uploaded",
        "url": f"/uploads/{file_id}"
    }


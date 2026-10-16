from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.security import get_current_user
from app.services.document_service import extract_text
from app.services.ingestion_service import ingest_document

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    original_filename = Path(file.filename).name
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, DOCX, PNG, JPG and JPEG files are allowed",
        )

    if file.content_type != ALLOWED_TYPES[extension]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type does not match the file extension",
        )

    content = file.file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    signatures = {
        ".pdf": lambda data: data.startswith(b"%PDF-"),
        ".docx": lambda data: data.startswith(b"PK\x03\x04"),
        ".png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
        ".jpg": lambda data: data.startswith(b"\xff\xd8\xff"),
        ".jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
    }

    if not signatures[extension](content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content",
        )

    saved_filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / saved_filename

    try:
        with file_path.open("wb") as uploaded_file:
            uploaded_file.write(content)

        extracted_text = extract_text(file_path)

        document = Document(
            user_id=current_user.id,
            filename=original_filename,
            file_path=str(file_path),
            extracted_text=extracted_text, 
            status="uploaded",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        if extracted_text:
            ingest_document(document, db)
            document.status = "processed"
            db.commit()
        else:
            document.status = "uploaded"
            db.commit()
        return document

    except Exception:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise

    finally:
        file.file.close()


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )



@router.get("/{document_id}/open")
def open_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    file_path = Path(document.file_path).resolve()

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file not found",
        )

    allowed_extensions = {
    ".pdf",
    ".docx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    }
    extension = file_path.suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document type",
        )

    media_types = {
    ".pdf": "application/pdf",
    ".docx": (
        "application/vnd.openxmlformats-officedocument."
        "wordprocessingml.document"
    ),
    ".txt": "text/plain",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}

    return FileResponse(
    path=file_path,
    media_type=media_types[extension],
    filename=file_path.name,
    content_disposition_type=(
        "inline"
        if extension in {".pdf", ".png", ".jpg", ".jpeg"}
        else "attachment"
    ),

    )



@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    file_path = Path(document.file_path).resolve()

    try:
        # Delete only the chunks belonging to this document.
        db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document.id,
        ).delete(synchronize_session=False)

        # Delete the document record.
        db.delete(document)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document and its chunks",
        )

    # Remove the physical file after the database transaction succeeds.
    try:
        if file_path.is_file():
            file_path.unlink()
    except OSError:
        # The database deletion succeeded, but the file needs cleanup.
        raise HTTPException(
            status_code=500,
            detail="Document record deleted, but uploaded file cleanup failed",
        )

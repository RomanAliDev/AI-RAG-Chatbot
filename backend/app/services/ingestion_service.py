from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.chunking_service import split_text
from app.services.embedding_service import generate_embeddings


def ingest_document(document: Document, db: Session) -> int:
    
    if not document.extracted_text or not document.extracted_text.strip():
        raise ValueError("Document has no extracted text")

    chunks = split_text(document.extracted_text)

    if not chunks:
        raise ValueError("No text chunks generated")

    embeddings = generate_embeddings(chunks)

    if len(chunks) != len(embeddings):
        raise RuntimeError("Chunk and embedding counts do not match")

    records = [
        DocumentChunk(
            document_id=document.id,
            user_id=document.user_id,
            chunk_index=index,
            content=chunk,
            embedding=embedding,
        )
        for index, (chunk, embedding) in enumerate(
            zip(chunks, embeddings, strict=True)
        )
    ]

    try:
        db.add_all(records)
        db.commit()
    except Exception:
        db.rollback()
        raise


    return len(records)

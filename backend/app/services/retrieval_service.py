from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import generate_query_embedding


def retrieve_chunks(
    question: str,
    user_id: int,
    db: Session,
    top_k: int = 3,
    max_distance: float = 0.7,
) -> list[DocumentChunk]:

    if not question.strip():
        return []

    query_embedding = generate_query_embedding(question)

    distance = DocumentChunk.embedding.cosine_distance(query_embedding)

    chunks = (
        db.query(DocumentChunk)
        .filter(
            DocumentChunk.user_id == user_id,
            DocumentChunk.embedding.is_not(None),
            distance <= max_distance,
        )
        .order_by(distance)
        .limit(top_k)
        .all()
    )

    return chunks

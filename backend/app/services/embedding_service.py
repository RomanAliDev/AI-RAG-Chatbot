
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import settings


embedding_model = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=settings.gemini_api_key,
    output_dimensionality=3072,
)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    return embedding_model.embed_documents(texts)


def generate_query_embedding(text: str) -> list[float]:
    if not text.strip():
        raise ValueError("Query text cannot be empty")

    return embedding_model.embed_query(text)

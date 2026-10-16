from pydantic import BaseModel, Field 


class ChatRequest(BaseModel):
    question: str = Field(min_length=10, max_length=500)


class ChatSource(BaseModel):
    document_id: int
    chunk_id: int
    content: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource] = Field(default_factory=list)


class ChatRoute(BaseModel):
    category: str = Field(
    description="Question category: GENERAL or RAG"
    )

class SearchQuery(BaseModel):
    rewritten_question: str = Field(
        description="Standalone search query for document retrieval"
    )
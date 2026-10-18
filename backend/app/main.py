from fastapi import FastAPI

from app.router import auth , documents ,chat, conversation
from fastapi.middleware.cors import CORSMiddleware

from app.models.user import User 
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.conversation import Conversation
from app.models.chat_message import ChatMessage

from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-RAG-Chatbot",
    description="Multi-user document RAG chatbot powered by LangChain and Gemini"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(conversation.router)

@app.get("/")
def root():
    return {"message": "Welcome to the AI-RAG-Chatbot API!"}
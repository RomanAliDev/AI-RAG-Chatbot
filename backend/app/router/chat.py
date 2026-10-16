from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.models.conversation import Conversation
from app.models.chat_message import ChatMessage
from app.services.chat_service import generate_chat_answer

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    try:
        previous_messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conversation_id)
            .order_by(
            ChatMessage.created_at.desc(),
            ChatMessage.id.desc(),
            )
            .limit(20)
            .all()
            )
        
        chat_history = [
            {
                "role": message.role,
                "content": message.content,
            }
             for message in reversed(previous_messages)
        ]
        

        user_message = ChatMessage(
            conversation_id=conversation_id,
            role="user",
            content=question,
        )

        db.add(user_message)
        db.commit()

        
        result = generate_chat_answer(
            question=question,
            user_id=current_user.id,
            db=db,
            chat_history=chat_history,
        )

        if conversation.title == "New Chat":
                conversation.title = question[:50]

        assistant_message = ChatMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=result["answer"],
        )

        db.add(assistant_message)
        db.commit()

        return result

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()
        print(f"Chat processing error: {exc}")

        raise HTTPException(
            status_code=500,
            detail=str(exc) or "Unknown error occurred",
        )

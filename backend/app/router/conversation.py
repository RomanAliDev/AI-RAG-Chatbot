from fastapi import Depends, APIRouter , status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.models.conversation import Conversation
from fastapi import HTTPException
from app.models.chat_message import ChatMessage


router = APIRouter(prefix="/api/v1/conversations", tags=["Conversations"])

@router.post("/")
def create_conversation(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conversation = Conversation(
        user_id=current_user.id,
        title="New Chat",
    )

    db.add(conversation)
    
    db.commit()
    db.refresh(conversation)

    return {
        "id": conversation.id,
        "title": conversation.title,
        "created_at": conversation.created_at,
    }


@router.get("/")
def get_conversations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )

    return [
        {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
        }
        for conversation in conversations
    ]


@router.get("/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.conversation_id == conversation_id,
        )
        .order_by(
            ChatMessage.created_at.asc(),
            ChatMessage.id.asc(),
        )
        .all()
    )

    return {
        "conversation_id": conversation.id,
        "title": conversation.title,
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }



@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    try:
        db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation.id
        ).delete(synchronize_session=False)

        db.delete(conversation)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation",
        )

    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id,
    }

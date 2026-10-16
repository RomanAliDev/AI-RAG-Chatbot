from sqlalchemy.orm import Session

from app.services.general_chat_service import (
    generate_general_answer,
    llm,
)
from app.services.rag_service import generate_rag_answer
from app.schemas.chat import ChatRoute

def generate_chat_answer(
    question: str,
    user_id: int,
    db: Session,
    chat_history: list[dict] | None = None,
) -> dict:

    history_text = "\n".join(
        f"{message['role']}: {message['content']}"
        for message in (chat_history or [])[-6:]
    )

    routing_prompt = (
        "Classify the user's question into exactly one category:\n"
        "- GENERAL: general knowledge, programming, explanations, "
        "greetings, or unrelated to the user's uploaded documents.\n"
        "- RAG: questions asking about information in uploaded documents, "
        "including follow-up questions about previously discussed documents.\n"
        "Use conversation history to understand the current question.\n"
        "Return only GENERAL or RAG.\n\n"
        f"Conversation history:\n{history_text}\n\n"
        f"Current question: {question}"
    )

    route_llm=llm.with_structured_output(ChatRoute)
    result = route_llm.invoke(routing_prompt)
    category = result.category

    if category == "RAG":
        return generate_rag_answer(
            question=question,
            user_id=user_id,
            db=db,
            chat_history=chat_history,
        )

    return generate_general_answer(
        question=question,
        chat_history=chat_history,
    )

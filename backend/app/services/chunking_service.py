
from langchain_text_splitters import RecursiveCharacterTextSplitter


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", " ", ""],
)


def split_text(text: str) -> list[str]:
    if not text or not text.strip():
        return []

    return text_splitter.split_text(text)

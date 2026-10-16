
import pytesseract
from PIL import Image

from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader



pytesseract.pytesseract.tesseract_cmd = (
    r"D:\OCR Software\tesseract.exe"
)

def extract_text(file_path: Path) -> str | None:
    extension = file_path.suffix.lower()

    if extension == ".pdf":
        reader = PdfReader(str(file_path))

        text_parts = [
            page.extract_text() or ""
            for page in reader.pages
        ]

        extracted_text = "\n".join(text_parts).strip()
        return extracted_text or None

    if extension == ".docx":
        document = DocxDocument(str(file_path))

        text_parts = [
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        ]

        extracted_text = "\n".join(text_parts).strip()
        return extracted_text or None

    if extension in {".png", ".jpg", ".jpeg"}:
        with Image.open(file_path) as image:
            extracted_text = pytesseract.image_to_string(
                image,
                lang="eng",
            )
            return extracted_text.strip() or None

    return None

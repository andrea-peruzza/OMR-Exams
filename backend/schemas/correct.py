from pydantic import BaseModel
from typing import Optional

class CorrectRequest(BaseModel):
    datafile: str
    produce_pdf: bool = False
    pdf_filename: Optional[str] = None

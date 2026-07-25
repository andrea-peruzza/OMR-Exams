from pydantic import BaseModel
from typing import Optional

class SortRequest(BaseModel):
    datafile: str
    resolution: Optional[int] = 300
    paper: Optional[str] = "A4"
    clean_sorted: Optional[bool] = False

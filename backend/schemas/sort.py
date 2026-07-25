from pydantic import BaseModel
from typing import Optional, List

class SortRequest(BaseModel):
    datafile: str
    paper: Optional[str] = "A4"
    clean_sorted: Optional[bool] = False
    selected_scans: List[str]

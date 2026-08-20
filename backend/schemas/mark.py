from pydantic import BaseModel

from typing import Optional

class CalculateRequest(BaseModel):
    datafile: str
    outputfile: str
    use_custom_weights: Optional[bool] = False
    weight_correct: Optional[float] = 1.0
    weight_wrong: Optional[float] = -0.33
    weight_missing: Optional[float] = 0.0

class ReportRequest(BaseModel):
    datafile: str
    outputfile: str

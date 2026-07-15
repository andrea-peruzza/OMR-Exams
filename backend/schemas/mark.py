from pydantic import BaseModel

class CalculateRequest(BaseModel):
    datafile: str
    outputfile: str

class ReportRequest(BaseModel):
    datafile: str
    outputfile: str

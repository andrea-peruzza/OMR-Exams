from pydantic import BaseModel
from typing import List

class StudentAssociation(BaseModel):
    original_id: str
    new_student_id: str
    new_fullname: str

class BulkAssociateRequest(BaseModel):
    datafile: str
    associations: List[StudentAssociation]

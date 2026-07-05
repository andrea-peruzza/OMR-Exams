from pydantic import BaseModel
from typing import Optional

class DashboardStatus(BaseModel):
    config_loaded: bool
    config_path: Optional[str] = None
    questions_present: bool
    students_present: bool
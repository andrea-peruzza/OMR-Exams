from pydantic import BaseModel
from typing import Optional

class DashboardStatus(BaseModel):
    config_loaded: bool
    config_path: Optional[str] = None
    exam_json_exists: bool
    exam_json_path: Optional[str] = None
    scans_present: bool
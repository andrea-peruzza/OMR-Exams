from pydantic import BaseModel
from typing import List, Optional

class MoodleExportRequest(BaseModel):
    files: List[str]
    single: bool = False
    penalty: Optional[int] = 0
    outputfile: str = "export_moodle.xml"

class MoodleImportRequest(BaseModel):
    xml_file: str
    output_name: Optional[str] = None

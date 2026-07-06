from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class DataMarker(BaseModel):
    skip_until: Optional[str] = None
    on_column: Optional[int] = 0
    skip_rows: Optional[int] = 0

class ExcelFields(BaseModel):
    id: str
    name: str
    surname: str
    email: Optional[str] = None

class ConfigExcel(BaseModel):
    data_marker: Optional[DataMarker] = None
    fields: ExcelFields

class ConfigQuestion(BaseModel):
    source: str = Field(alias="from")
    draw: int

class ConfigExam(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    shuffle_questions: Optional[bool] = False
    shuffle_answers: Optional[bool] = True
    max_questions: Optional[int] = None  # Using None instead of False for Pydantic clarity
    max_open_questions: Optional[int] = None
    page_limits: Optional[int] = 2

class ConfigChoices(BaseModel):
    circled: Optional[bool] = False
    usesf: Optional[bool] = False

class GenerateConfig(BaseModel):
    exam: ConfigExam
    choices: Optional[ConfigChoices] = None
    paper: Optional[str] = "A4"
    packages: Optional[Dict[str, str]] = {}
    commands: Optional[Dict[str, str]] = {}
    dyslexia: Optional[bool] = False
    header: Optional[str] = None
    footer: Optional[str] = None
    preamble: Optional[str] = None
    excel: Optional[ConfigExcel] = None
    questions: Optional[List[ConfigQuestion]] = None

class GenerateRequest(BaseModel):
    config: GenerateConfig
    save_config: bool = False
    
    # Impostazioni di runtime (non salvate in config.yaml)
    date: str
    is_anonymous: bool
    num_anonymous_exams: Optional[int] = None
    selected_student_file: Optional[str] = None  # path relativo in data/students/
    output_prefix: str
    split: Optional[int] = None
    seed: Optional[int] = 42
    folded: Optional[bool] = True
    rotated: Optional[bool] = False

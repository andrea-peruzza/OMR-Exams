from fastapi import APIRouter
from schemas.dashboard import DashboardStatus
import os

router = APIRouter()

import glob

# In sviluppo locale: calcoliamo dinamicamente la cartella "data" che si trova
# due livelli sopra rispetto a questo file (backend/api/dashboard.py -> ../../data)
DEFAULT_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))

# In Docker: viene impostata automaticamente dal docker-compose.yaml tramite env
DATA_DIR = os.environ.get("DATA_DIR", DEFAULT_DATA_DIR)

@router.get("/status", response_model=DashboardStatus)
def get_status():
    config_path = os.path.join(DATA_DIR, "config.yaml")
    questions_dir = os.path.join(DATA_DIR, "questions")
    students_dir = os.path.join(DATA_DIR, "students")

    config_loaded = os.path.exists(config_path)
    
    questions_present = False
    if os.path.isdir(questions_dir):
        # Cerchiamo file markdown nella cartella questions
        md_files = glob.glob(os.path.join(questions_dir, "*.md"))
        questions_present = len(md_files) > 0
        
    students_present = False
    if os.path.isdir(students_dir):
        # Cerchiamo file excel nella cartella students
        excel_files = glob.glob(os.path.join(students_dir, "*.xls*"))
        students_present = len(excel_files) > 0

    return DashboardStatus(
        config_loaded=config_loaded,
        config_path=config_path if config_loaded else None,
        questions_present=questions_present,
        students_present=students_present
    )
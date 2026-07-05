from fastapi import APIRouter
from schemas.dashboard import DashboardStatus
import os

router = APIRouter()

# In sviluppo locale: imposta la variabile d'ambiente DATA_DIR nel terminale
# In Docker: viene impostata automaticamente dal docker-compose.yaml
DATA_DIR = os.environ.get("DATA_DIR", "./data")

@router.get("/status", response_model=DashboardStatus)
def get_status():
    config_path = os.path.join(DATA_DIR, "config.yaml")
    exam_json_path = os.path.join(DATA_DIR, "exam.json")
    scans_dir = os.path.join(DATA_DIR, "output", "scans", "raw")

    config_loaded = os.path.exists(config_path)
    exam_json_exists = os.path.exists(exam_json_path)
    scans_present = os.path.isdir(scans_dir) and len(os.listdir(scans_dir)) > 0

    return DashboardStatus(
        config_loaded=config_loaded,
        config_path=config_path if config_loaded else None,
        exam_json_exists=exam_json_exists,
        exam_json_path=exam_json_path if exam_json_exists else None,
        scans_present=scans_present
    )
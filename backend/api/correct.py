import os
import glob
from fastapi import APIRouter, BackgroundTasks
from typing import List, Dict, Any
from core.correct import Correct
from schemas.correct import CorrectRequest
from api.sse import task_manager

router = APIRouter()

DATA_DIR = os.environ.get("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))
SORTED_DIR = os.path.join(DATA_DIR, "sorted")

class CorrectProgressCallback:
    def __init__(self, task_id: str):
        self.task_id = task_id

    def __call__(self, current: int, total: int, message: str):
        task_manager.update_task(self.task_id, current, total, message)

def run_correct_task(task_id: str, req: CorrectRequest):
    try:
        task_manager.update_task(task_id, 0, 100, 'Inizializzazione correzione...')
        
        # Usa il nome completo del file json selezionato
        data_filename = os.path.join(DATA_DIR, req.datafile)
        
        # Determina il file di output
        if req.produce_pdf and req.pdf_filename:
            pdf_name = req.pdf_filename
            if not pdf_name.endswith('.pdf'):
                pdf_name += '.pdf'
            corrected_out = os.path.join(DATA_DIR, pdf_name)
        else:
            corrected_out = os.devnull
            
        progress_callback = CorrectProgressCallback(task_id)
        
        corrector = Correct(
            sorted=SORTED_DIR,
            corrected=corrected_out,
            data_filename=data_filename,
            resolution=300, # Defaulting to 300
            compression=50, # Defaulting to 50 for OpenCV IMWRITE_JPEG_QUALITY
            use_page_answers=False,
            progress_callback=progress_callback
        )
        
        corrector.correct()
        
        # Task completato con successo
        result_data = {
            "manual_checks_needed": len(corrector.watch_results)
        }
        task_manager.complete_task(task_id, result_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        task_manager.fail_task(task_id, str(e))

@router.get("/status")
def get_status():
    if not os.path.exists(SORTED_DIR):
        os.makedirs(SORTED_DIR)
        
    sorted_files = glob.glob(os.path.join(SORTED_DIR, "*.png"))
    data_files = [os.path.basename(f) for f in glob.glob(os.path.join(DATA_DIR, "*.json"))]
    
    return {
        "has_datafile": len(data_files) > 0,
        "has_sorted_scans": len(sorted_files) > 0,
        "data_files": data_files
    }

@router.post("/start")
async def start_correct(req: CorrectRequest, background_tasks: BackgroundTasks):
    task_id = task_manager.create_task()
    background_tasks.add_task(run_correct_task, task_id, req)
    return {"task_id": task_id}

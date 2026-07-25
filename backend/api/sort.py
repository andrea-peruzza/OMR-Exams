import os
import glob
import shutil
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, HTTPException
from typing import List, Dict, Any
from core.sort import Sort
from schemas.sort import SortRequest
from api.sse import task_manager

router = APIRouter()

DATA_DIR = os.environ.get("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))
SCANS_DIR = os.path.join(DATA_DIR, "scans")
SORTED_DIR = os.path.join(DATA_DIR, "sorted")

class SortProgressCallback:
    def __init__(self, task_id: str):
        self.task_id = task_id

    def __call__(self, current: int, total: int, message: str):
        task_manager.update_task(self.task_id, current, total, message)

def run_sort_task(task_id: str, req: SortRequest):
    try:
        task_manager.update_task(task_id, 0, 100, 'Inizializzazione sort...')
        
        if req.clean_sorted:
            for f in glob.glob(os.path.join(SORTED_DIR, "*.png")):
                try:
                    os.remove(f)
                except:
                    pass
        
        # Recupera tutti i pdf in data/scans/
        scanned_files = glob.glob(os.path.join(SCANS_DIR, "*.pdf"))
        if not scanned_files:
            raise Exception("Nessun file PDF trovato nella cartella data/scans")
            
        datafile_path = os.path.join(DATA_DIR, req.datafile)
        if not os.path.exists(datafile_path):
            raise Exception(f"Datafile non trovato: {datafile_path}")
            
        progress_callback = SortProgressCallback(task_id)
        
        sorter = Sort(
            scanned=scanned_files,
            sorted=SORTED_DIR,
            doublecheck=False, # TODO: eventualmente renderlo configurabile
            progress_callback=progress_callback
        )
        
        sorter.sort(paper=req.paper.upper())
        
        # Task completato con successo
        task_manager.complete_task(task_id)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        task_manager.fail_task(task_id, str(e))


@router.get("/status")
def get_status():
    if not os.path.exists(SCANS_DIR):
        os.makedirs(SCANS_DIR)
        
    scans_files = glob.glob(os.path.join(SCANS_DIR, "*.pdf"))
    data_files = [os.path.basename(f) for f in glob.glob(os.path.join(DATA_DIR, "*.json"))]
    sorted_pngs = glob.glob(os.path.join(SORTED_DIR, "*.png"))
    
    return {
        "has_scans": len(scans_files) > 0,
        "scans_count": len(scans_files),
        "data_files": data_files,
        "sorted_png_count": len(sorted_pngs)
    }

@router.post("/upload")
async def upload_scan(file: UploadFile = File(...)):
    if not os.path.exists(SCANS_DIR):
        os.makedirs(SCANS_DIR)
        
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Il file deve essere un PDF")
        
    file_path = os.path.join(SCANS_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start")
async def start_sort(req: SortRequest, background_tasks: BackgroundTasks):
    task_id = task_manager.create_task()
    background_tasks.add_task(run_sort_task, task_id, req)
    return {"task_id": task_id, "data_dir": SORTED_DIR}

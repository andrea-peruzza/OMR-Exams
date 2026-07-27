import os
import glob
import yaml
import shutil
from datetime import datetime as dt
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, HTTPException
from schemas.generate import GenerateRequest
from state.manager import task_manager
from core.generate import Generate

class ProgressCallback:
    def __init__(self, task_id):
        self.task_id = task_id
        
    def __call__(self, current, total, message):
        task_manager.update_task(self.task_id, current, total, message)

router = APIRouter()
DATA_DIR = os.environ.get("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))

@router.get("/config")
def get_config(file: str = "config.yaml"):
    config_path = os.path.join(DATA_DIR, file)
    if os.path.exists(config_path) and file.endswith(".yaml"):
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    return {}

@router.get("/files")
def get_files():
    questions_dir = os.path.join(DATA_DIR, "questions")
    students_dir = os.path.join(DATA_DIR, "students")
    
    questions = []
    if os.path.isdir(questions_dir):
        questions = [os.path.basename(f) for f in glob.glob(os.path.join(questions_dir, "*.md"))]
        
    students = []
    if os.path.isdir(students_dir):
        students = [os.path.basename(f) for f in glob.glob(os.path.join(students_dir, "*.xls*"))]
        
    configs = [os.path.basename(f) for f in glob.glob(os.path.join(DATA_DIR, "*.yaml"))]
    jsons = [os.path.basename(f) for f in glob.glob(os.path.join(DATA_DIR, "*.json"))]
    pdfs = [os.path.basename(f) for f in glob.glob(os.path.join(DATA_DIR, "*.pdf"))]
        
    return {"questions": questions, "students": students, "configs": configs, "jsons": jsons, "pdfs": pdfs}

@router.post("/upload/question")
async def upload_question(file: UploadFile = File(...)):
    if not file.filename.endswith('.md'):
        raise HTTPException(400, "Solo file markdown ammessi")
    questions_dir = os.path.join(DATA_DIR, "questions")
    os.makedirs(questions_dir, exist_ok=True)
    file_path = os.path.join(questions_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

@router.post("/upload/student")
async def upload_student(file: UploadFile = File(...)):
    if not (file.filename.endswith('.xls') or file.filename.endswith('.xlsx')):
        raise HTTPException(400, "Solo file excel ammessi")
    students_dir = os.path.join(DATA_DIR, "students")
    os.makedirs(students_dir, exist_ok=True)
    file_path = os.path.join(students_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

def run_generate_task(task_id: str, req: GenerateRequest):
    try:
        config_dict = req.config.model_dump(by_alias=True, exclude_none=True)
        config_dict['basedir'] = DATA_DIR

        if req.save_config:
            filename = req.config_output_name
            if not filename:
                filename = f"{req.output_prefix}_config.yaml"
            if not filename.endswith('.yaml'):
                filename += '.yaml'
            config_path = os.path.join(DATA_DIR, filename)
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.dump(config_dict, f, allow_unicode=True)

        # Costruisce la lista studenti: lista di tuple (matricola, fullname) come si aspetta il core
        student_list = []
        if not req.is_anonymous and req.selected_student_file:
            excel_path = os.path.join(DATA_DIR, "students", req.selected_student_file)
            if not os.path.exists(excel_path):
                raise Exception(f"File studenti non trovato: {excel_path}")
            
            import pandas as pd
            skip_rows = 0
            if 'excel' in config_dict and 'data_marker' in config_dict['excel']:
                marker = config_dict['excel']['data_marker'].get('skip_until')
                column = config_dict['excel']['data_marker'].get('on_column', 0)
                skip_rows_config = config_dict['excel']['data_marker'].get('skip_rows', 0)
                if marker:
                    df_marker = pd.read_excel(excel_path, header=None)
                    for i, row in df_marker.iterrows():
                        if str(row[column]).strip() == marker:
                            skip_rows = i + 1
                            break
                elif skip_rows_config:
                    skip_rows = skip_rows_config
            
            df = pd.read_excel(excel_path, skiprows=skip_rows)
            
            # Auto-rilevamento intelligente: salta le righe finché non trova vere intestazioni
            attempts = 0
            while df.columns.astype(str).str.startswith('Unnamed:').all() and attempts < 10:
                skip_rows += 1
                df = pd.read_excel(excel_path, skiprows=skip_rows)
                attempts += 1
                
            df.columns = [str(c).lower().strip() for c in df.columns]
            fields = config_dict['excel']['fields']
            name_col = str(fields.get('name', 'name')).lower().strip()
            surname_col = str(fields.get('surname', 'surname')).lower().strip()
            id_col = str(fields.get('id', 'id')).lower().strip()
            
            missing_cols = []
            if name_col not in df.columns: missing_cols.append(f"Nome ({name_col})")
            if surname_col not in df.columns: missing_cols.append(f"Cognome ({surname_col})")
            if id_col not in df.columns: missing_cols.append(f"Matricola ({id_col})")
            
            if missing_cols:
                raise Exception(f"Errore: Colonne non trovate nel file Excel: {', '.join(missing_cols)}. Colonne rilevate: {', '.join(df.columns)}")
            
            for idx, row in df.iterrows():
                fullname = f"{row[name_col]} {row[surname_col]}"
                matricola = str(row[id_col])
                student_list.append((matricola, fullname))
        else:
            count = req.num_anonymous_exams or 1
            for i in range(count):
                student_list.append((str(i+1), "Anonimo"))

        questions_dir = os.path.join(DATA_DIR, "questions")
        
        try:
            exam_date = dt.strptime(req.date, "%Y-%m-%d")
        except:
            exam_date = dt.now()

        generator = Generate(
            config=config_dict,
            questions=questions_dir,
            output_prefix=os.path.join(DATA_DIR, req.output_prefix),
            students=student_list,
            exam_date=exam_date,
            seed=req.seed,
            split=req.split,
            folded=req.folded,
            rotated=req.rotated,
            dyslexia_count=req.dyslexia_count,
            progress_callback=ProgressCallback(task_id)
        )
        
        generator.process()
        
        from core.backup import backup_exam_json
        backup_exam_json(os.path.join(DATA_DIR, f"{req.output_prefix}.json"))
        
        task_manager.complete_task(task_id)

    except Exception as e:
        import traceback
        traceback.print_exc()
        task_manager.fail_task(task_id, str(e))

@router.post("/start")
def start_generation(req: GenerateRequest, background_tasks: BackgroundTasks):
    task_id = task_manager.create_task()
    background_tasks.add_task(run_generate_task, task_id, req)
    return {"task_id": task_id, "data_dir": DATA_DIR}

@router.post("/test-layout")
async def test_layout(req: GenerateRequest):
    import asyncio
    try:
        config_dict = req.config.model_dump(by_alias=True, exclude_none=True)
        config_dict['basedir'] = DATA_DIR
        questions_dir = os.path.join(DATA_DIR, "questions")
        
        output_prefix = os.path.join(DATA_DIR, req.output_prefix)
        
        def run_test():
            generator = Generate(
                config=config_dict,
                questions=questions_dir,
                output_prefix=output_prefix,
                test=True
            )
            generator.process()
            
        await asyncio.to_thread(run_test)
        
        # Return a cache-busting timestamp to avoid caching issues with the PDF
        import time
        timestamp = int(time.time())
        return {"pdf_url": f"/api/data/{req.output_prefix}.pdf?t={timestamp}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

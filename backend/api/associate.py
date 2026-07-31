from fastapi import APIRouter, HTTPException
import os
import glob
from tinydb import TinyDB, Query, where
from schemas.associate import BulkAssociateRequest

router = APIRouter()
DATA_DIR = os.environ.get("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))

@router.get("/exams")
async def get_exams(datafile: str):
    data_filename = os.path.join(DATA_DIR, datafile)
    if not os.path.exists(data_filename):
        raise HTTPException(status_code=404, detail="Datafile non trovato")
    
    exams_list = []
    with TinyDB(data_filename) as db:
        if 'exams' not in db.tables():
            return {"exams": []}
            
        exams = db.table('exams').all()
        sorted_dir = os.path.join(DATA_DIR, "sorted")
        
        for exam in exams:
            student_id = str(exam['student_id'])
            fullname = exam.get('fullname', 'Anonimo')
            
            # Trova la prima pagina smistata per questo studente (es. 1-1.png)
            first_image = f"{student_id}-1.png"
            image_path = os.path.join(sorted_dir, first_image)
            image_url = f"/api/data/sorted/{first_image}" if os.path.exists(image_path) else None
            
            exams_list.append({
                "student_id": student_id,
                "fullname": fullname,
                "image": image_url
            })
                
    return {"exams": exams_list}

@router.get("/students_files")
async def get_students_files():
    students_dir = os.path.join(DATA_DIR, "students")
    if not os.path.exists(students_dir):
        return {"files": []}
    
    files = []
    for ext in ("*.xlsx", "*.xls", "*.csv"):
        for f in glob.glob(os.path.join(students_dir, ext)):
            files.append(os.path.basename(f))
    return {"files": files}

@router.get("/check_sorted")
async def check_sorted_files():
    sorted_dir = os.path.join(DATA_DIR, "sorted")
    if not os.path.exists(sorted_dir):
        return {"has_sorted_files": False}
    
    # Check if there's at least one PNG file
    png_files = glob.glob(os.path.join(sorted_dir, "*.png"))
    return {"has_sorted_files": len(png_files) > 0}

@router.post("/update")
async def update_associations(req: BulkAssociateRequest):
    data_filename = os.path.join(DATA_DIR, req.datafile)
    if not os.path.exists(data_filename):
        raise HTTPException(status_code=404, detail="Datafile non trovato")
        
    updated_count = 0
    with TinyDB(data_filename) as db:
        if 'exams' not in db.tables():
            raise HTTPException(status_code=404, detail="Tabella exams non trovata")
            
        Exam = Query()
        exams_table = db.table('exams')
        correction_table = db.table('correction')
        
        for assoc in req.associations:
            # Trova l'esame per aggiornare fullname e student_id
            exam = exams_table.get(Exam.student_id == assoc.original_id)
            if not exam:
                exam = exams_table.get(Exam.student_id == int(assoc.original_id))
                
            if exam:
                exam['student_id'] = assoc.new_student_id
                exam['fullname'] = assoc.new_fullname
                exams_table.upsert(exam, Exam.student_id == assoc.original_id)
                updated_count += 1
                
                # Se esiste anche la correzione, aggiorniamo il suo student_id per mantenere la coerenza
                if 'correction' in db.tables():
                    correction = correction_table.get(Exam.student_id == assoc.original_id)
                    if correction:
                        correction['student_id'] = assoc.new_student_id
                        correction_table.upsert(correction, Exam.student_id == assoc.original_id)
                        
                # IMPORTANTE: Se si cambia lo student_id, l'immagine smistata in `sorted/` ha ancora il vecchio nome file (es. "vecchioID-1.png")
                # Tuttavia, essendo solo per associazione, potremmo voler rinominare i file o semplicemente tenere i vecchi file per non rompere i collegamenti
                # Per semplicità, rinominiamo i file PNG se l'id è cambiato
                if str(assoc.original_id) != str(assoc.new_student_id):
                    sorted_dir = os.path.join(DATA_DIR, "sorted")
                    old_prefix = f"{assoc.original_id}-"
                    new_prefix = f"{assoc.new_student_id}-"
                    for filename in os.listdir(sorted_dir):
                        if filename.startswith(old_prefix) and filename.endswith(".png"):
                            old_path = os.path.join(sorted_dir, filename)
                            new_path = os.path.join(sorted_dir, filename.replace(old_prefix, new_prefix, 1))
                            os.rename(old_path, new_path)

    return {"status": "success", "updated_count": updated_count}

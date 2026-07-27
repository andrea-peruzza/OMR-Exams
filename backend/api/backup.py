from fastapi import APIRouter, HTTPException
from core.backup import list_backups, restore_backup

router = APIRouter()

@router.get("/list")
def get_backups():
    try:
        backups = list_backups()
        return {"backups": backups}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore/{filename}")
def restore(filename: str):
    try:
        restore_backup(filename)
        return {"message": "Backup ripristinato con successo"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

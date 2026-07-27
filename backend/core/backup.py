import os
import shutil
import stat
import glob
import subprocess
from datetime import datetime

DATA_DIR = os.environ.get("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))
BACKUP_DIR = os.path.join(DATA_DIR, "backup")

def _ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)

def _deny_deletion(filepath):
    if os.name == 'nt':
        subprocess.run(['icacls', filepath, '/deny', 'Everyone:(D)'], capture_output=True)

def _allow_deletion(filepath):
    if os.name == 'nt':
        subprocess.run(['icacls', filepath, '/remove:d', 'Everyone'], capture_output=True)

def backup_exam_json(filepath):
    """
    Copia il file JSON in data/backup/, lo rende in sola lettura e mantiene al massimo 5 file.
    """
    _ensure_backup_dir()
    
    if not os.path.exists(filepath):
        return
        
    filename = os.path.basename(filepath)
    backup_path = os.path.join(BACKUP_DIR, filename)
    
    # Rimuovi l'eventuale file esistente in backup per evitare errori di permesso in sovrascrittura
    if os.path.exists(backup_path):
        _allow_deletion(backup_path)
        os.chmod(backup_path, stat.S_IWRITE)
        os.remove(backup_path)
        
    # Copia il file
    shutil.copy2(filepath, backup_path)
    
    # Imposta sola lettura e nega l'eliminazione
    os.chmod(backup_path, stat.S_IREAD)
    _deny_deletion(backup_path)
    
    # Gestisci il limite di 5 file
    _enforce_backup_limit()

def _enforce_backup_limit(limit=5):
    """
    Mantiene solo i file più recenti nella cartella backup.
    """
    files = glob.glob(os.path.join(BACKUP_DIR, "*.json"))
    if len(files) <= limit:
        return
        
    # Ordina i file per data di modifica (dal più vecchio al più nuovo)
    files.sort(key=lambda x: os.path.getmtime(x))
    
    # Elimina i più vecchi finché non si raggiunge il limite
    files_to_delete = files[:-limit]
    for file in files_to_delete:
        try:
            # Rimuovi i blocchi NTFS e di sola lettura prima di eliminare
            _allow_deletion(file)
            os.chmod(file, stat.S_IWRITE)
            os.remove(file)
        except Exception as e:
            print(f"Errore durante l'eliminazione del backup vecchio {file}: {e}")

def list_backups():
    """
    Ritorna la lista dei backup disponibili con i loro metadati.
    """
    _ensure_backup_dir()
    files = glob.glob(os.path.join(BACKUP_DIR, "*.json"))
    
    # Ordina dal più recente al più vecchio
    files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    
    backups = []
    for f in files:
        stat_info = os.stat(f)
        backups.append({
            "filename": os.path.basename(f),
            "size": stat_info.st_size,
            "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
        })
    return backups

def restore_backup(filename):
    """
    Ripristina un file di backup nella directory principale dei dati e lo rende scrivibile.
    """
    backup_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Il backup {filename} non esiste.")
        
    target_path = os.path.join(DATA_DIR, filename)
    
    # Rimuovi temporaneamente il blocco di negazione per permettere la lettura
    _allow_deletion(backup_path)
    try:
        # Copia il file dal backup alla cartella data
        shutil.copy2(backup_path, target_path)
    finally:
        # Ripristina il blocco sul backup
        _deny_deletion(backup_path)
    
    # Rimuovi il flag di sola lettura dal file ripristinato, in modo che sia normalmente utilizzabile
    os.chmod(target_path, stat.S_IWRITE)
    
    return True

import glob
import os
import shutil
import stat
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


def _safe_chmod(filepath, readonly=True):
    try:
        if readonly:
            os.chmod(filepath, stat.S_IREAD)
        else:
            os.chmod(filepath, stat.S_IWRITE | stat.S_IREAD)
    except Exception:
        pass


def backup_exam_json(filepath):
    _ensure_backup_dir()

    if not os.path.exists(filepath):
        return

    filename = os.path.basename(filepath)
    backup_path = os.path.join(BACKUP_DIR, filename)

    if os.path.exists(backup_path):
        _allow_deletion(backup_path)
        _safe_chmod(backup_path, readonly=False)
        try:
            os.remove(backup_path)
        except Exception:
            pass

    shutil.copy2(filepath, backup_path)
    _safe_chmod(backup_path, readonly=True)
    _deny_deletion(backup_path)
    _enforce_backup_limit()


def _enforce_backup_limit(limit=5):
    """Mantiene solo i file più recenti nella cartella backup."""
    files = glob.glob(os.path.join(BACKUP_DIR, "*.json"))
    if len(files) <= limit:
        return

    files.sort(key=lambda path: os.path.getmtime(path))
    files_to_delete = files[:-limit]
    for filepath in files_to_delete:
        try:
            _allow_deletion(filepath)
            _safe_chmod(filepath, readonly=False)
            os.remove(filepath)
        except Exception as exc:
            with open(os.path.join(DATA_DIR, "debug_backup_delete.txt"), "a") as debug_file:
                debug_file.write(f"Errore eliminazione {filepath}: {str(exc)}\n")
            print(f"Errore durante l'eliminazione del backup vecchio {filepath}: {exc}")


def list_backups():
    """Ritorna la lista dei backup disponibili con i loro metadati."""
    _ensure_backup_dir()
    files = glob.glob(os.path.join(BACKUP_DIR, "*.json"))
    files.sort(key=lambda path: os.path.getmtime(path), reverse=True)

    backups = []
    for filepath in files:
        stat_info = os.stat(filepath)
        backups.append({
            "filename": os.path.basename(filepath),
            "size": stat_info.st_size,
            "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
        })
    return backups


def restore_backup(filename):
    """Ripristina un backup nella directory principale dei dati."""
    backup_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Il backup {filename} non esiste.")

    target_path = os.path.join(DATA_DIR, filename)
    _allow_deletion(backup_path)
    try:
        shutil.copy2(backup_path, target_path)
    finally:
        _deny_deletion(backup_path)

    _safe_chmod(target_path, readonly=False)
    return True
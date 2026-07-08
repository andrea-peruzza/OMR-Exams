import uuid
from typing import Dict, Any

class TaskManager:
    def __init__(self):
        # { task_id: {"status": "Generating", "progress": 45, "total": 100, "message": "...", "completed": False, "error": None} }
        self.tasks: Dict[str, Dict[str, Any]] = {}

    def create_task(self) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "status": "Starting",
            "progress": 0,
            "total": 100,
            "message": "Inizializzazione...",
            "completed": False,
            "error": None
        }
        return task_id

    def update_task(self, task_id: str, progress: int, total: int, message: str):
        if task_id in self.tasks:
            self.tasks[task_id]["progress"] = progress
            self.tasks[task_id]["total"] = total
            self.tasks[task_id]["message"] = message

    def complete_task(self, task_id: str, result_data: Dict[str, Any] = None):
        if task_id in self.tasks:
            self.tasks[task_id]["progress"] = self.tasks[task_id]["total"]
            self.tasks[task_id]["completed"] = True
            self.tasks[task_id]["status"] = "Completed"
            self.tasks[task_id]["message"] = "Completato"
            if result_data:
                self.tasks[task_id]["result_data"] = result_data

    def fail_task(self, task_id: str, error: str):
        if task_id in self.tasks:
            self.tasks[task_id]["completed"] = True
            self.tasks[task_id]["status"] = "Failed"
            self.tasks[task_id]["error"] = error
            self.tasks[task_id]["message"] = "Errore durante l'elaborazione"

    def get_task(self, task_id: str) -> Dict[str, Any]:
        return self.tasks.get(task_id, None)

# Istanza Singleton condivisa
task_manager = TaskManager()

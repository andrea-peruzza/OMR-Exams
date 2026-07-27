from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

#  MOCK CLICK BLOCCANTI 
# Deve stare PRIMA di qualsiasi import da core/
# Impedisce che click.prompt() e click.confirm() blocchino il server
# aspettando input dall'utente che in un contesto API non arriverà mai
import click
click.prompt = lambda *args, **kwargs: kwargs.get('default', 'y')
click.confirm = lambda *args, **kwargs: True

from api import dashboard, generate, sse, sort, correct, manual, mark, moodle, backup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(generate.router, prefix="/api/generate")
app.include_router(sse.router, prefix="/api/sse")
app.include_router(sort.router, prefix="/api/sort")
app.include_router(correct.router, prefix="/api/correct")
app.include_router(manual.router, prefix="/api/manual")
app.include_router(mark.router, prefix="/api/mark")
app.include_router(moodle.router, prefix="/api/moodle")
app.include_router(backup.router, prefix="/api/backup")

# Mount della cartella data per permettere al frontend di accedere ai PDF
DATA_DIR = os.environ.get("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data")))
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)
app.mount("/api/data", StaticFiles(directory=DATA_DIR), name="data")
##app.include_router(scan.router, prefix="/api/scan")
#app.include_router(correct.router, prefix="/api/correct")
#app.include_router(mark.router, prefix="/api/mark")
#app.include_router(report.router, prefix="/api/report")
#app.include_router(moodle.router, prefix="/api/moodle")


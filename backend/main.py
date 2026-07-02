from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurazione CORS per permettere al frontend di comunicare col backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione metteremo l'URL esatto del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend FastAPI di OMRExams perfettamente funzionante!"}
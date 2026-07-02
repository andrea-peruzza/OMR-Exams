# 1. Partiamo da un'immagine Linux ufficiale con Python 3.10 già installato
FROM python:3.10-slim

# 2. Impediamo a Python di creare i fastidiosi file .pyc
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Impostiamo la cartella di lavoro all'interno del container
WORKDIR /app

# 4. Installiamo i programmi di sistema (Ghostscript, ImageMagick, Perl, LaTeX)
# Usiamo texlive-xetex e latexmk perché generate.py li richiede esplicitamente
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    imagemagick \
    perl \
    texlive-xetex \
    texlive-latex-extra \
    texlive-lang-italian \
    latexmk \
    && rm -rf /var/lib/apt/lists/*

# 5. Copiamo tutto il resto del codice del nostro progetto dentro il container
COPY . /app

# 6. Installiamo il progetto stesso!
# Il punto "." dice a pip di leggere il pyproject.toml nella cartella corrente
# e installare tutte le librerie elencate lì dentro.
RUN pip install --no-cache-dir .

# 7. Diciamo a Docker quale porta esporre (es. 5000 se usi Flask)
EXPOSE 5000

# 8. Il comando che verrà lanciato quando accendiamo il container
# (Sostituisci "app.py" con il nome del file principale del tuo backend web)
CMD ["uvicorn", "main.py", "--host", "0.0.0.0", "--port", "5000"]
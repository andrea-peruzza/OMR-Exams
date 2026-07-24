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
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-pstricks \
    lmodern \
    latexmk \
    libzbar0 \
    libzxing3 \
    && rm -rf /var/lib/apt/lists/*

# corregge la policy di ImageMagick che blocca i PDF
RUN find /etc/ImageMagick-* -name "policy.xml" -exec \
    sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' {} \;

# 4bis. Installiamo il font OpenDyslexic (necessario per xetex/fontspec)
# fontconfig serve per registrare i font di sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# I file .otf devono trovarsi in ./fonts/ nel repo (stessa cartella del Dockerfile)
# Copio la cartella su questo indirizzo perché fontconfig scansiona /usr/share/fonts/ e sottocartelle alla ricerca di font
COPY fonts/ /usr/share/fonts/truetype/opendyslexic/
RUN fc-cache -f -v

# 5. Copio prima le dipendenze python
COPY requirements.txt .

# 6. Installiamo il progetto stesso!
# Il punto "." dice a pip di leggere il pyproject.toml nella cartella corrente
# e installare tutte le librerie elencate lì dentro.
RUN pip install --no-cache-dir -r requirements.txt

#e poi importo il codice
COPY . /app

# 7. Diciamo a Docker quale porta esporre (es. 5000 se usi Flask)
EXPOSE 5000

# 8. Il comando che verrà lanciato quando accendiamo il container
# (Sostituisci "app.py" con il nome del file principale del tuo backend web)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
#!/bin/bash

cd "$(dirname "$0")" || exit 1

echo "=============================================="
echo "      Avvio del progetto OMR Exams in corso"
echo "=============================================="
echo ""

if [ -d ".git" ]; then
    echo "Aggiornamento del core OMRExams..."
    if ! git submodule update --init --recursive; then
        echo "ERRORE: Impossibile inizializzare il submodule OMRExams."
        exit 1
    fi
fi

if [ ! -f "backend/omrexams/pyproject.toml" ]; then
    echo "ERRORE: Il core OMRExams non e' disponibile."
    echo "Clona il repository con --recurse-submodules oppure esegui:"
    echo "git submodule update --init --recursive"
    exit 1
fi

echo "[1/4] Controllo stato del motore Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "Il motore Docker non e' in esecuzione. Provo ad avviarlo..."
    OS="$(uname -s)"
    if [ "$OS" = "Darwin" ]; then
        open -a Docker
    elif [ "$OS" = "Linux" ]; then
        sudo systemctl start docker
    fi
    
    echo "Attendo l'avvio di Docker (potrebbe richiedere da 30 a 60 secondi)..."
    while ! docker info > /dev/null 2>&1; do
        sleep 5
        echo "In attesa di Docker..."
    done
    echo "Docker e' ora in esecuzione"
else
    echo "Il motore Docker e' gia' in esecuzione."
fi

echo ""
echo "[2/4] Aggiornamento incrementale dei container Docker..."
echo "(NOTA: La primissima volta questa operazione potrebbe richiedere"
echo "diversi minuti per scaricare le immagini base e compilare il codice)"
if docker compose version > /dev/null 2>&1; then
    if ! docker compose build; then
        echo ""
        echo "ERRORE: La fase di build e' fallita. Controlla i log qui sopra."
        exit 1
    fi
else
    if ! docker-compose build; then
        echo ""
        echo "ERRORE: La fase di build e' fallita. Controlla i log qui sopra."
        exit 1
    fi
fi

echo ""
echo "[3/4] Avvio dei container in background..."
if docker compose version > /dev/null 2>&1; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo "[4/4] Attendo che il server web sia completamente avviato e pronto..."
while ! curl -s http://localhost:8080 > /dev/null; do
    sleep 2
done

echo ""
echo "Apro l'applicazione nel browser predefinito..."
OS="$(uname -s)"
URL="http://localhost:8080"
if [ "$OS" = "Darwin" ]; then
    open "$URL"
elif [ "$OS" = "Linux" ]; then
    if command -v xdg-open > /dev/null 2>&1; then
        xdg-open "$URL"
    else
        echo "Impossibile aprire il browser automaticamente. Visita manualmente $URL"
    fi
else
    echo "Per favore, visita manualmente $URL nel tuo browser."
fi

echo ""
echo "=============================================="
echo "                 Avvio completato"
echo "=============================================="
echo "L'applicazione e' ora in esecuzione nel browser."
echo ""
echo "PER SPEGNERE L'APPLICAZIONE:"
echo "Premi il tasto INVIO all'interno di questa finestra..."
read -p ""

echo ""
echo "=============================================="
echo "[1/2] Spegnimento dei container in corso..."
if docker compose version > /dev/null 2>&1; then
    docker compose stop
else
    docker-compose stop
fi

echo ""
read -p "Vuoi spegnere anche il motore Docker? (s/n): " STOP_DOCKER
if [ "$STOP_DOCKER" = "s" ] || [ "$STOP_DOCKER" = "S" ]; then
    echo "[2/2] Chiusura del motore Docker..."
    if [ "$OS" = "Darwin" ]; then
        osascript -e 'quit app "Docker"'
    elif [ "$OS" = "Linux" ]; then
        sudo systemctl stop docker
    fi
    echo "Motore Docker spento."
else
    echo "Motore Docker lasciato in esecuzione."
fi

echo ""
echo "Applicazione chiusa correttamente."

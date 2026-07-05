# Documentazione: Dashboard OMRExams

Questo documento illustra l'architettura, le funzionalità e le scelte progettuali adottate per la realizzazione della **Dashboard** del sistema web OMRExams.

---

## 1. Obiettivo della Dashboard

La Dashboard rappresenta il punto d'ingresso principale dell'applicazione (raggiungibile alla rotta `/dashboard`). I suoi scopi principali sono due:
1. **Pannello di Controllo (Status)**: Fornire all'utente un feedback immediato e visivo sulla presenza dei file di input essenziali prima di avviare le procedure.
2. **Hub di Navigazione**: Fungere da smistatore verso le aree funzionali specifiche dell'applicazione (Generazione, Smistamento, Correzione, Assegnazione Voti e Convertitore Moodle) per garantire una *User Experience* fluida.

---

## 2. Architettura e Flusso Dati

La funzionalità è stata progettata mantenendo una netta **Separazione delle Responsabilità (Separation of Concerns)**:

### 2.1 Backend (FastAPI)
- **File**: `backend/api/dashboard.py` e `backend/schemas/dashboard.py`
- **Responsabilità**: Il backend funge unicamente da fornitore di dati statici. L'endpoint `GET /api/dashboard/status` verifica l'integrità dell'ambiente di lavoro analizzando il file system. Restituisce un oggetto JSON conforme al modello Pydantic `DashboardStatus`.
- **Dati analizzati**:
  - `config_loaded`: Presenza del file `config.yaml`.
  - `questions_present`: Verifica la presenza di almeno un file `.md` nella cartella `/data/questions`.
  - `students_present`: Verifica la presenza di file `.xls` o `.xlsx` nella cartella `/data/students`.

> [!TIP]
> **Scelta Progettuale - Risoluzione del Percorso**:
> Per garantire la massima portabilità tra l'esecuzione locale diretta e l'esecuzione all'interno di un container Docker, il percorso `DATA_DIR` viene calcolato in modo dinamico e robusto usando `os.path.abspath`. Il server risale di due livelli partendo dalla posizione del router (`api/dashboard.py -> ../../data`) se la variabile d'ambiente non è impostata da Docker.

### 2.2 Frontend (React)
- **File**: `frontend/src/pages/Dashboard.jsx`, `frontend/src/api/client.js`, `frontend/src/App.jsx`
- **Responsabilità**: Gestisce il routing client-side, interroga l'API al caricamento della pagina (`useEffect`) e renderizza i dati.
- **Client Axios**: Tutte le chiamate verso FastAPI sono racchiuse in un'istanza centralizzata (`apiClient`) esportata da `client.js`. Questo facilita la futura aggiunta di meccanismi di autenticazione o intercettazione degli errori globali.

---

## 3. UI e Design System

L'estetica della Dashboard è stata sviluppata per essere moderna e "premium".
- **Tailwind CSS v3**: È stato scelto in quanto standard di mercato consolidato, in grado di offrire piena e immediata compatibilità con le librerie di componenti basate su Radix UI (come shadcn/ui).
- **Iconografia (lucide-react)**: Sono state integrate icone vettoriali minimaliste per facilitare il riconoscimento cognitivo rapido delle sezioni.
- **Micro-interazioni**: L'hub di navigazione fa un ampio uso di transizioni CSS (`transition-all`, `hover:shadow-md`, `group-hover:scale-110`) per rendere l'interfaccia "viva" al passaggio del cursore, restituendo una sensazione di reattività e professionalità.

---

## 4. Panoramica delle Sezioni della UI

### Sezione 1: Stato del Progetto
Composta da 3 card che leggono lo stato dal backend:
1. **Configurazione**: Controlla la presenza delle impostazioni globali.
2. **Domande (Markdown)**: Indica se la repository di domande sorgente non è vuota.
3. **Lista Studenti (Excel)**: Indica se è stato fornito un elenco a cui associare i fascicoli.
*Design choice*: Si utilizzano badge semaforici (verde/rosso/giallo) per un colpo d'occhio immediato.

### Sezione 2: Strumenti OMR (Hub Navigazione)
Una griglia di pulsanti cliccabili (`<Link>` di React Router) che instradano verso i vari moduli del progetto senza effettuare chiamate API backend o ricaricamenti della pagina (SPA - Single Page Application):
- **Genera Esami (`/generate`)**: Interfaccia per la creazione in PDF.
- **Smista Scansioni (`/sort`)**: Taglio e divisione per singolo studente.
- **Correggi (`/correct`)**: Valutazione OMR dei voti scansionati.
- **Assegna Voti (`/mark`)**: Computo finale e salvataggio Excel.
- **Convertitore Moodle (`/moodle`)**: Import/export dal formato XML.

Questa strutturazione permette al sistema di essere scalato modularmente: quando sarà necessario aggiungere una nuova funzione (es. statistiche), basterà aggiungere un nuovo endpoint al router e un nuovo link in questa griglia frontend.

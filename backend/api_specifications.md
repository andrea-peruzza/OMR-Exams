# Specifiche API Backend per le funzionalità Core (OMR)

Questo documento analizza i moduli principali presenti nella cartella `/core` del progetto, descrivendo l'istanziazione delle classi, i parametri di input e output, l'interazione con la console e con il disco. Questa analisi fornisce la base per l'implementazione degli endpoint HTTP (API) che esporranno le funzionalità del backend.

---

## 1. Generazione Esami (`core/generate.py` -> `Generate`)

Questa classe si occupa della creazione dei file PDF degli esami e del database di metadati.

*   **Endpoint suggerito**: `POST /api/exams/generate`
*   **Istanziazione**: 
    `Generate(config, questions, output_prefix, test=False, paper='A4', students=None, exam_date=dt.now(), seed=42, split=None, folded=True, rotated=False, progress_callback=None)`
*   **Input**:
    *   `config` (dict): Configurazione (tipicamente caricata da `config.yaml`).
    *   `questions` (str): Percorso della cartella contenente i file Markdown delle domande.
    *   `output_prefix` (str): Prefisso per i file di output (PDF e JSON).
    *   `students` (list): Lista di tuple (id, nome) degli studenti.
    *   `exam_date` (datetime): Data dell'esame.
    *   `paper`, `folded`, `rotated`, `split`, `seed`: Parametri per il formato e la randomizzazione.
*   **Output**: 
    *   Esecuzione logica tramite `process()`.
    *   In caso di API, suggerisce di usare un `progress_callback` per gestire l'avanzamento tramite WebSockets o Server-Sent Events (SSE).
*   **Stampa a Console**: Usa pesantemente `click.secho` e il modulo `logging` per mostrare progresso, avvisi ed errori (ad es. "Generating X exams"). Include anche prompt bloccanti in caso di modalità CLI, che **dovranno essere rimossi o bypassati** in esecuzione server.
*   **Scrittura su Disco**:
    *   Crea e poi cancella una cartella temporanea `tmp/`.
    *   Copia file di template LaTeX in `tmp/`.
    *   Genera file PDF finali (`<output_prefix>.pdf` o multipli in caso di split).
    *   Genera e salva un database TinyDB in formato JSON (`<output_prefix>.json`).

---

## 2. Smistamento Scansioni (`core/sort.py` -> `Sort`)

Questa classe suddivide e converte i PDF scansionati in immagini delle singole pagine per singolo studente.

*   **Endpoint suggerito**: `POST /api/exams/sort`
*   **Istanziazione**: 
    `Sort(scanned, sorted, doublecheck)`
*   **Input**:
    *   `scanned` (list[str]): Lista dei percorsi dei file PDF scansionati.
    *   `sorted` (str): Percorso della cartella di destinazione per le immagini suddivise.
    *   `doublecheck` (str): Percorso del file JSON del database (opzionale, per verifiche di coerenza).
    *   Metodo `sort(resolution, paper)`: accetta la risoluzione dell'immagine e il formato.
*   **Output**: Esecuzione dello smistamento. Non restituisce valori diretti, modifica il filesystem.
*   **Stampa a Console**: Usa `click.secho` per indicare la creazione/pulizia delle directory e barre di caricamento. Segnala eventuali "leftovers" (pagine non smistate correttamente).
*   **Scrittura su Disco**:
    *   Legge i PDF originali.
    *   Se il formato non è A4 (es. A3), crea e gestisce una cartella temporanea `split_tmp/`.
    *   Crea o svuota la cartella di destinazione specificata in `sorted`.
    *   Salva immagini delle pagine estratte.
    *   Scrive eventualmente un file `leftovers.pdf` in caso di errori di lettura QR code.

---

## 3. Correzione Scansioni (`core/correct.py` -> `Correct`)

Questa classe analizza le immagini scansionate, decodifica i QR code, rileva le risposte marcate e genera il PDF corretto.

*   **Endpoint suggerito**: `POST /api/exams/correct`
*   **Istanziazione**: 
    `Correct(sorted, corrected, data_filename, resolution, compression, use_page_answers=False, progress_callback=None)`
*   **Input**:
    *   `sorted` (str): Percorso della cartella con le immagini smistate (`.png`).
    *   `corrected` (str): Percorso per salvare il file PDF finale con le correzioni evidenziate.
    *   `data_filename` (str): Percorso del file database (JSON).
    *   `resolution` (int), `compression` (int): Parametri per l'elaborazione dell'immagine.
    *   `use_page_answers` (bool): Flag opzionale.
*   **Output**: Tramite `progress_callback` invia lo stato dell'elaborazione in tempo reale.
*   **Stampa a Console**: Utilizza log di sistema e `click.secho` per segnalare i file da attenzionare ("highly incoherent detection") e chiede l'input dell'utente con un prompt per cancellare i file temporanei (`click.prompt`). Questo prompt andrà gestito in API (assumendo sempre *yes*).
*   **Scrittura su Disco**:
    *   Crea una cartella `tmp/` dove scrive le immagini annotate (`.jpg`).
    *   Crea un file di appoggio `<data_filename>.tmp`.
    *   Genera il file PDF definitivo con le correzioni visive (`corrected`).
    *   Aggiorna il database JSON originale (`data_filename`) inserendo le informazioni sulle risposte date e corrette.

---

## 4. Assegnazione Voti (`core/mark.py` -> `Mark`)

Classe che calcola i punteggi in base alle risposte date e a specifiche funzioni di calcolo dei pesi.

*   **Endpoint suggerito**: `POST /api/exams/mark`
*   **Istanziazione**: 
    `Mark(datafile, outputfile)`
*   **Input**:
    *   `datafile` (str): Percorso del file database JSON.
    *   `outputfile` (str): Percorso di output per il foglio Excel finale.
    *   Nel metodo `mark(...)`: `marking_function` (funzione logica da applicare per i punteggi), `include_missing` (bool), `weights` (dict).
*   **Output**: Esegue il calcolo e genera un DataFrame pandas.
*   **Stampa a Console**: Segnala su terminale tramite `click.secho` avvisi ("Warning:") se le risposte corrette nel db non coincidono o se lo studente non è presente nella tabella degli esami.
*   **Scrittura su Disco**: Genera ed esporta un file Excel (`.xlsx`) contenente la classifica, i punteggi parziali per domanda e i voti finali per ogni studente.

---

## 5. Convertitori Formati

Queste utility permettono di convertire set di domande da e verso formati compatibili.

### `MoodleConverter` (`core/moodle_converter.py`)
*   **Endpoint suggerito**: `POST /api/convert/moodle` (Export a Moodle)
*   **Istanziazione**: `MoodleConverter(questions_dir, single, penalty)`
*   **Input**: Directory delle domande Markdown, flag per risposte singole, valore della penalità.
*   **Output / Scrittura Disco**: Scansiona i file `.md` e crea file XML (`.xml`) Moodle compatibili all'interno della stessa cartella.
*   **Stampa a Console**: Nessuna diretta degna di nota, lavora silently.

### `MarkdownConverter` (`core/markdown_converter.py`)
*   **Endpoint suggerito**: `POST /api/convert/markdown` (Import da Moodle)
*   **Istanziazione**: `MarkdownConverter(moodle_file, questions_dir)`
*   **Input**: Percorso di un file XML Moodle e directory di destinazione.
*   **Output / Scrittura Disco**: Trasforma il file XML in file `.md` e lo salva nella directory indicata.
*   **Stampa a Console**: Usa `logging.error` in caso di domande XML non supportate.

---

## 6. Aggiornamento Correzioni (`core/update_corrected.py` -> `UpdateCorrected`)

Permette di correggere la soluzione esatta per una domanda in caso di errore da parte del docente post-generazione, aggiornando i voti retroattivamente nel db.

*   **Endpoint suggerito**: `PUT /api/exams/update-answers`
*   **Istanziazione**: `UpdateCorrected(questions, datafile, **kwargs)`
*   **Input**: `questions` (lista di percorsi ai file markdown corretti), `datafile` (JSON database).
*   **Output / Scrittura Disco**: Il metodo `process(dry_run=False)` ricalcola le sequenze delle risposte. Modifica il `datafile` (TinyDB) aggiornando i record degli studenti con la soluzione esatta.
*   **Stampa a Console**: Molto verboso tramite `click.secho`, mostra i conflitti ("⚠️ For student... wrongly reports...") e le conseguenti correzioni applicate.

---

## Considerazioni architetturali per le API Backend

1. **Gestione del filesystem**: Poiché tutte le classi scrivono e leggono pesantemente da file su disco e directory di lavoro (es. `tmp`, output PDF, file Excel), ogni richiesta API che genera esami lavorerà su una cartella di lavoro fissa dentra data/.
2. **Rimozione dei Prompt CLI**: Nelle API bisognerà fare attenzione a script che attendono l'input dell'utente in modo bloccante. Esempi critici: `click.prompt()` e `click.confirm()` sono attualmente presenti nel codice base, per cui il layer API dovrà predisporre dei mock delle funzioni di click che bloccano tramite il segunete codice, che andrà runnato una volta sola nel main.py all'avvio, prima di importare qualsiasi cosa da core/:
import click
click.prompt = lambda *args, **kwargs: kwargs.get('default', 'y')
click.confirm = lambda *args, **kwargs: True

3. **Task Asincroni**: Funzionalità come `generate`, `sort` e `correct` impiegano multiprocessing (`mp.JoinableQueue`, `mp.Pool`) e possono essere lunghe computazionalmente. Gli endpoint HTTP dovranno gestire queste task in maniera asincrona (es. tramite *Celery* o *FastAPI BackgroundTasks*), esponendo lo stato e il progresso tramite le `progress_callback` messe a disposizione dalle classi.

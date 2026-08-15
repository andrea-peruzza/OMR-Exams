# OMR-Exams

OMR-Exams è un'applicazione web completa progettata per creare, gestire e correggere automaticamente esami a risposta multipla utilizzando la tecnologia OMR (Optical Mark Recognition).
Nato come evoluzione di un software OMR preesistente, questo progetto integra la logica di correzione all'interno di un'interfaccia web  facile da usare anche per gli utenti senza competenze informatiche, offrendo un metodo di distribuzione completamente automatizzato.

## Cosa fa il progetto

- **Creazione Esami:** Genera fogli d'esame stampabili dotati di codici QR per domande a scelta multipla.
- **Correzione Automatica:** Permette di caricare le scansioni dei fogli compilati e utilizza algoritmi OMR per rilevare automaticamente i segni, calcolare i punteggi e associarli agli studenti.
- **Strumenti di ausilio:** Presenza di diversi strumenti secondari rispetto al flusso di generazione e correzione principale, che permettono una gestione completa del sistema.
- **Interfaccia Web:** Il frontend permette agli utenti di gestire l'intero flusso di lavoro direttamente dal browser, senza dover interagire con interfacce a riga di comando.
- **Distribuzione Isolata:** L'intero sistema è "containerizzato" tramite Docker. Ciò vuol dire che funziona allo stesso modo su qualsiasi sistema operativo senza interferire e senza richiedere l'installazione manuale di  librerie o dipedenze.

## Come utilizzare l'applicazione

La suite è progettata per essere completamente plug-and-play. L'unico requisito di base è Docker Desktop installato nel PC.

### Avvio
Dopo aver clonato questa repository sul tuo computer:
1. Apri la cartella principale del progetto.
2. Avvia lo script corrispondente al tuo sistema operativo:
   - Windows: Esegui `start.bat`
   - Mac/Linux: Esegui `./start.sh` da terminale
3. Lo script controllerà che il motore Docker sia acceso, effettuerà la build e l'attivazione dei container (la build dei container verrà effettuata solo la prima volta) e aprirà in automatico la pagina web corretta (`http://localhost:8080`) nel tuo browser, da dove sarà possibile utilizzare l'applicazione.
La prima volta la build dei container può perdurare diversi minuti.
Le volte successive l'avvio sarà pressoché immediato.

4. **Spegnimento dell'app:** Basterà premere un tasto qualsiasi nella finestra del terminale rimasta aperta. Lo script si occuperà di spegnere in modo pulito i container e spegnere il Docker Engine qualora richiesto.

## Parti Principali e Architettura

Il progetto è diviso in tre blocchi logici principali, orchestrati insieme da `docker-compose`:

- **Frontend (`/frontend`)**
   - Sviluppato in React e compilato con Vite.
   - Fornisce l'interfaccia grafica utente moderna, interattiva e reattiva.
   - Messo in produzione e servito tramite un server web leggero (**Nginx**).

- **Backend (`/backend`)**
   - Sviluppato in Python utilizzando il framework FastAPI.
   - Funge da ponte tra l'interfaccia web e il motore centrale di elaborazione OMR.
   - Gestisce l'elaborazione delle immagini, la generazione dei PDF e l'integrazione con le liste studenti in formato Excel.
   - Utilizza TinyDB come database per salvare in modo leggero e veloce lo stato e i risultati degli esami.

- **Cartella dei dati (`/data`)**
   - È collegata in modo trasparente alla cartella locale `/data` tramite il docker-compose. Questo garantisce che tutti i compiti generati, le scansioni caricate, i risultati elaborati e in generale i file salvati rimangano in modo persistente sul computer dell'utente e non vadano persi quando l'applicazione viene spenta.

# Modulo Dashboard: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo Dashboard rappresenta il punto di accesso principale per l'interazione dell'utente con il sistema web OMRExams, accessibile alla root `/` o `/dashboard`. La dashboard ha subito un'evoluzione per fungere da hub centralizzato, non solo per il flusso di lavoro primario che comprende generazione, correzione e valutazione, ma anche per una suite di strumenti ausiliari introdotti per facilitare la gestione dell'ecosistema come l'editor, il sistema di backup e quello di cleanup.

## 2. Architettura e flusso di lavoro

L'architettura della dashboard è progettata per indirizzare rapidamente l'utente verso le funzionalità di cui ha bisogno.
A differenza delle versioni iniziali che effettuavano diagnostica preventiva, la versione attuale si concentra sull'offerta visiva delegando la diagnostica, ovvero i semafori di stato, direttamente ai singoli moduli operativi.

## 3. Componenti frontend e interfaccia utente

L'interfaccia utente, localizzata in `frontend/src/pages/Dashboard.jsx`, è implementata come una mappa di navigazione divisa in categorie logiche.

### 3.1 Sistema di design e layout
È stato impiegato Tailwind CSS v3 in modo estensivo per creare una griglia responsiva. Le card utilizzano utility di transizione per fornire un feedback tattile e visivo. L'uso della libreria `lucide-react` garantisce associazioni visive immediate, come ad esempio un'icona di un file per la generazione o un cerchio di spunta per la correzione. Ogni sezione possiede una sua specifica color palette, come il blu per la generazione, lo smeraldo per la correzione, il giallo per le verifiche e il rosso per la cancellazione.

### 3.2 Struttura funzionale dell'interfaccia
La dashboard è divisa in due macro-sezioni. La prima riguarda gli strumenti per il flusso di lavoro principale e contiene i collegamenti ai pilastri del ciclo OMR. Troviamo la pagina "Genera esami" per la creazione di PDF randomizzati a partire da Markdown, "Smista e correggi" che è un'interfaccia unificata per la gestione dello smistamento dei fogli scansionati e la correzione ottica successiva, "Verifica manuale" per la gestione dei casi ambigui o correzioni forzate a database e "Assegna voti" per il calcolo dei punteggi e l'esportazione Excel.

La seconda sezione riguarda gli strumenti di ausilio per la gestione dell'ecosistema e contiene le utility periferiche. Troviamo l'editor domande per la creazione grafica di file Markdown, la pagina "Associa studenti" per far corrispondere scansioni anonime con anagrafiche, il convertitore Moodle, il backup per il ripristino dei file JSON e la gestione dati per la cancellazione sicura dei file generati.

L'integrazione di questi strumenti ausiliari direttamente nella schermata iniziale ottimizza i tempi operativi, offrendo al docente e all'amministratore un controllo granulare sull'intero ciclo di vita dei dati.

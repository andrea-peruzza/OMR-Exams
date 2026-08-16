# Modulo Backup: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo per il backup costituisce la rete di sicurezza dell'applicazione OMRExams. È stato progettato appositamente per mitigare l'errore umano durante le fasi di manipolazione dei file JSON del progetto. Lo scopo è fornire un'interfaccia semplice che consenta il recupero dell'informazione garantendo al contempo un ingombro in memoria ridotto grazie all'uso di limiti di conservazione preconfigurati.

## 2. Architettura e flusso di lavoro

L'architettura verte su un'implementazione lato server che gestisce l'archiviazione fisica all'interno di una cartella designata per i salvataggi, mentre il frontend funge da interfaccia di consultazione e di innesco per il processo di ripristino.

I backup vengono prodotti automaticamente dal sistema ogniqualvolta si effettui una mutazione distruttiva sui file JSON originari. Il limite di conservazione è impostato a cinque file per questioni di bilanciamento tra spazio occupato e utilità.
Navigando sulla pagina del modulo l'utente richiede la lista dei file. Il backend interroga la directory di salvataggio, formattando nomi, grandezze fisiche e l'ora di ultima modifica. L'operatore seleziona un file dalla tabella e un avviso nativo intercetta l'azione per prevenire scritture accidentali. All'approvazione, la richiesta raggiunge il server che incarica la funzione di base di sovrascrivere fisicamente il file json in produzione con la copia di backup selezionata.

## 3. Componenti frontend e interfaccia utente

Sviluppato in `frontend/src/pages/Backup.jsx`, il componente adotta una visualizzazione basata su tabelle.

### 3.1 Design della tabella
Le dimensioni dei file vengono analizzate da una funzione di supporto che converte i byte grezzi in formati maggiormente leggibili. Stessa prassi viene applicata alle stringhe temporali.
Il bottone di ripristino è supportato da un'icona tematica per enfatizzare visivamente l'azione costruttiva, in contrapposizione al colore rosso di cancellazione tipico di altri moduli distruttivi.

### 3.2 Feedback visivo
La gestione standard degli errori di rete è affiancata da un avviso esplicativo a scomparsa. Il successo del ripristino rassicura l'utente dell'immediata disponibilità del file di dati per le successive fasi operative.

## 4. Implementazione backend e logica

L'infrastruttura responsabile dell'interoperabilità risiede in `backend/api/backup.py`.

La logica comprende un modulo di facciata che ingloba la funzione di elencazione ereditata dal motore applicativo. Gestisce l'intercettazione degli errori sollevando un'eccezione HTTP controllata per evitare di esporre dettagli tecnici al browser. Un punto di accesso dedicato riceve le richieste di ripristino specificate tramite il nome del file e gestisce in modo esplicito le eccezioni per i file non trovati sollevando uno stato HTTP coerente.

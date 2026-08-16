# Moduli Sort e Correct: architettura e funzionalità unificata

## 1. Introduzione e scopo del modulo

Il file `Correct.jsx` funge da interfaccia unificata per le due fasi più critiche dell'intera applicazione, ovvero lo smistamento e la successiva correzione ottica. Sebbene a livello di backend la logica computazionale rimanga confinata in due API distinte definite in `backend/api/sort.py` e `backend/api/correct.py`, il frontend maschera questa dicotomia offrendo all'operatore un unico percorso guidato e bloccante dove la fase uno è propedeutica alla fase due, minimizzando gli errori procedurali.

## 2. Flusso di lavoro unificato

L'interfaccia utente governa l'intero processo attraverso un sistema a due fasi.

La prima fase riguarda lo smistamento scansioni e ha l'obiettivo di acquisire un file PDF cumulativo direttamente dallo scanner e scomporlo in file d'esame per singolo studente. L'utente può caricare i PDF grezzi dal proprio dispositivo. Avviando il processo asincrono, il backend rasterizza il PDF pagina per pagina, riconosce il QR code e salva i file smistati in `data/sorted/`. Il frontend consuma lo stream degli eventi dalla pipe asincrona per aggiornare la barra di progresso in tempo reale.
Qualora la cartella di destinazione contenga già dei file, il frontend utilizza un messaggio di conferma per domandare se svuotare preventivamente l'area o effettuare un accodamento. A fine processo, se alcune pagine vengono scartate perché ad esempio il QR code non è stato trovato, l'interfaccia utente riporta esattamente il nome e numero di pagina in un avviso testuale.

La seconda fase riguarda la correzione automatica e diventa interattiva solo se la prima fase è stata completata. Il frontend evoca l'API e il server, delegando il calcolo, esegue le procedure di computer vision determinando le risposte contrassegnate e aggiornando il JSON.
Se spuntata l'opzione apposita, l'operatore deve definire un nome per la generazione del referto visivo in formato PDF. Un meccanismo intelligente controlla se il PDF esiste già, chiedendo se si desidera sovrascriverlo o rinominarlo prima di procedere.
Al termine della computazione, se vengono riscontrate anomalie ottiche come ambiguità del segno o correzioni manuali effettuate a penna dallo studente, un banner arancione si palesa suggerendo vivamente la navigazione rapida verso il modulo per la verifica manuale. In assenza di anomalie, il sistema consiglia il salto diretto verso la pagina di assegnazione voti.

## 3. Implementazione backend e logica

A differenza della convergenza frontend, i livelli API e core applicativo rimangono disaccoppiati per ragioni di manutenibilità ed incapsulamento.

### 3.1 Backend per lo smistamento
Il controller `backend/api/sort.py` è incaricato della manipolazione file I/O e dell'avvio del processo in background. Dispone di uno schema Pydantic atto a validare il file di destinazione e il formato della carta. Interagisce in seguito con il gestore dei task per notificare i progressi al frontend.

### 3.2 Backend per la correzione
Il controller `backend/api/correct.py` gestisce le routine di OpenCV. Dispone di una richiesta propedeutica invocata simultaneamente con lo stato dello smistamento per compilare le check visive sul frontend. Gestisce inoltre la persistenza e la risposta HTTP per calcolare esattamente quanti controlli manuali siano emersi.

## 4. Scelte progettuali

### 4.1 Orchestrazione frontend
L'idea di fondere le due pagine in un'unica interfaccia risolve un problema legato all'esperienza utente, in quanto l'utente non deve ricordarsi la sequenzialità dei passi e non è obbligato a saltare tra le pagine. Il componente implementa una macchina a stati visiva, dove il contenitore della seconda fase rimane trasparente e non interattivo finché le condizioni logiche della prima fase non sono del tutto soddisfatte.

### 4.2 Astrazione della sincronicità
L'implementazione degli eventi trasmessi dal server per entrambe le fasi abbatte il problema dei timeout di rete tradizionali per elaborazioni che, specialmente nel processamento delle immagini su grandi PDF, possono durare parecchi minuti, offrendo al contempo rassicurazione visiva costante tramite l'avanzamento in percentuale.

# Modulo manual correction: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo per la verifica manuale è stato introdotto come sistema di ripiego per gestire le incertezze del riconoscimento ottico automatizzato. Il suo scopo è consentire all'utente di intervenire laddove il modulo di correzione automatica fallisca nell'identificare i punti di calibrazione, ad esempio per fogli strappati o codici non leggibili, o incontri ambiguità irrisolvibili nella decodifica delle risposte a causa di segni multipli o cancellature estese. Attraverso questo modulo, l'utente può ispezionare visivamente le scansioni originali o i ritagli elaborati e forzare l'inserimento o la sovrascrittura delle risposte direttamente nel database, assicurando l'integrità totale della valutazione.

## 2. Architettura e flusso di lavoro

L'interazione tra i layer del sistema è ottimizzata per fornire un'esperienza di revisione fluida, appoggiandosi a chiamate di rete RESTful e al riutilizzo di funzioni di base preesistenti.

Il sistema innanzitutto incrocia i dati globali degli studenti registrati con i record degli studenti già elaborati con successo per rilevare anomalie. Questa operazione logica identifica i fascicoli mancanti o problematici. A questo punto il client richiede al server il calcolo in tempo reale dello stato di un esame incompleto. L'utente analizza visivamente il reperto digitale e compila un form per forzare la risposta corretta. La richiesta transita al backend, che aggira la pipeline di visione artificiale ed esegue un'operazione di inserimento o aggiornamento diretta sul database, creando record puliti qualora lo studente ne fosse totalmente sprovvisto. A seguito di un inserimento, il frontend ricarica automaticamente lo stato dello studente dal server aggiornando la vista, per garantire un feedback di correttezza immediato all'utente.

## 3. Componenti frontend e interfaccia utente

L'interfaccia utente in `frontend/src/pages/ManualCorrection.jsx` è progettata per massimizzare l'efficienza durante la revisione di massa.

### 3.1 Gestione dello stato
La logica di presentazione è governata da uno stato interno che orchestra lo scambio tra due viste principali. La vista in formato PDF permette la consultazione dei fascicoli originali interi tramite il componente condiviso e la vista di dettaglio visualizza i ritagli isolati degli studenti problematici tramite un visualizzatore ottimizzato.

### 3.2 Design delle performance
Invece di delegare al server pesanti conversioni, il client sfrutta le capacità statiche del framework, le immagini vengono infatti iniettate nel DOM tramite dei tag HTML limitando il carico computazionale. I messaggi diagnostici sono ancorati in prossimità dei form di inserimento, questo elimina la necessità di scorrimento verticale da parte dell'utente per validare l'esito delle operazioni minimizzando il carico cognitivo.

## 4. Implementazione backend e logica

Il servizio dedicato alla verifica manuale risiede in `backend/api/manual.py`.

### 4.1 Endpoint operativi
Le rotte GET ispezionano le directory per popolare la vista PDF globale ed eseguono l'algoritmo sulle tabelle del database individuando gli identificativi degli studenti sprovvisti di record di correzione validi. La richiesta per i dati dello studente incapsula la chiamata alla funzione di base preesistente e computa al volo il punteggio parziale per singola domanda. Le richieste POST fungono da controller per l'ingestione forzata dei dati. Qualora lo studente non esista nella tabella di correzione, viene allocata un'infrastruttura dati vuota prima di applicare la modifica richiesta dall'utente.

### 4.2 Validazione dei dati
Le richieste POST sono filtrate attraverso schemi in `schemas/manual.py`, prevenendo corruzioni accidentali della base dati causate da formati inattesi.

## 5. Scelte progettuali e pattern

### 5.1 Isolamento delle eccezioni del motore di base
Per rendere possibile la delega al modulo manuale, l'architettura originaria del motore di correzione è stata modificata facendo in modo che gli errori fatali vengano intercettati tramite blocchi di eccezione. Invece di interrompere il processo, il sistema memorizza il fallimento e salta la scrittura a database del fascicolo corrotto, predisponendolo per essere recuperato da questo modulo.

### 5.2 Estensibilità dell'interfaccia
L'integrazione di questo modulo ha richiesto minime modifiche al layout preesistente. È stato sufficiente aggiungere la rotta protetta in React, ampliare la griglia CSS della dashboard e inserire un nuovo componente visivo.

# Modulo Questions Editor: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo per l'editor delle domande espande le potenzialità della piattaforma introducendo un ambiente di formattazione grafica. Il suo scopo è consentire agli utente di creare o modificare le banche dati di domande in file Markdown senza dover necessariamente padroneggiare la sintassi originale, sfruttando un'interfaccia intuitiva a form. Consente di gestire sia quiz a risposta chiusa che domande a risposta aperta, permettendo di regolarne anche il layout di stampa.

## 2. Architettura e flusso di lavoro

L'architettura dell'editor funge da traduttore tra lo stato grafico dell'interfaccia e la stringa in formato Markdown necessaria al motore di generazione dei PDF.

All'avvio, l'interfaccia permette di scegliere la modalità operativa. Se viene caricato un file esistente, il modulo preleva il file testuale. Una batteria di espressioni regolari implementata nel browser disseziona la stringa originaria trasformandola in una struttura dati in formato JSON. L'operatore modifica i campi di testo, i controlli di spunta per indicare la soluzione corretta e i parametri spaziali delle domande aperte. Tutte queste azioni alterano i dati di stato. Al salvataggio, il frontend ricompatta i dati riconvertendoli nella corretta sintassi in formato Markdown e la stringa viene postata al server che sovrascrive o aggiunge il contenuto nel file corrispondente.

## 3. Componenti frontend e interfaccia utente

Implementato in `frontend/src/pages/QuestionsEditor.jsx`, l'editor adotta determinati schemi interattivi.

### 3.1 Gestione dello stato
L'intero blocco di domande vive in uno stato annidato e profondo. Funzioni specializzate manipolano questi nodi in base all'identificativo generato automaticamente, assicurando che l'interfaccia aggiorni esattamente solo la cella modificata.

### 3.2 Moduli di inserimento e validazione
Prima dell'invio al backend, il client verifica logicamente l'integrità dei dati. Si assicura che nessuna domanda sia priva di testo, che ci siano minimo due risposte per le domande chiuse e almeno una spunta sulla risposta esatta. In caso di fallimento un avviso visivo blocca la richiesta prevenendo potenziali crash. Sulle risposte aperte, il parametro dello spazio bianco ha una correzione adattiva, per cui se la domanda supera una certa lunghezza occupando due righe stampate, l'editor imposta automaticamente lo spazio ad una dimensione maggiore per compensare l'ingombro.

### 3.3 Sincronizzazione dati
L'editor dispone di un'importante funzione per l'aggiornamento degli esami già generati. Se attivata durante la modalità di modifica, la funzione invoca una rotta API speciale che provvede a leggere i file JSON storici del sistema e iniettarvi in modo trasparente le coordinate modificate. Risulta utile ad esempio se l'utente si accorge a posteriori di aver impostato la risposta errata e vuole correggere il database senza dover necessariamente rigenerare i file d'esame.

## 4. Implementazione backend e logica

Le API a servizio dell'editor sono state inglobate in `backend/api/generate.py` data l'affinità per i formati richiesti.
I punti di accesso permettono di rilevare i file testuali validi nel filesystem e acquisirne il testo puro, definiscono il punto di ingresso per il salvataggio fisico su file e richiamano la logica preesistente per applicare correzioni retroattive che assicurano la solidità dell'ecosistema.

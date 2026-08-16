# Modulo Generate: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo Generate costituisce il motore di creazione degli esami dell'applicazione OMRExams. Il suo scopo principale è interpretare le direttive fornite dall'utente e i file sorgente, come le domande in Markdown e le liste studenti, per generare gli esami in formato PDF stampabile. Data l'elevata intensità computazionale richiesta dalla generazione di documenti tramite compilazione LaTeX, il modulo è stato architettato per operare in maniera interamente asincrona, prevenendo il blocco dell'interfaccia utente durante i lunghi tempi di elaborazione.

## 2. Architettura e flusso di lavoro

L'architettura del modulo si basa su un paradigma client-server con esecuzione di task in background e aggiornamento dello stato in tempo reale tramite eventi inviati dal server.

Il flusso operativo tipico prevede innanzitutto che l'interfaccia utente raccolga i dati del form e li invii, tramite il client API, all'endpoint di avvio della generazione `POST /api/generate/start`. Il backend riceve la richiesta, delega la creazione di un processo in background al gestore di stato e restituisce immediatamente al client un identificativo univoco del task. Ricevuto l'identificativo, il client apre una connessione verso l'endpoint dedicato `GET /api/sse/stream/{task_id}`. A questo punto il motore di base `generator.process()` esegue la compilazione dei PDF, comunicando periodicamente l'avanzamento al gestore di stato. Infine, il server trasmette gli eventi di progresso al client, il quale aggiorna la barra di caricamento in tempo reale fino al completamento.

Questo modello architetturale garantisce una separazione netta tra il ciclo di richiesta HTTP, che è breve e sincrono, e il ciclo di elaborazione dati, che è lungo e asincrono.

## 3. Componenti frontend e interfaccia utente

L'interfaccia di configurazione, contenuta in `frontend/src/pages/Generate.jsx`, trasforma la configurazione basata su file YAML e interfaccia a riga di comando in un'esperienza interattiva e accessibile.

### 3.1 Gestione dello stato e dinamismo
La logica della vista impiega agganci di stato multipli per discriminare tra la configurazione persistente e le variabili di runtime come il flag per l'anonimato o la data di esecuzione. L'interfaccia si adatta dinamicamente alle scelte dell'utente. Ad esempio, attivando la generazione anonima, l'interfaccia nasconde i selettori di file Excel richiedendo esclusivamente il numero di esami da generare, semplificando il percorso visivo e operativo.

### 3.2 Feedback e interazione
L'integrazione nativa dell'API all'interno del ciclo di vita del componente permette l'ascolto degli eventi dal server, traducendoli visivamente tramite componenti vettoriali e barre di progresso stilizzate con Tailwind CSS. Elementi di input mascherati e delegati al client API consentono l'iniezione diretta di risorse Markdown o Excel senza imporre la navigazione al di fuori del contesto corrente. Tutte le richieste di rete sono astratte tramite l'istanza contenuta in `frontend/src/api/client.js`, che gestisce automaticamente la codifica.

## 4. Implementazione backend e logica

Il backend, implementato in FastAPI, funge da strato di mediazione tra l'interfaccia HTTP e il modulo applicativo originale preesistente, assicurando l'integrità dei dati scambiati.

### 4.1 Validazione dei modelli
La sicurezza e coerenza strutturale dei dati in ingresso sono delegate a Pydantic in `backend/schemas/generate.py`, che impone modelli di tipizzazione rigidi.

### 4.2 Endpoint e gestione task
Il controller in `backend/api/generate.py` definisce gli endpoint operativi. Le rotte di accesso ispezionano il file system per precompilare dinamicamente i menu a tendina dell'interfaccia utente. Le rotte di invio sfruttano i moduli standard per memorizzare in sicurezza i file. La rotta di avvio costituisce l'entry point logico, impiega background tasks di FastAPI per avviare l'elaborazione, intercetta variazioni logiche come la generazione anonima e invoca il costrutto per garantire la tracciabilità dello stato attraverso i processi multipli.

### 4.3 Gestione dello stato e comunicazione asincrona
Il gestore dello stato in `backend/state/manager.py` implementa un modello che mantiene lo stato d'esecuzione in memoria. Questa soluzione architetturale, sebbene confinata ad un contesto a singolo nodo e singolo utente, abbatte latenze e complessità architetturali. Il sistema di streaming utilizza generatori asincroni per interrogare lo stato e veicolare dati in formato testuale al client, interrompendo fisiologicamente la connessione all'acquisizione del completamento.

## 5. Scelte progettuali e pattern

### 5.1 Isolamento del motore
Il preesistente motore all'interno della cartella core/ (derivato dal precedente progetto) è stato isolato e opera senza alcuna consapevolezza dell'infrastruttura web. Non dipendendo da logiche HTTP o JSON, ne viene garantita l'assoluta portabilità ed il potenziale riutilizzo in contesti a riga di comando.

### 5.2 Struttura per la distribuzione
L'impalcatura dei template LaTeX è stata astratta nel modulo interno e l'integrazione dei file di inizializzazione ha trasformato tale risorsa in un pacchetto standard Python, facilitando così la potenziale esecuzione all'interno di ambienti standardizzati.

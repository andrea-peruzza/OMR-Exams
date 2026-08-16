# Modulo Mark: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo si occupa dell'assegnazione dei voti e costituisce la fase conclusiva del processo di valutazione. Il suo scopo è consolidare i dati estratti durante la correzione ottica, calcolare i punteggi finali applicando pesi e penalità personalizzate e generare report statistici dettagliati. Il modulo si occupa inoltre dell'esportazione dei risultati in formati standard pronti per la pubblicazione o per la conservazione agli atti, fornendo ai docenti una suite di strumenti analitici per valutare non solo la prestazione degli studenti, ma anche l'affidabilità delle domande stesse.

## 2. Architettura e flusso di lavoro

Il modulo unifica diverse funzioni matematiche preesistenti sotto una singola interfaccia di rete, delegando l'elaborazione intensiva a librerie specializzate per l'analisi dei dati.

Il frontend richiede il catalogo delle domande processate ricavato dinamicamente dai file JSON della sessione. Su richiesta dell'utente, il motore di calcolo valuta ogni record nel database, applica logiche di punteggio parziale, sottrae penalità per risposte errate o omesse e calcola il voto provvisorio generando un foglio di calcolo di sintesi. L'operatore può richiedere l'aggregazione dei dati e il sistema, mediante operazioni di raggruppamento su dataset, calcola rapporti di correttezza a livello di intera classe. È inoltre possibile filtrare i risultati relativi a una specifica domanda per comprenderne la criticità didattica ed esportare il documento.

## 3. Componenti frontend e interfaccia utente

L'interfaccia in `frontend/src/pages/Mark.jsx` consolida funzionalità eterogenee, originariamente isolate, all'interno di un'unica vista interattiva.

### 3.1 Interazione e logica di stato
Come per i moduli precedenti, le funzionalità vengono bloccate preventivamente qualora manchino i metadati di base della sessione. Le tre sezioni funzionali, ovvero calcolo voti, generazione report e analisi domanda, sono gestite da stati di elaborazione e cattura errori tra loro indipendenti, impedendo che un'eventuale anomalia su un'esportazione blocchi la fruibilità del resto della pagina.
All'interno del pannello di analisi, l'esportazione integrata e dinamica genera messaggi a schermo non bloccanti per l'inserimento del nome file, culminando con notifiche visive di avvenuto salvataggio su disco.

### 3.2 Anteprima nativa del foglio di calcolo
Per ottimizzare le prestazioni e ridurre la proliferazione di richieste per la manipolazione dati, è stato ingegnerizzato un componente specializzato per l'anteprima dei file Excel. Questo effettua un'acquisizione diretta per ottenere il file originale e sfrutta una libreria dedicata per convertire i fogli in tabelle. In presenza di grandi raccolte di dati formattati in modo complesso, il componente implementa un algoritmo di unificazione delle stringhe per fornire un'anteprima pulita senza mai alterare il file di origine.

## 4. Implementazione backend e logica

Il controller FastAPI per questo modulo localizzato in `backend/api/mark.py` estrapola e contiene le originarie classi di calcolo.

### 4.1 Endpoint e logica applicativa
Le rotte GET analizzano il file JSON e collezionano un elenco di tuple contenente nome del file e indice per popolare dinamicamente i menu dell'interfaccia utente.
La rotta dedicata al calcolo funge da intermedio per l'invocazione del core, applica le curve di valutazione, formalizza i risultati e salva nativamente l'output sul file system.
La rotta dedicata ai report è un modulo statistico puro. Sfrutta procedure logiche per condensare i dati grezzi in metriche aggregate per singola domanda.
Le rotte per la revisione delle domande permettono la generazione automatica di estratti di documenti relativi a singoli quesiti critici.

## 5. Scelte progettuali e pattern

### 5.1 Calcolo in tempo reale e archiviazione
La scelta di non appesantire il database con i risultati dei calcoli statistici, ma di generarli sotto forma di fogli di calcolo persistenti, sè una scelta per mantenere l'output il più compatibile possibile con gli strumenti software d'ufficio. Il database mantiene unicamente il dato grezzo, mentre le visualizzazioni vengono ricalcolate o rilette dai fogli di calcolo derivati.

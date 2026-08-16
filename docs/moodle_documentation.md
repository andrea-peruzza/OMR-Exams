# Modulo Moodle Converter: architettura e integrazione

## 1. Introduzione e scopo del modulo

Il modulo Moodle Converter fornisce un'infrastruttura di interoperabilità tra il sistema OMRExams e la piattaforma di e-learning Moodle. L'obiettivo primario di questo componente è l'astrazione bidirezionale dei formati delle domande d'esame. Permette di esportare banche dati di domande create localmente in formato Markdown verso lo standard Moodle XML, e inversamente di importare quiz nativi Moodle all'interno del formato supportato dal nostro motore. Questa funzionalità garantisce un'estesa flessibilità didattica e il riuso di materiale preesistente.

## 2. Architettura e flusso di lavoro

L'architettura del modulo si configura come un classico pattern client-server. La logica applicativa relativa agli algoritmi di parsing testuale è rimasta confinata nel modulo core di base per garantire compatibilità con la riga di comando e testabilità, mentre il livello API funge puramente da livello di orchestrazione.

Il flusso di esportazione prevede che il frontend interroghi il backend e presenti la lista dei file sorgente disponibili. Ricevuto l'elenco dei file, l'istanza `MoodleConverter` preleva i file testuali, li analizza e aggrega le strutture logiche risultanti. Durante la conversione l'algoritmo applica modifiche logiche, ad esempio invertendo algebricamente il segno delle penalità per conformarsi allo standard XML di Moodle. Qualora rilevi quesiti a risposta aperta, l'algoritmo genera automaticamente un file ausiliario separato.

Il flusso di importazione prevede che l'operatore selezioni un file precedentemente depositato oppure ne carichi uno nuovo dal proprio computer. Il backend avvia il convertitore sfruttando le librerie adeguate per la decodifica. La fase di analisi applica delle politiche di recupero per decodificare il file in base allo standard del formato, calcolando frazioni logiche per mitigare incertezze strutturali e prevenire instabilità nel caso in cui le domande manchino della risposta corretta specificata esplicitamente, garantendone la salvaguardia convertendole in domande a risposta aperta.

## 3. Componenti frontend e interfaccia utente

L'interfaccia in `frontend/src/pages/Moodle.jsx` sdoppia funzionalmente il layout tramite un sistema a schede per esportazione e importazione, garantendo separazione cognitiva per i due macro-scopi.

### 3.1 Gestione dello stato e reattività
L'utilizzo degli stati e degli agganci di React permette il tracciamento incrociato degli stati della rete come caricamenti, errori o successi. Al completamento di ogni transazione di caricamento, esportazione o importazione, il frontend innesca una re-sincronizzazione forzata aggiornando la lista dei file e restituendo un feedback immediato del successo dell'operazione.
Le logiche CSS e la libreria vettoriale implementano palette cromatiche standard per la restituzione ottica dei messaggi.
L'interazione con il backend è interamente mascherata nell'oggetto `moodleAPI`, che incapsula la definizione automatica e trasparente dei formati durante i caricamenti dei file fisici.

## 4. Implementazione backend e logica

Il controller FastAPI `backend/api/moodle.py` implementa il perimetro applicativo verso l'esterno.

### 4.1 Endpoint pubblici
Le rotte GET sfruttano routine standard per ispezionare il filesystem alla ricerca di obiettivi operativi per esportazione o importazione.
Le rotte POST di conversione funzionano da controller per l'esportazione e l'importazione, accettano dati multipli, normalizzano la formattazione e avviano le logiche del motore di base.
La rotta POST di upload è dedicata esclusivamente alla gestione fisica dei file in ingresso, disaccoppiando la fase di caricamento fisico del file dalla fase di conversione logica.

### 4.2 Validazione dati
Le routine POST per la conversione si avvalgono dei modelli formali in `backend/schemas/moodle.py`. 
Lo schema per l'esportazione assicura la presenza della lista dei file scelti, della direttiva a risposta singola o multipla, e del fattore opzionale di penalità. Lo schema per l'importazione semplifica l'ingresso validando unicamente l'identificativo logico per prevenire alterazioni non consentite dei percorsi.

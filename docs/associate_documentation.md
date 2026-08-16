# Modulo Associate: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo per l'associazione degli studenti è una funzionalità di post-elaborazione concepita per collegare i fascicoli d'esame anonimi elaborati dal sistema con le anagrafiche reali degli studenti. Questa fase interviene qualora gli esami non presentino l'identità dello studente, o quando si rende necessario abbinare grandi quantità di test anonimi con una lista di iscritti.

## 2. Architettura e flusso di lavoro

L'architettura ha lo scopo di ridurre l'attrito durante l'inserimento dei dati automatizzando l'allineamento tra il database interno dell'applicazione e i fogli di calcolo esterni.

L'utente accede alla pagina, il frontend interroga il server per verificare la disponibilità dei prerequisiti e, se l'esito è positivo, scarica la lista degli esami anonimi. L'utente può fornire i dati anagrafici caricando un file Excel dal computer o scegliendone uno situato fisicamente sul server.
Il frontend analizza il foglio elettronico direttamente nel browser, estrapolando le colonne con nome, cognome e matricola per mitigare le differenze di formattazione nei vari file. L'operatore utilizza quindi i menu a tendina auto-completanti o l'input manuale per associare il record anagrafico all'immagine scansionata dell'esame. Al salvataggio i dati vengono inviati al backend che sovrascrive i campi nel database completando definitivamente il profilo dello studente.

## 3. Componenti frontend e interfaccia utente

L'interfaccia utente in `frontend/src/pages/Associate.jsx` mira a facilitare il lavoro dell'utente.

### 3.1 Tabelle e visualizzazione immagini
La tabella interattiva mostra l'identificativo anonimo e un'anteprima dell'esame fisico. Grazie all'implementazione di un sistema di ingrandimento dell'immagine mostrata, l'utente può leggere l'intestazione manoscritta dallo studente sul foglio senza dover aprire nuove schede, e digitarla nel campo adiacente.

### 3.2 Completamento automatico intelligente
È stato implementato un componente dedicato per la selezione dei candidati. Digitando nel campo di testo, il sistema filtra in tempo reale l'elenco estratto dal file originale permettendo un'associazione istantanea.

### 3.3 Gestione dei casi limite
Se la cartella di destinazione è vuota, l'interfaccia blocca l'operatività mostrando un messaggio di avviso che reindirizza imperativamente l'utente alla pagina di smistamento forzando la corretta sequenzialità della procedura.

## 4. Implementazione backend e logica

Il backend esposto in `backend/api/associate.py` definisce un perimetro protetto per la modifica del database.

### 4.1 Endpoint operativi
Le routine diagnostiche con rotte GET controllano l'effettiva esistenza delle immagini, elencano i fogli di calcolo ospitati sul server nella cartella dedicata e leggono la sezione interna al file JSON restituendo l'elenco degli studenti temporanei. La rotta POST esegue l'aggiornamento massivo dei dati, sostituisce l'identificativo anonimo con la vera matricola all'interno delle tabelle assicurandosi di non violare la coerenza referenziale del database.

## 5. Scelte progettuali e pattern

La decisione di analizzare il file Excel interamente nel browser riduce significativamente la complessità del backend e il traffico di rete. Invece di inviare dati binari al server e farli analizzare a librerie esterne, il browser compie il lavoro scambiando col server solamente il risultato finale validato.

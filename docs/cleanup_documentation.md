# Modulo Cleanup: architettura e funzionalità

## 1. Introduzione e scopo del modulo

Il modulo per la gestione dei dati risponde alla necessità di effettuare pulizia e manutenzione ordinaria sul filesystem del progetto. Nel corso di un intero flusso operativo l'applicazione produce un volume considerevole di dati digitali come file PDF, immagini e fogli Excel. Questo modulo offre un'interfaccia di cancellazione di massa categorizzata, eliminando la necessità per l'amministratore di sistema di agire tramite comandi diretti dal computer.

## 2. Architettura e flusso di lavoro

L'architettura si basa sulla scansione incrociata delle cartelle e su un'interfaccia utente dotata di filtri logici.

L'apertura dell'interfaccia utente attiva la ricerca all'interno del server. Il backend esegue routine di libreria standard per ispezionare tutte le sottocartelle del nodo dei dati, distribuendo i percorsi in un dizionario raggruppato per categorie.
Il frontend riceve l'oggetto raggruppato. Il layout permette all'utente di filtrare i documenti per categoria e raggrupparli all'interno di una lista locale. L'utente seleziona infine i file desiderati e ne conferma l'eliminazione. Il backend riceve la lista dei percorsi inviando il comando di distruzione al sistema.

## 3. Componenti frontend e interfaccia utente

Definito in `frontend/src/pages/Cleanup.jsx`, il componente è costruito per bilanciare chiarezza visiva e rigore operativo trattandosi di un modulo distruttivo.

### 3.1 Design generale e gestione dello stato
L'interfaccia divide orizzontalmente lo schermo in base al principio principale-dettaglio. A sinistra risiede la lista di navigazione a schede che rappresenta le categorie. A destra viene istanziata l'area di visualizzazione contenente la selezione vera e propria. Per la memorizzazione temporanea delle selezioni effettuate tramite i pulsanti di spunta, il componente React usa un oggetto `Set` in modo nativo. Questa scelta impedisce le duplicazioni di testo snellendo funzioni di calcolo come la selezione e deselezione multipla.

### 3.2 Prevenzione degli errori
Le operazioni distruttive sono evidenziate con le semantiche associate al colore rosso tipico dei pericoli.
Viene integrata una finestra visiva a blocco per obbligare l'utente ad effettuare un controllo visivo del numero dei file in procinto di eliminazione chiedendo esplicitamente il consenso.
Inoltre la categoria che contiene i file JSON attiva un avviso statico che istruisce attivamente l'utente informandolo sull'esistenza del modulo di backup, fornendo un'indicazione per raggiungere tale pagina.

## 4. Implementazione backend e logica

L'implementazione fornita in `backend/api/cleanup.py` gestisce un controller a stretto contatto con l'ambiente del server stesso.

### 4.1 Ricerca
Il codice ispeziona cartella per cartella. Un passaggio saliente provvede a normalizzare in automatico la barra obliqua dei percorsi, sostituendo le convenzioni dei sistemi operativi Windows con quelle degli ambienti Web, garantendo in questo modo una consultazione immutabile indipendentemente dal tipo di elaboratore ospitante.

### 4.2 Sicurezza dei dati
La logica per l'eliminazione vanta l'implementazione di rigidi controlli di sicurezza: le logiche estrapolano il nome del file ricollegandolo al contesto unicamente convalidato. Se il risultato non rientra nell'ambiente operativo consentito all'applicativo la transazione viene fermata prima ancora di attivare i moduli di rimozione garantendo massima sicurezza del sistema, che fornisce inoltre diagnosi testuali per illustrare il successo o l'eventuale interruzione causata da permessi inadeguati.

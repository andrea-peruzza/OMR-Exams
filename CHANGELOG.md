# Changelog

## 0.3.1 - 2026-09-11

start.sh/start.bat ora eseguono sempre un aggiornamento incrementale dei container Docker invece di saltare la build dopo la prima esecuzione.

- Gli script di avvio (`start.sh`/`start.bat`) ora aggiornano sempre in modo incrementale i container Docker all'avvio, sfruttando la cache, invece di limitarsi alla build una tantum al primo utilizzo.


## 0.3.0 - 2026-09-11

- Nessuna novità visibile per gli utenti in questa versione: la modifica riguarda esclusivamente la riorganizzazione interna del codice (spostamento di omrexams in un submodule) e non introduce cambiamenti alle funzionalità dell'applicazione.


## 0.2.1 - 2026-09-11

- Bookkeeping delle versioni


## 0.2.0 - 2026-09-11

- Nessuna novità visibile per gli utenti in questa versione: gli aggiornamenti riguardano esclusivamente la pubblicazione e il versionamento delle immagini Docker (inclusa la variante arm64) e non modificano le funzionalità dell'applicazione.


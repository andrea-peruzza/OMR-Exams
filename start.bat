@echo off
echo ==============================================
echo       Avvio del progetto OMR Exams in corso
echo ==============================================
echo.

echo [1/4] Controllo stato del motore Docker...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo Il motore Docker e' gia' in esecuzione.
    goto DockerIsRunning
)

echo Il motore Docker non e' in esecuzione. Provo ad avviarlo...
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo Non riesco a trovare Docker Desktop. Avvialo manualmente.
    pause
    exit /b 1
)

start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo Attendo l'avvio di Docker (potrebbe richiedere da 30 a 60 secondi)...

:waitForDocker
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo In attesa di Docker...
    goto waitForDocker
)
echo Docker e' ora in esecuzione!

:DockerIsRunning

echo.
if not exist ".build_done" (
    echo [2/4] Costruzione dei container Docker ^(Build^)...
    echo ^(NOTA: La primissima volta questa operazione potrebbe richiedere 
    echo diversi minuti per scaricare le immagini base e compilare il codice^)
    
    :: In questo modo la procedura di build e' ben visibile a schermo passo-passo
    docker-compose build
    if %errorlevel% neq 0 (
        echo.
        echo ==============================================
        echo ERRORE: La fase di build e' fallita!
        echo Scorri in alto per leggere il messaggio d'errore
        echo ed individuare il problema.
        echo ==============================================
        pause
        exit /b %errorlevel%
    )
    
    :: Crea un file nascosto come "segnalibro" per ricordare che la build e' fatta
    type nul > .build_done
) else (
    echo [2/4] Costruzione dei container Docker saltata ^(Gia' effettuata in passato^).
)

echo.
echo [3/4] Avvio dei container in background...
docker-compose up -d

echo.
echo [4/4] Attendo che il server web sia completamente avviato e pronto...
powershell -Command "$ErrorActionPreference = 'SilentlyContinue'; while($true){ try { $resp=Invoke-WebRequest http://localhost:8080 -UseBasicParsing; if($resp.StatusCode -eq 200 -or $resp.StatusCode -eq 304){ break } } catch {}; Start-Sleep -Seconds 2 }"

echo.
echo Apro l'applicazione nel browser predefinito...
start http://localhost:8080

echo.
echo ==============================================
echo                  Avvio completato
echo ==============================================
echo L'applicazione e' ora in esecuzione nel browser.
echo.
echo PER SPEGNERE L'APPLICAZIONE E CHIUDERE DOCKER:
echo Premi un tasto qualsiasi all'interno di questa finestra...
pause >nul

echo.
echo ==============================================
echo [1/2] Spegnimento dei container in corso...
docker-compose down

echo [2/2] Chiusura del motore Docker Desktop...
taskkill /IM "Docker Desktop.exe" /F >nul 2>&1
taskkill /IM "com.docker.backend.exe" /F >nul 2>&1

echo.
echo Applicazione e Docker spenti correttamente.
echo Puoi chiudere il terminale.
pause

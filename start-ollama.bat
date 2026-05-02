@echo off
REM Auto-start Ollama for PromptKeeper
REM Run this batch file to launch Ollama in the background

echo Starting Ollama...
REM Check if Ollama is already running
timeout /t 2 >nul
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -ErrorAction Stop; Write-Host 'Ollama is already running'; exit 0 } catch { exit 1 }"

if %ERRORLEVEL% equ 0 (
    echo Ollama is already running on localhost:11434
    pause
    exit /b 0
)

REM Start Ollama in background using vbs
echo Creating Ollama starter...
powershell -NoProfile -Command "Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden"
timeout /t 3 >nul

REM Verify it's running
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -ErrorAction Stop; Write-Host 'Ollama started successfully on localhost:11434' } catch { Write-Host 'Failed to start Ollama'; exit 1 }"

if %ERRORLEVEL% equ 0 (
    echo.
    echo Success! Ollama is running.
    echo You can now use PromptKeeper with local AI.
    echo.
    echo Ollama window will run in background.
    echo To stop Ollama: Press Ctrl+C in the Ollama window
    pause
) else (
    echo.
    echo Failed to start Ollama.
    echo Make sure Ollama is installed: https://ollama.ai
    pause
    exit /b 1
)

@echo off
setlocal enabledelayedexpansion

REM PromptKeeper Launcher - Auto-starts Ollama and opens webapp
REM Double-click this file to launch PromptKeeper

echo.
echo ========================================
echo     PromptKeeper Launcher
echo ========================================
echo.

REM Step 1: Check if Ollama is running
echo [1/3] Checking Ollama...
powershell -NoProfile -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -ErrorAction Stop; Write-Host 'OK' } catch { Write-Host 'NO' }" > %temp%\ollama_check.txt
set /p ollama_status=<%temp%\ollama_check.txt

if "%ollama_status%"=="OK" (
    echo Ollama is already running
    goto :skipstart
)

REM Step 2: Start Ollama if not running
echo.
echo [2/3] Starting Ollama...

REM Kill any existing ollama process
taskkill /IM ollama.exe /F >nul 2>&1

REM Start Ollama in background
start "" ollama serve
echo Ollama starting...
timeout /t 5 >nul

:skipstart

REM Step 3: Open webapp
echo.
echo [3/3] Opening PromptKeeper...

start "" "C:\PromptKeeper\webapp\index.html"

echo.
echo ========================================
echo     PromptKeeper is ready!
echo ========================================
echo.
echo Close this window when done.
echo.

timeout /t 3 >nul

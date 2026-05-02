# PromptKeeper Launcher - Auto-starts Ollama and opens webapp
# Run: powershell -ExecutionPolicy Bypass -File launch-promptkeeper.ps1

$ollamaExe = "C:\Users\Константин\AppData\Local\Programs\ollama\ollama.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      PromptKeeper Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Check if Ollama is already running
Write-Host "`n[1/3] Checking Ollama status..." -ForegroundColor Yellow

$ollamaRunning = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -ErrorAction Stop
    $ollamaRunning = $true
    Write-Host "OK - Ollama is already running" -ForegroundColor Green
}
catch {
    Write-Host "NOT FOUND - Ollama not responding" -ForegroundColor Yellow
}

# Step 2: Start Ollama if not running
if (-not $ollamaRunning) {
    Write-Host "`n[2/3] Starting Ollama..." -ForegroundColor Yellow

    # Kill any orphaned ollama processes first
    Get-Process ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500

    if (Test-Path $ollamaExe) {
        try {
            # Start Ollama in background with no window
            $process = & $ollamaExe serve -WindowStyle Hidden
            Write-Host "OK - Ollama started" -ForegroundColor Green
            $ollamaRunning = $true
        }
        catch {
            Write-Host "ERROR - Failed to start Ollama" -ForegroundColor Red
        }
    }
    else {
        Write-Host "ERROR - Ollama not found at: $ollamaExe" -ForegroundColor Red
        Write-Host "Install from: https://ollama.ai" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[2/3] Skipped (Ollama already running)" -ForegroundColor Gray
}

# Step 3: Open PromptKeeper web app
Write-Host "`n[3/3] Opening PromptKeeper..." -ForegroundColor Yellow

$webappPath = "C:\PromptKeeper\webapp\index.html"

if (Test-Path $webappPath) {
    try {
        # Open in default browser
        Start-Process $webappPath
        Write-Host "OK - PromptKeeper opened in browser" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR - Failed to open webapp" -ForegroundColor Red
        Write-Host "  Manually open: $webappPath" -ForegroundColor Yellow
    }
}
else {
    Write-Host "ERROR - Webapp not found at: $webappPath" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "          Ready to use!" -ForegroundColor Cyan
if ($ollamaRunning) {
    Write-Host "  Ollama: OK (fast local AI)" -ForegroundColor Cyan
}
else {
    Write-Host "  Ollama: Check status above" -ForegroundColor Yellow
}
Write-Host "  PromptKeeper: OPENED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nTo stop Ollama later: taskkill /IM ollama.exe /F" -ForegroundColor Gray

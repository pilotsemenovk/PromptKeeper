# Auto-start Ollama for PromptKeeper
# Run: powershell -ExecutionPolicy Bypass -File start-ollama.ps1

Write-Host "Starting Ollama for PromptKeeper..." -ForegroundColor Green

# Check if already running
try {
    $r = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Ollama is already running on localhost:11434" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "Ollama not found, starting..." -ForegroundColor Yellow
}

# Start Ollama in background
try {
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden -PassThru
    Write-Host "Ollama process started" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Failed to start Ollama. Make sure it's installed: https://ollama.ai" -ForegroundColor Red
    exit 1
}

# Wait and verify
Start-Sleep -Seconds 3

try {
    $r = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Ollama is running successfully!" -ForegroundColor Green
    Write-Host "  Access: http://localhost:11434" -ForegroundColor Cyan
    Write-Host "  PromptKeeper will use this for AI functions" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to verify Ollama startup" -ForegroundColor Red
    exit 1
}

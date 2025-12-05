# Low Society Automated Integration Test Runner
# This script starts the server and runs automated game tests

Write-Host "=== Low Society Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if server is already running
$serverRunning = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($serverRunning) {
    Write-Host "Server is already running on port 3003" -ForegroundColor Green
} else {
    Write-Host "Starting server..." -ForegroundColor Yellow

    # Start server in background
    $serverPath = Join-Path $PSScriptRoot "..\server"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; npm run dev" -WindowStyle Normal

    Write-Host "Waiting for server to start (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Check if dependencies are installed
$nodeModulesPath = Join-Path $PSScriptRoot "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing test dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Running automated game test..." -ForegroundColor Cyan
Write-Host "This will simulate 4 AI players playing through a complete game" -ForegroundColor Gray
Write-Host ""

# Run the test
npm test

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Check test-log.txt for full game log" -ForegroundColor Gray
Write-Host "Check test-errors.txt for any errors" -ForegroundColor Gray
Write-Host ""

# Check if errors occurred
$errorFile = Join-Path $PSScriptRoot "test-errors.txt"
if (Test-Path $errorFile) {
    $errorContent = Get-Content $errorFile -Raw
    $errorLines = ($errorContent -split "`n").Count

    if ($errorLines -gt 3) {
        Write-Host "⚠️  Errors were detected during the test!" -ForegroundColor Red
        Write-Host "View test-errors.txt for details" -ForegroundColor Red
    } else {
        Write-Host "✅ No errors detected!" -ForegroundColor Green
    }
}

Write-Host ""
Read-Host "Press Enter to exit"

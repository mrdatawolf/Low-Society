# Run Multiple Low Society Tests
# This script runs the test multiple times to catch special cards (Pawn Shop Trade, Repo Man)

param(
    [int]$Count = 5,
    [int]$Delay = 3
)

Write-Host "=== Running $Count Integration Tests ===" -ForegroundColor Cyan
Write-Host "This will help catch Pawn Shop Trade and Repo Man cards" -ForegroundColor Gray
Write-Host ""

# Check if server is running
$serverRunning = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if (-not $serverRunning) {
    Write-Host "⚠️  Server not running on port 3003" -ForegroundColor Yellow
    Write-Host "Starting server..." -ForegroundColor Yellow

    $serverPath = Join-Path $PSScriptRoot "..\server"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; npm run dev" -WindowStyle Normal

    Write-Host "Waiting for server to start (10 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Check dependencies
$nodeModulesPath = Join-Path $PSScriptRoot "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Clear previous aggregate logs
$aggregateLog = Join-Path $PSScriptRoot "test-aggregate.txt"
$aggregateSummary = Join-Path $PSScriptRoot "test-summary.txt"

"=== Multiple Test Run - $(Get-Date) ===" | Out-File $aggregateLog
"Test Count: $Count`n" | Add-Content $aggregateLog

"=== Test Summary ===" | Out-File $aggregateSummary
"Started: $(Get-Date)`n" | Add-Content $aggregateSummary

$successCount = 0
$failureCount = 0
$pawnShopCount = 0
$repoManCount = 0

for ($i = 1; $i -le $Count; $i++) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Test Run $i of $Count" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Clear previous single test logs
    Remove-Item "test-log.txt" -ErrorAction SilentlyContinue
    Remove-Item "test-errors.txt" -ErrorAction SilentlyContinue

    # Run test
    npm test

    # Check results
    $errorFile = "test-errors.txt"
    $logFile = "test-log.txt"

    if (Test-Path $errorFile) {
        $errorContent = Get-Content $errorFile -Raw
        $errorLines = ($errorContent -split "`n").Count

        if ($errorLines -gt 3) {
            Write-Host "❌ Test $i FAILED" -ForegroundColor Red
            $failureCount++

            # Append errors to aggregate
            "`n--- Test $i ERRORS ---" | Add-Content $aggregateLog
            $errorContent | Add-Content $aggregateLog
        } else {
            Write-Host "✅ Test $i PASSED" -ForegroundColor Green
            $successCount++
        }
    }

    # Check for special cards
    if (Test-Path $logFile) {
        $logContent = Get-Content $logFile -Raw

        if ($logContent -match "Pawn Shop Trade") {
            Write-Host "🔄 Pawn Shop Trade card appeared!" -ForegroundColor Magenta
            $pawnShopCount++
            "`n--- Test $i - PAWN SHOP TRADE ---" | Add-Content $aggregateLog
            $logContent | Add-Content $aggregateLog
        }

        if ($logContent -match "Repo Man|luxury card") {
            Write-Host "🚨 Repo Man card appeared!" -ForegroundColor Yellow
            $repoManCount++
            "`n--- Test $i - REPO MAN ---" | Add-Content $aggregateLog
            $logContent | Add-Content $aggregateLog
        }
    }

    # Delay before next test
    if ($i -lt $Count) {
        Write-Host ""
        Write-Host "Waiting $Delay seconds before next test..." -ForegroundColor Gray
        Start-Sleep -Seconds $Delay
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "Results:" -ForegroundColor White
Write-Host "  ✅ Passed: $successCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failureCount" -ForegroundColor Red
Write-Host "  🔄 Pawn Shop Trade: $pawnShopCount" -ForegroundColor Magenta
Write-Host "  🚨 Repo Man: $repoManCount" -ForegroundColor Yellow
Write-Host ""

# Write summary to file
"Completed: $(Get-Date)" | Add-Content $aggregateSummary
"" | Add-Content $aggregateSummary
"Results:" | Add-Content $aggregateSummary
"  Passed: $successCount" | Add-Content $aggregateSummary
"  Failed: $failureCount" | Add-Content $aggregateSummary
"  Pawn Shop Trade: $pawnShopCount" | Add-Content $aggregateSummary
"  Repo Man: $repoManCount" | Add-Content $aggregateSummary

Write-Host "Detailed logs saved to:" -ForegroundColor Gray
Write-Host "  - test-aggregate.txt (all logs)" -ForegroundColor Gray
Write-Host "  - test-summary.txt (summary)" -ForegroundColor Gray
Write-Host ""

# Warnings
if ($pawnShopCount -eq 0) {
    Write-Host "⚠️  Pawn Shop Trade card did not appear in any test" -ForegroundColor Yellow
    Write-Host "   Consider running more tests or forcing the card to appear" -ForegroundColor Gray
}

if ($repoManCount -eq 0) {
    Write-Host "⚠️  Repo Man card did not appear in any test" -ForegroundColor Yellow
    Write-Host "   Consider running more tests or forcing the card to appear" -ForegroundColor Gray
}

if ($failureCount -gt 0) {
    Write-Host ""
    Write-Host "❌ Some tests failed! Review test-aggregate.txt for details" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"

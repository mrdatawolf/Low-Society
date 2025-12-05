# Continuous Low Society Integration Tests
# Runs tests in a loop until manually cancelled (Ctrl+C)

Write-Host "=== Low Society Continuous Testing ===" -ForegroundColor Cyan
Write-Host "Tests will run continuously until you press Ctrl+C" -ForegroundColor Yellow
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

# Initialize counters and logs
$runCount = 0
$successCount = 0
$failureCount = 0
$pawnShopCount = 0
$repoManCount = 0
$reverseAuctionCount = 0

$continuousLog = Join-Path $PSScriptRoot "test-continuous.log"
$continuousSummary = Join-Path $PSScriptRoot "test-continuous-summary.txt"

"=== Continuous Test Run Started - $(Get-Date) ===" | Out-File $continuousLog
"Press Ctrl+C to stop`n" | Add-Content $continuousLog

Write-Host "Starting continuous test loop..." -ForegroundColor Green
Write-Host "Progress and stats will update after each game" -ForegroundColor Gray
Write-Host ""
Write-Host "Logs:" -ForegroundColor White
Write-Host "  - test-continuous.log (all runs)" -ForegroundColor Gray
Write-Host "  - test-continuous-summary.txt (live stats)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop testing" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Trap Ctrl+C to show final summary
$stopRequested = $false
[Console]::TreatControlCAsInput = $false

# Main loop
while (-not $stopRequested) {
    try {
        $runCount++

        # Clear screen for clean output (optional - comment out if you want scrolling history)
        # Clear-Host

        Write-Host ""
        Write-Host "--- Test Run #$runCount ---" -ForegroundColor Cyan
        $startTime = Get-Date

        # Clear previous single test logs
        Remove-Item "test-log.txt" -ErrorAction SilentlyContinue
        Remove-Item "test-errors.txt" -ErrorAction SilentlyContinue

        # Run test
        $output = npm test 2>&1 | Out-String

        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds

        # Check results
        $errorFile = "test-errors.txt"
        $logFile = "test-log.txt"

        $testPassed = $true
        $foundPawnShop = $false
        $foundRepoMan = $false
        $foundReverseAuction = $false

        if (Test-Path $errorFile) {
            $errorContent = Get-Content $errorFile -Raw
            $errorLines = ($errorContent -split "`n").Count

            if ($errorLines -gt 3) {
                $testPassed = $false
                $failureCount++
                Write-Host "❌ FAILED" -ForegroundColor Red

                # Log error details
                "`n--- Run $runCount FAILED ($(Get-Date)) ---" | Add-Content $continuousLog
                $errorContent | Add-Content $continuousLog
            } else {
                $successCount++
                Write-Host "✅ PASSED" -ForegroundColor Green
            }
        }

        # Check for special features
        if (Test-Path $logFile) {
            $logContent = Get-Content $logFile -Raw

            if ($logContent -match "Pawn Shop Trade|swapped cards") {
                $foundPawnShop = $true
                $pawnShopCount++
                Write-Host "  🔄 Pawn Shop Trade appeared!" -ForegroundColor Magenta

                # Log the interesting game
                "`n--- Run $runCount - PAWN SHOP TRADE ($(Get-Date)) ---" | Add-Content $continuousLog
                "Duration: $duration seconds" | Add-Content $continuousLog
                $logContent | Add-Content $continuousLog
            }

            if ($logContent -match "Repo Man|discarded a luxury card") {
                $foundRepoMan = $true
                $repoManCount++
                Write-Host "  🚨 Repo Man appeared!" -ForegroundColor Yellow

                # Log the interesting game
                "`n--- Run $runCount - REPO MAN ($(Get-Date)) ---" | Add-Content $continuousLog
                "Duration: $duration seconds" | Add-Content $continuousLog
                $logContent | Add-Content $continuousLog
            }

            if ($logContent -match "BIDDING TO AVOID") {
                $foundReverseAuction = $true
                $reverseAuctionCount++
                Write-Host "  ⚠️  Reverse Auction (disgrace card)" -ForegroundColor DarkYellow
            }
        }

        # Update live stats
        Write-Host ""
        Write-Host "Statistics (After $runCount runs):" -ForegroundColor White
        Write-Host "  ✅ Passed: $successCount" -ForegroundColor Green
        if ($failureCount -gt 0) {
            Write-Host "  ❌ Failed: $failureCount" -ForegroundColor Red
        }
        Write-Host "  🔄 Pawn Shop Trade: $pawnShopCount ($('{0:P0}' -f ($pawnShopCount/$runCount)))" -ForegroundColor Magenta
        Write-Host "  🚨 Repo Man: $repoManCount ($('{0:P0}' -f ($repoManCount/$runCount)))" -ForegroundColor Yellow
        Write-Host "  ⚠️  Reverse Auctions: $reverseAuctionCount ($('{0:P0}' -f ($reverseAuctionCount/$runCount)))" -ForegroundColor DarkYellow
        Write-Host "  ⏱️  Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor Gray

        # Write summary file (overwrite each time)
        $summaryContent = @"
=== Continuous Test Summary ===
Started: $(Get-Date)
Current Run: $runCount

Results:
  Passed: $successCount
  Failed: $failureCount

Special Cards:
  Pawn Shop Trade: $pawnShopCount ($([math]::Round(($pawnShopCount/$runCount)*100, 1))%)
  Repo Man: $repoManCount ($([math]::Round(($repoManCount/$runCount)*100, 1))%)
  Reverse Auctions: $reverseAuctionCount ($([math]::Round(($reverseAuctionCount/$runCount)*100, 1))%)

Last Update: $(Get-Date)
"@
        $summaryContent | Out-File $continuousSummary

        # Small delay before next test
        Start-Sleep -Seconds 2

    } catch {
        if ($_.Exception.Message -match "KeyboardInterrupt|OperationStoppedException") {
            $stopRequested = $true
            break
        }

        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        "`n--- Run $runCount ERROR ($(Get-Date)) ---" | Add-Content $continuousLog
        $_.Exception | Add-Content $continuousLog

        Start-Sleep -Seconds 5
    }
}

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Continuous Testing Stopped" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Final Statistics:" -ForegroundColor White
Write-Host "  Total Runs: $runCount" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $successCount" -ForegroundColor Green
if ($failureCount -gt 0) {
    Write-Host "  ❌ Failed: $failureCount" -ForegroundColor Red
}
Write-Host "  🔄 Pawn Shop Trade: $pawnShopCount ($('{0:P0}' -f ($pawnShopCount/$runCount)))" -ForegroundColor Magenta
Write-Host "  🚨 Repo Man: $repoManCount ($('{0:P0}' -f ($repoManCount/$runCount)))" -ForegroundColor Yellow
Write-Host "  ⚠️  Reverse Auctions: $reverseAuctionCount ($('{0:P0}' -f ($reverseAuctionCount/$runCount)))" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "Detailed logs saved to:" -ForegroundColor Gray
Write-Host "  - test-continuous.log" -ForegroundColor Gray
Write-Host "  - test-continuous-summary.txt" -ForegroundColor Gray
Write-Host ""

# Final summary to file
"`n=== Final Summary ($(Get-Date)) ===" | Add-Content $continuousLog
"Total Runs: $runCount" | Add-Content $continuousLog
"Passed: $successCount" | Add-Content $continuousLog
"Failed: $failureCount" | Add-Content $continuousLog
"Pawn Shop Trade: $pawnShopCount" | Add-Content $continuousLog
"Repo Man: $repoManCount" | Add-Content $continuousLog
"Reverse Auctions: $reverseAuctionCount" | Add-Content $continuousLog

Read-Host "Press Enter to exit"

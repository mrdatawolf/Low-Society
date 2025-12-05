@echo off
echo === Low Society Continuous Testing ===
echo Tests will run continuously until you press Ctrl+C
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting continuous test loop...
echo Press Ctrl+C to stop
echo.

set /a runCount=0
set /a successCount=0
set /a failureCount=0

:loop
set /a runCount+=1

echo.
echo --- Test Run #%runCount% ---
echo Running test...

REM Run the test
call npm test >nul 2>&1

REM Check for errors
if exist "test-errors.txt" (
    findstr /R /C:"." "test-errors.txt" >nul 2>&1
    if errorlevel 1 (
        echo PASSED
        set /a successCount+=1
    ) else (
        echo FAILED
        set /a failureCount+=1
    )
)

REM Show stats
echo.
echo Statistics:
echo   Passed: %successCount%
echo   Failed: %failureCount%
echo.

REM Short delay
timeout /t 2 /nobreak >nul

REM Loop forever (Ctrl+C to stop)
goto loop

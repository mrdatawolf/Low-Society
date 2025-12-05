@echo off
echo === Low Society Integration Test ===
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing test dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo Running automated game test...
echo This will simulate 4 AI players playing through a complete game
echo.

REM Run the test
call npm test

echo.
echo === Test Complete ===
echo Check test-log.txt for full game log
echo Check test-errors.txt for any errors
echo.

pause

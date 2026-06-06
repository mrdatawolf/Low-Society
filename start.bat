@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo   Low Society - Startup
echo ========================================

:: Check Node.js
echo.
echo [CHECK] Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL]  Node.js not found. Install v18+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node --version 2^>^&1') do set NODE_VER=%%v
for /f "tokens=1 delims=." %%m in ('echo !NODE_VER:~1!') do set NODE_MAJOR=%%m
if !NODE_MAJOR! LSS 18 (
    echo [FAIL]  Node.js v18+ required. Found !NODE_VER!
    pause
    exit /b 1
)
echo [OK]    Node.js !NODE_VER!

:: Check npm
echo [CHECK] npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL]  npm not found.
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('npm --version 2^>^&1') do set NPM_VER=%%v
echo [OK]    npm !NPM_VER!

:: Server dependencies
echo [CHECK] Server dependencies...
if not exist "%~dp0server\node_modules" (
    echo [INFO]  Not found - running npm install in server\...
    pushd "%~dp0server"
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [FAIL]  npm install failed in server\
        popd
        pause
        exit /b 1
    )
    popd
)
echo [OK]    server\node_modules present

:: Client dependencies
echo [CHECK] Client dependencies...
if not exist "%~dp0client\node_modules" (
    echo [INFO]  Not found - running npm install in client\...
    pushd "%~dp0client"
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [FAIL]  npm install failed in client\
        popd
        pause
        exit /b 1
    )
    popd
)
echo [OK]    client\node_modules present

:: Port checks (warnings only - not fatal)
netstat -ano 2>nul | findstr ":3003 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 echo [WARN]  Port 3003 already in use - server may fail to start

netstat -ano 2>nul | findstr ":3004 " | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 echo [WARN]  Port 3004 already in use - client may fail to start

echo.
echo ========================================
echo   Checks passed - launching app
echo ========================================
echo.
echo   Server  ^>  http://localhost:3003
echo   Client  ^>  http://localhost:3004
echo.
echo   Two terminal windows will open.
echo   Close them to stop the app.
echo.
pause

start "Low Society - Server" cmd /k "cd /d %~dp0server && npm start"
timeout /t 2 /nobreak >nul
start "Low Society - Client" cmd /k "cd /d %~dp0client && npm start"

echo Open http://localhost:3004 in your browser.
echo.
pause
endlocal

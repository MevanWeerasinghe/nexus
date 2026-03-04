@echo off
REM Nexus Frontend - Windows Service Installation Script
REM Run this script as Administrator

SET APP_NAME=NexusFrontend
SET APP_DIR=C:\Apps\nexus-frontend
SET NSSM_PATH=C:\Tools\nssm\win64\nssm.exe
SET NODE_PATH=C:\Program Files\nodejs\node.exe

echo ========================================
echo Nexus ITAM Frontend - Service Installer
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this script as Administrator
    pause
    exit /b 1
)

REM Check if NSSM exists
if not exist "%NSSM_PATH%" (
    echo ERROR: NSSM not found at %NSSM_PATH%
    echo Please download NSSM from https://nssm.cc/download
    echo and extract to C:\Tools\nssm
    pause
    exit /b 1
)

REM Check if Node.js exists
if not exist "%NODE_PATH%" (
    echo ERROR: Node.js not found at %NODE_PATH%
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if app directory exists
if not exist "%APP_DIR%\package.json" (
    echo ERROR: Application not found at %APP_DIR%
    echo Please copy the frontend files to %APP_DIR%
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "%APP_DIR%\node_modules" (
    echo Installing dependencies...
    cd /d "%APP_DIR%"
    call npm install
)

REM Check if build exists
if not exist "%APP_DIR%\.next" (
    echo Building application...
    cd /d "%APP_DIR%"
    call npm run build
)

REM Stop existing service if running
echo Checking for existing service...
%NSSM_PATH% status %APP_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo Stopping existing service...
    %NSSM_PATH% stop %APP_NAME%
    %NSSM_PATH% remove %APP_NAME% confirm
)

REM Install the service
echo Installing service...
%NSSM_PATH% install %APP_NAME% "%NODE_PATH%" "%APP_DIR%\node_modules\.bin\next" "start" "-p" "3000"
%NSSM_PATH% set %APP_NAME% AppDirectory "%APP_DIR%"
%NSSM_PATH% set %APP_NAME% DisplayName "Nexus ITAM Frontend"
%NSSM_PATH% set %APP_NAME% Description "IT Asset Management System Frontend"
%NSSM_PATH% set %APP_NAME% Start SERVICE_AUTO_START
%NSSM_PATH% set %APP_NAME% AppStdout "%APP_DIR%\logs\stdout.log"
%NSSM_PATH% set %APP_NAME% AppStderr "%APP_DIR%\logs\stderr.log"
%NSSM_PATH% set %APP_NAME% AppRotateFiles 1
%NSSM_PATH% set %APP_NAME% AppRotateBytes 10485760
%NSSM_PATH% set %APP_NAME% AppEnvironmentExtra "NODE_ENV=production"

REM Create logs directory
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

REM Start the service
echo Starting service...
%NSSM_PATH% start %APP_NAME%

echo.
echo ========================================
echo Installation complete!
echo Service: %APP_NAME%
echo Status: 
%NSSM_PATH% status %APP_NAME%
echo.
echo Frontend available at: http://localhost:3000
echo ========================================
pause

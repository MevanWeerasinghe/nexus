@echo off
REM Nexus Backend - Windows Service Installation Script
REM Run this script as Administrator

SET APP_NAME=NexusBackend
SET APP_DIR=C:\Apps\nexus-backend
SET NSSM_PATH=C:\Tools\nssm\win64\nssm.exe

echo =======================================
echo Nexus ITAM Backend - Service Installer
echo =======================================
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

REM Check if app directory exists
if not exist "%APP_DIR%\app\main.py" (
    echo ERROR: Application not found at %APP_DIR%
    echo Please copy the backend files to %APP_DIR%
    pause
    exit /b 1
)

REM Check if venv exists
if not exist "%APP_DIR%\venv\Scripts\python.exe" (
    echo Creating virtual environment...
    cd /d "%APP_DIR%"
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
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
%NSSM_PATH% install %APP_NAME% "%APP_DIR%\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
%NSSM_PATH% set %APP_NAME% AppDirectory "%APP_DIR%"
%NSSM_PATH% set %APP_NAME% DisplayName "Nexus ITAM Backend"
%NSSM_PATH% set %APP_NAME% Description "IT Asset Management System Backend API"
%NSSM_PATH% set %APP_NAME% Start SERVICE_AUTO_START
%NSSM_PATH% set %APP_NAME% AppStdout "%APP_DIR%\logs\stdout.log"
%NSSM_PATH% set %APP_NAME% AppStderr "%APP_DIR%\logs\stderr.log"
%NSSM_PATH% set %APP_NAME% AppRotateFiles 1
%NSSM_PATH% set %APP_NAME% AppRotateBytes 10485760

REM Create logs directory
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"

REM Start the service
echo Starting service...
%NSSM_PATH% start %APP_NAME%

echo.
echo =======================================
echo Installation complete!
echo Service: %APP_NAME%
echo Status: 
%NSSM_PATH% status %APP_NAME%
echo.
echo API available at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo =======================================
pause

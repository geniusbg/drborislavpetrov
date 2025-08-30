@echo off
REM Auto Backup Scheduled Batch File
REM Този файл стартира автоматичен backup и може да се използва в Task Scheduler

echo ========================================
echo Auto Backup - Dr. Borislav Petrov
echo Time: %date% %time%
echo ========================================

REM Change to script directory
cd /d "%~dp0"

REM Run backup script with admin token
powershell -ExecutionPolicy Bypass -File "auto-backup.ps1" -AdminToken "test"

REM Check exit code
if %errorlevel% equ 0 (
    echo Backup completed successfully!
) else (
    echo Backup failed with error code: %errorlevel%
)

REM Wait a moment to see the result
timeout /t 5 /nobreak >nul

echo Backup process finished.

@echo off
REM Auto Backup Batch File
REM Този файл стартира PowerShell скрипта за автоматичен backup

echo Starting auto-backup.ps1 with admin token...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-backup.ps1" -AdminToken "test" %*
echo.
echo Backup completed! Check the output above.
pause

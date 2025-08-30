@echo off
REM Auto Backup Batch File - Fixed Version
REM Този файл стартира фиксирания PowerShell скрипт

echo Starting auto-backup-fixed.ps1...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-backup-fixed.ps1" %*
pause

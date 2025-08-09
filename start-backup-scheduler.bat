@echo off
echo Starting Database Backup Scheduler...
echo This will run backup every hour
echo Press Ctrl+C to stop

:loop
echo.
echo [%date% %time%] Running backup...
node backup-database-node.js
echo [%date% %time%] Backup completed
echo Waiting 1 hour before next backup...
timeout /t 3600 /nobreak >nul
goto loop 
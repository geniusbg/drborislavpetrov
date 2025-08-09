@echo off
echo Cleaning duplicates from bug tracker...
echo.

echo Step 1: Checking for duplicates...
node check-duplicates.js
echo.

echo Step 2: Removing duplicates...
node remove-duplicates.js
echo.

echo Step 3: Verifying cleanup...
node check-duplicates.js
echo.

echo Cleanup completed.
pause 
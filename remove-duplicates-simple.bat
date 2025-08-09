@echo off
echo Removing duplicates from bug tracker...
echo.

echo Step 1: Checking current duplicates...
node check-duplicates.js
echo.

echo Step 2: Removing some duplicates...
node remove-some-duplicates.js
echo.

echo Step 3: Checking again...
node check-duplicates.js
echo.

echo Cleanup completed.
pause 
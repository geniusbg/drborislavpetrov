@echo off
echo Testing POST request to bug API...
echo.
echo Sending data:
echo {
echo   "title": "Test bug от скрипт",
echo   "description": "Тестово описание",
echo   "severity": "low",
echo   "category": "test",
echo   "reporter": "admin",
echo   "steps_to_reproduce": ["стъпка 1", "стъпка 2"],
echo   "expected_behavior": "Трябва да работи",
echo   "actual_behavior": "Работи",
echo   "browser": "Chrome",
echo   "device": "Desktop",
echo   "tags": ["test", "script"]
echo }
echo.
curl -X POST "http://localhost:3000/api/admin/bugs" -H "Content-Type: application/json" -H "x-admin-token: admin-token" -d "{\"title\":\"Test bug от скрипт\",\"description\":\"Тестово описание\",\"severity\":\"low\",\"category\":\"test\",\"reporter\":\"admin\",\"steps_to_reproduce\":[\"стъпка 1\",\"стъпка 2\"],\"expected_behavior\":\"Трябва да работи\",\"actual_behavior\":\"Работи\",\"browser\":\"Chrome\",\"device\":\"Desktop\",\"tags\":[\"test\",\"script\"]}"
echo.
echo Test completed.
pause 
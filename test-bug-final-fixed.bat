@echo off
echo Testing bug API POST request with valid data...
echo.
curl -X POST "http://localhost:3000/api/admin/bugs" -H "Content-Type: application/json" -H "x-admin-token: admin-token" -d "{\"title\":\"Final Test Bug\",\"description\":\"Final test\",\"severity\":\"low\",\"category\":\"ui\",\"reporter\":\"admin\",\"steps_to_reproduce\":[\"step1\"],\"expected_behavior\":\"should work\",\"actual_behavior\":\"works\",\"browser\":\"Chrome\",\"device\":\"Desktop\",\"tags\":[\"test\"]}"
echo.
echo Test completed.
pause 
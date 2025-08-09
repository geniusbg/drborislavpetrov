Write-Host "Testing bug API..." -ForegroundColor Green

# Test GET
Write-Host "Testing GET /api/admin/bugs..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bugs" -Headers @{"x-admin-token"="admin-token"}
    Write-Host "GET Status: $($getResponse.StatusCode)" -ForegroundColor Green
    $getData = $getResponse.Content | ConvertFrom-Json
    Write-Host "GET Bugs count: $($getData.bugs.Count)" -ForegroundColor Green
} catch {
    Write-Host "GET Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POST
Write-Host "`nTesting POST /api/admin/bugs..." -ForegroundColor Yellow
try {
    $postData = @{
        title = "Test Bug"
        description = "Test Description"
        severity = "low"
        category = "test"
    } | ConvertTo-Json
    
    Write-Host "POST Data: $postData" -ForegroundColor Cyan
    
    $postResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bugs" -Method POST -Headers @{
        "x-admin-token" = "admin-token"
        "Content-Type" = "application/json"
    } -Body $postData
    
    Write-Host "POST Status: $($postResponse.StatusCode)" -ForegroundColor Green
    Write-Host "POST Content: $($postResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "POST Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "POST Error Details: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
} 
$body = @{
    voiceCommand = "запази ми час за Пешо Пешо за 24 август от 14:00 за почистване на зъби"
} | ConvertTo-Json -Compress

$headers = @{
    'Content-Type' = 'application/json'
    'x-admin-token' = 'admin-token-123'
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/voice-commands" -Method POST -Body $body -Headers $headers
    Write-Host "Success: $($response | ConvertTo-Json -Depth 10)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
} 
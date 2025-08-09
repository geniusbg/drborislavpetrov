# Auto Backup Script
# Този скрипт извиква автоматичния backup API endpoint

param(
    [string]$ApiUrl = "http://localhost:3000/api/admin/backups/auto",
    [string]$AdminToken = "auto-backup-token"
)

Write-Host "🔄 Starting automatic backup..." -ForegroundColor Yellow
Write-Host "⏰ Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "🌐 API URL: $ApiUrl" -ForegroundColor Yellow

try {
    # Извикване на API endpoint-а
    $headers = @{
        "x-admin-token" = $AdminToken
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -TimeoutSec 300
    
    if ($response.success) {
        Write-Host "✅ Automatic backup completed successfully!" -ForegroundColor Green
        Write-Host "📄 Output: $($response.output)" -ForegroundColor Cyan
        Write-Host "⏰ Timestamp: $($response.timestamp)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Backup failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error calling backup API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure the application is running on $ApiUrl" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎉 Auto backup script completed!" -ForegroundColor Green 
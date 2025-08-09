# Database Backup Script
# ÐÐ²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ Ð¸Ð·Ð¿ÑŠÐ»Ð½ÑÐ²Ð° backup Ð½Ð° Ð±Ð°Ð·Ð°Ñ‚Ð° Ð´Ð°Ð½Ð½Ð¸

$ProjectPath = "C:\Users\genius\Downloads\drborislavpetrov"
$BackupScript = "backup-database-node.js"
$LogFile = Join-Path $ProjectPath "backup.log"

Write-Host "Starting scheduled backup..." -ForegroundColor Yellow
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow

try {
    # Ð˜Ð·Ð¿ÑŠÐ»Ð½ÑÐ²Ð°Ð½Ðµ Ð½Ð° backup ÑÐºÑ€Ð¸Ð¿Ñ‚Ð°
    $result = node "$ProjectPath\$BackupScript" 2>&1
    
    # Ð—Ð°Ð¿Ð¸ÑÐ²Ð°Ð½Ðµ Ð² log Ñ„Ð°Ð¹Ð»
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup completed successfully"
    Add-Content -Path $LogFile -Value $logEntry
    
    Write-Host "Backup completed successfully!" -ForegroundColor Green
} catch {
    $errorMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup failed: $($_.Exception.Message)"
    Add-Content -Path $LogFile -Value $errorMsg
    Write-Host "Backup failed: $($_.Exception.Message)" -ForegroundColor Red
}

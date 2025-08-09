# Auto Backup Scheduler Setup
# Този скрипт настройва автоматичен backup чрез API endpoint

param(
    [string]$ProjectPath = $PSScriptRoot,
    [string]$ApiUrl = "http://localhost:3000/api/admin/backups/auto",
    [int]$IntervalHours = 1
)

Write-Host "Setting up Auto Backup Scheduler..." -ForegroundColor Green
Write-Host "Project Path: $ProjectPath" -ForegroundColor Yellow
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "Backup Interval: $IntervalHours hour(s)" -ForegroundColor Yellow

# Проверка дали auto-backup.ps1 съществува
$autoBackupScript = Join-Path $ProjectPath "auto-backup.ps1"
if (-not (Test-Path $autoBackupScript)) {
    Write-Host "Auto backup script not found: $autoBackupScript" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Auto backup script found: $autoBackupScript" -ForegroundColor Green

# Създаване на PowerShell скрипт за backup
$backupScriptContent = @"
# Auto Backup Script
# Автоматично изпълнява backup чрез API endpoint

`$ApiUrl = "$ApiUrl"
`$AdminToken = "auto-backup-token"
`$LogFile = Join-Path `$PSScriptRoot "auto-backup.log"

Write-Host "🔄 Starting automatic backup..." -ForegroundColor Yellow
Write-Host "⏰ Time: `$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow

try {
    # Извикване на API endpoint-а
    `$headers = @{
        "x-admin-token" = `$AdminToken
        "Content-Type" = "application/json"
    }
    
    `$response = Invoke-RestMethod -Uri `$ApiUrl -Method POST -Headers `$headers -TimeoutSec 300
    
    if (`$response.success) {
        `$logEntry = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Auto backup completed successfully"
        Add-Content -Path `$LogFile -Value `$logEntry
        Write-Host "✅ Auto backup completed successfully!" -ForegroundColor Green
    } else {
        `$logEntry = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Auto backup failed: `$(`$response.error)"
        Add-Content -Path `$LogFile -Value `$logEntry
        Write-Host "❌ Auto backup failed: `$(`$response.error)" -ForegroundColor Red
    }
} catch {
    `$logEntry = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Auto backup error: `$(`$_.Exception.Message)"
    Add-Content -Path `$LogFile -Value `$logEntry
    Write-Host "❌ Error calling backup API: `$(`$_.Exception.Message)" -ForegroundColor Red
}
"@

$backupScriptPath = Join-Path $ProjectPath "run-auto-backup.ps1"
$backupScriptContent | Out-File -FilePath $backupScriptPath -Encoding UTF8
Write-Host "✅ Created auto backup runner script: $backupScriptPath" -ForegroundColor Green

# Създаване на Scheduled Task
$taskName = "DrBorislavPetrov-AutoBackup"
$taskDescription = "Automatic database backup via API for Dr. Borislav Petrov application"

# Изтриване на съществуващата задача ако има такава
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "🗑️ Removed existing scheduled task: $taskName" -ForegroundColor Yellow
} catch {
    # Task doesn't exist, continue
}

# Създаване на новата задача
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$backupScriptPath`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) -RepetitionDuration (New-TimeSpan -Days 365)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $taskDescription -User "SYSTEM"
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "📋 Task Name: $taskName" -ForegroundColor Yellow
    Write-Host "⏰ Schedule: Every $IntervalHours hour(s)" -ForegroundColor Yellow
    Write-Host "🌐 API URL: $ApiUrl" -ForegroundColor Yellow
    Write-Host "📁 Log File: $(Join-Path $ProjectPath 'auto-backup.log')" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

# Тестване на auto backup скрипта
Write-Host "🧪 Testing auto backup script..." -ForegroundColor Yellow
try {
    & powershell.exe -ExecutionPolicy Bypass -File $backupScriptPath
    Write-Host "✅ Auto backup test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Auto backup test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Показване на информация за управление
Write-Host ""
Write-Host "🎉 Auto backup scheduler setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Management Commands:" -ForegroundColor Cyan
Write-Host "   View task: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   Start task: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   Stop task: Stop-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   Delete task: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   View logs: Get-Content '$(Join-Path $ProjectPath 'auto-backup.log')'" -ForegroundColor White
Write-Host ""
Write-Host "🌐 API Endpoint: $ApiUrl" -ForegroundColor Cyan
Write-Host "🔑 Token: auto-backup-token" -ForegroundColor Cyan
Write-Host "📁 Backup files location: $(Join-Path $ProjectPath 'backups')" -ForegroundColor Cyan
Write-Host "🔄 Manual auto backup: powershell.exe -ExecutionPolicy Bypass -File $backupScriptPath" -ForegroundColor Cyan 
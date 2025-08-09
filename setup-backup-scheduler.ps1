# Database Backup Scheduler Setup
# Този скрипт настройва автоматичен backup на базата данни на всеки час

param(
    [string]$ProjectPath = $PSScriptRoot,
    [string]$BackupScript = "backup-database.js",
    [int]$IntervalHours = 1,
    [int]$RetentionDays = 5
)

Write-Host "Setting up Database Backup Scheduler..." -ForegroundColor Green
Write-Host "Project Path: $ProjectPath" -ForegroundColor Yellow
Write-Host "Backup Interval: $IntervalHours hour(s)" -ForegroundColor Yellow
Write-Host "Retention: $RetentionDays days" -ForegroundColor Yellow

# Проверка дали Node.js е инсталиран
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Проверка дали backup скриптът съществува
$backupScriptPath = Join-Path $ProjectPath $BackupScript
if (-not (Test-Path $backupScriptPath)) {
    Write-Host "Backup script not found: $backupScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Backup script found: $backupScriptPath" -ForegroundColor Green

# Създаване на PowerShell скрипт за backup
$backupScriptContent = @"
# Database Backup Script
# Автоматично изпълнява backup на базата данни

`$ProjectPath = "$ProjectPath"
`$BackupScript = "$BackupScript"
`$LogFile = Join-Path `$ProjectPath "backup.log"

Write-Host "🔄 Starting scheduled backup..." -ForegroundColor Yellow
Write-Host "⏰ Time: `$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow

try {
    # Изпълняване на backup скрипта
    `$result = node "`$ProjectPath\`$BackupScript" 2>&1
    
    # Записване в log файл
    `$logEntry = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup completed successfully"
    Add-Content -Path `$LogFile -Value `$logEntry
    
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
} catch {
    `$errorMsg = "`$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Backup failed: `$(`$_.Exception.Message)"
    Add-Content -Path `$LogFile -Value `$errorMsg
    Write-Host "❌ Backup failed: `$(`$_.Exception.Message)" -ForegroundColor Red
}
"@

$backupScriptPath = Join-Path $ProjectPath "run-backup.ps1"
$backupScriptContent | Out-File -FilePath $backupScriptPath -Encoding UTF8
Write-Host "✅ Created backup runner script: $backupScriptPath" -ForegroundColor Green

# Създаване на Scheduled Task
$taskName = "DrBorislavPetrov-DatabaseBackup"
$taskDescription = "Automatic database backup for Dr. Borislav Petrov application"

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
    Write-Host "📁 Log File: $(Join-Path $ProjectPath 'backup.log')" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

# Тестване на backup скрипта
Write-Host "🧪 Testing backup script..." -ForegroundColor Yellow
try {
    $testResult = node $backupScriptPath 2>&1
    Write-Host "✅ Backup test completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backup test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Показване на информация за управление
Write-Host ""
Write-Host "🎉 Backup scheduler setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Management Commands:" -ForegroundColor Cyan
Write-Host "   View task: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   Start task: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   Stop task: Stop-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   Delete task: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "   View logs: Get-Content '$(Join-Path $ProjectPath 'backup.log')'" -ForegroundColor White
Write-Host ""
Write-Host "Backup files location: $(Join-Path $ProjectPath 'backups')" -ForegroundColor Cyan
Write-Host "Manual backup: node $BackupScript" -ForegroundColor Cyan 
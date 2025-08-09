# Simple Auto Backup Setup
# Този скрипт настройва автоматичен backup

param(
    [string]$ProjectPath = $PSScriptRoot,
    [string]$ApiUrl = "http://localhost:3000/api/admin/backups/auto",
    [int]$IntervalHours = 1
)

Write-Host "Setting up Auto Backup Scheduler..." -ForegroundColor Green

# Създаване на Scheduled Task
$taskName = "DrBorislavPetrov-AutoBackup"
$taskDescription = "Automatic database backup via API"

# Изтриване на съществуващата задача ако има такава
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed existing scheduled task: $taskName" -ForegroundColor Yellow
} catch {
    # Task doesn't exist, continue
}

# Създаване на новата задача
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ProjectPath\auto-backup.ps1`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) -RepetitionDuration (New-TimeSpan -Days 365)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $taskDescription -User "SYSTEM"
    Write-Host "Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "Task Name: $taskName" -ForegroundColor Yellow
    Write-Host "Schedule: Every $IntervalHours hour(s)" -ForegroundColor Yellow
} catch {
    Write-Host "Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "Auto backup scheduler setup completed!" -ForegroundColor Green 
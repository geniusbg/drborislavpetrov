# Setup Auto Backup Script for Windows Development
# Този скрипт настройва автоматичните backup-и

param(
    [string]$ApiUrl = "http://localhost:3000/api/admin/backups",
    [string]$AdminToken = "auto-backup-token",
    [string]$BackupDir = "./backups",
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Test
)

Write-Host "🔧 Setup Auto Backup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $statusMessage = "[$timestamp] [$Type] $Message"
    
    switch ($Type) {
        "ERROR" { Write-Host $statusMessage -ForegroundColor Red }
        "SUCCESS" { Write-Host $statusMessage -ForegroundColor Green }
        "WARN" { Write-Host $statusMessage -ForegroundColor Yellow }
        default { Write-Host $statusMessage -ForegroundColor White }
    }
}

function Test-BackupAPI {
    Write-Status "🧪 Testing backup API..." "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri $ApiUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Status "✅ Backup API is accessible" "SUCCESS"
            return $true
        } else {
            Write-Status "⚠️ Backup API responded with status: $($response.StatusCode)" "WARN"
            return $false
        }
    } catch {
        Write-Status "❌ Backup API test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-AutomaticBackup {
    Write-Status "🧪 Testing automatic backup endpoint..." "INFO"
    
    try {
        $headers = @{
            "x-admin-token" = $AdminToken
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $ApiUrl -Method PUT -Headers $headers -TimeoutSec 60
        
        if ($response.success) {
            Write-Status "✅ Automatic backup test successful!" "SUCCESS"
            Write-Status "📄 File: $($response.file)" "INFO"
            Write-Status "🔧 Method: $($response.method)" "INFO"
            return $true
        } else {
            Write-Status "❌ Automatic backup test failed: $($response.error)" "ERROR"
            return $false
        }
    } catch {
        Write-Status "❌ Automatic backup test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Install-AutoBackup {
    Write-Status "📦 Installing automatic backup..." "INFO"
    
    # Create backup directory
    if (!(Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-Status "📁 Created backup directory: $BackupDir" "SUCCESS"
    }
    
    # Create log file
    $logFile = Join-Path $BackupDir "auto-backup.log"
    if (!(Test-Path $logFile)) {
        New-Item -ItemType File -Path $logFile -Force | Out-Null
        Write-Status "📝 Created log file: $logFile" "SUCCESS"
    }
    
    # Test PowerShell execution policy
    $executionPolicy = Get-ExecutionPolicy
    if ($executionPolicy -eq "Restricted") {
        Write-Status "⚠️ PowerShell execution policy is restricted. You may need to run:" "WARN"
        Write-Host "   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    }
    
    # Test backup functionality
    if (Test-BackupAPI) {
        if (Test-AutomaticBackup) {
            Write-Status "✅ Automatic backup installation completed successfully!" "SUCCESS"
            Write-Status "💡 You can now run: .\auto-backup.ps1" "INFO"
            Write-Status "💡 Or use: .\auto-backup.bat" "INFO"
        } else {
            Write-Status "⚠️ Installation completed but automatic backup test failed" "WARN"
        }
    } else {
        Write-Status "❌ Installation failed - backup API not accessible" "ERROR"
    }
}

function Uninstall-AutoBackup {
    Write-Status "🗑️ Uninstalling automatic backup..." "INFO"
    
    # Remove log file
    $logFile = Join-Path $BackupDir "auto-backup.log"
    if (Test-Path $logFile) {
        Remove-Item $logFile -Force
        Write-Status "🗑️ Removed log file: $logFile" "SUCCESS"
    }
    
    # Note: We don't remove the backup directory as it may contain important backups
    Write-Status "⚠️ Backup directory '$BackupDir' was not removed (may contain important data)" "WARN"
    Write-Status "✅ Automatic backup uninstallation completed" "SUCCESS"
}

function Show-Configuration {
    Write-Status "📋 Current Configuration:" "INFO"
    Write-Host "   API URL: $ApiUrl" -ForegroundColor Cyan
    Write-Host "   Admin Token: $AdminToken" -ForegroundColor Cyan
    Write-Host "   Backup Directory: $BackupDir" -ForegroundColor Cyan
    Write-Host "   PowerShell Execution Policy: $(Get-ExecutionPolicy)" -ForegroundColor Cyan
}

# Main execution
if ($Install) {
    Install-AutoBackup
} elseif ($Uninstall) {
    Uninstall-AutoBackup
} elseif ($Test) {
    Write-Status "🧪 Running tests only..." "INFO"
    if (Test-BackupAPI) {
        Test-AutomaticBackup
    }
} else {
    Write-Status "ℹ️ No action specified. Use -Install, -Uninstall, or -Test" "INFO"
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\setup-auto-backup.ps1 -Install    # Install automatic backup" -ForegroundColor White
    Write-Host "  .\setup-auto-backup.ps1 -Uninstall  # Uninstall automatic backup" -ForegroundColor White
    Write-Host "  .\setup-auto-backup.ps1 -Test       # Test backup functionality" -ForegroundColor White
    Write-Host "  .\setup-auto-backup.ps1 -Help       # Show this help" -ForegroundColor White
    Write-Host ""
    
    Show-Configuration
} 
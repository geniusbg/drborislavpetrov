# Auto Backup Script - Simple Version
# Този скрипт чете database параметрите от .env файла

param(
    [string]$ApiUrl = "http://localhost:3000/api/admin/backups",
    [string]$AdminToken = "auto-backup-token",
    [switch]$Force,
    [switch]$Test,
    [string]$LogFile = ""
)

# Setup logging
if ($LogFile -and $LogFile -ne "") {
    $LogFile = $LogFile.Trim()
    if (-not (Test-Path (Split-Path $LogFile -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $LogFile -Parent) -Force | Out-Null
    }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN"  { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage -ForegroundColor White }
    }
    
    if ($LogFile -and $LogFile -ne "") {
        Add-Content -Path $LogFile -Value $logMessage
    }
}

function Read-EnvFile {
    param([string]$EnvPath = ".env")
    
    if (-not (Test-Path $EnvPath)) {
        Write-Log ".env file not found at: $EnvPath" "ERROR"
        return @{}
    }
    
    $envVars = @{}
    $content = Get-Content $EnvPath -ErrorAction SilentlyContinue
    
    foreach ($line in $content) {
        $line = $line.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                $envVars[$key] = $value
            }
        }
    }
    
    return $envVars
}

Write-Log "Starting automatic backup..." "INFO"
Write-Log "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO"
Write-Log "API URL: $ApiUrl" "INFO"
Write-Log "Admin Token: $AdminToken" "INFO"

# Read environment variables from .env file
Write-Log "Reading environment variables from .env file..." "INFO"
$envVars = Read-EnvFile

if ($envVars.Count -eq 0) {
    Write-Log "Failed to read environment variables from .env file" "ERROR"
    exit 1
}

# Set PostgreSQL environment variables
$dbKeys = @($envVars.Keys | Where-Object { $_ -like "DB_*" })
foreach ($key in $dbKeys) {
    $pgKey = $key.Replace("DB_", "PG")
    $envVars[$pgKey] = $envVars[$key]
    Write-Log "Set $pgKey = $($envVars[$pgKey])" "INFO"
}

# Set specific PostgreSQL variables
if ($envVars["DB_HOST"]) { $env:PGHOST = $envVars["DB_HOST"] }
if ($envVars["DB_PORT"]) { $env:PGPORT = $envVars["DB_PORT"] }
if ($envVars["DB_NAME"]) { $env:PGDATABASE = $envVars["DB_NAME"] }
if ($envVars["DB_USER"]) { $env:PGUSER = $envVars["DB_USER"] }
if ($envVars["DB_PASSWORD"]) { $env:PGPASSWORD = $envVars["DB_PASSWORD"] }

Write-Log "Environment variables set successfully" "SUCCESS"

if ($Force) {
    Write-Log "Force backup mode enabled" "WARN"
}

if ($Test) {
    Write-Log "Test mode enabled - will not perform actual backup" "WARN"
}

try {
    # Test connection first
    Write-Log "Testing API connection..." "INFO"
    
    $testHeaders = @{
        "x-admin-token" = $AdminToken
        "Content-Type" = "application/json"
    }
    
    $testResponse = Invoke-WebRequest -Uri $ApiUrl -Method GET -Headers $testHeaders -TimeoutSec 10 -ErrorAction Stop
    if ($testResponse.StatusCode -eq 200) {
        Write-Log "API connection successful" "SUCCESS"
    } else {
        Write-Log "API responded with status: $($testResponse.StatusCode)" "WARN"
    }
} catch {
    Write-Log "API connection test failed: $($_.Exception.Message)" "ERROR"
    Write-Log "Make sure the application is running on $ApiUrl" "WARN"
    
    if (-not $Force) {
        Write-Log "Exiting due to connection failure (use -Force to override)" "ERROR"
        exit 1
    } else {
        Write-Log "Continuing despite connection issues due to -Force flag" "WARN"
    }
}

if ($Test) {
    Write-Log "Test mode - backup would be performed now" "SUCCESS"
    Write-Log "Test completed successfully!" "SUCCESS"
    exit 0
}

try {
    # Извикване на автоматичния backup endpoint (PUT method)
    $headers = @{
        "x-admin-token" = $AdminToken
        "Content-Type" = "application/json"
    }
    
    Write-Log "Calling automatic backup API..." "INFO"
    
    $response = Invoke-RestMethod -Uri $ApiUrl -Method PUT -Headers $headers -TimeoutSec 300
    
    if ($response.success) {
        Write-Log "Automatic backup completed successfully!" "SUCCESS"
        Write-Log "File: $($response.file)" "INFO"
        Write-Log "Method: $($response.method)" "INFO"
        Write-Log "Timestamp: $($response.timestamp)" "INFO"
        Write-Log "Output: $($response.output)" "INFO"
    } else {
        Write-Log "Backup failed: $($response.error)" "ERROR"
        if ($response.details) {
            Write-Log "Details: $($response.details)" "ERROR"
        }
        exit 1
    }
} catch {
    Write-Log "Error calling backup API: $($_.Exception.Message)" "ERROR"
    exit 1
}

Write-Log "Backup process completed successfully!" "SUCCESS"

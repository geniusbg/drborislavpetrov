#!/bin/bash

# Auto Backup Script for Ubuntu/Linux Production
# Този скрипт извиква автоматичния backup API endpoint

# Default values
API_URL="${API_URL:-http://localhost:3000/api/admin/backups}"
ADMIN_TOKEN="${ADMIN_TOKEN:-auto-backup-token}"
LOG_FILE="${LOG_FILE:-./backups/auto-backup.log}"
FORCE_MODE=false
TEST_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -t|--token)
            ADMIN_TOKEN="$2"
            shift 2
            ;;
        -l|--log)
            LOG_FILE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_MODE=true
            shift
            ;;
        --test)
            TEST_MODE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -u, --url URL        API URL (default: $API_URL)"
            echo "  -t, --token TOKEN    Admin token (default: $ADMIN_TOKEN)"
            echo "  -l, --log FILE       Log file (default: $LOG_FILE)"
            echo "  -f, --force          Force backup even if connection test fails"
            echo "  --test               Test mode - don't perform actual backup"
            echo "  -h, --help           Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use $0 --help for usage information"
            exit 1
            ;;
    esac
done

# Setup logging
setup_logging() {
    if [ -n "$LOG_FILE" ] && [ "$LOG_FILE" != "" ]; then
        local log_dir=$(dirname "$LOG_FILE")
        if [ ! -d "$log_dir" ]; then
            mkdir -p "$log_dir"
        fi
    fi
}

# Logging function
write_log() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_message="[$timestamp] [$level] $message"
    
    case "$level" in
        "ERROR")
            echo -e "\033[31m$log_message\033[0m"  # Red
            ;;
        "WARN")
            echo -e "\033[33m$log_message\033[0m"  # Yellow
            ;;
        "SUCCESS")
            echo -e "\033[32m$log_message\033[0m"  # Green
            ;;
        *)
            echo "$log_message"  # White
            ;;
    esac
    
    if [ -n "$LOG_FILE" ] && [ "$LOG_FILE" != "" ]; then
        echo "$log_message" >> "$LOG_FILE"
    fi
}

# Check if required tools are available
check_dependencies() {
    write_log "🔍 Checking dependencies..." "INFO"
    
    if ! command -v curl >/dev/null 2>&1; then
        write_log "❌ curl is not installed. Please install curl." "ERROR"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        write_log "⚠️ jq is not installed. JSON parsing might be limited." "WARN"
    fi
    
    write_log "✅ Dependencies check completed" "SUCCESS"
}

# Test API connection
test_connection() {
    write_log "📡 Testing API connection..." "INFO"
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 10 "$API_URL" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
        write_log "✅ API connection successful" "SUCCESS"
        return 0
    else
        write_log "❌ API connection failed (HTTP: $response)" "ERROR"
        write_log "💡 Make sure the application is running on $API_URL" "WARN"
        return 1
    fi
}

# Perform backup
perform_backup() {
    write_log "📡 Calling automatic backup API..." "INFO"
    
    local response=$(curl -s -X PUT "$API_URL" \
        -H "x-admin-token: $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -w "%{http_code}" \
        --connect-timeout 300 \
        2>/dev/null)
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        write_log "✅ Automatic backup completed successfully!" "SUCCESS"
        
        # Try to parse JSON response if jq is available
        if command -v jq >/dev/null 2>&1; then
            local file=$(echo "$body" | jq -r '.file // "N/A"')
            local method=$(echo "$body" | jq -r '.method // "N/A"')
            local timestamp=$(echo "$body" | jq -r '.timestamp // "N/A"')
            local output=$(echo "$body" | jq -r '.output // "N/A"')
            
            write_log "📄 File: $file" "INFO"
            write_log "🔧 Method: $method" "INFO"
            write_log "⏰ Timestamp: $timestamp" "INFO"
            write_log "📝 Output: $output" "INFO"
        else
            write_log "📋 Response: $body" "INFO"
        fi
        
        return 0
    else
        write_log "❌ Backup failed (HTTP: $http_code)" "ERROR"
        write_log "📋 Response: $body" "ERROR"
        return 1
    fi
}

# Main execution
main() {
    setup_logging
    
    write_log "🔄 Starting automatic backup..." "INFO"
    write_log "⏰ Time: $(date '+%Y-%m-%d %H:%M:%S')" "INFO"
    write_log "🌐 API URL: $API_URL" "INFO"
    write_log "🔑 Admin Token: $ADMIN_TOKEN" "INFO"
    
    if [ "$FORCE_MODE" = true ]; then
        write_log "🔄 Force backup mode enabled" "WARN"
    fi
    
    if [ "$TEST_MODE" = true ]; then
        write_log "🧪 Test mode enabled - will not perform actual backup" "WARN"
    fi
    
    # Check dependencies
    check_dependencies
    
    # Test connection
    if ! test_connection; then
        if [ "$FORCE_MODE" = false ]; then
            write_log "❌ Exiting due to connection failure (use --force to override)" "ERROR"
            exit 1
        else
            write_log "⚠️ Continuing despite connection issues due to --force flag" "WARN"
        fi
    fi
    
    if [ "$TEST_MODE" = true ]; then
        write_log "🧪 Test mode - backup would be performed now" "SUCCESS"
        write_log "🎉 Test completed successfully!" "SUCCESS"
        exit 0
    fi
    
    # Perform backup
    if perform_backup; then
        write_log "🎉 Auto backup script completed successfully!" "SUCCESS"
        exit 0
    else
        write_log "❌ Auto backup script failed!" "ERROR"
        exit 1
    fi
}

# Run main function
main "$@"

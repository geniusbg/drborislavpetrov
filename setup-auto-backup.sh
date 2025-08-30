#!/bin/bash

# Setup Auto Backup Script for Ubuntu/Linux Production
# Този скрипт настройва автоматичните backup-и

# Default values
API_URL="${API_URL:-http://localhost:3000/api/admin/backups}"
ADMIN_TOKEN="${ADMIN_TOKEN:-auto-backup-token}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"  # Daily at 2:00 AM

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -s|--schedule)
            CRON_SCHEDULE="$2"
            shift 2
            ;;
        -i|--install)
            INSTALL_MODE=true
            shift
            ;;
        -u|--uninstall)
            UNINSTALL_MODE=true
            shift
            ;;
        -t|--test)
            TEST_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -u, --url URL        API URL (default: $API_URL)"
    echo "  -t, --token TOKEN    Admin token (default: $ADMIN_TOKEN)"
    echo "  -d, --dir DIR        Backup directory (default: $BACKUP_DIR)"
    echo "  -s, --schedule CRON  Cron schedule (default: $CRON_SCHEDULE)"
    echo "  -i, --install        Install automatic backup"
    echo "  -u, --uninstall      Uninstall automatic backup"
    echo "  -t, --test           Test backup functionality"
    echo "  -h, --help           Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --install                    # Install with defaults"
    echo "  $0 --install --schedule '0 3 * * *'  # Install with custom schedule"
    echo "  $0 --test                      # Test backup functionality"
    echo "  $0 --uninstall                 # Remove automatic backup"
}

# Logging function
log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_message="[$timestamp] [$level] $message"
    
    case "$level" in
        "ERROR")
            echo -e "${RED}$log_message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}$log_message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}$log_message${NC}"
            ;;
        *)
            echo "$log_message"
            ;;
    esac
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_message "⚠️ Running as root - this is not recommended for security" "WARN"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check dependencies
check_dependencies() {
    log_message "🔍 Checking dependencies..." "INFO"
    
    local missing_deps=()
    
    if ! command -v curl >/dev/null 2>&1; then
        missing_deps+=("curl")
    fi
    
    if ! command -v crontab >/dev/null 2>&1; then
        missing_deps+=("cron")
    fi
    
    if ! command -v systemctl >/dev/null 2>&1; then
        missing_deps+=("systemd")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_message "❌ Missing dependencies: ${missing_deps[*]}" "ERROR"
        log_message "💡 Install with: sudo apt-get update && sudo apt-get install ${missing_deps[*]}" "INFO"
        return 1
    fi
    
    log_message "✅ All dependencies are available" "SUCCESS"
    return 0
}

# Test backup API
test_backup_api() {
    log_message "🧪 Testing backup API..." "INFO"
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout 10 "$API_URL" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
        log_message "✅ Backup API is accessible" "SUCCESS"
        return 0
    else
        log_message "❌ Backup API test failed (HTTP: $response)" "ERROR"
        return 1
    fi
}

# Test automatic backup
test_automatic_backup() {
    log_message "🧪 Testing automatic backup endpoint..." "INFO"
    
    local response=$(curl -s -X PUT "$API_URL" \
        -H "x-admin-token: $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -w "%{http_code}" \
        --connect-timeout 60 \
        2>/dev/null)
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        log_message "✅ Automatic backup test successful!" "SUCCESS"
        
        # Try to parse JSON response if jq is available
        if command -v jq >/dev/null 2>&1; then
            local file=$(echo "$body" | jq -r '.file // "N/A"')
            local method=$(echo "$body" | jq -r '.method // "N/A"')
            log_message "📄 File: $file" "INFO"
            log_message "🔧 Method: $method" "INFO"
        else
            log_message "📋 Response: $body" "INFO"
        fi
        
        return 0
    else
        log_message "❌ Automatic backup test failed (HTTP: $http_code)" "ERROR"
        log_message "📋 Response: $body" "ERROR"
        return 1
    fi
}

# Install automatic backup
install_automatic_backup() {
    log_message "📦 Installing automatic backup..." "INFO"
    
    # Create backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_message "📁 Created backup directory: $BACKUP_DIR" "SUCCESS"
    fi
    
    # Create log file
    local log_file="$BACKUP_DIR/auto-backup.log"
    if [ ! -f "$log_file" ]; then
        touch "$log_file"
        log_message "📝 Created log file: $log_file" "SUCCESS"
    fi
    
    # Make backup script executable
    if [ -f "auto-backup.sh" ]; then
        chmod +x "auto-backup.sh"
        log_message "🔧 Made backup script executable" "SUCCESS"
    fi
    
    # Create cron job
    local current_dir=$(pwd)
    local cron_job="$CRON_SCHEDULE cd $current_dir && ./auto-backup.sh --url $API_URL --token $ADMIN_TOKEN --log $log_file >> $log_file 2>&1"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
    
    if [ $? -eq 0 ]; then
        log_message "✅ Cron job installed successfully!" "SUCCESS"
        log_message "⏰ Schedule: $CRON_SCHEDULE" "INFO"
    else
        log_message "❌ Failed to install cron job" "ERROR"
        return 1
    fi
    
    # Test functionality
    if test_backup_api && test_automatic_backup; then
        log_message "✅ Automatic backup installation completed successfully!" "SUCCESS"
        log_message "💡 Backup will run automatically according to cron schedule" "INFO"
        log_message "💡 Check logs with: tail -f $log_file" "INFO"
        return 0
    else
        log_message "⚠️ Installation completed but tests failed" "WARN"
        return 1
    fi
}

# Uninstall automatic backup
uninstall_automatic_backup() {
    log_message "🗑️ Uninstalling automatic backup..." "INFO"
    
    # Remove cron job
    local current_dir=$(pwd)
    local cron_job="$CRON_SCHEDULE cd $current_dir && ./auto-backup.sh --url $API_URL --token $ADMIN_TOKEN --log $log_file >> $log_file 2>&1"
    
    # Remove specific cron job
    crontab -l 2>/dev/null | grep -v "$cron_job" | crontab -
    
    if [ $? -eq 0 ]; then
        log_message "✅ Cron job removed successfully!" "SUCCESS"
    else
        log_message "⚠️ Cron job removal may have failed" "WARN"
    fi
    
    # Remove log file
    local log_file="$BACKUP_DIR/auto-backup.log"
    if [ -f "$log_file" ]; then
        rm "$log_file"
        log_message "🗑️ Removed log file: $log_file" "SUCCESS"
    fi
    
    # Note: We don't remove the backup directory as it may contain important backups
    log_message "⚠️ Backup directory '$BACKUP_DIR' was not removed (may contain important data)" "WARN"
    log_message "✅ Automatic backup uninstallation completed" "SUCCESS"
}

# Show configuration
show_configuration() {
    log_message "📋 Current Configuration:" "INFO"
    echo "   API URL: $API_URL"
    echo "   Admin Token: $ADMIN_TOKEN"
    echo "   Backup Directory: $BACKUP_DIR"
    echo "   Cron Schedule: $CRON_SCHEDULE"
    echo "   Current Directory: $(pwd)"
}

# Main execution
main() {
    echo -e "${BLUE}🔧 Setup Auto Backup Script for Ubuntu/Linux${NC}"
    echo "================================================"
    
    # Check root privileges
    check_root
    
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi
    
    # Show current configuration
    show_configuration
    
    # Execute based on mode
    if [ "$INSTALL_MODE" = true ]; then
        install_automatic_backup
    elif [ "$UNINSTALL_MODE" = true ]; then
        uninstall_automatic_backup
    elif [ "$TEST_MODE" = true ]; then
        log_message "🧪 Running tests only..." "INFO"
        if test_backup_api; then
            test_automatic_backup
        fi
    else
        log_message "ℹ️ No action specified. Use --install, --uninstall, or --test" "INFO"
        echo ""
        show_help
    fi
}

# Run main function
main "$@"

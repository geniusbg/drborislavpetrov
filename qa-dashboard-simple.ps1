# QA Dashboard - Simple PowerShell Version
# Virtual QA Team - Test Management Dashboard

Write-Host "QA Dashboard - Welcome!" -ForegroundColor Cyan
Write-Host "Choose an option from the menu below..." -ForegroundColor Yellow

function Show-MainMenu {
    Write-Host "`n=== QA DASHBOARD ===" -ForegroundColor Green
    Write-Host "1. Show all QA tests" -ForegroundColor White
    Write-Host "2. Run automated test" -ForegroundColor White
    Write-Host "3. Run specific test" -ForegroundColor White
    Write-Host "4. Show QA guides" -ForegroundColor White
    Write-Host "5. Clean test data" -ForegroundColor White
    Write-Host "6. Generate QA report" -ForegroundColor White
    Write-Host "7. Check test status" -ForegroundColor White
    Write-Host "8. Exit" -ForegroundColor White
    Write-Host "=====================" -ForegroundColor Green
}

function Show-AllTests {
    Write-Host "`n=== ALL QA TESTS ===`n" -ForegroundColor Cyan
    
    $testFiles = @{
        'QA_AUTOMATED_TEST.js' = 'Automated Tests (Puppeteer)'
        'TEST_HOMEPAGE.js' = 'Homepage Test'
        'TEST_BOOKINGS.js' = 'Bookings Test'
        'TEST_CALENDAR.js' = 'Calendar Test'
        'TEST_USERS.js' = 'Users Test'
        'TEST_SERVICE_EDITING.js' = 'Service Editing Test'
        'TEST_API.js' = 'API Test'
        'TEST_FORM_VALIDATION.js' = 'Form Validation Test'
        'TEST_BUTTONS.js' = 'Buttons and UI Test'
        'TEST_NETWORK.js' = 'Network Test'
        'TEST_LOCALSTORAGE.js' = 'LocalStorage Test'
        'TEST_AUTO_REFRESH.js' = 'Auto Refresh Test'
        'TEST_HYDRATION_FIX.js' = 'Hydration Test'
        'TEST_CALENDAR_BOOKINGS.js' = 'Calendar Bookings Test'
        'TEST_BOOKING_CREATION.js' = 'Booking Creation Test'
        'TEST_BOOKING_EDITING.js' = 'Booking Editing Test'
        'TEST_USERS_API.js' = 'Users API Test'
        'TEST_USERS_MODAL_CLOSE.js' = 'Users Modal Test'
        'TEST_API_SERVICES.js' = 'Services API Test'
    }
    
    Write-Host "AUTOMATED TESTS:" -ForegroundColor Yellow
    Write-Host "================" -ForegroundColor Yellow
    foreach ($file in $testFiles.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "OK" } else { "MISSING" }
        Write-Host "$status $file - $($testFiles[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
    
    $qaGuides = @{
        'QA_CHECKLIST.md' = 'QA Checklist - Manual Testing'
        'QA_TEAM_GUIDE.md' = 'QA Team Guide - Team Guide'
        'QA_TEST_SCRIPT.md' = 'QA Test Script - Test Script'
        'MANUAL_QA_TEST.md' = 'Manual QA Test - Manual Testing'
        'QA_TESTS_BOOKING_STATUS.md' = 'QA Tests Booking Status - Booking Status'
    }
    
    Write-Host "`nQA GUIDES:" -ForegroundColor Yellow
    Write-Host "==========" -ForegroundColor Yellow
    foreach ($file in $qaGuides.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "OK" } else { "MISSING" }
        Write-Host "$status $file - $($qaGuides[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
}

function Start-AutomatedTest {
    Write-Host "`n=== RUNNING AUTOMATED TEST ===`n" -ForegroundColor Yellow
    
    if (-not (Test-Path 'QA_AUTOMATED_TEST.js')) {
        Write-Host "ERROR: QA_AUTOMATED_TEST.js not found!" -ForegroundColor Red
        return
    }
    
    Write-Host "Checking if server is running..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bugs" -Headers @{"x-admin-token"="admin-token"} -ErrorAction Stop
        Write-Host "OK: Server is running!" -ForegroundColor Green
        
        Write-Host "Starting automated QA test..." -ForegroundColor Yellow
        Write-Host "This will open a browser and run all tests...`n" -ForegroundColor Cyan
        
        & node QA_AUTOMATED_TEST.js
        
    } catch {
        Write-Host "ERROR: Server is not running!" -ForegroundColor Red
        Write-Host "Start it with: npm run dev" -ForegroundColor Yellow
    }
}

function Start-SpecificTest {
    Write-Host "`n=== RUNNING SPECIFIC TEST ===`n" -ForegroundColor Yellow
    
    $testFiles = @{
        'QA_AUTOMATED_TEST.js' = 'Automated Tests (Puppeteer)'
        'TEST_HOMEPAGE.js' = 'Homepage Test'
        'TEST_BOOKINGS.js' = 'Bookings Test'
        'TEST_CALENDAR.js' = 'Calendar Test'
        'TEST_USERS.js' = 'Users Test'
        'TEST_SERVICE_EDITING.js' = 'Service Editing Test'
        'TEST_API.js' = 'API Test'
        'TEST_FORM_VALIDATION.js' = 'Form Validation Test'
        'TEST_BUTTONS.js' = 'Buttons and UI Test'
        'TEST_NETWORK.js' = 'Network Test'
        'TEST_LOCALSTORAGE.js' = 'LocalStorage Test'
        'TEST_AUTO_REFRESH.js' = 'Auto Refresh Test'
        'TEST_HYDRATION_FIX.js' = 'Hydration Test'
        'TEST_CALENDAR_BOOKINGS.js' = 'Calendar Bookings Test'
        'TEST_BOOKING_CREATION.js' = 'Booking Creation Test'
        'TEST_BOOKING_EDITING.js' = 'Booking Editing Test'
        'TEST_USERS_API.js' = 'Users API Test'
        'TEST_USERS_MODAL_CLOSE.js' = 'Users Modal Test'
        'TEST_API_SERVICES.js' = 'Services API Test'
    }
    
    Write-Host "Available tests:" -ForegroundColor Cyan
    $index = 1
    foreach ($file in $testFiles.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "OK" } else { "MISSING" }
        Write-Host "$index. $status $file - $($testFiles[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
        $index++
    }
    
    Write-Host "`nTo run a test manually, use:" -ForegroundColor Yellow
    Write-Host "   node [filename]" -ForegroundColor White
    Write-Host "   Example: node TEST_HOMEPAGE.js" -ForegroundColor White
}

function Show-QAGuides {
    Write-Host "`n=== QA GUIDES ===`n" -ForegroundColor Cyan
    
    $qaGuides = @{
        'QA_CHECKLIST.md' = 'QA Checklist - Manual Testing'
        'QA_TEAM_GUIDE.md' = 'QA Team Guide - Team Guide'
        'QA_TEST_SCRIPT.md' = 'QA Test Script - Test Script'
        'MANUAL_QA_TEST.md' = 'Manual QA Test - Manual Testing'
        'QA_TESTS_BOOKING_STATUS.md' = 'QA Tests Booking Status - Booking Status'
    }
    
    foreach ($file in $qaGuides.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "OK" } else { "MISSING" }
        Write-Host "$status $file - $($qaGuides[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
        
        if ($exists) {
            try {
                $content = Get-Content $file -TotalCount 3
                Write-Host "   Note: $($content -join ' ')...`n" -ForegroundColor Gray
            } catch {
                Write-Host "   Error reading file`n" -ForegroundColor Red
            }
        }
    }
}

function Cleanup-TestData {
    Write-Host "`n=== CLEANING TEST DATA ===`n" -ForegroundColor Yellow
    
    if (Test-Path 'CLEANUP_TEST_DATA.js') {
        Write-Host "Starting test data cleanup..." -ForegroundColor Cyan
        
        try {
            & node CLEANUP_TEST_DATA.js
            Write-Host "OK: Test data cleaned!" -ForegroundColor Green
        } catch {
            Write-Host "ERROR during cleanup: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "ERROR: CLEANUP_TEST_DATA.js not found!" -ForegroundColor Red
    }
}

function Generate-QAReport {
    Write-Host "`n=== GENERATING QA REPORT ===`n" -ForegroundColor Yellow
    
    $report = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        testFiles = @{}
        qaGuides = @{}
        summary = @{
            totalTests = 0
            availableTests = 0
            totalGuides = 0
            availableGuides = 0
        }
    }
    
    $testFiles = @{
        'QA_AUTOMATED_TEST.js' = 'Automated Tests (Puppeteer)'
        'TEST_HOMEPAGE.js' = 'Homepage Test'
        'TEST_BOOKINGS.js' = 'Bookings Test'
        'TEST_CALENDAR.js' = 'Calendar Test'
        'TEST_USERS.js' = 'Users Test'
        'TEST_SERVICE_EDITING.js' = 'Service Editing Test'
        'TEST_API.js' = 'API Test'
        'TEST_FORM_VALIDATION.js' = 'Form Validation Test'
        'TEST_BUTTONS.js' = 'Buttons and UI Test'
        'TEST_NETWORK.js' = 'Network Test'
        'TEST_LOCALSTORAGE.js' = 'LocalStorage Test'
        'TEST_AUTO_REFRESH.js' = 'Auto Refresh Test'
        'TEST_HYDRATION_FIX.js' = 'Hydration Test'
        'TEST_CALENDAR_BOOKINGS.js' = 'Calendar Bookings Test'
        'TEST_BOOKING_CREATION.js' = 'Booking Creation Test'
        'TEST_BOOKING_EDITING.js' = 'Booking Editing Test'
        'TEST_USERS_API.js' = 'Users API Test'
        'TEST_USERS_MODAL_CLOSE.js' = 'Users Modal Test'
        'TEST_API_SERVICES.js' = 'Services API Test'
    }
    
    foreach ($file in $testFiles.Keys) {
        $exists = Test-Path $file
        $report.testFiles[$file] = @{
            description = $testFiles[$file]
            exists = $exists
            size = if ($exists) { (Get-Item $file).Length } else { 0 }
        }
        $report.summary.totalTests++
        if ($exists) { $report.summary.availableTests++ }
    }
    
    $qaGuides = @{
        'QA_CHECKLIST.md' = 'QA Checklist - Manual Testing'
        'QA_TEAM_GUIDE.md' = 'QA Team Guide - Team Guide'
        'QA_TEST_SCRIPT.md' = 'QA Test Script - Test Script'
        'MANUAL_QA_TEST.md' = 'Manual QA Test - Manual Testing'
        'QA_TESTS_BOOKING_STATUS.md' = 'QA Tests Booking Status - Booking Status'
    }
    
    foreach ($file in $qaGuides.Keys) {
        $exists = Test-Path $file
        $report.qaGuides[$file] = @{
            description = $qaGuides[$file]
            exists = $exists
            size = if ($exists) { (Get-Item $file).Length } else { 0 }
        }
        $report.summary.totalGuides++
        if ($exists) { $report.summary.availableGuides++ }
    }
    
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath "qa_report.json" -Encoding UTF8
    
    Write-Host "OK: QA report generated: qa_report.json" -ForegroundColor Green
    Write-Host "Statistics:" -ForegroundColor Cyan
    Write-Host "   - Tests: $($report.summary.availableTests)/$($report.summary.totalTests)" -ForegroundColor White
    Write-Host "   - Guides: $($report.summary.availableGuides)/$($report.summary.totalGuides)" -ForegroundColor White
}

function Check-TestStatus {
    Write-Host "`n=== CHECKING TEST STATUS ===`n" -ForegroundColor Yellow
    
    Write-Host "Checking server status..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bugs" -Headers @{"x-admin-token"="admin-token"} -ErrorAction Stop
        Write-Host "OK: Server is running!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Server is not running!" -ForegroundColor Red
        Write-Host "Start it with: npm run dev" -ForegroundColor Yellow
    }
    
    Write-Host "`nTest file status:" -ForegroundColor Cyan
    $testFiles = @(
        'QA_AUTOMATED_TEST.js',
        'TEST_HOMEPAGE.js',
        'TEST_BOOKINGS.js',
        'TEST_CALENDAR.js',
        'TEST_USERS.js',
        'TEST_SERVICE_EDITING.js',
        'TEST_API.js',
        'TEST_FORM_VALIDATION.js',
        'TEST_BUTTONS.js',
        'TEST_NETWORK.js',
        'TEST_LOCALSTORAGE.js',
        'TEST_AUTO_REFRESH.js',
        'TEST_HYDRATION_FIX.js',
        'TEST_CALENDAR_BOOKINGS.js',
        'TEST_BOOKING_CREATION.js',
        'TEST_BOOKING_EDITING.js',
        'TEST_USERS_API.js',
        'TEST_USERS_MODAL_CLOSE.js',
        'TEST_API_SERVICES.js'
    )
    
    foreach ($file in $testFiles) {
        $exists = Test-Path $file
        $status = if ($exists) { "OK" } else { "MISSING" }
        Write-Host "$status $file" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
}

# Main menu
Show-MainMenu

# Show all tests
Show-AllTests

Write-Host "`nTo run automated test, use:" -ForegroundColor Yellow
Write-Host "   node QA_AUTOMATED_TEST.js" -ForegroundColor White
Write-Host "`nTo run specific test, use:" -ForegroundColor Yellow
Write-Host "   node [test_filename]" -ForegroundColor White
Write-Host "`nTo check QA guides, open:" -ForegroundColor Yellow
Write-Host "   QA_CHECKLIST.md" -ForegroundColor White

Read-Host "`nPress Enter to continue..." 
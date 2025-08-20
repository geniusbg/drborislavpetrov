# 🧪 QA Dashboard - PowerShell версия
# Виртуален QA екип - табло за управление

Write-Host "🧪 Добре дошли в QA Dashboard!" -ForegroundColor Cyan
Write-Host "💡 Изберете опция от менюто по-долу..." -ForegroundColor Yellow

function Show-MainMenu {
    Write-Host "`n🧪 === QA DASHBOARD ===" -ForegroundColor Green
    Write-Host "1. 📋 Покажи всички QA тестове" -ForegroundColor White
    Write-Host "2. 🚀 Стартирай автоматизиран тест" -ForegroundColor White
    Write-Host "3. 🔧 Стартирай конкретен тест" -ForegroundColor White
    Write-Host "4. 📊 Покажи QA ръководства" -ForegroundColor White
    Write-Host "5. 🧹 Изчисти тестови данни" -ForegroundColor White
    Write-Host "6. 📈 Генерирай QA отчет" -ForegroundColor White
    Write-Host "7. 🔍 Провери статус на тестове" -ForegroundColor White
    Write-Host "8. ❌ Излез" -ForegroundColor White
    Write-Host "========================`n" -ForegroundColor Green
}

function Show-AllTests {
    Write-Host "`n📋 === ВСИЧКИ QA ТЕСТОВЕ ===`n" -ForegroundColor Cyan
    
    $testFiles = @{
        'QA_AUTOMATED_TEST.js' = 'Автоматизирани тестове (Puppeteer)'
        'TEST_HOMEPAGE.js' = 'Тест на начална страница'
        'TEST_BOOKINGS.js' = 'Тест на резервации'
        'TEST_CALENDAR.js' = 'Тест на календар'
        'TEST_USERS.js' = 'Тест на потребители'
        'TEST_SERVICE_EDITING.js' = 'Тест на редактиране услуги'
        'TEST_API.js' = 'Тест на API endpoints'
        'TEST_FORM_VALIDATION.js' = 'Тест на валидация на форми'
        'TEST_BUTTONS.js' = 'Тест на бутони и UI'
        'TEST_NETWORK.js' = 'Тест на мрежови заявки'
        'TEST_LOCALSTORAGE.js' = 'Тест на localStorage'
        'TEST_AUTO_REFRESH.js' = 'Тест на автоматично обновяване'
        'TEST_HYDRATION_FIX.js' = 'Тест на hydration'
        'TEST_CALENDAR_BOOKINGS.js' = 'Тест на календар резервации'
        'TEST_BOOKING_CREATION.js' = 'Тест на създаване резервации'
        'TEST_BOOKING_EDITING.js' = 'Тест на редактиране резервации'
        'TEST_USERS_API.js' = 'Тест на потребители API'
        'TEST_USERS_MODAL_CLOSE.js' = 'Тест на модали потребители'
        'TEST_API_SERVICES.js' = 'Тест на услуги API'
    }
    
    Write-Host "🤖 АВТОМАТИЗИРАНИ ТЕСТОВЕ:" -ForegroundColor Yellow
    Write-Host "============================" -ForegroundColor Yellow
    foreach ($file in $testFiles.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "$status $file - $($testFiles[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
    
    $qaGuides = @{
        'QA_CHECKLIST.md' = 'QA Checklist - Ръчно тестване'
        'QA_TEAM_GUIDE.md' = 'QA Team Guide - Ръководство за екипа'
        'QA_TEST_SCRIPT.md' = 'QA Test Script - Скрипт за тестване'
        'MANUAL_QA_TEST.md' = 'Manual QA Test - Ръчно тестване'
        'QA_TESTS_BOOKING_STATUS.md' = 'QA Tests Booking Status - Статус резервации'
    }
    
    Write-Host "`n📚 QA РЪКОВОДСТВА:" -ForegroundColor Yellow
    Write-Host "==================" -ForegroundColor Yellow
    foreach ($file in $qaGuides.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "$status $file - $($qaGuides[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
}

function Start-AutomatedTest {
    Write-Host "`n🚀 === СТАРТИРАНЕ НА АВТОМАТИЗИРАН ТЕСТ ===`n" -ForegroundColor Yellow
    
    if (-not (Test-Path 'QA_AUTOMATED_TEST.js')) {
        Write-Host "❌ QA_AUTOMATED_TEST.js не е намерен!" -ForegroundColor Red
        return
    }
    
    Write-Host "🔍 Проверявам дали server-ът работи..." -ForegroundColor Cyan
    
    try {
        $base = if ($env:SITE_DOMAIN) { $env:SITE_DOMAIN } else { "http://localhost:3000" }
        Invoke-WebRequest -Uri "$base/api/admin/bugs" -Headers @{"x-admin-token"="admin-token"} -ErrorAction Stop | Out-Null
        Write-Host "✅ Server-ът работи!" -ForegroundColor Green
        
        Write-Host "🚀 Стартирам автоматизирания QA тест..." -ForegroundColor Yellow
        Write-Host "📝 Това ще отвори браузър и ще изпълни всички тестове...`n" -ForegroundColor Cyan
        
        & node QA_AUTOMATED_TEST.js
        
    } catch {
        Write-Host "❌ Server-ът не работи! Стартирайте го с: npm run dev" -ForegroundColor Red
    }
}

function Start-SpecificTest {
    Write-Host "`n🔧 === СТАРТИРАНЕ НА КОНКРЕТЕН ТЕСТ ===`n" -ForegroundColor Yellow
    
    $testFiles = @{
        'QA_AUTOMATED_TEST.js' = 'Автоматизирани тестове (Puppeteer)'
        'TEST_HOMEPAGE.js' = 'Тест на начална страница'
        'TEST_BOOKINGS.js' = 'Тест на резервации'
        'TEST_CALENDAR.js' = 'Тест на календар'
        'TEST_USERS.js' = 'Тест на потребители'
        'TEST_SERVICE_EDITING.js' = 'Тест на редактиране услуги'
        'TEST_API.js' = 'Тест на API endpoints'
        'TEST_FORM_VALIDATION.js' = 'Тест на валидация на форми'
        'TEST_BUTTONS.js' = 'Тест на бутони и UI'
        'TEST_NETWORK.js' = 'Тест на мрежови заявки'
        'TEST_LOCALSTORAGE.js' = 'Тест на localStorage'
        'TEST_AUTO_REFRESH.js' = 'Тест на автоматично обновяване'
        'TEST_HYDRATION_FIX.js' = 'Тест на hydration'
        'TEST_CALENDAR_BOOKINGS.js' = 'Тест на календар резервации'
        'TEST_BOOKING_CREATION.js' = 'Тест на създаване резервации'
        'TEST_BOOKING_EDITING.js' = 'Тест на редактиране резервации'
        'TEST_USERS_API.js' = 'Тест на потребители API'
        'TEST_USERS_MODAL_CLOSE.js' = 'Тест на модали потребители'
        'TEST_API_SERVICES.js' = 'Тест на услуги API'
    }
    
    Write-Host "Достъпни тестове:" -ForegroundColor Cyan
    $index = 1
    foreach ($file in $testFiles.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "$index. $status $file - $($testFiles[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
        $index++
    }
    
    Write-Host "`n💡 За да стартирате тест ръчно, използвайте:" -ForegroundColor Yellow
    Write-Host "   node [име_на_файла]" -ForegroundColor White
    Write-Host "   Пример: node TEST_HOMEPAGE.js" -ForegroundColor White
}

function Show-QAGuides {
    Write-Host "`n📚 === QA РЪКОВОДСТВА ===`n" -ForegroundColor Cyan
    
    $qaGuides = @{
        'QA_CHECKLIST.md' = 'QA Checklist - Ръчно тестване'
        'QA_TEAM_GUIDE.md' = 'QA Team Guide - Ръководство за екипа'
        'QA_TEST_SCRIPT.md' = 'QA Test Script - Скрипт за тестване'
        'MANUAL_QA_TEST.md' = 'Manual QA Test - Ръчно тестване'
        'QA_TESTS_BOOKING_STATUS.md' = 'QA Tests Booking Status - Статус резервации'
    }
    
    foreach ($file in $qaGuides.Keys) {
        $exists = Test-Path $file
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "$status $file - $($qaGuides[$file])" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
        
        if ($exists) {
            try {
                $content = Get-Content $file -TotalCount 3
                Write-Host "   📝 $($content -join ' ')...`n" -ForegroundColor Gray
            } catch {
                Write-Host "   ❌ Грешка при четене на файла`n" -ForegroundColor Red
            }
        }
    }
}

function Clear-TestData {
    Write-Host "`n🧹 === ИЗЧИСТВАНЕ НА ТЕСТОВИ ДАННИ ===`n" -ForegroundColor Yellow
    
    if (Test-Path 'CLEANUP_TEST_DATA.js') {
        Write-Host "🚀 Стартирам изчистване на тестови данни..." -ForegroundColor Cyan
        
        try {
            & node CLEANUP_TEST_DATA.js
            Write-Host "✅ Тестовите данни са изчистени!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Грешка при изчистване: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ CLEANUP_TEST_DATA.js не е намерен!" -ForegroundColor Red
    }
}

function New-QAReport {
    Write-Host "`n📈 === ГЕНЕРИРАНЕ НА QA ОТЧЕТ ===`n" -ForegroundColor Yellow
    
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
        'QA_AUTOMATED_TEST.js' = 'Автоматизирани тестове (Puppeteer)'
        'TEST_HOMEPAGE.js' = 'Тест на начална страница'
        'TEST_BOOKINGS.js' = 'Тест на резервации'
        'TEST_CALENDAR.js' = 'Тест на календар'
        'TEST_USERS.js' = 'Тест на потребители'
        'TEST_SERVICE_EDITING.js' = 'Тест на редактиране услуги'
        'TEST_API.js' = 'Тест на API endpoints'
        'TEST_FORM_VALIDATION.js' = 'Тест на валидация на форми'
        'TEST_BUTTONS.js' = 'Тест на бутони и UI'
        'TEST_NETWORK.js' = 'Тест на мрежови заявки'
        'TEST_LOCALSTORAGE.js' = 'Тест на localStorage'
        'TEST_AUTO_REFRESH.js' = 'Тест на автоматично обновяване'
        'TEST_HYDRATION_FIX.js' = 'Тест на hydration'
        'TEST_CALENDAR_BOOKINGS.js' = 'Тест на календар резервации'
        'TEST_BOOKING_CREATION.js' = 'Тест на създаване резервации'
        'TEST_BOOKING_EDITING.js' = 'Тест на редактиране резервации'
        'TEST_USERS_API.js' = 'Тест на потребители API'
        'TEST_USERS_MODAL_CLOSE.js' = 'Тест на модали потребители'
        'TEST_API_SERVICES.js' = 'Тест на услуги API'
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
        'QA_CHECKLIST.md' = 'QA Checklist - Ръчно тестване'
        'QA_TEAM_GUIDE.md' = 'QA Team Guide - Ръководство за екипа'
        'QA_TEST_SCRIPT.md' = 'QA Test Script - Скрипт за тестване'
        'MANUAL_QA_TEST.md' = 'Manual QA Test - Ръчно тестване'
        'QA_TESTS_BOOKING_STATUS.md' = 'QA Tests Booking Status - Статус резервации'
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
    
    Write-Host "✅ QA отчетът е генериран: qa_report.json" -ForegroundColor Green
    Write-Host "📊 Статистика:" -ForegroundColor Cyan
    Write-Host "   - Тестове: $($report.summary.availableTests)/$($report.summary.totalTests)" -ForegroundColor White
    Write-Host "   - Ръководства: $($report.summary.availableGuides)/$($report.summary.totalGuides)" -ForegroundColor White
}

function Test-QAStatus {
    Write-Host "`n🔍 === ПРОВЕРКА НА СТАТУС НА ТЕСТОВЕ ===`n" -ForegroundColor Yellow
    
    Write-Host "🔍 Проверявам server статус..." -ForegroundColor Cyan
    
    try {
        $base = if ($env:SITE_DOMAIN) { $env:SITE_DOMAIN } else { "http://localhost:3000" }
        Invoke-WebRequest -Uri "$base/api/admin/bugs" -Headers @{"x-admin-token"="admin-token"} -ErrorAction Stop | Out-Null
        Write-Host "✅ Server-ът работи!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Server-ът не работи!" -ForegroundColor Red
        Write-Host "💡 Стартирайте го с: npm run dev" -ForegroundColor Yellow
    }
    
    Write-Host "`n📋 Статус на тестови файлове:" -ForegroundColor Cyan
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
        $status = if ($exists) { "✅" } else { "❌" }
        Write-Host "$status $file" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
    }
}

# Главно меню
Show-MainMenu

# Показваме всички тестове
Show-AllTests

Write-Host "`n💡 За да стартирате автоматизиран тест, използвайте:" -ForegroundColor Yellow
Write-Host "   node QA_AUTOMATED_TEST.js" -ForegroundColor White
Write-Host "`n💡 За да стартирате конкретен тест, използвайте:" -ForegroundColor Yellow
Write-Host "   node [име_на_тест_файла]" -ForegroundColor White
Write-Host "`n💡 За да проверите QA ръководствата, отворете:" -ForegroundColor Yellow
Write-Host "   QA_CHECKLIST.md" -ForegroundColor White

Read-Host "`nНатиснете Enter за да продължите..." 
# PowerShell script to upload missing PWA files to production server
# Usage: .\upload-missing-files.ps1 [project_directory]

param(
    [string]$ProjectDir = "C:\Users\genius\Downloads\drborislavpetrov"
)

Write-Host "📤 Uploading missing PWA files to production server" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "📁 Project directory: $ProjectDir" -ForegroundColor Yellow

# Check if directory exists
if (-not (Test-Path $ProjectDir)) {
    Write-Host "❌ Project directory not found: $ProjectDir" -ForegroundColor Red
    Write-Host "💡 Usage: .\upload-missing-files.ps1 [project_directory]" -ForegroundColor Yellow
    exit 1
}

# Navigate to project directory
Set-Location $ProjectDir

# Check if public directory exists
if (-not (Test-Path "public")) {
    Write-Host "❌ public directory not found in $ProjectDir" -ForegroundColor Red
    Write-Host "💡 Make sure you're in the correct project directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found public directory" -ForegroundColor Green

# Copy manifest files
Write-Host "📝 Copying manifest files..." -ForegroundColor Yellow
Copy-Item "public\manifest.json" "." -Force
Copy-Item "public\admin-manifest.json" "." -Force

# Copy favicon files
Write-Host "🎨 Copying favicon files..." -ForegroundColor Yellow
Copy-Item "public\favicon.ico" "." -Force
Copy-Item "public\favicon-16x16.png" "." -Force
Copy-Item "public\favicon-32x32.png" "." -Force

# Copy icon files
Write-Host "🖼️ Copying icon files..." -ForegroundColor Yellow
Copy-Item "public\icon-192.png" "." -Force
Copy-Item "public\icon-512.png" "." -Force

Write-Host ""
Write-Host "✅ All PWA files copied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Copied files:" -ForegroundColor Cyan
Write-Host "- manifest.json" -ForegroundColor White
Write-Host "- admin-manifest.json" -ForegroundColor White
Write-Host "- favicon.ico" -ForegroundColor White
Write-Host "- favicon-16x16.png" -ForegroundColor White
Write-Host "- favicon-32x32.png" -ForegroundColor White
Write-Host "- icon-192.png" -ForegroundColor White
Write-Host "- icon-512.png" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload these files to your production server" -ForegroundColor White
Write-Host "2. Place them in the web root directory" -ForegroundColor White
Write-Host "3. Restart your web server (nginx/apache)" -ForegroundColor White
Write-Host "4. Clear browser cache" -ForegroundColor White
Write-Host "5. Test PWA functionality" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test URLs:" -ForegroundColor Cyan
Write-Host "- Main manifest: https://drpetrov.bg/manifest.json" -ForegroundColor White
Write-Host "- Admin manifest: https://drpetrov.bg/admin-manifest.json" -ForegroundColor White
Write-Host "- Favicon: https://drpetrov.bg/favicon.ico" -ForegroundColor White

# Fix Plans Board - Create Tables in Production Database
# Run this script in PowerShell

Write-Host "🚀 Fixing Plans Board in Production..." -ForegroundColor Green
Write-Host ""

# Step 1: Get production database URL from Vercel
Write-Host "Step 1: Get your production DATABASE_URL from Vercel Dashboard" -ForegroundColor Yellow
Write-Host "   - Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   - Select your project" -ForegroundColor White
Write-Host "   - Go to Settings → Environment Variables" -ForegroundColor White
Write-Host "   - Find DATABASE_URL and DIRECT_URL" -ForegroundColor White
Write-Host ""

$databaseUrl = Read-Host "Enter your production DATABASE_URL (or press Enter to skip and set manually)"
$directUrl = Read-Host "Enter your production DIRECT_URL (or press Enter to skip and set manually)"

if ($databaseUrl -and $directUrl) {
    Write-Host ""
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    $env:DATABASE_URL = $databaseUrl
    $env:DIRECT_URL = $directUrl
    
    Write-Host "✅ Environment variables set!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Running prisma db push..." -ForegroundColor Yellow
    Write-Host ""
    
    npx prisma db push --accept-data-loss
    
    Write-Host ""
    Write-Host "✅ Done! Tables should now exist in production." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://www.argufight.com/admin/plans" -ForegroundColor White
    Write-Host "2. Try creating a board" -ForegroundColor White
    Write-Host "3. If it works, you're all set! 🎉" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Manual setup:" -ForegroundColor Yellow
    Write-Host "1. Get DATABASE_URL and DIRECT_URL from Vercel" -ForegroundColor White
    Write-Host "2. Run these commands in PowerShell:" -ForegroundColor White
    Write-Host ""
    Write-Host '   $env:DATABASE_URL="your-database-url-here"' -ForegroundColor Cyan
    Write-Host '   $env:DIRECT_URL="your-direct-url-here"' -ForegroundColor Cyan
    Write-Host '   npx prisma db push --accept-data-loss' -ForegroundColor Cyan
    Write-Host ""
}


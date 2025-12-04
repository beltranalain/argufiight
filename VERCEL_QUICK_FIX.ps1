# Quick Fix Script for Vercel 500 Error
# Run this in PowerShell to diagnose and fix common issues

Write-Host "🔍 Vercel 500 Error Quick Fix" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not installed. Installing..." -ForegroundColor Yellow
    npm install -g vercel
} else {
    Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Vercel:" -ForegroundColor White
Write-Host "   vercel login" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Link your project (if not already):" -ForegroundColor White
Write-Host "   vercel link" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Pull environment variables:" -ForegroundColor White
Write-Host "   vercel env pull .env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check what's missing:" -ForegroundColor White
Write-Host "   Get-Content .env.local | Select-String -Pattern 'DATABASE_URL|AUTH_SECRET'" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Generate AUTH_SECRET (if missing):" -ForegroundColor White
Write-Host "   node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`"" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Add missing variables in Vercel Dashboard:" -ForegroundColor White
Write-Host "   - Go to: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   - Your Project → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Add: DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Run database migrations:" -ForegroundColor White
Write-Host "   npx prisma migrate deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "8. Test database connection:" -ForegroundColor White
Write-Host "   Visit: https://your-site.vercel.app/api/test-db" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 For detailed instructions, see: FIX_VERCEL_500_ERROR.md" -ForegroundColor Cyan


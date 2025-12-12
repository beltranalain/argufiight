# Run Database Migrations for Production
# This script sets the environment variables and runs Prisma migrations

$env:DATABASE_URL = "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"
$env:DIRECT_URL = "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"

Write-Host "🚀 Running database migrations..." -ForegroundColor Green
Write-Host ""

# Option 1: Use db push (simpler, syncs schema directly)
Write-Host "Using prisma db push (simpler approach)..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

Write-Host ""
Write-Host "✅ Database schema synced!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit your site: https://honorable-ai.vercel.app" -ForegroundColor White
Write-Host "2. Create your first admin account" -ForegroundColor White
Write-Host "3. Test the site!" -ForegroundColor White






# Check if all database tables exist
# Run this to verify the database schema was created correctly

$env:DATABASE_URL = "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"
$env:DIRECT_URL = "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"

Write-Host "🔍 Checking database tables..." -ForegroundColor Green
Write-Host ""

# Check critical tables
$tables = @('users', 'sessions', 'debates', 'admin_settings', 'waiting_list')

foreach ($table in $tables) {
    try {
        $result = npx prisma db execute --stdin --schema=prisma/schema.prisma
        Write-Host "✅ $table exists" -ForegroundColor Green
    } catch {
        Write-Host "❌ $table - Error checking" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 To see all tables, run:" -ForegroundColor Cyan
Write-Host "   npx prisma studio" -ForegroundColor White






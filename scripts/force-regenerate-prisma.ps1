# Force regenerate Prisma Client
# This script stops any processes that might be locking Prisma files and regenerates the client

Write-Host "🔄 Force regenerating Prisma Client..." -ForegroundColor Cyan
Write-Host ""

# Try to kill any Node processes that might be locking files
Write-Host "Stopping any Node processes that might be locking Prisma files..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear Prisma cache
$prismaCache = "node_modules\.prisma"
if (Test-Path $prismaCache) {
    Write-Host "Clearing Prisma cache..." -ForegroundColor Yellow
    Remove-Item -Path $prismaCache -Recurse -Force -ErrorAction SilentlyContinue
}

# Regenerate Prisma Client
Write-Host ""
Write-Host "Regenerating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Prisma Client regenerated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now restart your dev server." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Failed to regenerate Prisma Client" -ForegroundColor Red
    Write-Host "Please try manually: npx prisma generate" -ForegroundColor Yellow
}

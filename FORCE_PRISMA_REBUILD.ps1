# Force Prisma Rebuild on Vercel
# This commits the latest fixes and pushes to trigger a clean rebuild

Write-Host "🔧 Force Prisma Rebuild - Committing fixes..." -ForegroundColor Cyan
Write-Host ""

cd C:\Users\beltr\Honorable.AI

# Check status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix: Force Prisma Client regeneration - clear all caches in build"

Write-Host ""
Write-Host "🚀 Pushing to trigger Vercel rebuild..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "✅ Code pushed! Now do this in Vercel:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Click your project → Settings → General" -ForegroundColor White
Write-Host "3. Click 'Clear Build Cache'" -ForegroundColor White
Write-Host "4. Go to Deployments tab" -ForegroundColor White
Write-Host "5. Click three dots (⋯) on latest deployment → Redeploy" -ForegroundColor White
Write-Host "6. Turn OFF 'Use existing Build Cache'" -ForegroundColor Yellow
Write-Host "7. Click 'Redeploy'" -ForegroundColor White
Write-Host ""
Write-Host "Watch the build logs - you should see:" -ForegroundColor Cyan
Write-Host "  ✅ Schema is configured for PostgreSQL" -ForegroundColor Gray
Write-Host "  ✅ Cleaned Prisma cache" -ForegroundColor Gray
Write-Host "  ✅ Prisma Client regenerated successfully!" -ForegroundColor Gray


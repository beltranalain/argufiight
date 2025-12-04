# PowerShell Commands to Fix Vercel SQLite Error
# Run these commands in PowerShell

Write-Host "🔧 Fixing Vercel SQLite Error" -ForegroundColor Cyan
Write-Host ""

# Navigate to project
cd C:\Users\beltr\Honorable.AI

# Check status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix: Ensure PostgreSQL schema for production - add schema verification"

Write-Host ""
Write-Host "🚀 Pushing to trigger Vercel rebuild..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "✅ Done! Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to Vercel Dashboard → Your Project → Settings → General" -ForegroundColor White
Write-Host "2. Click 'Clear Build Cache'" -ForegroundColor White
Write-Host "3. Go to Deployments tab" -ForegroundColor White
Write-Host "4. Click 'Redeploy' on latest deployment" -ForegroundColor White
Write-Host "5. Select 'Use existing Build Cache' = OFF" -ForegroundColor White
Write-Host "6. Click 'Redeploy'" -ForegroundColor White
Write-Host ""
Write-Host "After redeploy, test:" -ForegroundColor Cyan
Write-Host "  - https://honorable-ai.com/api/test-db" -ForegroundColor Gray
Write-Host "  - https://honorable-ai.com/signup" -ForegroundColor Gray


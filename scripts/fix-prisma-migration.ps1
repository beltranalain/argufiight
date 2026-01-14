# PowerShell script to fix Prisma migration issues

Write-Host "`n=== Prisma Migration Fix Script ===" -ForegroundColor Cyan
Write-Host "`nStep 1: Checking for running Node processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    Write-Host "⚠️  Found running Node processes. Please stop your dev server first." -ForegroundColor Yellow
    Write-Host "Press any key after stopping the dev server..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "✅ No Node processes running" -ForegroundColor Green
}

Write-Host "`nStep 2: Attempting migration with shadow database reset..." -ForegroundColor Yellow
Write-Host "Running: npx prisma migrate dev --name add_campaign_payment" -ForegroundColor Gray

try {
    npx prisma migrate dev --name add_campaign_payment
    Write-Host "`n✅ Migration successful!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Migration failed. Trying alternative approach..." -ForegroundColor Red
    Write-Host "`nOption 1: Try with --skip-seed flag" -ForegroundColor Yellow
    Write-Host "  npx prisma migrate dev --name add_campaign_payment --skip-seed" -ForegroundColor Cyan
    
    Write-Host "`nOption 2: If that fails, use manual SQL migration:" -ForegroundColor Yellow
    Write-Host "  1. Run: scripts/manual-add-campaign-payment-fields.sql" -ForegroundColor Cyan
    Write-Host "  2. Then: npx prisma migrate resolve --applied add_campaign_payment" -ForegroundColor Cyan
    Write-Host "  3. Then: npx prisma generate" -ForegroundColor Cyan
}

Write-Host "`nStep 3: Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated!" -ForegroundColor Green
} catch {
    Write-Host "❌ Generation failed. Make sure no processes are using Prisma client." -ForegroundColor Red
    Write-Host "Close all terminals and try again." -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Green

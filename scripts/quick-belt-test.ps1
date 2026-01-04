# Quick Belt System Test
# Simple script to enable and verify belt system

Write-Host "`n🔧 Quick Belt System Test`n" -ForegroundColor Cyan

# 1. Check if enabled
Write-Host "1. Checking if belt system is enabled..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "ENABLE_BELT_SYSTEM=true") {
    Write-Host "   ✅ Belt system is enabled" -ForegroundColor Green
} else {
    Write-Host "   ❌ Belt system is disabled - enabling..." -ForegroundColor Yellow
    Add-Content .env "`nENABLE_BELT_SYSTEM=true"
    Write-Host "   ✅ Enabled! (Restart dev server to apply)" -ForegroundColor Green
}

# 2. Check tables
Write-Host "`n2. Checking database tables..." -ForegroundColor Yellow
npx tsx scripts/check-belt-tables.ts

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure dev server is running: npm run dev" -ForegroundColor White
Write-Host "  2. Visit admin page: http://localhost:3002/admin/belts" -ForegroundColor White
Write-Host "  3. Visit user page: http://localhost:3002/belts/room" -ForegroundColor White
Write-Host "`nNote: If you just enabled it, restart your dev server!" -ForegroundColor Yellow
Write-Host "Note: Server may be on port 3002 if 3000 is in use`n" -ForegroundColor Yellow

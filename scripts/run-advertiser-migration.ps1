# PowerShell script to run advertiser fields migration
# This script provides instructions for running the SQL migration

Write-Host "`n=== Advertiser Fields Migration ===" -ForegroundColor Cyan
Write-Host "`nThis migration adds new fields to the advertisers table:" -ForegroundColor White
Write-Host "  - contact_phone" -ForegroundColor Gray
Write-Host "  - company_size" -ForegroundColor Gray
Write-Host "  - monthly_ad_budget" -ForegroundColor Gray
Write-Host "  - marketing_goals" -ForegroundColor Gray

Write-Host "`n📋 Option 1: Run SQL in Neon Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "  1. Open Neon Dashboard: https://console.neon.tech" -ForegroundColor White
Write-Host "  2. Go to your project -> SQL Editor" -ForegroundColor White
Write-Host "  3. Copy the contents of: scripts/manual-add-advertiser-fields.sql" -ForegroundColor White
Write-Host "  4. Paste and run the SQL" -ForegroundColor White

Write-Host "`n📋 Option 2: Use psql (if you have it installed)" -ForegroundColor Yellow
Write-Host "  psql YOUR_DATABASE_URL < scripts/manual-add-advertiser-fields.sql" -ForegroundColor White

Write-Host "`n📋 Option 3: Use Prisma Studio (for manual entry)" -ForegroundColor Yellow
Write-Host "  npx prisma studio" -ForegroundColor White
Write-Host "  (Then manually add columns via SQL tab)" -ForegroundColor White

Write-Host "`n⚠️  After migration, run:" -ForegroundColor Yellow
Write-Host "  npx prisma generate" -ForegroundColor Cyan

Write-Host "`n✅ Then test the application form - all fields should save!" -ForegroundColor Green

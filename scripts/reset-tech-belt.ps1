# Reset TECH Championship Belt - Unstake it and set to ACTIVE
# This script finds the TECH Championship Belt and resets it

Write-Host "Resetting TECH Championship Belt..." -ForegroundColor Cyan
Write-Host ""

# Connect to database and reset the belt
$env:PRISMA_DATABASE_URL = $env:DATABASE_URL

Write-Host "Finding TECH Championship Belt..." -ForegroundColor Yellow

# Use npx prisma db execute to run SQL
$sql = @"
SELECT id, name, status, "is_staked", "staked_in_debate_id", "staked_in_tournament_id", "current_holder_id"
FROM belts
WHERE name LIKE '%TECH%Championship%' OR category = 'TECH'
LIMIT 1;
"@

$sqlFile = "$env:TEMP\check_tech_belt.sql"
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "Checking belt status..." -ForegroundColor Cyan
Write-Host "Run this SQL in Prisma Studio or your database client:" -ForegroundColor Yellow
Write-Host ""
Write-Host $sql -ForegroundColor Gray
Write-Host ""
Write-Host "Then run this to reset it:" -ForegroundColor Yellow
Write-Host ""
Write-Host @"
UPDATE belts
SET 
  "is_staked" = false,
  "staked_in_debate_id" = NULL,
  "staked_in_tournament_id" = NULL,
  status = 'ACTIVE'
WHERE name LIKE '%TECH%Championship%' OR category = 'TECH';
"@ -ForegroundColor Gray
Write-Host ""

Write-Host "Or use this TypeScript script:" -ForegroundColor Cyan
Write-Host "  npx tsx scripts/reset-tech-belt.ts" -ForegroundColor Yellow

# Fix Debate API 500 Errors
# This script clears caches and regenerates Prisma client

Write-Host "🔧 Fixing Debate API Errors..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

Set-Location $projectRoot

Write-Host "📁 Project directory: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Step 1: Clear Next.js cache
Write-Host "🗑️  Clearing Next.js cache (.next)..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
if ($?) {
    Write-Host "   ✅ Next.js cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .next directory not found (may not exist yet)" -ForegroundColor Yellow
}

# Step 2: Clear Prisma cache
Write-Host "🗑️  Clearing Prisma cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
if ($?) {
    Write-Host "   ✅ Prisma cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma cache not found" -ForegroundColor Yellow
}

# Step 3: Regenerate Prisma client
Write-Host ""
Write-Host "🔄 Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma client regenerated" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to regenerate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your dev server: npm run dev" -ForegroundColor White
Write-Host "   2. Check server console for detailed error messages" -ForegroundColor White
Write-Host ""



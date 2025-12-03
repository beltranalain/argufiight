# Fix Prisma Cache Issue
# This script clears caches and regenerates the Prisma client to fix the debate_tags table error

Write-Host "🔧 Fixing Prisma Cache Issue" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if dev server is running
Write-Host "Step 1: Checking for running Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Found $($nodeProcesses.Count) Node.js process(es) running" -ForegroundColor Yellow
    Write-Host "   Please stop the dev server (Ctrl+C in the terminal running 'npm run dev')" -ForegroundColor Yellow
    Write-Host "   Or press Enter to continue anyway (processes may be locked)..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "✅ No Node.js processes found" -ForegroundColor Green
}

# Step 2: Clear Next.js cache
Write-Host ""
Write-Host "Step 2: Clearing Next.js cache (.next)..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared .next cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next directory doesn't exist" -ForegroundColor Gray
}

# Step 3: Clear Prisma client cache
Write-Host ""
Write-Host "Step 3: Clearing Prisma client cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared Prisma client cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Prisma cache doesn't exist" -ForegroundColor Gray
}

# Step 4: Clear other caches
Write-Host ""
Write-Host "Step 4: Clearing other caches..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared node_modules cache" -ForegroundColor Green
}

# Step 5: Regenerate Prisma client (must be done before verifying tables)
Write-Host ""
Write-Host "Step 5: Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma client regenerated" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma generation failed" -ForegroundColor Red
    Write-Host "   Make sure the dev server is stopped!" -ForegroundColor Yellow
    exit 1
}

# Step 6: Verify tables exist
Write-Host ""
Write-Host "Step 6: Verifying database tables..." -ForegroundColor Yellow
node scripts/ensure-tags-tables.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tables verified" -ForegroundColor Green
} else {
    Write-Host "❌ Table verification failed" -ForegroundColor Red
    exit 1
}

# Step 7: Summary
Write-Host ""
Write-Host "✅ Fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the dev server: npm run dev" -ForegroundColor White
Write-Host "2. Test the endpoint: http://localhost:3000/api/debates" -ForegroundColor White
Write-Host "3. Check the terminal for any errors" -ForegroundColor White
Write-Host ""


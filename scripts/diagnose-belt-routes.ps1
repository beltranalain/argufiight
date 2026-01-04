# Diagnose Belt Routes
# Checks if routes are accessible and why they might be failing

param(
    [string]$Port = "3002"
)

Write-Host "`nBelt Route Diagnostics`n" -ForegroundColor Cyan
Write-Host "Testing on port: $Port`n" -ForegroundColor Yellow

$baseUrl = "http://localhost:$Port"

# Check if server is running
Write-Host "1. Checking if server is running..." -ForegroundColor Yellow
try {
    $test = Invoke-WebRequest -Uri $baseUrl -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Server is running`n" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Server is NOT running on port $Port" -ForegroundColor Red
    Write-Host "   Start it with: npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Test routes
Write-Host "2. Testing API routes...`n" -ForegroundColor Yellow

# Test /api/belts
Write-Host "   Testing GET /api/belts..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Route exists! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host '   [OK] Route exists! Status 401 Unauthorized - need to login' -ForegroundColor Green
    } elseif ($statusCode -eq 403) {
        Write-Host '   [OK] Route exists! Status 403 Forbidden - check ENABLE_BELT_SYSTEM=true' -ForegroundColor Yellow
    } elseif ($statusCode -eq 404) {
        Write-Host '   [FAIL] 404 Not Found - Route not recognized by Next.js' -ForegroundColor Red
        Write-Host '      -> Try restarting the dev server' -ForegroundColor Yellow
        Write-Host '      -> Check if file exists: app/api/belts/route.ts' -ForegroundColor Yellow
    } else {
        Write-Host "   [ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test /api/belts/room
Write-Host "`n   Testing GET /api/belts/room..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/room" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Route exists! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host '   [OK] Route exists! Status 401 Unauthorized - need to login' -ForegroundColor Green
    } elseif ($statusCode -eq 403) {
        Write-Host '   [OK] Route exists! Status 403 Forbidden - check ENABLE_BELT_SYSTEM=true' -ForegroundColor Yellow
    } elseif ($statusCode -eq 404) {
        Write-Host '   [FAIL] 404 Not Found - Route not recognized by Next.js' -ForegroundColor Red
        Write-Host '      -> Try restarting the dev server' -ForegroundColor Yellow
        Write-Host '      -> Check if file exists: app/api/belts/room/route.ts' -ForegroundColor Yellow
    } else {
        Write-Host "   [ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check files exist
Write-Host "`n3. Checking route files...`n" -ForegroundColor Yellow
$files = @(
    "app/api/belts/route.ts",
    "app/api/belts/room/route.ts",
    "app/api/belts/[id]/route.ts",
    "app/api/belts/challenge/route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] $file" -ForegroundColor Red
    }
}

# Check env variable
Write-Host "`n4. Checking environment variable...`n" -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "ENABLE_BELT_SYSTEM=true") {
    Write-Host "   [OK] ENABLE_BELT_SYSTEM=true is set" -ForegroundColor Green
    Write-Host "   [WARN] Remember: Restart dev server after changing .env!" -ForegroundColor Yellow
} else {
    Write-Host "   [FAIL] ENABLE_BELT_SYSTEM is not set to 'true'" -ForegroundColor Red
    Write-Host "   Fix: Add-Content .env 'ENABLE_BELT_SYSTEM=true'" -ForegroundColor Yellow
}

Write-Host "`n[OK] Diagnostics complete!`n" -ForegroundColor Green
Write-Host "If routes return 404:" -ForegroundColor Cyan
Write-Host '  1. Stop the dev server (Ctrl+C)' -ForegroundColor White
Write-Host '  2. Start it again: npm run dev' -ForegroundColor White
Write-Host '  3. Wait for Ready message' -ForegroundColor White
Write-Host '  4. Test again: .\scripts\diagnose-belt-routes.ps1' -ForegroundColor White
Write-Host ''

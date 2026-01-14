# PowerShell script to test payment success route
# Run this in PowerShell: .\test-payment-route.ps1

$baseUrl = "http://localhost:3000"
$testUrl = "$baseUrl/advertiser/campaigns/payment/success?session_id=cs_test_123&campaign_id=test-campaign-id"

Write-Host "Testing payment success route..." -ForegroundColor Cyan
Write-Host "URL: $testUrl" -ForegroundColor Yellow
Write-Host ""

# Test if server is running
Write-Host "1. Checking if Next.js dev server is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Server is running (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Server is NOT running. Start it with: npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Testing payment success route..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "   ✓ Route exists (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "   Response headers:" -ForegroundColor Yellow
    $response.Headers | Format-Table
} catch {
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 308) {
        $location = $_.Exception.Response.Headers.Location
        Write-Host "   ✓ Route exists and redirects to: $location" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ✗ Route returns 404 - Page not found" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "   1. Restart the dev server: npm run dev" -ForegroundColor White
        Write-Host "   2. Clear Next.js cache: Remove .next folder" -ForegroundColor White
        Write-Host "   3. Check if page.tsx exists in correct location" -ForegroundColor White
    } else {
        Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Checking file structure..." -ForegroundColor Cyan
$pagePath = "app\advertiser\campaigns\payment\success\page.tsx"
if (Test-Path $pagePath) {
    Write-Host "   ✓ Page file exists: $pagePath" -ForegroundColor Green
    $fileInfo = Get-Item $pagePath
    Write-Host "   File size: $($fileInfo.Length) bytes" -ForegroundColor Gray
    Write-Host "   Last modified: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "   ✗ Page file NOT found: $pagePath" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Checking for .next build cache..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Write-Host "   ✓ .next folder exists" -ForegroundColor Green
    Write-Host "   To clear cache, run: Remove-Item -Recurse -Force .next" -ForegroundColor Yellow
} else {
    Write-Host "   ⚠ .next folder not found (might need to build first)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan

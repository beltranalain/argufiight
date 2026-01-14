# PowerShell script to test the complete payment flow
# Run this after making a payment to verify the success page works

$baseUrl = "http://localhost:3000"

Write-Host "=== Payment Success Page Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if page file exists
Write-Host "1. Checking page file..." -ForegroundColor Cyan
$pagePath = "app\advertiser\campaigns\payment\success\page.tsx"
if (Test-Path $pagePath) {
    Write-Host "   ✓ Page file exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Page file NOT found" -ForegroundColor Red
    exit 1
}

# Test 2: Check if server is running
Write-Host ""
Write-Host "2. Checking if server is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Server is running (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Server is NOT running. Start it with: npm run dev" -ForegroundColor Red
    exit 1
}

# Test 3: Test with a fake session ID (should redirect to dashboard with error)
Write-Host ""
Write-Host "3. Testing payment success route with fake session..." -ForegroundColor Cyan
$testUrl = "$baseUrl/advertiser/campaigns/payment/success?session_id=cs_test_fake&campaign_id=test-id"
try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ Route exists (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 308) {
        $location = $_.Exception.Response.Headers.Location
        Write-Host "   ✓ Route exists and redirects to: $location" -ForegroundColor Green
        
        if ($location -like "*error=*") {
            Write-Host "   ℹ This is expected - fake session ID causes error" -ForegroundColor Yellow
        }
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ✗ Route returns 404 - Page not found" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   1. Restart dev server: npm run dev" -ForegroundColor White
        Write-Host "   2. Clear cache: Remove-Item -Recurse -Force .next" -ForegroundColor White
        Write-Host "   3. Check server logs for errors" -ForegroundColor White
    } else {
        Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you are still getting 404 on real payments:" -ForegroundColor Yellow
Write-Host "1. Make sure the dev server is restarted after changes" -ForegroundColor White
Write-Host "2. Clear Next.js cache: Remove-Item -Recurse -Force .next" -ForegroundColor White
Write-Host "3. Check the actual URL Stripe redirects to in browser console" -ForegroundColor White
Write-Host "4. Verify the success_url in Stripe checkout session matches the route" -ForegroundColor White

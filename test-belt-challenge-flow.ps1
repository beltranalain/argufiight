# Test Belt Challenge Flow
# This script tests the complete belt challenge flow

$baseUrl = "http://localhost:3002"

Write-Host "=== Testing Belt Challenge Flow ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify belts endpoint
Write-Host "Step 1: Verifying belts are available..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Belts endpoint accessible" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "[OK] Endpoint exists (auth required)" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status: $statusCode" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Manual Testing Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open browser and go to: http://localhost:3002" -ForegroundColor White
Write-Host "2. Log in as a user (not the belt holder)" -ForegroundColor White
Write-Host "3. Navigate to the dashboard" -ForegroundColor White
Write-Host "4. Find a belt with a current holder" -ForegroundColor White
Write-Host "5. Click the 'Challenge' button" -ForegroundColor White
Write-Host ""
Write-Host "Expected behavior:" -ForegroundColor Yellow
Write-Host "- Modal should open immediately" -ForegroundColor White
Write-Host "- Modal title should say 'Challenge for [Belt Name]'" -ForegroundColor White
Write-Host "- Should show opponent username and belt name" -ForegroundColor White
Write-Host "- Should have a 'Debate Topic' input field" -ForegroundColor White
Write-Host ""
Write-Host "If modal doesn't open:" -ForegroundColor Red
Write-Host "- Check browser console (F12) for errors" -ForegroundColor White
Write-Host "- Check if button click is registered" -ForegroundColor White
Write-Host "- Verify React DevTools shows state changes" -ForegroundColor White
Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

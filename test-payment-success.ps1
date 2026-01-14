# PowerShell script to test payment success page
# This script will loop and test the payment success endpoint

$baseUrl = "https://www.argufight.com"
$testSessionId = "cs_test_a1E4027pkYTXwszHpK23Kcmz72ksQRu2ZzgUsDbtJQvyHd5nYA18tFJcj6"
$testCampaignId = "212331f3-6870-45b1-b62e-a7ad35c58a7a"

$successUrl = "$baseUrl/advertiser/campaigns/payment/success?session_id=$testSessionId&campaign_id=$testCampaignId"

Write-Host "=== Payment Success Page Test ===" -ForegroundColor Cyan
Write-Host "Testing URL: $successUrl" -ForegroundColor Yellow
Write-Host ""

$iteration = 1
$maxIterations = 10

while ($iteration -le $maxIterations) {
    Write-Host "[$iteration/$maxIterations] Testing payment success page..." -ForegroundColor Green
    
    try {
        $response = Invoke-WebRequest -Uri $successUrl -Method GET -MaximumRedirection 0 -ErrorAction SilentlyContinue -UseBasicParsing
        
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Yellow" })
        Write-Host "  Final URL: $($response.BaseResponse.ResponseUri)" -ForegroundColor Cyan
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ Page loaded successfully!" -ForegroundColor Green
        } elseif ($response.StatusCode -ge 300 -and $response.StatusCode -lt 400) {
            Write-Host "  → Redirected (expected)" -ForegroundColor Yellow
            $location = $response.Headers.Location
            if ($location) {
                Write-Host "  Redirect Location: $location" -ForegroundColor Cyan
            }
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        Write-Host "  ✗ Error: $statusCode - $statusDescription" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "  → 404 Not Found - Page route may not be registered" -ForegroundColor Red
        }
        elseif ($statusCode -eq 500) {
            Write-Host "  → 500 Server Error - Check server logs" -ForegroundColor Red
        }
        elseif ($statusCode -ge 300 -and $statusCode -lt 400) {
            Write-Host "  → Redirect (status $statusCode)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    
    if ($iteration -lt $maxIterations) {
        Start-Sleep -Seconds 2
    }
    
    $iteration++
}

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To test with different parameters, modify:" -ForegroundColor Yellow
Write-Host "  - `$testSessionId" -ForegroundColor Gray
Write-Host "  - `$testCampaignId" -ForegroundColor Gray
Write-Host "  - `$maxIterations (currently $maxIterations)" -ForegroundColor Gray

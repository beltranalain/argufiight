# Simple Belt API Test
# Tests if the belt challenge endpoint is working

$baseUrl = "http://localhost:3002"

Write-Host "=== Belt Challenge API Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if belts endpoint works
Write-Host "Test 1: Fetching belts..." -ForegroundColor Yellow
try {
    $beltsResponse = Invoke-RestMethod -Uri "$baseUrl/api/belts" -Method GET
    $beltCount = $beltsResponse.belts.Count
    Write-Host "[OK] Found $beltCount belts" -ForegroundColor Green
    
    if ($beltCount -gt 0) {
        $firstBelt = $beltsResponse.belts[0]
        Write-Host "  First belt: $($firstBelt.name) (ID: $($firstBelt.id))" -ForegroundColor Gray
        
        if ($firstBelt.currentHolder) {
            Write-Host "  Holder: $($firstBelt.currentHolder.username)" -ForegroundColor Gray
        } else {
            Write-Host "  Holder: None (Vacant)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[ERROR] Failed to fetch belts: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check challenge endpoint (will fail without auth, but shows if endpoint exists)
Write-Host "Test 2: Testing challenge endpoint..." -ForegroundColor Yellow

$testPayload = @{
    beltId = "test-belt-id"
    topic = "Test topic"
    description = "Test description"
    category = "TECH"
    challengerPosition = "FOR"
    totalRounds = 5
    roundDuration = 86400000
    speedMode = $false
    allowCopyPaste = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testPayload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "[OK] Endpoint is accessible" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401) {
        Write-Host "[OK] Endpoint exists (401 = authentication required, which is expected)" -ForegroundColor Green
    } elseif ($statusCode -eq 400) {
        Write-Host "[OK] Endpoint exists (400 = bad request, but endpoint is working)" -ForegroundColor Green
        
        # Try to get error message
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $errorObj = $responseBody | ConvertFrom-Json
            Write-Host "  Error message: $($errorObj.error)" -ForegroundColor Yellow
        } catch {
            Write-Host "  Could not parse error response" -ForegroundColor Gray
        }
    } else {
        Write-Host "[ERROR] Unexpected error: $statusCode" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure you're logged in via browser" -ForegroundColor White
Write-Host "2. Try clicking the Challenge button on a belt in the UI" -ForegroundColor White
Write-Host "3. Check browser console (F12) for any JavaScript errors" -ForegroundColor White

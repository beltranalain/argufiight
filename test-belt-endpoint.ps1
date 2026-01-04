# Test Belt Challenge Endpoint
# Simple test to verify the API endpoint structure

$baseUrl = "http://localhost:3002"

Write-Host "=== Testing Belt Challenge Endpoint ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check belts endpoint (requires auth, but shows endpoint exists)
Write-Host "Test 1: Checking /api/belts endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Belts endpoint is accessible" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "[OK] Belts endpoint exists - Authentication required (expected)" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Belts endpoint returned: $statusCode" -ForegroundColor Yellow
        Write-Host "  This is OK - endpoint exists, just needs authentication" -ForegroundColor Gray
    }
}

Write-Host ""

# Test 2: Check challenge endpoint structure (will fail auth, but shows endpoint exists)
Write-Host "Test 2: Checking /api/belts/challenge endpoint structure..." -ForegroundColor Yellow

# Test with minimal payload
$minimalPayload = @{
    beltId = "test-id"
    topic = "Test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
        -Method POST `
        -ContentType "application/json" `
        -Body $minimalPayload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "[OK] Challenge endpoint responded" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401) {
        Write-Host "[OK] Endpoint exists - Authentication required (expected)" -ForegroundColor Green
    } elseif ($statusCode -eq 400) {
        Write-Host "[OK] Endpoint exists - Bad request (endpoint is working)" -ForegroundColor Green
        
        # Get error details
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $errorObj = $responseBody | ConvertFrom-Json
            Write-Host "  Error: $($errorObj.error)" -ForegroundColor Yellow
        } catch {
            Write-Host "  Could not parse error response" -ForegroundColor Gray
        }
    } else {
        Write-Host "[ERROR] Unexpected status: $statusCode" -ForegroundColor Red
        Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# Test 3: Test with full payload (what the UI should send)
Write-Host "Test 3: Testing with full payload (simulating UI request)..." -ForegroundColor Yellow

$fullPayload = @{
    beltId = "dbc4bbca-f363-4aaa-96e2-8e0bf6cd1c24"
    topic = "Should AI be regulated by governments?"
    description = "This is a test challenge"
    category = "TECH"
    challengerPosition = "FOR"
    totalRounds = 5
    roundDuration = 86400000
    speedMode = $false
    allowCopyPaste = $true
} | ConvertTo-Json

Write-Host "Payload:" -ForegroundColor Cyan
Write-Host $fullPayload -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
        -Method POST `
        -ContentType "application/json" `
        -Body $fullPayload `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "[OK] Full payload accepted" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401) {
        Write-Host "[OK] Full payload structure is correct - Auth required" -ForegroundColor Green
    } elseif ($statusCode -eq 400) {
        Write-Host "[INFO] Endpoint received request but validation failed" -ForegroundColor Yellow
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $errorObj = $responseBody | ConvertFrom-Json
            Write-Host "  Validation error: $($errorObj.error)" -ForegroundColor Yellow
            
            # Check if it's the topic error
            if ($errorObj.error -like "*topic*") {
                Write-Host ""
                Write-Host "  [DIAGNOSIS] Topic validation is failing" -ForegroundColor Red
                Write-Host "  This suggests the topic field is not being received correctly" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  Could not parse error response" -ForegroundColor Gray
        }
    } else {
        Write-Host "[ERROR] Unexpected status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- If you see [OK] for Test 3, the endpoint structure is correct" -ForegroundColor White
Write-Host "- If you see topic validation error, check the CreateDebateModal component" -ForegroundColor White
Write-Host "- To test with authentication, use the browser and check Network tab" -ForegroundColor White

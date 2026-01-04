# Test Belt Challenge API
# This script tests the POST /api/belts/challenge endpoint

$baseUrl = "http://localhost:3000"

Write-Host "=== Testing Belt Challenge API ===" -ForegroundColor Cyan

# Step 1: Get session cookie (required for all requests)
Write-Host "`n1. Getting session token..." -ForegroundColor Yellow
Write-Host "   NOTE: You need to provide a valid session cookie." -ForegroundColor Yellow
Write-Host "   Get it from browser DevTools > Application > Cookies > sessionToken" -ForegroundColor Yellow
Write-Host "   Or run: Get-Content .env | Select-String SESSION" -ForegroundColor Gray
$sessionToken = Read-Host "   Enter sessionToken"

if ([string]::IsNullOrWhiteSpace($sessionToken)) {
    Write-Host "   ERROR: Session token is required!" -ForegroundColor Red
    exit 1
}

Write-Host "   Using session token: $($sessionToken.Substring(0, [Math]::Min(20, $sessionToken.Length)))..." -ForegroundColor Green

# Step 2: Get a list of belts to find a belt ID
Write-Host "`n2. Fetching all belts..." -ForegroundColor Yellow
try {
    $beltsResponse = Invoke-RestMethod -Uri "$baseUrl/api/belts" `
        -Method GET `
        -ContentType "application/json" `
        -Headers @{"Cookie" = "sessionToken=$sessionToken"}
    
    if ($beltsResponse.belts -and $beltsResponse.belts.Count -gt 0) {
        $firstBelt = $beltsResponse.belts[0]
        $beltId = $firstBelt.id
        Write-Host "   Found belt: $($firstBelt.name) (ID: $beltId)" -ForegroundColor Green
        
        if ($firstBelt.currentHolder) {
            Write-Host "   Current Holder: $($firstBelt.currentHolder.username) (ID: $($firstBelt.currentHolder.id))" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: Belt has no current holder!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ERROR: No belts found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: Failed to fetch belts" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# Step 3: Test challenge creation
Write-Host "`n3. Testing challenge creation..." -ForegroundColor Yellow

$challengeData = @{
    beltId = $beltId
    topic = "Test Challenge Topic: Is AI Art Real Art?"
    description = "This is a test challenge created via PowerShell script"
    category = "GENERAL"
    challengerPosition = "FOR"
    totalRounds = 5
    roundDuration = 86400000
    speedMode = $false
    allowCopyPaste = $true
} | ConvertTo-Json

Write-Host "   Request body:" -ForegroundColor Gray
Write-Host "   $challengeData" -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($sessionToken) {
        $headers["Cookie"] = "sessionToken=$sessionToken"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
        -Method POST `
        -Headers $headers `
        -Body $challengeData `
        -ErrorAction Stop
    
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Green
    $responseBody = $response.Content | ConvertFrom-Json
    $responseBody | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
    
} catch {
    Write-Host "   ERROR: Challenge creation failed" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response Body:" -ForegroundColor Red
        Write-Host "   $responseBody" -ForegroundColor Red
    } else {
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan

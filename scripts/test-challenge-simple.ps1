# Simple test script that gets session token from database
# Usage: .\scripts\test-challenge-simple.ps1 <email>

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$baseUrl = "http://localhost:3000"

Write-Host "=== Simple Belt Challenge Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get session token from database
Write-Host "1. Getting session token from database for: $Email" -ForegroundColor Yellow
try {
    $sessionOutput = npx tsx scripts/get-session-from-db.ts $Email 2>&1
    $sessionToken = $null
    
    # Extract token from output (look for the token line)
    foreach ($line in $sessionOutput) {
        if ($line -match '^\s*\$sessionToken = "([^"]+)"') {
            $sessionToken = $matches[1]
            break
        }
        # Also try to find the token directly (64 char hex string)
        if ($line -match '^[a-f0-9]{64}$') {
            $sessionToken = $line.Trim()
        }
    }
    
    if (-not $sessionToken) {
        # Try to get it from the raw output - look for a 64 character hex string
        $sessionOutputString = $sessionOutput -join [Environment]::NewLine
        if ($sessionOutputString -match '([a-f0-9]{64})') {
            $sessionToken = $matches[1]
        }
    }
    
    if (-not $sessionToken) {
        Write-Host "   ERROR: Could not extract session token from output" -ForegroundColor Red
        Write-Host "   Output was:" -ForegroundColor Red
        $sessionOutput | Write-Host
        exit 1
    }
    
    Write-Host "   ✓ Found session token: $($sessionToken.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to get session token" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get belts
Write-Host ""
Write-Host "2. Fetching belts..." -ForegroundColor Yellow
try {
    $belts = (Invoke-RestMethod -Uri "$baseUrl/api/belts" `
        -Headers @{"Cookie" = "sessionToken=$sessionToken"}).belts
    
    if (-not $belts -or $belts.Count -eq 0) {
        Write-Host "   ERROR: No belts found" -ForegroundColor Red
        exit 1
    }
    
    $beltId = $belts[0].id
    $beltName = $belts[0].name
    Write-Host "   ✓ Found belt: $beltName (ID: $beltId)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to fetch belts" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create challenge
Write-Host ""
Write-Host "3. Creating challenge..." -ForegroundColor Yellow
$body = @{
    beltId = $beltId
    topic = "Test Challenge: Is AI Art Real Art?"
    description = "PowerShell test challenge"
    category = "GENERAL"
    challengerPosition = "FOR"
    totalRounds = 5
    roundDuration = 86400000
    speedMode = $false
    allowCopyPaste = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Cookie" = "sessionToken=$sessionToken"
        } `
        -Body $body
    
    Write-Host "   ✓ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Response:" -ForegroundColor Green
    ($response.Content | ConvertFrom-Json) | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "   ✗ ERROR: Challenge creation failed" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

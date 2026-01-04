# Direct test using session JWT
# Usage: .\scripts\test-challenge-direct.ps1 <email>

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$baseUrl = "http://localhost:3000"

Write-Host "=== Direct Belt Challenge Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get session token from database
Write-Host "1. Getting session token from database for: $Email" -ForegroundColor Yellow
try {
    $sessionOutput = npx tsx scripts/get-session-from-db.ts $Email 2>&1
    $sessionToken = $null
    
    # Extract token from output - look for 64 char hex string
    $sessionOutputString = $sessionOutput -join [Environment]::NewLine
    if ($sessionOutputString -match '([a-f0-9]{64})') {
        $sessionToken = $matches[1]
    }
    
    if (-not $sessionToken) {
        Write-Host "   ERROR: Could not extract session token" -ForegroundColor Red
        $sessionOutput | Write-Host
        exit 1
    }
    
    Write-Host "   Found session token: $($sessionToken.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to get session token" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create JWT from session token
Write-Host ""
Write-Host "2. Creating session JWT..." -ForegroundColor Yellow
try {
    $jwtOutput = npx tsx scripts/create-session-jwt.ts $sessionToken 2>&1
    $sessionJWT = $null
    
    # Extract JWT from output (look for JWT pattern - starts with eyJ)
    $jwtOutputString = $jwtOutput -join [Environment]::NewLine
    if ($jwtOutputString -match '(eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)') {
        $sessionJWT = $matches[1]
    }
    
    if (-not $sessionJWT) {
        Write-Host "   ERROR: Could not extract JWT" -ForegroundColor Red
        $jwtOutput | Write-Host
        exit 1
    }
    
    Write-Host "   Created JWT: $($sessionJWT.Substring(0, 30))..." -ForegroundColor Green
    
    # Verify JWT can be decoded (tests AUTH_SECRET)
    Write-Host ""
    Write-Host "   Verifying JWT..." -ForegroundColor Yellow
    $verifyOutput = npx tsx scripts/verify-jwt.ts $sessionJWT 2>&1
    if ($verifyOutput -match 'JWT is valid') {
        Write-Host "   JWT verified successfully" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: JWT verification failed - AUTH_SECRET might not match!" -ForegroundColor Yellow
        Write-Host "   The JWT was created but might not work with the server" -ForegroundColor Yellow
    }
    
    # Save JWT for debugging
    Write-Host ""
    Write-Host "   Full JWT saved to variable `$sessionJWT" -ForegroundColor Gray
    Write-Host "   You can test it manually with:" -ForegroundColor Gray
    Write-Host "   Invoke-RestMethod -Uri 'http://localhost:3000/api/profile' -Headers @{'Cookie'='session=$sessionJWT'}" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: Failed to create JWT" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get belts
Write-Host ""
Write-Host "3. Fetching belts..." -ForegroundColor Yellow
try {
    $belts = (Invoke-RestMethod -Uri "$baseUrl/api/belts" `
        -Headers @{"Cookie" = "session=$sessionJWT"}).belts
    
    if (-not $belts -or $belts.Count -eq 0) {
        Write-Host "   ERROR: No belts found" -ForegroundColor Red
        exit 1
    }
    
    $beltId = $belts[0].id
    $beltName = $belts[0].name
    Write-Host "   Found belt: $beltName (ID: $beltId)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to fetch belts" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Create challenge
Write-Host ""
Write-Host "4. Creating challenge..." -ForegroundColor Yellow
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
            "Cookie" = "session=$sessionJWT"
        } `
        -Body $body
    
    Write-Host "   SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Response:" -ForegroundColor Green
    ($response.Content | ConvertFrom-Json) | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "   ERROR: Challenge creation failed" -ForegroundColor Red
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

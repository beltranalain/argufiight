# Get JWT and test it immediately
# Usage: .\scripts\get-and-test-jwt.ps1 <email>

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$baseUrl = "http://localhost:3000"

Write-Host "=== Get JWT and Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get session token
Write-Host "1. Getting session token..." -ForegroundColor Yellow
$sessionOutput = npx tsx scripts/get-session-from-db.ts $Email 2>&1
$sessionToken = $null

$sessionOutputString = $sessionOutput -join [Environment]::NewLine
if ($sessionOutputString -match '([a-f0-9]{64})') {
    $sessionToken = $matches[1]
}

if (-not $sessionToken) {
    Write-Host "   ERROR: Could not extract session token" -ForegroundColor Red
    exit 1
}

Write-Host "   Found token: $($sessionToken.Substring(0, 20))..." -ForegroundColor Green

# Step 2: Create JWT
Write-Host ""
Write-Host "2. Creating JWT..." -ForegroundColor Yellow
$jwtOutput = npx tsx scripts/create-session-jwt.ts $sessionToken 2>&1
$sessionJWT = $null

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

# Step 3: Test cookie reception first
Write-Host ""
Write-Host "3. Testing if server receives cookie..." -ForegroundColor Yellow
try {
    $cookieTest = Invoke-RestMethod -Uri "$baseUrl/api/test-cookie" `
        -Headers @{"Cookie" = "session=$sessionJWT"} `
        -ErrorAction Stop
    
    Write-Host "   Cookie Header: $($cookieTest.cookieHeader.Substring(0, [Math]::Min(50, $cookieTest.cookieHeader.Length)))..." -ForegroundColor Gray
    Write-Host "   Session Cookie from cookies(): $($cookieTest.sessionCookieFromCookies)" -ForegroundColor $(if ($cookieTest.sessionCookieFromCookies -ne 'NOT FOUND') { 'Green' } else { 'Red' })
    Write-Host "   Message: $($cookieTest.message)" -ForegroundColor $(if ($cookieTest.sessionCookieFromCookies -ne 'NOT FOUND') { 'Green' } else { 'Yellow' })
    
    if ($cookieTest.sessionCookieFromCookies -eq 'NOT FOUND') {
        Write-Host ""
        Write-Host "   ⚠️  WARNING: Server is NOT receiving the cookie!" -ForegroundColor Red
        Write-Host "   This is likely a Next.js cookies() issue with PowerShell requests" -ForegroundColor Yellow
        Write-Host "   Try testing from the browser instead, or check server middleware" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ERROR: Could not test cookie reception" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test with /api/profile
Write-Host ""
Write-Host "4. Testing JWT with /api/profile..." -ForegroundColor Yellow
Write-Host "   (Check your SERVER CONSOLE for logs)" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/profile" `
        -Headers @{"Cookie" = "session=$sessionJWT"} `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS! Status: 200" -ForegroundColor Green
    Write-Host "   User: $($response.user.username)" -ForegroundColor Green
    Write-Host "   Email: $($response.user.email)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   JWT is working! You can now use it for belt challenges." -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   ❌ FAILED! Status: $statusCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Check your SERVER CONSOLE for these messages:" -ForegroundColor Yellow
    Write-Host "   - [verifySessionWithDb] No session JWT cookie found" -ForegroundColor White
    Write-Host "   - [verifySessionWithDb] Decoded sessionToken: ..." -ForegroundColor White
    Write-Host "   - [verifySessionWithDb] Session not found..." -ForegroundColor White
    Write-Host ""
    Write-Host "   The JWT is:" -ForegroundColor Gray
    Write-Host "   $sessionJWT" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan

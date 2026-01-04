# Test different cookie formats
# This helps debug cookie sending issues

param(
    [Parameter(Mandatory=$true)]
    [string]$JWT
)

$baseUrl = "http://localhost:3000"

Write-Host "=== Testing Cookie Formats ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Simple Cookie header
Write-Host "Test 1: Cookie: session=$JWT" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/profile" `
        -Headers @{"Cookie" = "session=$JWT"} `
        -ErrorAction Stop
    Write-Host "   SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   FAILED! Status: $statusCode" -ForegroundColor Red
    if ($statusCode -eq 401) {
        Write-Host "   Server didn't accept the cookie" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 2: Using WebSession (PowerShell's cookie jar)
Write-Host "Test 2: Using WebSession cookie jar" -ForegroundColor Yellow
try {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $cookie = New-Object System.Net.Cookie("session", $JWT, "/", "localhost")
    $session.Cookies.Add($cookie)
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/profile" `
        -WebSession $session `
        -ErrorAction Stop
    Write-Host "   SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   FAILED! Status: $statusCode" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check what the server sees
Write-Host "Test 3: Testing with verbose output" -ForegroundColor Yellow
Write-Host "   Check your server logs for: [verifySessionWithDb]" -ForegroundColor Gray
Write-Host "   You should see either:" -ForegroundColor Gray
Write-Host "     - 'No session JWT cookie found' (cookie not received)" -ForegroundColor Gray
Write-Host "     - 'Decoded sessionToken: ...' (cookie received and decoded)" -ForegroundColor Gray

# Debug session cookie issue
# This will help identify if the cookie is being received

param(
    [Parameter(Mandatory=$true)]
    [string]$JWT
)

$baseUrl = "http://localhost:3000"

Write-Host "=== Session Cookie Debug Test ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "JWT (first 50 chars): $($JWT.Substring(0, [Math]::Min(50, $JWT.Length)))..." -ForegroundColor Gray
Write-Host ""

# Test with /api/profile (simpler endpoint)
Write-Host "Testing /api/profile endpoint..." -ForegroundColor Yellow
Write-Host "   Check your SERVER LOGS for:" -ForegroundColor Cyan
Write-Host "   - [verifySessionWithDb] No session JWT cookie found" -ForegroundColor White
Write-Host "   - [verifySessionWithDb] Decoded sessionToken: ..." -ForegroundColor White
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/profile" `
        -Headers @{"Cookie" = "session=$JWT"} `
        -ErrorAction Stop
    
    Write-Host "   ✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    $profile = ($response.Content | ConvertFrom-Json)
    Write-Host "   User: $($profile.user.username)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   ❌ FAILED! Status: $statusCode" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "   The server returned 401 Unauthorized." -ForegroundColor Yellow
        Write-Host "   Check your SERVER CONSOLE for one of these messages:" -ForegroundColor Yellow
        Write-Host "   1. '[verifySessionWithDb] No session JWT cookie found'" -ForegroundColor White
        Write-Host "      → Cookie not being received by server" -ForegroundColor Gray
        Write-Host "   2. '[verifySessionWithDb] Decoded sessionToken: ...'" -ForegroundColor White
        Write-Host "      → Cookie received, but session lookup failed" -ForegroundColor Gray
        Write-Host "   3. '[verifySessionWithDb] Session not found in database'" -ForegroundColor White
        Write-Host "      → Session expired or invalid" -ForegroundColor Gray
    }
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 TIP: Look at your dev server console output" -ForegroundColor Yellow
Write-Host "   The server logs will show exactly what's happening" -ForegroundColor Yellow

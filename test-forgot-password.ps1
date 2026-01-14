# Test Forgot Password API
# Usage: .\test-forgot-password.ps1 <email>

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

Write-Host "`n=== Testing Forgot Password API ===" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor White
Write-Host ""

try {
    $body = @{
        email = $Email
    } | ConvertTo-Json

    Write-Host "Sending request to /api/auth/forgot-password..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json | Write-Host
    
    Write-Host "`nCheck your email inbox (and spam folder) for the reset link." -ForegroundColor Yellow
    Write-Host "`nAlso check your server console for:" -ForegroundColor Yellow
    Write-Host "   - [Password Reset Email] Email sent successfully" -ForegroundColor White
    Write-Host "   - [FORGOT-PASSWORD] Reset link: ..." -ForegroundColor White
    
} catch {
    Write-Host "`nERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:" -ForegroundColor Red
        $_.ErrorDetails.Message | Write-Host
    }
    
    Write-Host "`nFull Error:" -ForegroundColor Red
    $_.Exception | Format-List | Write-Host
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan

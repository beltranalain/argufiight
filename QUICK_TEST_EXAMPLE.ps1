# Quick Test Example - Copy and modify this script with your credentials

# Set your credentials here
$email = "beltranalain@yahoo.com"
$password = "YOUR_PASSWORD_HERE"

# Create a session
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "Testing login..." -ForegroundColor Cyan

# Login
try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.user.username)" -ForegroundColor Green
    Write-Host "  Email: $($loginResponse.user.email)" -ForegroundColor Green
    Write-Host "  User ID: $($loginResponse.user.id)" -ForegroundColor Green
    
    # Test creator profile
    Write-Host "`nTesting creator profile..." -ForegroundColor Cyan
    $profile = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/creator/profile" `
        -WebSession $session
    
    Write-Host "Profile retrieved!" -ForegroundColor Green
    Write-Host "  Is Creator: $($profile.user.isCreator)" -ForegroundColor Green
    Write-Host "  Creator Status: $($profile.user.creatorStatus)" -ForegroundColor Green
    
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    # Try to get error details
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        $errorJson = $responseBody | ConvertFrom-Json
        Write-Host "  Error: $($errorJson.error)" -ForegroundColor Red
    } catch {
        Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    }
}

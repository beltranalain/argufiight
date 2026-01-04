# Quick test command for belt challenge API
# Usage: .\scripts\quick-test-challenge.ps1

$baseUrl = "http://localhost:3000"

# Get session token from user (required first)
Write-Host "Getting session token..." -ForegroundColor Yellow
Write-Host "Get it from: Browser DevTools > Application > Cookies > sessionToken" -ForegroundColor Gray
$sessionToken = Read-Host "Enter your sessionToken"

if ([string]::IsNullOrWhiteSpace($sessionToken)) {
    Write-Host "ERROR: Session token required" -ForegroundColor Red
    exit
}

# Get first belt ID
Write-Host "`nFetching belts..." -ForegroundColor Yellow
try {
    $belts = (Invoke-RestMethod -Uri "$baseUrl/api/belts" `
        -Method GET `
        -Headers @{"Cookie" = "sessionToken=$sessionToken"}).belts
    
    if (-not $belts -or $belts.Count -eq 0) {
        Write-Host "No belts found!" -ForegroundColor Red
        exit
    }
    
    $beltId = $belts[0].id
    $beltName = $belts[0].name
    Write-Host "Testing with belt: $beltName (ID: $beltId)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to fetch belts" -ForegroundColor Red
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test challenge creation
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

Write-Host "`nSending challenge request..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Cookie" = "sessionToken=$sessionToken"
        } `
        -Body $body
    
    Write-Host "SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    ($response.Content | ConvertFrom-Json) | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

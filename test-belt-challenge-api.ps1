# Test Belt Challenge API
# This script tests the belt challenge creation endpoint

Write-Host "Testing Belt Challenge API..." -ForegroundColor Cyan
Write-Host ""

# Base URL
$baseUrl = "http://localhost:3002"

# Step 1: Get session cookie from browser (you need to be logged in)
Write-Host "Step 1: Checking for session..." -ForegroundColor Yellow
$sessionCookie = $null

# Try to get cookie from Chrome (adjust path if needed)
$chromeCookiesPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cookies"
if (Test-Path $chromeCookiesPath) {
    Write-Host "Note: You need to be logged in via browser first" -ForegroundColor Yellow
} else {
    Write-Host "Note: Please log in via browser first, then run this script" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Fetching available belts..." -ForegroundColor Yellow

try {
    $beltsResponse = Invoke-RestMethod -Uri "$baseUrl/api/belts" -Method GET -ErrorAction Stop
    $belts = $beltsResponse.belts
    
    if ($belts -and $belts.Count -gt 0) {
        Write-Host "Found $($belts.Count) belts:" -ForegroundColor Green
        foreach ($belt in $belts) {
            Write-Host "  - $($belt.name) (ID: $($belt.id), Holder: $($belt.currentHolder.username))" -ForegroundColor White
        }
        
        # Find a belt with a holder (not the current user)
        $testBelt = $belts | Where-Object { $null -ne $_.currentHolder } | Select-Object -First 1
        
        if ($testBelt) {
            Write-Host ""
            Write-Host "Step 3: Testing challenge creation for belt: $($testBelt.name)" -ForegroundColor Yellow
            Write-Host "  Belt ID: $($testBelt.id)" -ForegroundColor Gray
            Write-Host "  Holder: $($testBelt.currentHolder.username)" -ForegroundColor Gray
            Write-Host ""
            
            # Prepare request body
            $requestBody = @{
                beltId = $testBelt.id
                topic = "Test Challenge: Should AI be regulated?"
                description = "This is a test challenge created via PowerShell script"
                category = "TECH"
                challengerPosition = "FOR"
                totalRounds = 5
                roundDuration = 86400000
                speedMode = $false
                allowCopyPaste = $true
            } | ConvertTo-Json
            
            Write-Host "Request body:" -ForegroundColor Cyan
            Write-Host $requestBody -ForegroundColor Gray
            Write-Host ""
            
            Write-Host "Attempting to create challenge..." -ForegroundColor Yellow
            Write-Host "Note: This will fail with 401 if you're not logged in via browser" -ForegroundColor Yellow
            Write-Host ""
            
            try {
                # Use Invoke-WebRequest to get better error details
                $response = Invoke-WebRequest -Uri "$baseUrl/api/belts/challenge" `
                    -Method POST `
                    -ContentType "application/json" `
                    -Body $requestBody `
                    -UseBasicParsing `
                    -ErrorAction Stop
                
                Write-Host "SUCCESS!" -ForegroundColor Green
                Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
                Write-Host "Response:" -ForegroundColor Cyan
                $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
                
            } catch {
                $statusCode = $_.Exception.Response.StatusCode.value__
                $statusDescription = $_.Exception.Response.StatusDescription
                
                Write-Host "ERROR!" -ForegroundColor Red
                Write-Host "Status: $statusCode $statusDescription" -ForegroundColor Red
                
                if ($_.Exception.Response) {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $responseBody = $reader.ReadToEnd()
                    Write-Host "Response body:" -ForegroundColor Yellow
                    Write-Host $responseBody -ForegroundColor Gray
                }
                
                if ($statusCode -eq 401) {
                    Write-Host ""
                    Write-Host "Authentication failed. Please:" -ForegroundColor Yellow
                    Write-Host "1. Log in via your browser at http://localhost:3002" -ForegroundColor Yellow
                    Write-Host "2. Then run this script again" -ForegroundColor Yellow
                } elseif ($statusCode -eq 400) {
                    Write-Host ""
                    Write-Host "Bad request. Check the response body above for details." -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "No belts with holders found to test challenge creation." -ForegroundColor Yellow
        }
    } else {
        Write-Host "No belts found." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR fetching belts:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan

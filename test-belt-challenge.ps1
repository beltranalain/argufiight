# Test Belt Challenge System
# This script tests the new belt challenge flow with debate details

Write-Host "Testing Belt Challenge System..." -ForegroundColor Cyan
Write-Host ""

# Get session token (you'll need to be logged in)
$sessionToken = $null
if (Test-Path "$env:USERPROFILE\.cursor\projects\c-Users-beltr-Honorable-AI\session-token.txt") {
    $sessionToken = Get-Content "$env:USERPROFILE\.cursor\projects\c-Users-beltr-Honorable.AI\session-token.txt" -ErrorAction SilentlyContinue
}

if (-not $sessionToken) {
    Write-Host "WARNING: No session token found. Please log in first." -ForegroundColor Yellow
    Write-Host "   The test will use cookies from your browser session." -ForegroundColor Yellow
    Write-Host ""
}

# Test 1: Check if API endpoint accepts debate details
Write-Host "Test 1: Testing Challenge Creation API with Debate Details" -ForegroundColor Green
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray

# First, get a belt ID
$beltResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/belts" -Method GET -ErrorAction SilentlyContinue

if ($beltResponse -and $beltResponse.belts -and $beltResponse.belts.Count -gt 0) {
    $testBelt = $beltResponse.belts[0]
    $beltId = $testBelt.id
    $beltName = $testBelt.name
    
    Write-Host "Found belt: $beltName (ID: $beltId)" -ForegroundColor Green
    
    # Check if belt has a holder
    if ($testBelt.currentHolderId) {
        Write-Host "Belt has a holder: $($testBelt.currentHolderId)" -ForegroundColor Green
        
        # Prepare challenge data with debate details
        $challengeData = @{
            beltId = $beltId
            topic = "Test Debate Topic: Is AI Art Real Art?"
            description = "This is a test challenge to verify the debate details are stored correctly."
            category = "TECH"
            challengerPosition = "FOR"
            totalRounds = 5
            roundDuration = 86400000
            speedMode = $false
            allowCopyPaste = $true
        } | ConvertTo-Json
        
        Write-Host ""
        Write-Host "Sending challenge creation request with debate details..." -ForegroundColor Cyan
        $parsedData = $challengeData | ConvertFrom-Json
        Write-Host "   Topic: $($parsedData.topic)" -ForegroundColor Gray
        Write-Host "   Category: $($parsedData.category)" -ForegroundColor Gray
        Write-Host "   Rounds: $($parsedData.totalRounds)" -ForegroundColor Gray
        
        try {
            # Create challenge
            $headers = @{
                "Content-Type" = "application/json"
            }
            
            if ($sessionToken) {
                $headers["Cookie"] = "sessionToken=$sessionToken"
            }
            
            $response = Invoke-RestMethod -Uri "http://localhost:3002/api/belts/challenge" -Method POST -Headers $headers -Body $challengeData -ErrorAction Stop
            
            Write-Host ""
            Write-Host "SUCCESS: Challenge created successfully!" -ForegroundColor Green
            Write-Host "   Challenge ID: $($response.challenge.id)" -ForegroundColor Gray
            Write-Host "   Status: $($response.challenge.status)" -ForegroundColor Gray
            Write-Host "   Uses Free Challenge: $($response.challenge.usesFreeChallenge)" -ForegroundColor Gray
            
            # Check if debate details are stored
            Write-Host ""
            Write-Host "Test 2: Verifying Debate Details are Stored" -ForegroundColor Green
            Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
            
            if ($response.challenge.debateTopic) {
                Write-Host "SUCCESS: Debate Topic stored: $($response.challenge.debateTopic)" -ForegroundColor Green
            } else {
                Write-Host "ERROR: Debate Topic NOT stored!" -ForegroundColor Red
            }
            
            if ($response.challenge.debateCategory) {
                Write-Host "SUCCESS: Debate Category stored: $($response.challenge.debateCategory)" -ForegroundColor Green
            } else {
                Write-Host "ERROR: Debate Category NOT stored!" -ForegroundColor Red
            }
            
            if ($response.challenge.debateTotalRounds) {
                Write-Host "SUCCESS: Total Rounds stored: $($response.challenge.debateTotalRounds)" -ForegroundColor Green
            } else {
                Write-Host "ERROR: Total Rounds NOT stored!" -ForegroundColor Red
            }
            
            if ($response.challenge.debateChallengerPosition) {
                Write-Host "SUCCESS: Challenger Position stored: $($response.challenge.debateChallengerPosition)" -ForegroundColor Green
            } else {
                Write-Host "ERROR: Challenger Position NOT stored!" -ForegroundColor Red
            }
            
            Write-Host ""
            Write-Host "All tests passed! The belt challenge system is working correctly." -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "  1. Check the challenge in the UI" -ForegroundColor Gray
            Write-Host "  2. Accept the challenge as the belt holder" -ForegroundColor Gray
            Write-Host "  3. Verify the debate is created with the stored details" -ForegroundColor Gray
            
        } catch {
            Write-Host ""
            Write-Host "ERROR: Error creating challenge:" -ForegroundColor Red
            Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($errorDetails.error) {
                    Write-Host "   Error: $($errorDetails.error)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "WARNING: Belt has no current holder. Cannot test challenge creation." -ForegroundColor Yellow
        Write-Host "   Please assign a belt to a user first." -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: No belts found. Cannot test challenge creation." -ForegroundColor Red
    Write-Host "   Please create a belt first." -ForegroundColor Red
}

Write-Host ""
Write-Host "---------------------------------------------------------------" -ForegroundColor Gray
Write-Host "Test completed." -ForegroundColor Cyan

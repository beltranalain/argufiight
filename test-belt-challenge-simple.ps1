# Simple test - requires you to be logged in via browser
# Just checks if the API endpoint accepts debate details

$beltId = Read-Host "Enter a belt ID to test with (or press Enter to find one automatically)"

if ([string]::IsNullOrWhiteSpace($beltId)) {
    Write-Host "Fetching belts..." -ForegroundColor Cyan
    try {
        $belts = Invoke-RestMethod -Uri "http://localhost:3002/api/belts" -Method GET -ErrorAction Stop
        if ($belts.belts -and $belts.belts.Count -gt 0) {
            $belt = $belts.belts[0]
            $beltId = $belt.id
            Write-Host "Using belt: $($belt.name) (ID: $beltId)" -ForegroundColor Green
        } else {
            Write-Host "No belts found. Please create a belt first." -ForegroundColor Red
            exit
        }
    } catch {
        Write-Host "ERROR: Could not fetch belts. Make sure you're logged in via browser." -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "Testing challenge creation with debate details..." -ForegroundColor Cyan

$body = @{
    beltId = $beltId
    topic = "Test: Is AI Art Real Art?"
    description = "Test description"
    category = "TECH"
    challengerPosition = "FOR"
    totalRounds = 5
    roundDuration = 86400000
    speedMode = $false
    allowCopyPaste = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/belts/challenge" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -ErrorAction Stop
    
    Write-Host ""
    Write-Host "SUCCESS! Challenge created:" -ForegroundColor Green
    Write-Host "  ID: $($response.challenge.id)" -ForegroundColor Gray
    Write-Host "  Topic: $($response.challenge.debateTopic)" -ForegroundColor Gray
    Write-Host "  Category: $($response.challenge.debateCategory)" -ForegroundColor Gray
    Write-Host "  Rounds: $($response.challenge.debateTotalRounds)" -ForegroundColor Gray
    Write-Host "  Position: $($response.challenge.debateChallengerPosition)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "All debate details stored correctly!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($error.error) {
            Write-Host "  Details: $($error.error)" -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "Make sure you're logged in via your browser at http://localhost:3002" -ForegroundColor Yellow
}

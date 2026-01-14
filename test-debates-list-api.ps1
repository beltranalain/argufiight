$baseUrl = "http://localhost:3000"
$userId = "cec34454-8ca4-416e-9715-0aebee4c7731"

Write-Host "`n=== Testing Debates List API ===" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/debates?userId=$userId&limit=10" -Method GET -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    $debates = $data.debates
    
    Write-Host "Found $($debates.Count) debates`n" -ForegroundColor Green
    
    $targetDebate = $debates | Where-Object { $_.topic -like "*AI good or bad*" } | Select-Object -First 1
    
    if ($targetDebate) {
        Write-Host "=== Target Debate ===" -ForegroundColor Cyan
        Write-Host "Status: $($targetDebate.status)" -ForegroundColor Yellow
        Write-Host "Verdict Reached: $($targetDebate.verdictReached)" -ForegroundColor $(if ($targetDebate.verdictReached) { "Green" } else { "Red" })
        Write-Host "Has No Statements: $($targetDebate.hasNoStatements)" -ForegroundColor $(if ($targetDebate.hasNoStatements) { "Green" } else { "Red" })
        Write-Host "Statement Count: $($targetDebate.statements.Count)" -ForegroundColor Cyan
        
        Write-Host "`nChecking if fields exist:" -ForegroundColor Cyan
        Write-Host "  verdictReached exists: $($targetDebate.PSObject.Properties.Name -contains 'verdictReached')" -ForegroundColor $(if ($targetDebate.PSObject.Properties.Name -contains 'verdictReached') { "Green" } else { "Red" })
        Write-Host "  hasNoStatements exists: $($targetDebate.PSObject.Properties.Name -contains 'hasNoStatements')" -ForegroundColor $(if ($targetDebate.PSObject.Properties.Name -contains 'hasNoStatements') { "Green" } else { "Red" })
    } else {
        Write-Host "Target debate not found. Showing first debate:" -ForegroundColor Yellow
        $first = $debates[0]
        Write-Host "  Topic: $($first.topic)" -ForegroundColor Gray
        Write-Host "  Status: $($first.status)" -ForegroundColor Gray
        Write-Host "  Has verdictReached: $($first.PSObject.Properties.Name -contains 'verdictReached')" -ForegroundColor Gray
        Write-Host "  Has hasNoStatements: $($first.PSObject.Properties.Name -contains 'hasNoStatements')" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

$baseUrl = "http://localhost:3000"
$debateId = "151cc66a-8c0c-4e68-a8f8-97894e0fc63c"

Write-Host "`n=== Testing Debate API ===" -ForegroundColor Cyan
Write-Host "Debate ID: $debateId`n" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/debates/$debateId" -Method GET -UseBasicParsing
    $debate = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: $($debate.status)" -ForegroundColor Green
    Write-Host "Verdict Reached: $($debate.verdictReached)" -ForegroundColor $(if ($debate.verdictReached) { "Green" } else { "Red" })
    Write-Host "Has No Statements: $($debate.hasNoStatements)" -ForegroundColor $(if ($debate.hasNoStatements) { "Green" } else { "Red" })
    Write-Host "Statement Count: $($debate.statements.Count)" -ForegroundColor Cyan
    Write-Host "Verdict Date: $($debate.verdictDate)" -ForegroundColor Cyan
    
    Write-Host "`n=== Full Debate Object Keys ===" -ForegroundColor Cyan
    $debate.PSObject.Properties.Name | Sort-Object | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Gray
    }
    
    Write-Host "`n=== Checking for hasNoStatements ===" -ForegroundColor Cyan
    if ($debate.PSObject.Properties.Name -contains "hasNoStatements") {
        Write-Host "✓ hasNoStatements field EXISTS" -ForegroundColor Green
        Write-Host "  Value: $($debate.hasNoStatements)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ hasNoStatements field MISSING" -ForegroundColor Red
    }
    
    Write-Host "`n=== Checking for verdictReached ===" -ForegroundColor Cyan
    if ($debate.PSObject.Properties.Name -contains "verdictReached") {
        Write-Host "✓ verdictReached field EXISTS" -ForegroundColor Green
        Write-Host "  Value: $($debate.verdictReached)" -ForegroundColor Yellow
    } else {
        Write-Host "✗ verdictReached field MISSING" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

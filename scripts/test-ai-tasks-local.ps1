# Test AI Tasks locally
# This simulates what cron-job.org will do

$baseUrl = "http://localhost:3000"

Write-Host "=== Testing AI Tasks Locally ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Auto-accept challenges
Write-Host "1. Testing AI Auto-Accept..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cron/ai-auto-accept" -Method GET
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   AI Users Checked: $($response.aiUsersChecked)" -ForegroundColor Gray
    Write-Host "   Challenges Accepted: $($response.accepted)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Generate AI responses
Write-Host "2. Testing AI Response Generation..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cron/ai-generate-responses" -Method GET
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   AI Users Checked: $($response.aiUsersChecked)" -ForegroundColor Gray
    Write-Host "   Responses Generated: $($response.responses)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Combined AI tasks
Write-Host "3. Testing Combined AI Tasks..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cron/ai-tasks" -Method GET
    Write-Host "   ✅ Success!" -ForegroundColor Green
    Write-Host "   Auto-Accept: $($response.results.autoAccept.accepted) accepted" -ForegroundColor Gray
    Write-Host "   Responses: $($response.results.responses.generated) generated" -ForegroundColor Gray
    Write-Host "   Belt Tasks: $($response.results.beltTasks.inactiveBeltsChecked) inactive belts checked" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To test with cron-job.org on localhost:" -ForegroundColor Yellow
Write-Host "   1. Install ngrok: https://ngrok.com/download" -ForegroundColor Gray
Write-Host "   2. Run: ngrok http 3000" -ForegroundColor Gray
Write-Host "   3. Use the ngrok URL in cron-job.org (e.g., https://abc123.ngrok.io/api/cron/ai-tasks)" -ForegroundColor Gray

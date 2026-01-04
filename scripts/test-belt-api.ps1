# Simple Belt API Test Script
# Tests API endpoints (requires server to be running)

param(
    [string]$BaseUrl = "http://localhost:3002"
)

Write-Host "`n🧪 Testing Belt API Endpoints`n" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Yellow

# Check if server is running
Write-Host "Checking if server is running..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri $BaseUrl -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Server is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is NOT running!" -ForegroundColor Red
    Write-Host "Please start the dev server first: npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Test endpoints (will fail without auth, but shows if routes exist)
Write-Host "Testing API endpoints...`n" -ForegroundColor Yellow

# Test 1: List belts
Write-Host "1. Testing GET /api/belts..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/belts" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Route exists! (Response: $($response | ConvertTo-Json -Compress))" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Route exists! (401 Unauthorized - expected, need to login)" -ForegroundColor Green
    } elseif ($statusCode -eq 403) {
        Write-Host "   ✅ Route exists! (403 Forbidden - belt system disabled or not admin)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 2: Belt room
Write-Host "`n2. Testing GET /api/belts/room..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/belts/room" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Route exists!" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Route exists! (401 Unauthorized - expected, need to login)" -ForegroundColor Green
    } elseif ($statusCode -eq 403) {
        Write-Host "   ✅ Route exists! (403 Forbidden - belt system disabled)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ API route testing complete!`n" -ForegroundColor Green
Write-Host "Note: 401/403 errors are expected if you're not logged in." -ForegroundColor Yellow
Write-Host "To test with authentication, login in browser and copy your session cookie.`n" -ForegroundColor Yellow

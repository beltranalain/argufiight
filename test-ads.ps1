# Quick Advertising System Test
# Run this script to test the advertising system locally

Write-Host "🧪 Testing Advertising System..." -ForegroundColor Cyan
Write-Host ""

# 1. Check if server is running
Write-Host "1. Checking dev server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Server is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running!" -ForegroundColor Red
    Write-Host "   Run 'npm run dev' in another terminal first" -ForegroundColor Yellow
    exit 1
}

# 2. Test ad selection API
Write-Host "`n2. Testing ad selection API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ads/select?placement=PROFILE_BANNER" -Method GET -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    if ($data.ad) {
        Write-Host "   ✅ Ad selection working - Found ad: $($data.ad.id)" -ForegroundColor Green
        Write-Host "      Banner URL: $($data.ad.bannerUrl)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Ad selection working but no ads available" -ForegroundColor Yellow
        Write-Host "      (This is normal if no ads are created yet)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Ad selection API failed: $_" -ForegroundColor Red
}

# 3. Test admin advertisements endpoint (will fail without auth, but tests route exists)
Write-Host "`n3. Testing admin routes..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/advertisements" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Admin route accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Admin route exists (401 Unauthorized is expected)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Admin route test: $_" -ForegroundColor Yellow
    }
}

# 4. Summary
Write-Host "`n" + ("="*50) -ForegroundColor Cyan
Write-Host "✅ Basic connectivity tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps to test the full system:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/admin/advertisements" -ForegroundColor White
Write-Host "2. Login as admin" -ForegroundColor White
Write-Host "3. Create a Direct Ad in the 'Direct Ads' tab" -ForegroundColor White
Write-Host "4. Visit a profile page to see the ad display" -ForegroundColor White
Write-Host ""
Write-Host "For detailed testing guide, see: TESTING_ADVERTISING_SYSTEM.md" -ForegroundColor Gray
Write-Host ""

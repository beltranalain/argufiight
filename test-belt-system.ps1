# Belt System Testing Script
# Run this script to test the belt system functionality

$baseUrl = "http://localhost:3002"
# IMPORTANT: Get the 'session' cookie value from your browser:
# 1. Open browser DevTools (F12)
# 2. Go to Application tab > Cookies > http://localhost:3002
# 3. Find the 'session' cookie and copy its VALUE (it's a JWT)
# 4. Paste it below
$sessionCookie = "" # Paste the 'session' cookie value here (the JWT, not sessionToken)

Write-Host "`n🧪 Belt System Testing Script`n" -ForegroundColor Cyan

# Function to make authenticated API calls
function Invoke-AuthenticatedRequest {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($sessionCookie) {
        $headers["Cookie"] = "session=$sessionCookie"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        return $response
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

# Test 1: Get all belts
Write-Host "`n1️⃣ Testing: Get All Belts" -ForegroundColor Yellow
$belts = Invoke-AuthenticatedRequest -Method "GET" -Url "$baseUrl/api/belts"
if ($belts) {
    Write-Host "✅ Found $($belts.belts.Count) belts" -ForegroundColor Green
    if ($belts.belts.Count -gt 0) {
        $firstBelt = $belts.belts[0]
        Write-Host "   First belt: $($firstBelt.name) (ID: $($firstBelt.id))" -ForegroundColor White
        $script:testBeltId = $firstBelt.id
    }
} else {
    Write-Host "⚠️  No belts found or error occurred" -ForegroundColor Yellow
}

# Test 2: Get user's belt room
Write-Host "`n2️⃣ Testing: Get User Belt Room" -ForegroundColor Yellow
$beltRoom = Invoke-AuthenticatedRequest -Method "GET" -Url "$baseUrl/api/belts/room"
if ($beltRoom) {
    Write-Host "✅ Belt room retrieved" -ForegroundColor Green
    Write-Host "   Current belts: $($beltRoom.currentBelts.Count)" -ForegroundColor White
    Write-Host "   History entries: $($beltRoom.history.Count)" -ForegroundColor White
} else {
    Write-Host "⚠️  Could not retrieve belt room" -ForegroundColor Yellow
}

# Test 3: Get belt details (if we have a belt ID)
if ($script:testBeltId) {
    Write-Host "`n3️⃣ Testing: Get Belt Details" -ForegroundColor Yellow
    $beltDetails = Invoke-AuthenticatedRequest -Method "GET" -Url "$baseUrl/api/belts/$($script:testBeltId)"
    if ($beltDetails) {
        Write-Host "✅ Belt details retrieved" -ForegroundColor Green
        Write-Host "   Name: $($beltDetails.belt.name)" -ForegroundColor White
        Write-Host "   Status: $($beltDetails.belt.status)" -ForegroundColor White
        Write-Host "   Type: $($beltDetails.belt.type)" -ForegroundColor White
        Write-Host "   Coin Value: $($beltDetails.belt.coinValue)" -ForegroundColor White
        Write-Host "   Current Holder: $($beltDetails.belt.currentHolder.username)" -ForegroundColor White
    }
}

# Test 4: Check coin balance (via user profile or notifications)
Write-Host "`n4️⃣ Testing: Check User Profile (for coins)" -ForegroundColor Yellow
$profile = Invoke-AuthenticatedRequest -Method "GET" -Url "$baseUrl/api/profile/me"
if ($profile) {
    Write-Host "✅ Profile retrieved" -ForegroundColor Green
    if ($profile.coins -ne $null) {
        Write-Host "   Coins: $($profile.coins)" -ForegroundColor White
    } else {
        Write-Host "   ⚠️  Coins field not found in profile" -ForegroundColor Yellow
    }
}

# Test 5: Test creating a challenge (commented out - requires valid belt and user)
Write-Host "`n5️⃣ Testing: Create Belt Challenge (SKIPPED - requires valid belt ID)" -ForegroundColor Yellow
Write-Host "   To test manually, use:" -ForegroundColor White
Write-Host "   POST $baseUrl/api/belts/challenge" -ForegroundColor Gray
Write-Host "   Body: { `"beltId`": `"<belt-id>`" }" -ForegroundColor Gray

# Test 6: Test admin endpoints (if admin)
Write-Host "`n6️⃣ Testing: Admin Belt Settings" -ForegroundColor Yellow
$settings = Invoke-AuthenticatedRequest -Method "GET" -Url "$baseUrl/api/admin/belts/settings"
if ($settings) {
    Write-Host "✅ Belt settings retrieved" -ForegroundColor Green
    Write-Host "   Found $($settings.settings.Count) belt type settings" -ForegroundColor White
} else {
    Write-Host "⚠️  Could not retrieve settings (may not be admin)" -ForegroundColor Yellow
}

# Test 7: Test inactive belts endpoint
Write-Host "`n7️⃣ Testing: Get Inactive Belts" -ForegroundColor Yellow
$inactive = Invoke-AuthenticatedRequest -Method "GET" -Url "$baseUrl/api/admin/belts/inactive"
if ($inactive) {
    Write-Host "✅ Inactive belts retrieved" -ForegroundColor Green
    Write-Host "   Found $($inactive.belts.Count) inactive belts" -ForegroundColor White
} else {
    Write-Host "⚠️  Could not retrieve inactive belts (may not be admin)" -ForegroundColor Yellow
}

# Test 8: Test cron endpoint (belt tasks)
Write-Host "`n8️⃣ Testing: Belt Tasks Cron Endpoint" -ForegroundColor Yellow
$cronSecret = $env:CRON_SECRET
if ($cronSecret) {
    $headers = @{
        "Authorization" = "Bearer $cronSecret"
        "Content-Type" = "application/json"
    }
    try {
        $cronResult = Invoke-RestMethod -Uri "$baseUrl/api/cron/belt-tasks" -Method "POST" -Headers $headers
        Write-Host "✅ Cron endpoint working" -ForegroundColor Green
        Write-Host "   Inactive belts checked: $($cronResult.results.inactiveBeltsChecked)" -ForegroundColor White
        Write-Host "   Expired challenges cleaned: $($cronResult.results.expiredChallengesCleaned)" -ForegroundColor White
    } catch {
        Write-Host "⚠️  Cron endpoint test failed (may need CRON_SECRET env var)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  CRON_SECRET not set, skipping cron test" -ForegroundColor Yellow
}

Write-Host "`n✅ Testing Complete!`n" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Get your session cookie from browser:" -ForegroundColor White
Write-Host "      Open DevTools (F12) > Application > Cookies > http://localhost:3002" -ForegroundColor Gray
Write-Host "      Find session cookie and copy its VALUE (it's a JWT)" -ForegroundColor Gray
Write-Host "   2. Update sessionCookie variable at top of script with the JWT value" -ForegroundColor White
Write-Host "   3. Run the script again: .\test-belt-system.ps1" -ForegroundColor White
Write-Host "   4. Test creating a challenge via UI or API" -ForegroundColor White
Write-Host "   5. Test accepting a challenge" -ForegroundColor White
Write-Host "   6. Complete a debate to test belt transfer" -ForegroundColor White
Write-Host ""

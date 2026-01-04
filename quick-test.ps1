# Quick test with your session token
$session = "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uVG9rZW4iOiI0NjMzMjU4ZjkwNjg0NzA5OTU3YTE4ZTc5YmFlZWI3MjI2MDhjZTQwZWQyMzJjNzdlYzUxOWEwOWExZjkxNDBkIiwiaWF0IjoxNzY3NDIwNDg2LCJleHAiOjE3NjgwMjUyODZ9.Y_zIHmP-u_BYt1V8QK6nFFsDH3blV0FNNhUPVI21ADI"

Write-Host "`n🧪 Testing Belt System API...`n" -ForegroundColor Cyan
Write-Host "⚠️  Note: Make sure ENABLE_BELT_SYSTEM=true in your .env file!`n" -ForegroundColor Yellow

# Create a session object for cookies
$sessionObj = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sessionObj.Cookies.Add((New-Object System.Net.Cookie("session", $session, "/", "localhost")))

# Test 1: Get all belts
Write-Host "1. Getting all belts..." -ForegroundColor Yellow
try {
    $belts = Invoke-RestMethod -Uri "http://localhost:3002/api/belts" -Method GET -WebSession $sessionObj
    Write-Host "✅ Success! Found $($belts.belts.Count) belts" -ForegroundColor Green
    if ($belts.belts.Count -gt 0) {
        Write-Host "   First belt: $($belts.belts[0].name) (ID: $($belts.belts[0].id))" -ForegroundColor White
        $script:testBeltId = $belts.belts[0].id
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

# Test 2: Get belt room
Write-Host "`n2. Getting belt room..." -ForegroundColor Yellow
try {
    $beltRoom = Invoke-RestMethod -Uri "http://localhost:3002/api/belts/room" -Method GET -WebSession $sessionObj
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Current belts: $($beltRoom.currentBelts.Count)" -ForegroundColor White
    Write-Host "   History entries: $($beltRoom.history.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get user profile (for coins)
Write-Host "`n3. Getting user profile (coins)..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "http://localhost:3002/api/profile" -Method GET -WebSession $sessionObj
    Write-Host "✅ Success!" -ForegroundColor Green
    # Profile response is { user: { ... } }
    if ($profile.user.coins -ne $null) {
        Write-Host "   Coins: $($profile.user.coins)" -ForegroundColor White
    } elseif ($profile.coins -ne $null) {
        Write-Host "   Coins: $($profile.coins)" -ForegroundColor White
    } else {
        Write-Host "   ⚠️  Coins field not found" -ForegroundColor Yellow
        Write-Host "   Response keys: $($profile.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        if ($profile.user) {
            Write-Host "   User keys: $($profile.user.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get belt details (if we have a belt ID)
if ($script:testBeltId) {
    Write-Host "`n4. Getting belt details..." -ForegroundColor Yellow
    try {
        $beltDetails = Invoke-RestMethod -Uri "http://localhost:3002/api/belts/$($script:testBeltId)" -Method GET -WebSession $sessionObj
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "   Name: $($beltDetails.belt.name)" -ForegroundColor White
        Write-Host "   Status: $($beltDetails.belt.status)" -ForegroundColor White
        Write-Host "   Type: $($beltDetails.belt.type)" -ForegroundColor White
        Write-Host "   Coin Value: $($beltDetails.belt.coinValue)" -ForegroundColor White
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Test Complete!`n" -ForegroundColor Green

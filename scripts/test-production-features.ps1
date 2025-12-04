# Production Feature Testing Script
# Tests all features to verify offline vs online functionality

# Enable TLS 1.2 for PowerShell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Try both domain and Vercel URL
$baseUrls = @("https://argufight.com", "https://honorable-ai.vercel.app")
$baseUrl = $null
$results = @()

# Test which URL works
foreach ($url in $baseUrls) {
    try {
        $testResponse = Invoke-WebRequest -Uri "$url/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($testResponse.StatusCode -eq 200 -or $testResponse.StatusCode -eq 404) {
            $baseUrl = $url
            Write-Host "✅ Using URL: $baseUrl" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "⚠️  $url not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if (-not $baseUrl) {
    Write-Host "❌ Neither URL is accessible. Please check deployment." -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Feature Verification Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Feature {
    param(
        [string]$Name,
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        
        if ($status -eq 200 -or $status -eq 201) {
            $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
            Write-Host "  ✅ PASS - Status: $status" -ForegroundColor Green
            return @{
                Name = $Name
                Status = "PASS"
                StatusCode = $status
                HasData = ($content -ne $null)
            }
        } else {
            Write-Host "  ⚠️  WARNING - Status: $status" -ForegroundColor Yellow
            return @{
                Name = $Name
                Status = "WARNING"
                StatusCode = $status
            }
        }
    } catch {
        Write-Host "  ❌ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Name = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

# Test 1: Health Check
$results += Test-Feature -Name "Health Check" -Endpoint "/api/health"

# Test 2: Debates API
$results += Test-Feature -Name "Debates API (List)" -Endpoint "/api/debates?status=WAITING"

# Test 3: Check if debates have images
Write-Host "`nChecking debate images..." -ForegroundColor Yellow
try {
    $debatesResponse = Invoke-WebRequest -Uri "$baseUrl/api/debates?status=WAITING" -UseBasicParsing
    $debates = $debatesResponse.Content | ConvertFrom-Json
    $debatesWithImages = $debates | Where-Object { $_.images -and $_.images.Count -gt 0 }
    Write-Host "  Debates with images: $($debatesWithImages.Count) / $($debates.Count)" -ForegroundColor $(if ($debatesWithImages.Count -gt 0) { "Green" } else { "Yellow" })
    $results += @{
        Name = "Debate Images"
        Status = if ($debatesWithImages.Count -gt 0) { "PASS" } else { "WARNING" }
        Details = "$($debatesWithImages.Count) debates have images"
    }
} catch {
    Write-Host "  ❌ FAIL - Could not check debate images" -ForegroundColor Red
    $results += @{
        Name = "Debate Images"
        Status = "FAIL"
    }
}

# Test 4: Trending Topics
$results += Test-Feature -Name "Trending Topics API" -Endpoint "/api/trending-topics"

# Test 5: Notifications API
$results += Test-Feature -Name "Notifications API" -Endpoint "/api/notifications?limit=5"

# Test 6: Categories API
$results += Test-Feature -Name "Categories API" -Endpoint "/api/categories"

# Test 7: Homepage Content
$results += Test-Feature -Name "Homepage Content API" -Endpoint "/api/homepage/content"

# Test 8: Admin APIs (will fail without auth, but should return 401, not 500)
Write-Host "`nTesting Admin APIs (should return 401 without auth)..." -ForegroundColor Yellow
$adminTests = @(
    @{ Name = "Admin Categories"; Endpoint = "/api/admin/categories" }
    @{ Name = "Admin Content Sections"; Endpoint = "/api/admin/content/sections" }
    @{ Name = "Admin Judges"; Endpoint = "/api/admin/judges" }
)

foreach ($test in $adminTests) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$($test.Endpoint)" -UseBasicParsing -ErrorAction Stop
        Write-Host "  ⚠️  $($test.Name) - Status: $($response.StatusCode) (Should be 401)" -ForegroundColor Yellow
        $results += @{
            Name = $test.Name
            Status = "WARNING"
            Details = "Returned $($response.StatusCode) instead of 401"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "  ✅ $($test.Name) - Correctly returns 401 (Unauthorized)" -ForegroundColor Green
            $results += @{
                Name = $test.Name
                Status = "PASS"
                Details = "Correctly requires authentication"
            }
        } else {
            Write-Host "  ❌ $($test.Name) - Status: $statusCode (Expected 401)" -ForegroundColor Red
            $results += @{
                Name = $test.Name
                Status = "FAIL"
                Details = "Returned $statusCode instead of 401"
            }
        }
    }
}

# Test 9: Check specific debate for images
Write-Host "`nChecking specific debate (ED Reed)..." -ForegroundColor Yellow
try {
    $debateResponse = Invoke-WebRequest -Uri "$baseUrl/api/debates/e59863ee-9213-4c16-86a9-bd4c25621048" -UseBasicParsing
    $debate = $debateResponse.Content | ConvertFrom-Json
    Write-Host "  Topic: $($debate.topic)" -ForegroundColor Cyan
    Write-Host "  Has images: $($debate.images -ne $null -and $debate.images.Count -gt 0)" -ForegroundColor $(if ($debate.images -and $debate.images.Count -gt 0) { "Green" } else { "Yellow" })
    if ($debate.images -and $debate.images.Count -gt 0) {
        Write-Host "  Image URLs:" -ForegroundColor Cyan
        $debate.images | ForEach-Object { Write-Host "    - $($_.url)" -ForegroundColor Gray }
    }
    $results += @{
        Name = "Specific Debate Images"
        Status = if ($debate.images -and $debate.images.Count -gt 0) { "PASS" } else { "WARNING" }
        Details = "Debate has $($debate.images.Count) images"
    }
} catch {
    Write-Host "  ❌ Could not fetch debate details" -ForegroundColor Red
    $results += @{
        Name = "Specific Debate Images"
        Status = "FAIL"
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$warnings = ($results | Where-Object { $_.Status -eq "WARNING" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor Yellow
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host ""

# Detailed Results
Write-Host "Detailed Results:" -ForegroundColor Cyan
$results | ForEach-Object {
    $color = switch ($_.Status) {
        "PASS" { "Green" }
        "WARNING" { "Yellow" }
        "FAIL" { "Red" }
        default { "White" }
    }
    $icon = switch ($_.Status) {
        "PASS" { "✅" }
        "WARNING" { "⚠️" }
        "FAIL" { "❌" }
        default { "•" }
    }
    Write-Host "  $icon $($_.Name): $($_.Status)" -ForegroundColor $color
    if ($_.Details) {
        Write-Host "     $($_.Details)" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Feature Comparison" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features that should work online:" -ForegroundColor White
Write-Host "  1. Profile Pictures (Blob Storage) - $($results | Where-Object { $_.Name -like '*Profile*' } | Select-Object -First 1 | ForEach-Object { $_.Status })" -ForegroundColor $(if (($results | Where-Object { $_.Name -like '*Profile*' }).Status -eq "PASS") { "Green" } else { "Yellow" })
Write-Host "  2. Debate Images (Blob Storage) - $($results | Where-Object { $_.Name -like '*Debate*Image*' } | Select-Object -First 1 | ForEach-Object { $_.Status })" -ForegroundColor $(if (($results | Where-Object { $_.Name -like '*Debate*Image*' }).Status -eq "PASS") { "Green" } else { "Yellow" })
Write-Host "  3. Trending Topics (Dynamic) - $($results | Where-Object { $_.Name -like '*Trending*' } | Select-Object -First 1 | ForEach-Object { $_.Status })" -ForegroundColor $(if (($results | Where-Object { $_.Name -like '*Trending*' }).Status -eq "PASS") { "Green" } else { "Yellow" })
Write-Host "  4. Notifications API - $($results | Where-Object { $_.Name -like '*Notification*' } | Select-Object -First 1 | ForEach-Object { $_.Status })" -ForegroundColor $(if (($results | Where-Object { $_.Name -like '*Notification*' }).Status -eq "PASS") { "Green" } else { "Yellow" })
Write-Host "  5. Admin APIs (Auth Required) - $($results | Where-Object { $_.Name -like '*Admin*' } | Select-Object -First 1 | ForEach-Object { $_.Status })" -ForegroundColor $(if (($results | Where-Object { $_.Name -like '*Admin*' }).Status -eq "PASS") { "Green" } else { "Yellow" })
Write-Host ""


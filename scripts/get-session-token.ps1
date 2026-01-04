# Get Session Token Helper
# This script helps you get your session token from the browser

Write-Host "=== Get Your Session Token ===" -ForegroundColor Cyan
Write-Host ""

# Option 1: Manual instructions
Write-Host "Method 1: From Browser DevTools (Recommended)" -ForegroundColor Yellow
Write-Host "  1. Open your browser and go to http://localhost:3000" -ForegroundColor White
Write-Host "  2. Press F12 to open DevTools" -ForegroundColor White
Write-Host "  3. Go to 'Application' tab (Chrome/Edge) or 'Storage' tab (Firefox)" -ForegroundColor White
Write-Host "  4. Click 'Cookies' > 'http://localhost:3000'" -ForegroundColor White
Write-Host "  5. Find 'sessionToken' and double-click the value to copy it" -ForegroundColor White
Write-Host ""

# Option 2: Browser Console
Write-Host "Method 2: From Browser Console" -ForegroundColor Yellow
Write-Host "  1. Open browser DevTools (F12)" -ForegroundColor White
Write-Host "  2. Go to 'Console' tab" -ForegroundColor White
Write-Host "  3. Run this command:" -ForegroundColor White
Write-Host "     document.cookie.split(';').find(c => c.includes('sessionToken'))" -ForegroundColor Cyan
Write-Host "  4. Copy everything after 'sessionToken='" -ForegroundColor White
Write-Host ""

# Option 3: Test the token
Write-Host "Method 3: Test Your Token" -ForegroundColor Yellow
$token = Read-Host "Paste your sessionToken here (or press Enter to skip)"

if (-not [string]::IsNullOrWhiteSpace($token)) {
    Write-Host ""
    Write-Host "Testing token..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/profile" `
            -Headers @{"Cookie" = "sessionToken=$token"}
        
        Write-Host "✓ Token is valid!" -ForegroundColor Green
        Write-Host "  User: $($response.user.username)" -ForegroundColor Green
        Write-Host "  Email: $($response.user.email)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your session token:" -ForegroundColor Cyan
        Write-Host $token -ForegroundColor White
        Write-Host ""
        Write-Host "To use it in PowerShell, run:" -ForegroundColor Yellow
        Write-Host "`$sessionToken = `"$token`"" -ForegroundColor Cyan
        
    } catch {
        Write-Host "✗ Token is invalid or expired" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "  1. Make sure you're logged in at http://localhost:3000" -ForegroundColor White
        Write-Host "  2. Get a fresh session token from the browser" -ForegroundColor White
        Write-Host ""
        Write-Host "OR use the database method:" -ForegroundColor Yellow
        Write-Host "  npx tsx scripts/get-session-from-db.ts your-email@example.com" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Skipped token test. Use one of the methods above to get your token." -ForegroundColor Gray
}

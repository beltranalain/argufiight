# Helper script to get session token from browser
# This opens instructions for getting the session token

Write-Host "=== How to Get Your Session Token ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: From Browser DevTools" -ForegroundColor Yellow
Write-Host "  1. Open your browser (Chrome/Edge/Firefox)" -ForegroundColor White
Write-Host "  2. Press F12 to open DevTools" -ForegroundColor White
Write-Host "  3. Go to 'Application' tab (Chrome/Edge) or 'Storage' tab (Firefox)" -ForegroundColor White
Write-Host "  4. Click 'Cookies' > 'http://localhost:3000'" -ForegroundColor White
Write-Host "  5. Find 'sessionToken' and copy its value" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: From Browser Console" -ForegroundColor Yellow
Write-Host "  1. Open browser DevTools (F12)" -ForegroundColor White
Write-Host "  2. Go to 'Console' tab" -ForegroundColor White
Write-Host "  3. Run: document.cookie.split(';').find(c => c.includes('sessionToken'))" -ForegroundColor White
Write-Host "  4. Copy the value after 'sessionToken='" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Check if logged in via API" -ForegroundColor Yellow
Write-Host "  Run: Invoke-RestMethod -Uri 'http://localhost:3000/api/profile' -Headers @{'Cookie'='sessionToken=YOUR_TOKEN'}" -ForegroundColor White
Write-Host ""

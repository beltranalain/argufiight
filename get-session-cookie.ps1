# Quick script to help you get your session cookie
# This will open instructions in your browser

Write-Host "`n📋 How to Get Your Session Cookie:`n" -ForegroundColor Cyan

Write-Host "Method 1: Browser DevTools (Recommended)" -ForegroundColor Yellow
Write-Host "1. Open your browser and go to: http://localhost:3002" -ForegroundColor White
Write-Host "2. Make sure you're logged in" -ForegroundColor White
Write-Host "3. Press F12 to open DevTools" -ForegroundColor White
Write-Host "4. Click the 'Application' tab (or 'Storage' in Firefox)" -ForegroundColor White
Write-Host "5. In the left sidebar, expand 'Cookies'" -ForegroundColor White
Write-Host "6. Click on 'http://localhost:3002'" -ForegroundColor White
Write-Host "7. Find the cookie named 'session'" -ForegroundColor White
Write-Host "8. Copy the VALUE column (it's a long JWT string starting with 'eyJ')" -ForegroundColor White
Write-Host "9. Paste it into test-belt-system.ps1 as the sessionCookie variable`n" -ForegroundColor White

Write-Host "Method 2: PowerShell (if you have the cookie in a variable)" -ForegroundColor Yellow
Write-Host '$session = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uVG9rZW4iOiI..."' -ForegroundColor Gray
Write-Host 'Invoke-RestMethod -Uri "http://localhost:3002/api/belts" -Method GET -Headers @{"Cookie"="session=$session"}' -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Important: You MUST use your REAL session cookie value, not 'YOUR_JWT_HERE'`n" -ForegroundColor Red

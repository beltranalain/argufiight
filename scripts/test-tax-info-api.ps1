# Test the tax-info API endpoint
# Make sure you're logged in and have a session cookie

$sessionCookie = Read-Host "Enter your session cookie value (or press Enter to use browser cookies)"

if ([string]::IsNullOrWhiteSpace($sessionCookie)) {
    Write-Host "Please get your session cookie from browser DevTools -> Application -> Cookies -> session"
    Write-Host "Then run: `$sessionCookie = 'your-cookie-value'; Invoke-WebRequest -Uri 'http://localhost:3000/api/creator/tax-info' -Headers @{'Cookie' = `"session=$sessionCookie`"} | Select-Object StatusCode, Content"
    exit
}

try {
    Write-Host "Testing /api/creator/tax-info endpoint..." -ForegroundColor Cyan
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/creator/tax-info" `
        -Method GET `
        -Headers @{
            'Cookie' = "session=$sessionCookie"
        } `
        -ErrorAction Stop
    
    Write-Host "`n✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "`n❌ Error occurred!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nError Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
        
        try {
            $errorObj = $responseBody | ConvertFrom-Json
            Write-Host "`nParsed Error:" -ForegroundColor Yellow
            $errorObj | ConvertTo-Json -Depth 10
        } catch {
            Write-Host "Could not parse error as JSON"
        }
    }
    
    Write-Host "`nFull Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

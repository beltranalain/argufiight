# Testing Instructions - Creator Network

## 🔐 Authentication Note

The login endpoint uses a cookie named `session` (not `sessionToken`). PowerShell's `WebSession` automatically handles cookies, so the script should work correctly once you provide valid credentials.

## ✅ Quick Test Commands

### PowerShell Script (Recommended)
```powershell
.\test-creator-network-flow.ps1 `
    -CreatorEmail "your-real-email@example.com" `
    -CreatorPassword "your-real-password"
```

### Manual API Test (if script fails)
```powershell
# 1. Login
$loginBody = @{
    email = "your-email@example.com"
    password = "your-password"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json" `
    -WebSession $session

# 2. Test creator profile (uses session automatically)
Invoke-RestMethod -Uri "http://localhost:3000/api/creator/profile" `
    -Method GET `
    -WebSession $session
```

## 🧪 Testing Checklist

### Prerequisites
- [ ] User account exists in database
- [ ] User has a password set (not Google-only auth)
- [ ] User is not banned
- [ ] Server is running on `http://localhost:3000`

### Creator Flow
1. [ ] Login successfully
2. [ ] Get creator profile
3. [ ] Enable creator mode (if not already enabled)
4. [ ] Update creator settings
5. [ ] View offers
6. [ ] Accept/decline/counter offers
7. [ ] View contracts
8. [ ] View earnings
9. [ ] View tax information

## 🐛 Troubleshooting

### 401 Unauthorized on Login
- **Check**: Email and password are correct
- **Check**: User exists in database
- **Check**: User has password set (not Google-only)
- **Check**: Password matches what's stored

### Session Not Persisting
- PowerShell's `WebSession` should automatically handle cookies
- Make sure you're using the same `$session` variable for all requests
- Check that cookies are being set in response headers

### All Tests Failing After Login
- Verify the session cookie is being stored
- Check that subsequent requests include the session
- Look at server logs for authentication errors

## 📝 Example Test Session

```powershell
# Create session
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Login
$login = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $login `
    -ContentType "application/json" `
    -WebSession $session

Write-Host "Login successful: $($loginResponse.user.username)"

# Use same session for all subsequent requests
$profile = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/creator/profile" `
    -WebSession $session

Write-Host "Profile: $($profile.user.username)"
```

## 🔍 Debugging Tips

1. **Check Server Logs**: Look at the Next.js server console for detailed error messages
2. **Verify Cookie**: Check if `Set-Cookie` header is present in login response
3. **Test Manually**: Use browser DevTools to see what cookies are set
4. **Check Database**: Verify user exists and has correct password hash

## 📚 API Endpoints Reference

See `FINAL_FIXES_SUMMARY.md` for complete API documentation.

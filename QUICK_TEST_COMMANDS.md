# Quick Test Commands

## PowerShell Script Usage

### Basic Usage
```powershell
.\test-creator-network-flow.ps1
```

### With Custom Base URL
```powershell
.\test-creator-network-flow.ps1 -BaseUrl "https://your-domain.com"
```

### With Credentials
```powershell
.\test-creator-network-flow.ps1 `
    -CreatorEmail "creator@example.com" `
    -CreatorPassword "password123" `
    -BaseUrl "http://localhost:3000"
```

### Full Example
```powershell
.\test-creator-network-flow.ps1 `
    -BaseUrl "http://localhost:3000" `
    -CreatorEmail "testcreator@example.com" `
    -CreatorPassword "TestPassword123!" `
    -AdvertiserEmail "advertiser@example.com" `
    -AdvertiserPassword "AdPassword123!" `
    -AdminEmail "admin@example.com" `
    -AdminPassword "AdminPassword123!"
```

## Manual API Testing Commands

### 1. Login as Creator
```powershell
$loginBody = @{
    email = "creator@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$sessionCookie = $response.sessionToken
```

### 2. Enable Creator Mode
```powershell
$headers = @{
    "Cookie" = "sessionToken=$sessionCookie"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/creators/enable" `
    -Method POST `
    -Headers $headers
```

### 3. Update Creator Settings
```powershell
$settingsBody = @{
    profileBannerPrice = 500
    postDebatePrice = 250
    debateWidgetPrice = 300
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/creator/settings" `
    -Method PUT `
    -Body $settingsBody `
    -Headers $headers `
    -ContentType "application/json"
```

### 4. Get Offers
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/creator/offers?status=PENDING" `
    -Method GET `
    -Headers $headers
```

### 5. Accept Offer
```powershell
$offerId = "your-offer-id-here"

Invoke-RestMethod -Uri "http://localhost:3000/api/creator/offers/$offerId/accept" `
    -Method POST `
    -Headers $headers
```

### 6. Get Contracts
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/creator/contracts?status=ACTIVE" `
    -Method GET `
    -Headers $headers
```

### 7. Complete Contract
```powershell
$contractId = "your-contract-id-here"

Invoke-RestMethod -Uri "http://localhost:3000/api/creator/contracts/$contractId/complete" `
    -Method POST `
    -Headers $headers
```

### 8. Get Earnings
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/creator/earnings" `
    -Method GET `
    -Headers $headers
```

### 9. Get Detailed Earnings
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/creator/earnings/detailed" `
    -Method GET `
    -Headers $headers
```

### 10. Get Tax Info
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/creator/tax-info" `
    -Method GET `
    -Headers $headers
```

## cURL Commands (Alternative)

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"creator@example.com","password":"password123"}' \
  -c cookies.txt
```

### Enable Creator Mode
```bash
curl -X POST http://localhost:3000/api/creators/enable \
  -b cookies.txt
```

### Get Offers
```bash
curl -X GET "http://localhost:3000/api/creator/offers?status=PENDING" \
  -b cookies.txt
```

### Accept Offer
```bash
curl -X POST http://localhost:3000/api/creator/offers/OFFER_ID/accept \
  -b cookies.txt
```

## Testing Checklist

Run these in order:

1. ✅ Login as creator
2. ✅ Enable creator mode
3. ✅ Update ad slot settings
4. ✅ View offers
5. ✅ Accept an offer
6. ✅ View contracts
7. ✅ View earnings
8. ✅ View tax information

## Expected Results

- All API calls should return 200 status
- Creator mode should enable successfully
- Settings should save and persist
- Offers should be visible
- Contract should be created on offer acceptance
- Earnings should display correctly
- Tax info should load without errors

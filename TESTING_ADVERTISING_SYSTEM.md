# Testing Advertising System Locally (PowerShell)

## 🚀 Quick Start

### 1. Start Development Server

```powershell
# Make sure you're in the project directory
cd C:\Users\beltr\Honorable.AI

# Install dependencies (if needed)
npm install

# Start the dev server
npm run dev
```

The server will start at `http://localhost:3000`

---

## 🧪 Testing Checklist

### **Test 1: Direct Ads (Admin-Created)**

#### Step 1: Login as Admin
1. Open `http://localhost:3000/login`
2. Login with your admin account
3. Navigate to `/admin/advertisements`
4. Click on **"Direct Ads"** tab

#### Step 2: Create a Direct Ad
1. Click **"Create Direct Ad"** button
2. Fill in:
   - **Title**: "Test Direct Ad"
   - **Type**: "BANNER"
   - **Target URL**: "https://www.argufight.com"
   - **Status**: "ACTIVE"
   - **Start Date**: Today
   - **End Date**: Next week
   - Upload an image or provide image URL
3. Click **"Save"**

#### Step 3: Verify Ad Displays
1. Go to a profile page: `http://localhost:3000/profile/[any-user-id]`
2. Check if the ad appears at the top (PROFILE_BANNER placement)
3. Click the ad - should open target URL
4. Check browser console for tracking (impressions/clicks)

**PowerShell Check:**
```powershell
# Check if ad was created in database
npx tsx scripts/check-advertisement.ts
```

---

### **Test 2: Advertiser Campaigns Flow**

#### Step 1: Create Advertiser Application
1. Go to `http://localhost:3000/advertise`
2. Fill out the application form:
   - Company Name: "Test Advertiser Co"
   - Website: "https://testadvertiser.com"
   - Industry: "Technology"
   - Contact Email: "test@advertiser.com"
   - Contact Name: "Test User"
3. Submit the application

#### Step 2: Approve Advertiser (as Admin)
1. Login as admin
2. Go to `/admin/advertisements`
3. Click **"Advertisers"** tab
4. Find the pending advertiser
5. Click **"Approve"**

**PowerShell Check:**
```powershell
# Verify user account was created
npx tsx scripts/check-advertiser.ts test@advertiser.com
```

#### Step 3: Login as Advertiser
1. Go to `http://localhost:3000/login`
2. Use email: `test@advertiser.com`
3. Use "Forgot Password" to set password (account was auto-created)
4. Login and you should be redirected to `/advertiser/dashboard`

#### Step 4: Create Campaign
1. In advertiser dashboard, click **"Create Campaign"**
2. Fill out the 5-step wizard:
   - **Step 1**: Select "Platform Ads"
   - **Step 2**: Campaign name, budget, dates
   - **Step 3**: Upload banner image
   - **Step 4**: Targeting options
   - **Step 5**: Review and submit
3. Campaign should be created with status "PENDING_REVIEW"

#### Step 5: Approve Campaign (as Admin)
1. Login as admin
2. Go to `/admin/advertisements`
3. Click **"Advertiser Campaigns"** tab
4. Find the pending campaign
5. Click **"Approve"**
6. Campaign status should change to "APPROVED"

#### Step 6: Verify Auto-Activation
1. Wait until campaign start date (or set start date to today)
2. Refresh the admin campaigns page
3. Campaign should auto-activate to "ACTIVE" status
4. Go to a profile page - should see the campaign ad (if no creator contracts)

**PowerShell Check:**
```powershell
# Check campaign status
npx tsx scripts/check-campaign.ts
```

---

### **Test 3: Ad Selection Priority**

#### Test Priority Order:
1. **Creator Contract** (highest priority) - if exists
2. **Platform Ads Campaign** (medium priority) - if exists
3. **Direct Ad** (fallback) - always available

**PowerShell Test:**
```powershell
# Test ad selection API directly
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/ads/select?placement=PROFILE_BANNER&userId=test-user-id" -Method GET
$response.Content | ConvertFrom-Json
```

---

## 🔍 Useful PowerShell Commands

### Check Database State

```powershell
# Check all advertisements
npx tsx scripts/check-advertisements.ts

# Check all campaigns
npx tsx scripts/check-campaigns.ts

# Check advertiser status
npx tsx scripts/check-advertiser.ts test@advertiser.com

# Check user account
npx tsx scripts/check-user.ts test@advertiser.com
```

### Test API Endpoints

```powershell
# Test ad selection
$params = @{
    placement = "PROFILE_BANNER"
    userId = "test-user-id"
}
$queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
Invoke-WebRequest -Uri "http://localhost:3000/api/ads/select?$queryString" -Method GET

# Test campaign creation (requires auth token)
$headers = @{
    "Content-Type" = "application/json"
    "Cookie" = "your-session-cookie"
}
$body = @{
    name = "Test Campaign"
    type = "PLATFORM_ADS"
    # ... other fields
} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/advertiser/campaigns" -Method POST -Headers $headers -Body $body
```

### Monitor Logs

```powershell
# Watch Next.js logs in real-time
# The dev server already shows logs, but you can filter:
npm run dev | Select-String "ad|campaign|advertiser"
```

---

## 🐛 Debugging Tips

### 1. Check Browser Console
- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed API calls

### 2. Check Server Logs
- Look at the terminal where `npm run dev` is running
- Look for error messages or warnings

### 3. Database Inspection
```powershell
# Connect to database and check tables
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

### 4. Common Issues

**Issue: Ads not displaying**
- Check if ad status is "ACTIVE"
- Check if dates are valid (startDate <= now <= endDate)
- Check browser console for API errors
- Verify ad selection API returns data

**Issue: Campaign not auto-activating**
- Check campaign status (should be "APPROVED")
- Check startDate is in the past
- Refresh the page (auto-activation runs on fetch)
- Check server logs for errors

**Issue: Advertiser can't login**
- Verify user account was created: `npx tsx scripts/check-advertiser.ts email@example.com`
- Check advertiser status is "APPROVED"
- Use "Forgot Password" if account was just created
- Check email matches exactly (case-sensitive)

---

## 📊 Test Scenarios

### Scenario 1: Direct Ad Only
1. Create Direct Ad with status ACTIVE
2. Visit profile page
3. ✅ Should see Direct Ad

### Scenario 2: Platform Campaign Only
1. Create and approve Platform Campaign
2. Set start date to today
3. Visit profile page
4. ✅ Should see Platform Campaign ad

### Scenario 3: Both Ads (Priority Test)
1. Create Direct Ad (ACTIVE)
2. Create and approve Platform Campaign (ACTIVE, start date today)
3. Visit profile page
4. ✅ Should see Platform Campaign (higher priority than Direct Ad)

### Scenario 4: Advertiser Flow End-to-End
1. Apply as advertiser
2. Admin approves → User account created
3. Advertiser logs in (uses Forgot Password)
4. Creates campaign
5. Admin approves campaign
6. Campaign auto-activates on start date
7. ✅ Ad displays on website

---

## ✅ Success Criteria

- [ ] Direct Ads can be created and display on website
- [ ] Advertiser applications can be submitted
- [ ] Admin can approve advertisers (creates user account)
- [ ] Advertisers can login and access dashboard
- [ ] Advertisers can create campaigns
- [ ] Admin can approve campaigns
- [ ] Campaigns auto-activate on start date
- [ ] Campaigns auto-complete on end date
- [ ] Ads display in correct priority order
- [ ] Ad tracking (impressions/clicks) works
- [ ] All tabs in admin panel show correct data

---

## 🚨 Quick Test Script

Save this as `test-ads.ps1`:

```powershell
# Quick Advertising System Test
Write-Host "🧪 Testing Advertising System..." -ForegroundColor Cyan

# 1. Check if server is running
Write-Host "`n1. Checking dev server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running. Run 'npm run dev' first" -ForegroundColor Red
    exit 1
}

# 2. Test ad selection API
Write-Host "`n2. Testing ad selection API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/ads/select?placement=PROFILE_BANNER" -Method GET
    $data = $response.Content | ConvertFrom-Json
    if ($data.ad) {
        Write-Host "✅ Ad selection working - Found ad: $($data.ad.id)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Ad selection working but no ads available" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ad selection API failed: $_" -ForegroundColor Red
}

# 3. Check database
Write-Host "`n3. Checking database..." -ForegroundColor Yellow
Write-Host "Run: npx tsx scripts/check-advertisements.ts" -ForegroundColor Cyan

Write-Host "`n✅ Basic tests complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Login as admin: http://localhost:3000/admin/advertisements" -ForegroundColor White
Write-Host "2. Create a Direct Ad" -ForegroundColor White
Write-Host "3. Visit a profile page to see the ad" -ForegroundColor White
```

Run it:
```powershell
.\test-ads.ps1
```

---

## 📝 Notes

- All tests should be done in **development mode** (`npm run dev`)
- Use **incognito/private browsing** to test without cached sessions
- Clear browser cache if you see old data
- Check **Network tab** in DevTools to see API responses
- Use **Prisma Studio** (`npx prisma studio`) to inspect database directly

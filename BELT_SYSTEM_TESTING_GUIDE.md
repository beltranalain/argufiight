# Belt System Testing Guide

## Quick Start

### 1. Enable the Belt System

**PowerShell:**
```powershell
# Check current status
Get-Content .env | Select-String "ENABLE_BELT_SYSTEM"

# Enable it
(Get-Content .env) -replace "ENABLE_BELT_SYSTEM=.*", "ENABLE_BELT_SYSTEM=true" | Set-Content .env

# Or add it if it doesn't exist
Add-Content .env "`nENABLE_BELT_SYSTEM=true"
```

**Or use the test script:**
```powershell
.\scripts\test-belt-system.ps1
# Choose option 2
```

### 2. Verify Database Tables

```powershell
npx tsx scripts/check-belt-tables.ts
```

Expected output:
```
📊 Belt tables status:
  ✅ belts
  ✅ belt_history
  ✅ belt_challenges
  ✅ belt_settings

📊 Belt enums status:
  ✅ BeltType
  ✅ BeltStatus
  ✅ ChallengeStatus
  ✅ BeltTransferReason
```

### 3. Start Development Server

```powershell
npm run dev
```

### 4. Test Admin Interface

1. Navigate to: `http://localhost:3000/admin/belts`
2. You should see the belt management page
3. Check filters work (status, type, category)

### 5. Test User Interface

1. Navigate to: `http://localhost:3000/belts/room`
2. Should show your belt room (empty if no belts)
3. Try viewing a belt: `http://localhost:3000/belts/[belt-id]`

## Manual API Testing

### Using PowerShell (Invoke-RestMethod)

**Note:** You need to be logged in and have a session cookie.

```powershell
# 1. List all belts
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/belts" -Method GET -Headers @{
    "Cookie" = "your-session-cookie-here"
}
$response | ConvertTo-Json -Depth 3

# 2. Get specific belt
$beltId = "your-belt-id"
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/belts/$beltId" -Method GET -Headers @{
    "Cookie" = "your-session-cookie-here"
}

# 3. Get user's belt room
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/belts/room" -Method GET -Headers @{
    "Cookie" = "your-session-cookie-here"
}

# 4. Create challenge
$body = @{
    beltId = "your-belt-id"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/belts/challenge" -Method POST -Body $body -ContentType "application/json" -Headers @{
    "Cookie" = "your-session-cookie-here"
}
```

### Using curl (if you have it)

```powershell
# List belts
curl http://localhost:3000/api/belts -H "Cookie: your-session-cookie"

# Get belt room
curl http://localhost:3000/api/belts/room -H "Cookie: your-session-cookie"
```

## Database Testing

### Create Test Belt via Prisma

```powershell
# Create a test script
@"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const belt = await prisma.belt.create({
    data: {
      name: 'Test Championship Belt',
      type: 'CHAMPIONSHIP',
      status: 'VACANT',
      coinValue: 1000,
      creationCost: 500,
    },
  })
  console.log('Belt created:', belt.id)
  await prisma.`$disconnect()
}

main()
"@ | Out-File -FilePath "test-belt.ts" -Encoding UTF8

npx tsx test-belt.ts
Remove-Item test-belt.ts
```

### Check Belt Settings

```powershell
@"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const settings = await prisma.beltSettings.findMany()
  console.log(JSON.stringify(settings, null, 2))
  await prisma.`$disconnect()
}

main()
"@ | Out-File -FilePath "check-settings.ts" -Encoding UTF8

npx tsx check-settings.ts
Remove-Item check-settings.ts
```

### Transfer Belt (Admin)

```powershell
# Via API (requires admin session)
$body = @{
    toUserId = "target-user-id"
    reason = "ADMIN_TRANSFER"
    adminNotes = "Test transfer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/belts/belt-id/transfer" -Method POST -Body $body -ContentType "application/json" -Headers @{
    "Cookie" = "admin-session-cookie"
}
```

## Testing Checklist

### ✅ Basic Functionality

- [ ] Belt system enabled in `.env`
- [ ] Database tables exist (run `check-belt-tables.ts`)
- [ ] Admin page loads (`/admin/belts`)
- [ ] User belt room loads (`/belts/room`)
- [ ] Belt detail page loads (`/belts/[id]`)

### ✅ Admin Features

- [ ] Can view all belts
- [ ] Filters work (status, type, category)
- [ ] Can view belt details
- [ ] Can transfer belt to another user
- [ ] Can see belt history
- [ ] Can see pending challenges

### ✅ User Features

- [ ] Can view own belt room
- [ ] Can see current belts
- [ ] Can see belt history
- [ ] Can view belt details
- [ ] Can create challenge (if eligible)
- [ ] Can accept/decline challenges (if holder)

### ✅ API Endpoints

- [ ] `GET /api/belts` - List belts
- [ ] `GET /api/belts/[id]` - Get belt details
- [ ] `GET /api/belts/room` - Get user's belt room
- [ ] `POST /api/belts/challenge` - Create challenge
- [ ] `POST /api/belts/challenge/[id]/accept` - Accept challenge
- [ ] `POST /api/belts/challenge/[id]/decline` - Decline challenge
- [ ] `POST /api/admin/belts/[id]/transfer` - Admin transfer

### ✅ Integration

- [ ] Belt transfers after debate completion (if belt at stake)
- [ ] Belt transfers after tournament completion
- [ ] ELO matching prevents abuse
- [ ] Grace periods work
- [ ] Mandatory defenses trigger after max declines

## Common Issues

### "Belt system is not enabled"

**Fix:**
```powershell
Add-Content .env "`nENABLE_BELT_SYSTEM=true"
# Restart dev server
```

### "Unauthorized" errors

**Fix:** Make sure you're logged in and have a valid session cookie.

### "Belt not found"

**Fix:** Check if belt exists in database:
```powershell
npx tsx scripts/check-belt-tables.ts
```

### Tables don't exist

**Fix:** Run migration:
```powershell
npx prisma db push
npx tsx prisma/seed-belt-settings.ts
```

## Quick Test Script

Save this as `quick-test.ps1`:

```powershell
# Quick belt system test
Write-Host "Testing Belt System...`n" -ForegroundColor Cyan

# 1. Check if enabled
$envContent = Get-Content .env -Raw
if ($envContent -match "ENABLE_BELT_SYSTEM=true") {
    Write-Host "✅ Belt system enabled" -ForegroundColor Green
} else {
    Write-Host "❌ Belt system disabled - enabling..." -ForegroundColor Yellow
    Add-Content .env "`nENABLE_BELT_SYSTEM=true"
    Write-Host "✅ Enabled!" -ForegroundColor Green
}

# 2. Check tables
Write-Host "`nChecking database tables..." -ForegroundColor Cyan
npx tsx scripts/check-belt-tables.ts

Write-Host "`n✅ Ready to test!`n" -ForegroundColor Green
Write-Host "1. Start server: npm run dev" -ForegroundColor Yellow
Write-Host "2. Visit: http://localhost:3000/admin/belts" -ForegroundColor Yellow
Write-Host "3. Visit: http://localhost:3000/belts/room" -ForegroundColor Yellow
```

Run it:
```powershell
.\quick-test.ps1
```

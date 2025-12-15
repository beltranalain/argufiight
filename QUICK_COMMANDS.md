# Quick PowerShell Commands - Merge Recovery

## 🚀 Complete Setup (Run All)

```powershell
# Run the automated script
.\MERGE_COMPLETE_COMMANDS.ps1
```

---

## 📋 Manual Commands (Step by Step)

### 1. Verify Merge Status
```powershell
# Check component counts
Get-ChildItem -Path "components" -Recurse -File | Measure-Object
Get-ChildItem -Path "mobile\src" -Recurse -File | Measure-Object
```

### 2. Install Web Dependencies
```powershell
npm install
```

### 3. Install Mobile Dependencies
```powershell
cd mobile
npm install
cd ..
```

### 4. Check TypeScript Errors (Optional)
```powershell
npx tsc --noEmit --skipLibCheck
```

### 5. Start Web Dev Server
```powershell
npm run dev
```

### 6. Verify Server is Running
```powershell
# Check if port 3000 is listening
Get-NetTCPConnection -LocalPort 3000 | Where-Object { $_.State -eq "Listen" }

# Or check Node processes
Get-Process -Name node | Select-Object Id, StartTime
```

### 7. Start Mobile App (Separate Terminal)
```powershell
cd mobile
npx expo start
```

---

## 🔧 Troubleshooting Commands

### Stop All Node Processes
```powershell
Get-Process -Name node | Stop-Process -Force
```

### Clear Next.js Cache
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

### Clear Prisma Cache (if needed)
```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npx prisma generate
```

### Check What's Running on Port 3000
```powershell
netstat -ano | findstr :3000
```

### Kill Process on Port 3000 (if needed)
```powershell
# Find PID
$pid = (Get-NetTCPConnection -LocalPort 3000).OwningProcess
# Kill it
Stop-Process -Id $pid -Force
```

---

## ✅ Verification Commands

### Check File Counts
```powershell
# Web components
(Get-ChildItem -Path "components" -Recurse -File).Count

# Mobile files
(Get-ChildItem -Path "mobile\src" -Recurse -File).Count

# API routes (should be preserved)
(Get-ChildItem -Path "app\api" -Recurse -File -Filter "*.ts").Count
```

### Check Key Files Exist
```powershell
# Web
Test-Path "components\panels\ArenaPanel.tsx"
Test-Path "app\page.tsx"
Test-Path "tailwind.config.ts"
Test-Path "middleware.ts"

# Mobile
Test-Path "mobile\src\screens\Home\HomeScreen.tsx"
Test-Path "mobile\src\components\DebateCard.tsx"
```

---

## 📊 Status Check (Quick)

```powershell
Write-Host "=== Merge Status ===" -ForegroundColor Cyan
Write-Host "Components: $((Get-ChildItem components -Recurse -File).Count) files" -ForegroundColor Green
Write-Host "Mobile: $((Get-ChildItem mobile\src -Recurse -File).Count) files" -ForegroundColor Green
Write-Host "Server: $(if (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }) { 'Running ✅' } else { 'Not Running ❌' })" -ForegroundColor $(if (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }) { 'Green' } else { 'Red' })
```

---

## 🎯 Most Common Commands

**Start everything:**
```powershell
npm install
npm run dev
```

**Check if server is running:**
```powershell
Get-NetTCPConnection -LocalPort 3000 | Where-Object { $_.State -eq "Listen" }
```

**Stop server:**
```powershell
Get-Process -Name node | Stop-Process -Force
```







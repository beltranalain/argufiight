# Quick Start Commands - PowerShell

## 🚀 Quick Start (Run These First)

```powershell
# 1. Navigate to project root
cd C:\Users\beltr\Honorable.AI

# 2. Install test dependencies
npm install --save-dev jest ts-jest @types/jest @jest/globals

# 3. Verify Prisma schema
npx prisma validate

# 4. Start backend server (Terminal 1)
npm run dev

# 5. Start mobile app (Terminal 2)
cd mobile
npm start
```

---

## 📋 Complete Checklist

### Backend Setup
```powershell
# Navigate to root
cd C:\Users\beltr\Honorable.AI

# Install test dependencies
npm install --save-dev jest ts-jest @types/jest @jest/globals

# Verify schema
npx prisma validate

# Generate Prisma client (if needed)
npx prisma generate

# Run linter
npm run lint

# Run tests
npm test
```

### Mobile App Setup
```powershell
# Navigate to mobile directory
cd C:\Users\beltr\Honorable.AI\mobile

# Install dependencies (if needed)
npm install

# Start Expo
npm start

# Or start specific platform
npm run ios        # iOS simulator
npm run android    # Android emulator
```

### Environment Setup
```powershell
# Check if .env exists
cd C:\Users\beltr\Honorable.AI
if (Test-Path .env) {
    Write-Host ".env exists"
} else {
    # Create .env file
    @"
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
"@ | Out-File -FilePath .env -Encoding utf8
}
```

### Testing
```powershell
# Run all tests
cd C:\Users\beltr\Honorable.AI
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run backend test scripts
node test-backend.js
node test-core-features.js
```

---

## 🔍 Verification Commands

### Check Project Health
```powershell
# Verify Prisma schema
npx prisma validate

# Check for linter errors
npm run lint

# Check TypeScript compilation
npx tsc --noEmit

# Check package.json scripts
Get-Content package.json | Select-String -Pattern "scripts" -Context 0,10
```

### Check Mobile App
```powershell
cd C:\Users\beltr\Honorable.AI\mobile

# Check mobile dependencies
npm list --depth=0

# Check for errors
npm run lint
```

---

## 🐛 Troubleshooting

### If Prisma errors occur:
```powershell
# Reset Prisma client
npx prisma generate --force

# Check database
npx prisma db push
```

### If mobile app won't start:
```powershell
cd C:\Users\beltr\Honorable.AI\mobile

# Clear cache
npm start -- --clear

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
```

### If tests fail:
```powershell
# Clear Jest cache
npm test -- --clearCache

# Run tests in verbose mode
npm test -- --verbose
```

---

## 📊 Status Check

```powershell
# Count API routes
Get-ChildItem -Path app\api -Directory -Recurse | Measure-Object | Select-Object -ExpandProperty Count

# Count mobile screens
cd mobile
Get-ChildItem -Path src\screens -Directory | Measure-Object | Select-Object -ExpandProperty Count

# Check test files
Get-ChildItem -Path tests -Recurse -Filter *.test.ts | Measure-Object | Select-Object -ExpandProperty Count
```

---

## 🎯 Next Steps Summary

1. ✅ **Install test dependencies**: `npm install --save-dev jest ts-jest @types/jest @jest/globals`
2. ✅ **Verify schema**: `npx prisma validate`
3. ✅ **Run tests**: `npm test`
4. ✅ **Start backend**: `npm run dev` (Terminal 1)
5. ✅ **Start mobile**: `cd mobile && npm start` (Terminal 2)
6. ✅ **Test the app**: Create a debate, accept it, submit statements
7. ✅ **Verify features**: Test edit/delete, comments, notifications

---

## 💡 Pro Tips

- **Use multiple terminals**: Keep backend and mobile running simultaneously
- **Watch mode**: Use `npm run test:watch` for continuous testing
- **Debug mode**: Use `npm run dev -- --inspect` for backend debugging
- **Expo DevTools**: Press `j` in Expo terminal to open debugger







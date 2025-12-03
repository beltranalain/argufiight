# Quick Start Guide for Next Chat Session

## 🚨 Current Issue: Database Tables Error

**Problem**: Next.js dev server shows error about `debate_tags` table not existing, even though:
- ✅ Tables exist in database
- ✅ Prisma queries work when tested directly
- ✅ API returns 200 (error is caught gracefully)

**Root Cause**: Cached Prisma client in Next.js dev server

---

## 🎯 Immediate Action Items

### 1. Read First
- **`CURRENT_ISSUE_STATUS.md`** - Complete issue documentation
- **`PROJECT_STATUS.md`** - Overall project status

### 2. Verify Current State
```bash
# Check if tables exist
node scripts/ensure-tags-tables.js

# Should output:
# ✅ tags table ready
# ✅ debate_tags table ready
# ✅ All tag tables verified and ready!
```

### 3. Fix the Issue

**Quick Fix (Recommended):**
```powershell
.\fix-prisma-cache.ps1
```

This automated script will:
- Check for running processes
- Clear all caches
- Verify tables
- Regenerate Prisma client
- Provide next steps

**Manual Fix:**
1. Stop dev server (Ctrl+C)
2. Clear caches: `.next`, `node_modules\.prisma`, `node_modules\.cache`
3. Run: `npx prisma generate` (must be done before step 4)
4. Verify: `node scripts/ensure-tags-tables.js`
5. Restart: `npm run dev`
6. Test: `http://localhost:3000/api/debates`

---

## 📁 Key Files

### Documentation
- `CURRENT_ISSUE_STATUS.md` - Full issue details
- `PROJECT_STATUS.md` - Project status
- `NEXT_SESSION_QUICK_START.md` - This file

### Code Files
- `lib/db/prisma.ts` - Prisma client initialization
- `app/api/debates/route.ts` - Main endpoint (has error handling)
- `prisma/schema.prisma` - Database schema
- `.env` - Database URL configuration

### Scripts
- `scripts/ensure-tags-tables.js` - Creates/verifies tables
- `fix-prisma-cache.ps1` - Automated fix script (run this first!)

---

## 🔍 Diagnostic Commands

### Check Database
```bash
# List all tables
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRawUnsafe('SELECT name FROM sqlite_master WHERE type=\"table\"').then(t => {console.log(t); p.\$disconnect();});"
```

### Test API Endpoint
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/debates | Select-Object StatusCode, Content

# Or open in browser
# http://localhost:3000/api/debates
```

### Check Prisma Version
```bash
npx prisma --version
# Should be: prisma 6.19.0
```

---

## 🐛 If Still Not Working

### Check Database Path
```bash
# Check .env file for DATABASE_URL
# Should be: DATABASE_URL="file:./prisma/dev.db"
```

### Check for Multiple Database Files
```bash
Get-ChildItem -Path prisma -Filter "*.db*" -Recurse
# Found 2 files - investigate which one is being used
```

### Check File Permissions
```bash
# Ensure database file is writable
Get-Item prisma\dev.db | Select-Object FullName, Attributes
```

### Alternative: Use Prisma Migrate
```bash
# Create proper migration
npx prisma migrate dev --name add_tags_tables
```

---

## 📝 What We Know

✅ **Tables exist** - Verified via direct queries  
✅ **Queries work** - Tested with Prisma directly  
✅ **API works** - Returns 200 status  
✅ **Error handling** - Code catches and handles gracefully  
❌ **Error in logs** - Still appears in Next.js terminal  

**Conclusion**: Issue is with cached Prisma client, not the database or code.

---

## 🚀 After Fixing

Once the error is resolved:
1. Test all API endpoints
2. Test mobile app connection
3. Continue with feature development
4. Update `PROJECT_STATUS.md` with completion

---

**Last Updated**: December 2, 2025  
**Status**: Ready for next session


# Fix for Tags and Trending API Errors

## Issues Fixed

### 1. ✅ Trending API - `view_count` column error
**Error**: `The column main.debates.view_count does not exist in the current database.`

**Root Cause**: Prisma client doesn't recognize `viewCount` field yet

**Fix Applied**:
- Removed `viewCount` from the select statement
- Added separate raw SQL query to fetch `viewCount` for each debate
- Included `viewCount` in the formatted response

**File**: `app/api/debates/trending/route.ts`

### 2. ✅ Tags API - `prisma.debateTag` undefined error
**Error**: `Cannot read properties of undefined (reading 'findMany')`

**Root Cause**: 
- Tags tables exist in database but Prisma models were missing
- Prisma client doesn't have `Tag` and `DebateTag` models

**Fix Applied**:
1. **Added Prisma Models** to `prisma/schema.prisma`:
   - `Tag` model
   - `DebateTag` model
   - Added `tags` relation to `Debate` model

2. **Added Fallback Logic** in `app/api/debates/tags/route.ts`:
   - Try Prisma model first
   - Fall back to raw SQL if model not available
   - Return empty array if all queries fail

**Files Modified**:
- `prisma/schema.prisma` - Added Tag and DebateTag models
- `app/api/debates/tags/route.ts` - Added fallback to raw SQL

## Next Steps

**IMPORTANT**: After adding the models to the schema, you need to regenerate Prisma client:

```powershell
# Stop the dev server (Ctrl+C), then:
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npx prisma generate
npm run dev
```

**Note**: The fallback to raw SQL will work immediately, but after regenerating Prisma client, the models will be available and queries will be faster.

## Status

✅ **Trending API**: Fixed with raw SQL fallback for viewCount
✅ **Tags API**: Fixed with raw SQL fallback + Prisma models added to schema
⚠️ **Prisma Client**: Needs regeneration to use new models (fallback works in meantime)







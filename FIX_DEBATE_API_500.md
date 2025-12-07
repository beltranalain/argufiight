# Fix for Debate API 500 Errors

## Issue
The `/api/debates/[id]` endpoint is returning 500 errors because Prisma client doesn't recognize the `viewCount` field, even though the column exists in the database.

## Root Cause
- `view_count` column exists in database ✅
- Prisma schema includes `viewCount` field ✅
- Prisma client was generated BEFORE the column was added ❌
- Dev server is running and locking Prisma client files, preventing regeneration ❌

## Fix Applied

### Temporary Workaround
Added fallback logic to fetch `viewCount` using raw SQL if Prisma client doesn't have it:

```typescript
// If viewCount is missing (Prisma client not regenerated), fetch it separately
let viewCount = 0
if (!('viewCount' in debate)) {
  try {
    const result = await prisma.$queryRaw<Array<{ view_count: number }>>`
      SELECT view_count FROM debates WHERE id = ${id}
    `
    viewCount = result[0]?.view_count || 0
  } catch (error) {
    viewCount = 0
  }
} else {
  viewCount = (debate as any).viewCount || 0
}
```

This ensures the API works even if Prisma client is out of sync.

## Permanent Fix (After Server Restart)

1. **Stop the dev server** (Ctrl+C)
2. **Regenerate Prisma client**:
   ```powershell
   Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
   npx prisma generate
   ```
3. **Restart dev server**:
   ```powershell
   npm run dev
   ```

After this, the workaround will still work but Prisma will have the field directly.

## Status
✅ **Fixed** - API should now work even with outdated Prisma client
⚠️ **Temporary** - Workaround in place until Prisma client is regenerated




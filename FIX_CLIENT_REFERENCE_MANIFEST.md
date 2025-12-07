# Fix clientReferenceManifest Error on Railway

## Problem
Railway is showing the error:
```
⨯ Error [InvariantError]: Invariant: Expected clientReferenceManifest to be defined. This is a bug in Next.js.
```

This is a known issue with Next.js 15.x and React 19, especially when the build is incomplete or there's a version mismatch.

## Root Cause
1. Railway might be running `next start` without a complete build
2. The `.next` directory might be missing the client reference manifest files
3. Next.js version mismatch (package.json shows 15.2.4, but Railway might be using 15.5.7)

## Solution

### Option 1: Ensure Build Runs on Railway (Recommended)

1. **Check Railway Build Settings:**
   - Go to Railway Dashboard → Your Service → Settings
   - Verify **Build Command** is set to: `npm run build`
   - Verify **Start Command** is set to: `npm start`

2. **Ensure Build Completes:**
   - Railway should automatically run `npm run build` before `npm start`
   - Check the build logs to ensure the build completes successfully
   - Look for: `✓ Compiled successfully` or similar success message

### Option 2: Update Start Script to Verify Build

The start script should verify the build exists before starting. Update `package.json`:

```json
"start": "node scripts/verify-build.js && node scripts/setup-database.js && next start"
```

### Option 3: Force Clean Build

If Railway is caching an incomplete build:

1. **Clear Railway Build Cache:**
   - Railway Dashboard → Your Service → Settings → Clear Build Cache
   - Redeploy

2. **Or add to build script:**
   ```json
   "build": "node scripts/clean-build.js && node scripts/regenerate-prisma.js && next build --no-lint"
   ```

### Option 4: Update Next.js Version

If the version mismatch is the issue, update Next.js:

```bash
npm install next@latest
```

Then commit and push:
```powershell
git add package.json package-lock.json
git commit -m "Update Next.js to latest version to fix clientReferenceManifest error"
git push
```

## Immediate Fix for Railway

1. **Go to Railway Dashboard**
2. **Your Service → Settings → Build & Deploy**
3. **Set Build Command:** `npm run build`
4. **Set Start Command:** `npm start`
5. **Clear Build Cache** (if available)
6. **Redeploy**

## Verification

After redeploying, check the logs:
- ✅ Should see: `✓ Compiled successfully`
- ✅ Should see: `✓ Ready in Xms`
- ❌ Should NOT see: `clientReferenceManifest` errors

## If Still Failing

1. Check Railway logs for build errors
2. Verify `.next` directory exists in build output
3. Try updating Next.js to latest version
4. Consider using `output: 'standalone'` in next.config.js (if Railway supports it)




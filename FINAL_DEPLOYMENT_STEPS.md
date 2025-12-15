# Final Deployment Steps - Clean Start

## Why Recreate?
- Clears all build cache
- Ensures latest code is deployed
- Fixes image upload issues (Vercel Blob Storage)
- Fresh Prisma client generation

## Step 1: Delete Current Project

1. Go to: https://vercel.com/dashboard
2. Click your project: **honorable-ai**
3. Go to **Settings** → Scroll to bottom
4. Click **Delete Project**
5. Type project name to confirm
6. Click **Delete**

## Step 2: Create New Project

1. Click **Add New** → **Project**
2. **Import Git Repository**:
   - Select: `beltranalain/Honorable.AI`
   - Click **Import**

3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detect)
   - **Output Directory**: `.next` (auto-detect)
   - **Install Command**: `npm install` (auto-detect)

4. **DO NOT CLICK DEPLOY YET** - Add environment variables first!

## Step 3: Add Environment Variables (CRITICAL)

**Before deploying**, go to **Settings** → **Environment Variables** and add:

### Required Variables:

1. **DATABASE_URL**
   ```
   postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```
   - Select: Production, Preview, Development

2. **AUTH_SECRET**
   ```
   344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837
   ```
   - Select: Production, Preview, Development

3. **NEXT_PUBLIC_APP_URL**
   ```
   https://honorable-ai.com
   ```
   - Select: Production, Preview, Development

4. **POSTGRES_URL** (optional but recommended)
   ```
   postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```
   - Select: Production, Preview, Development

5. **PRISMA_DATABASE_URL** (if you have it)
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=...
   ```
   - Select: Production, Preview, Development

6. **BLOB_READ_WRITE_TOKEN** (for image uploads - optional)
   - Go to Vercel Dashboard → Storage → Create Blob
   - Copy the token and add it here
   - If not set, images will use base64 fallback (works but less efficient)

## Step 4: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. Watch build logs to ensure success

## Step 5: Add Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `honorable-ai.com`
4. Follow DNS instructions (same as before)

## Step 6: Seed Database (After Deployment)

After deployment succeeds, run the seed script locally:

```powershell
cd C:\Users\beltr\Honorable.AI

$env:DATABASE_URL="postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"
$env:AUTH_SECRET="344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837"

npm run seed:all
```

## Step 7: Verify Everything Works

1. **Login**: `https://honorable-ai.vercel.app/login`
   - Should redirect to dashboard

2. **Admin Dashboard**: `https://honorable-ai.vercel.app/admin`
   - Categories should show 6 categories
   - Content Manager should show 5 sections
   - Legal Pages should show Terms and Privacy
   - AI Judges should show all judges

3. **Image Upload**: Try uploading an image in Content Manager
   - Should work with Vercel Blob Storage (or base64 fallback)

## What This Fixes

✅ Fresh build with all latest code
✅ Prisma engine binary correctly generated
✅ Image uploads using Vercel Blob Storage
✅ All admin features populated with data
✅ Trending Topics dynamic from database
✅ Login redirects working

---

**Note**: Your database data will remain intact - we're only recreating the Vercel project, not the database.







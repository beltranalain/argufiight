# Recreate Vercel Project - Step by Step

## Step 1: Delete Current Project

1. Go to: https://vercel.com/dashboard
2. Click on your project: **honorable-ai** (or whatever it's named)
3. Go to **Settings** → Scroll to bottom
4. Click **Delete Project**
5. Type the project name to confirm
6. Click **Delete**

## Step 2: Create New Project

1. In Vercel Dashboard, click **Add New** → **Project**
2. **Import Git Repository**:
   - Select: `beltranalain/Honorable.AI`
   - Click **Import**

3. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

4. Click **Deploy**

## Step 3: Add Environment Variables

**IMPORTANT**: Add these BEFORE the first deployment finishes:

1. Go to **Settings** → **Environment Variables**
2. Add each variable (for **Production**, **Preview**, and **Development**):

   ```
   DATABASE_URL=postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```

   ```
   AUTH_SECRET=344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837
   ```

   ```
   NEXT_PUBLIC_APP_URL=https://honorable-ai.com
   ```

   ```
   POSTGRES_URL=postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```

   ```
   PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19hRlB3LXdQRkd6eGVqSXBIMnFxNFQiLCJhcGlfa2V5IjoiMDFLQks0TVMxRkszVFJSU1BQRjA4NUdWWDAiLCJ0ZW5hbnRfaWQiOiJkMDY4NWNjZjU5NDQ2ZjRjZGYyYjFhY2Y2MDE2ZWQwNDVhZmUzMjUxNjUxZWYyZjY4ZDQxZmQ3YTcyZDViYzU2IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjM2NGY3NjItY2UwNC00OWFkLWFkNGItMjlhYjQ2MzRlMTBkIn0.FNY4AV-LCX_6EdS9268EQ8x_oQDxr9t0uuspm8oHYL8
   ```

3. **Save** each variable

## Step 4: Wait for Deployment

- The build will start automatically
- Wait 2-3 minutes for it to complete
- Watch the build logs to ensure it succeeds

## Step 5: Add Custom Domain (After Deployment)

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `honorable-ai.com`
4. Vercel will show DNS records to add in GoDaddy
5. Add the CNAME record in GoDaddy (as before)

## Step 6: Verify Everything Works

After deployment completes:

1. **Test Login**: `https://honorable-ai.vercel.app/login`
   - Should redirect to dashboard after login

2. **Test Admin Dashboard**: `https://honorable-ai.vercel.app/admin`
   - All pages should load (Categories, Content Manager, Legal Pages, AI Judges)

3. **Test Trending Topics**: `https://honorable-ai.vercel.app/`
   - Should show real data from database (or "No trending topics yet")

## What This Fixes

- ✅ Clears all build cache
- ✅ Fresh Prisma client generation
- ✅ All latest code changes
- ✅ Proper environment variables
- ✅ Clean deployment

---

**Note**: Your database data will remain intact - we're only recreating the Vercel project, not the database.






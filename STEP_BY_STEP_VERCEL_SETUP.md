# Step-by-Step: Fix Vercel 500 Error

## What We're Doing
Setting up environment variables in Vercel so your app can connect to the database.

---

## Step 1: Generate AUTH_SECRET (PowerShell)

Open PowerShell and run:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**IMPORTANT:** Copy the output (it will be a long string of letters and numbers). You'll need this in Step 3.

Example output might look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

## Step 2: Go to Vercel Environment Variables

1. Open your browser
2. Go to: https://vercel.com/dashboard
3. Click on your project (should be "honorable-ai" or similar)
4. Click **"Settings"** (top menu)
5. Click **"Environment Variables"** (left sidebar)

You should see:
- `DATABASE_URL` (currently wrong - has the node command)
- `NEXT_PUBLIC_APP_URL` (correct - has your domain)

---

## Step 3: Fix DATABASE_URL

1. Find `DATABASE_URL` in the list
2. Click the **edit icon** (pencil) next to it
3. **Delete** the current value (the node command)
4. **Paste** this exact value:

```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```

5. Make sure these are checked:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

6. Click **"Save"**

---

## Step 4: Add AUTH_SECRET

1. Click the **"Add Another"** button (or the + icon)
2. In the **"Key"** field, type: `AUTH_SECRET`
3. In the **"Value"** field, paste the output from Step 1 (the long hex string you generated)
4. Make sure these are checked:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

---

## Step 5: Verify Your Variables

You should now have 3 environment variables:

1. ✅ `DATABASE_URL` = `postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require`
2. ✅ `AUTH_SECRET` = (your generated hex string)
3. ✅ `NEXT_PUBLIC_APP_URL` = `https://honorable-ai.com`

---

## Step 6: Redeploy

1. Click **"Deployments"** (top menu)
2. Find the latest deployment
3. Click the **three dots** (⋯) on the right
4. Click **"Redeploy"**
5. Wait 2-3 minutes for it to finish

---

## Step 7: Test It

1. Go to your website: `https://honorable-ai.com`
2. Try to sign up with a new account
3. If it works, you're done! 🎉

If you still get an error, go to Step 8.

---

## Step 8: Run Database Migrations (If Still Getting Errors)

If you still get a 500 error after redeploying, you need to run database migrations.

### Option A: Using Vercel CLI (Recommended)

Open PowerShell and run these commands one by one:

```powershell
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Login to Vercel
vercel login
# (This will open a browser - follow the prompts)

# 3. Navigate to your project folder
cd C:\Users\beltr\Honorable.AI

# 4. Link to your Vercel project
vercel link
# (Select your project when prompted)

# 5. Pull environment variables
vercel env pull .env.local

# 6. Run migrations
npx prisma migrate deploy
```

### Option B: Add to Build Command (Easier)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Build & Development Settings**
2. Find **"Build Command"**
3. Change it from:
   ```
   npm run build
   ```
   To:
   ```
   npm run build && npx prisma migrate deploy
   ```
4. Click **"Save"**
5. Go to **Deployments** → **Redeploy**

---

## Troubleshooting

### Still Getting 500 Error?

1. **Check Vercel Logs:**
   - Go to Deployments → Latest deployment
   - Click **"Functions"** tab
   - Click on `/api/auth/signup`
   - Look at the error message

2. **Test Database Connection:**
   - Visit: `https://honorable-ai.com/api/test-db`
   - This will show you what's wrong

3. **Verify Environment Variables:**
   - Go back to Settings → Environment Variables
   - Make sure all 3 variables are there
   - Make sure Production/Preview/Development are all checked

---

## Quick Checklist

Before testing, make sure:
- [ ] DATABASE_URL is set (not the node command)
- [ ] AUTH_SECRET is set (long hex string)
- [ ] NEXT_PUBLIC_APP_URL is set to your domain
- [ ] All variables have Production/Preview/Development checked
- [ ] You clicked "Save" after adding/editing
- [ ] You redeployed after making changes

---

## Need Help?

If you're stuck at any step, tell me:
1. Which step you're on
2. What error message you see (if any)
3. What you see on your screen

I'll help you through it!






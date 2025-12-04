# Step-by-Step: Deploy to honorable-ai.com with Vercel

## Prerequisites
- ✅ GitHub account with your code pushed
- ✅ GoDaddy account with honorable-ai.com
- ✅ 15-20 minutes

---

## Part 1: Deploy to Vercel (5 minutes)

### Step 1.1: Sign Up / Log In
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 1.2: Import Project
1. After logging in, click **"Add New..."** → **"Project"**
2. You should see your GitHub repositories
3. Find **`Honorable.AI`** (or `beltranalain/Honorable.AI`)
4. Click **"Import"** next to it

### Step 1.3: Configure Project
Vercel auto-detects Next.js, but verify:

**Framework Preset:**
- Should show: **Next.js** ✅

**Root Directory:**
- Leave as: **`.`** (root directory)

**Build and Output Settings:**
- Build Command: `npm run build` ✅
- Output Directory: `.next` ✅
- Install Command: `npm install` ✅

**Environment Variables:**
Click **"Environment Variables"** and add:

```
DATABASE_URL=your-postgresql-connection-string-here
AUTH_SECRET=generate-this-below
NEXT_PUBLIC_APP_URL=https://honorable-ai.com
```

**Generate AUTH_SECRET (run in PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste as `AUTH_SECRET` value.

### Step 1.4: Deploy
1. Click **"Deploy"** button (bottom right)
2. Wait 2-3 minutes for build
3. You'll get a temporary URL like: `https://honorable-ai-abc123.vercel.app`
4. **Don't worry about this URL** - we'll use your custom domain next!

---

## Part 2: Add Custom Domain (2 minutes)

### Step 2.1: Add Domain in Vercel
1. In Vercel Dashboard, go to your project
2. Click **"Settings"** tab (top menu)
3. Click **"Domains"** (left sidebar)
4. Click **"Add Domain"** button
5. Enter: `honorable-ai.com`
6. Click **"Add"**

### Step 2.2: Add www Subdomain (Optional but Recommended)
1. Still in Domains section
2. Click **"Add Domain"** again
3. Enter: `www.honorable-ai.com`
4. Click **"Add"**

### Step 2.3: Get DNS Records
Vercel will show you DNS configuration. You'll see something like:

**For Root Domain (honorable-ai.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**📝 Write these down or keep this page open!**

---

## Part 3: Configure GoDaddy DNS (5 minutes)

### Step 3.1: Access DNS Settings
1. Go to [godaddy.com](https://godaddy.com)
2. Sign in to your account
3. Click **"My Products"** (top menu)
4. Find **"Domains"** section
5. Click on **`honorable-ai.com`**
6. Click **"DNS"** or **"Manage DNS"** button

### Step 3.2: Update A Record (Root Domain)
1. Find the **A record** with Name `@` (or blank)
2. **Edit** it (or create new if doesn't exist):
   - **Type**: `A`
   - **Name**: `@` (or leave blank)
   - **Value**: The IP address from Vercel (e.g., `76.76.21.21`)
   - **TTL**: `600` (or default)
3. Click **"Save"**

**⚠️ Important:** If there are multiple A records, delete the old ones and keep only the Vercel one.

### Step 3.3: Update CNAME Record (www Subdomain)
1. Find the **CNAME record** with Name `www`
2. **Edit** it (or create new if doesn't exist):
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com` (or what Vercel shows)
   - **TTL**: `600` (or default)
3. Click **"Save"**

### Step 3.4: Remove Conflicting Records
- Delete any old A/CNAME records pointing to other services
- Keep only the Vercel records you just added

---

## Part 4: Wait for DNS Propagation (5-30 minutes)

### Step 4.1: Check Status in Vercel
1. Go back to Vercel Dashboard → Your Project → Settings → Domains
2. You'll see status for `honorable-ai.com`:
   - ⏳ **"Pending"** = DNS not propagated yet (wait)
   - ✅ **"Valid Configuration"** = DNS is correct! (ready)
   - ❌ **"Invalid Configuration"** = DNS records wrong (check again)

### Step 4.2: Check DNS Propagation (Optional)
Visit [whatsmydns.net](https://whatsmydns.net) and enter `honorable-ai.com` to see if DNS has propagated globally.

### Step 4.3: SSL Certificate
- Vercel automatically generates SSL certificate
- Takes 5-10 minutes after DNS is valid
- You'll see "Valid Configuration" when ready

---

## Part 5: Verify It Works (2 minutes)

### Step 5.1: Test Your Domain
1. Wait for Vercel to show "Valid Configuration"
2. Open browser and go to: `https://honorable-ai.com`
3. Your site should load! 🎉

### Step 5.2: Test www Subdomain
1. Go to: `https://www.honorable-ai.com`
2. Should redirect to or show same site

### Step 5.3: Update Environment Variable
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Make sure `NEXT_PUBLIC_APP_URL` is: `https://honorable-ai.com`
3. If you changed it, Vercel will auto-redeploy

---

## ✅ You're Done!

Your site is now live at:
- 🌐 **https://honorable-ai.com**
- 🌐 **https://www.honorable-ai.com**

---

## 🔧 Troubleshooting

### "Invalid Configuration" in Vercel?
- Double-check DNS records match exactly
- Make sure you removed old records
- Wait 10-15 minutes and refresh

### Site Not Loading?
- Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
- Verify SSL certificate is active (should be automatic)
- Check Vercel deployment logs for errors

### Still Having Issues?
1. Check Vercel's domain documentation
2. Contact Vercel support (they're very helpful)
3. Verify GoDaddy DNS settings match Vercel's requirements exactly

---

## 📝 Quick Reference

**Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
**GoDaddy DNS:** [dcc.godaddy.com](https://dcc.godaddy.com)
**Check DNS:** [whatsmydns.net](https://whatsmydns.net)


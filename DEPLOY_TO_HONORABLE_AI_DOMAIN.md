# Deploy to honorable-ai.com (GoDaddy Domain)

You own `honorable-ai.com` on GoDaddy. Here are the best options to deploy your Next.js project to this domain.

## 🏆 Recommended: Vercel (Best for Next.js + Custom Domain)

**Why Vercel:**
- ✅ Made by Next.js creators (perfect compatibility)
- ✅ Free SSL certificate (HTTPS)
- ✅ Easy custom domain setup
- ✅ Automatic deployments from GitHub
- ✅ Free tier is generous
- ✅ Built-in CDN for fast global performance

### Step 1: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up with GitHub** (easiest way)
3. **Import your project:**
   - Click "Add New..." → "Project"
   - Find `Honorable.AI` repository
   - Click "Import"

4. **Configure Build Settings:**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Root Directory: `./`

5. **Add Environment Variables:**
   ```
   DATABASE_URL=your-postgresql-connection-string
   AUTH_SECRET=generate-a-random-32-char-string
   NEXT_PUBLIC_APP_URL=https://honorable-ai.com
   ```
   
   **Generate AUTH_SECRET:**
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get: `https://honorable-ai-xyz.vercel.app` (temporary URL)

### Step 2: Add Custom Domain to Vercel

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Domains**
   - Click **"Add Domain"**
   - Enter: `honorable-ai.com`
   - Also add: `www.honorable-ai.com` (optional but recommended)

2. **Vercel will show you DNS records to add:**
   - You'll see something like:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

### Step 3: Configure GoDaddy DNS

1. **Log into GoDaddy:**
   - Go to [godaddy.com](https://godaddy.com)
   - Sign in
   - Go to **My Products** → **Domains**
   - Click on `honorable-ai.com`
   - Click **"DNS"** or **"Manage DNS"**

2. **Update DNS Records:**
   
   **Option A: Use A Record (Recommended)**
   - Find existing A record for `@` (or create new)
   - Set **Type**: `A`
   - Set **Name**: `@` (or leave blank)
   - Set **Value**: The IP address Vercel gave you (e.g., `76.76.21.21`)
   - Set **TTL**: `600` (or default)
   - **Save**

   **For www subdomain:**
   - Find or create CNAME record
   - Set **Type**: `CNAME`
   - Set **Name**: `www`
   - Set **Value**: `cname.vercel-dns.com` (or what Vercel shows)
   - **Save**

   **Option B: Use CNAME (Alternative)**
   - Some prefer CNAME for root domain
   - Vercel will tell you which to use

3. **Remove conflicting records:**
   - Delete any old A records pointing to other IPs
   - Keep only the Vercel records

### Step 4: Wait for DNS Propagation

- **DNS changes take 5 minutes to 48 hours** (usually 15-30 minutes)
- Vercel will show "Valid Configuration" when DNS is correct
- You can check status in Vercel Dashboard → Domains

### Step 5: Update Environment Variable

Once domain is active:
1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to: `https://honorable-ai.com`
3. Redeploy (or wait for auto-deploy)

---

## 🚀 Alternative Option 1: Netlify

**Why Netlify:**
- ✅ Free tier
- ✅ Easy custom domain
- ✅ Good Next.js support
- ✅ Free SSL

### Steps:

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up with GitHub**
3. **Import project:**
   - "Add new site" → "Import an existing project"
   - Select `Honorable.AI`
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
4. **Add custom domain:**
   - Site settings → Domain management
   - Add `honorable-ai.com`
   - Follow DNS instructions (similar to Vercel)
5. **Update GoDaddy DNS** with Netlify's DNS records

---

## 🚀 Alternative Option 2: Render

**Why Render:**
- ✅ Free tier
- ✅ PostgreSQL included
- ✅ Simple setup
- ✅ Custom domain support

### Steps:

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Create Web Service:**
   - "New" → "Web Service"
   - Connect `Honorable.AI` repo
   - Build command: `npm run build`
   - Start command: `npm start`
4. **Add custom domain:**
   - Settings → Custom Domains
   - Add `honorable-ai.com`
   - Update GoDaddy DNS with Render's records

---

## 🚀 Alternative Option 3: Keep Railway + Add Custom Domain

If you want to stick with Railway:

1. **In Railway Dashboard:**
   - Your service → **Settings** → **Networking**
   - Click **"Generate Domain"** (if not done)
   - Then click **"Custom Domain"**
   - Enter: `honorable-ai.com`

2. **Railway will give you DNS records:**
   - Usually a CNAME record
   - Example: `honorable-ai.com` → `your-app.railway.app`

3. **Update GoDaddy DNS:**
   - Add CNAME record as Railway instructs
   - Wait for propagation

---

## 📋 Quick Comparison

| Platform | Free Tier | Custom Domain | SSL | Database | Best For |
|----------|-----------|---------------|-----|----------|----------|
| **Vercel** | ✅ Yes | ✅ Easy | ✅ Auto | ❌ Separate | **Next.js apps** ⭐ |
| **Netlify** | ✅ Yes | ✅ Easy | ✅ Auto | ❌ Separate | Static/Next.js |
| **Render** | ✅ Yes | ✅ Easy | ✅ Auto | ✅ Included | Full-stack apps |
| **Railway** | ✅ $5 credit | ✅ Easy | ✅ Auto | ✅ Included | Full-stack apps |

---

## 🎯 My Recommendation

**Use Vercel** because:
1. Made by Next.js team (best compatibility)
2. Easiest custom domain setup
3. Free SSL included
4. Fast global CDN
5. Automatic deployments

You can still use Railway or another service for your PostgreSQL database if needed.

---

## ⚡ Quick Start Commands (PowerShell)

After choosing a platform, commit and push:

```powershell
cd C:\Users\beltr\Honorable.AI

# Check status
git status

# Add changes
git add .

# Commit
git commit -m "Ready for production deployment"

# Push to GitHub
git push
```

Then follow the platform-specific steps above.

---

## 🔧 Troubleshooting

### DNS Not Working?
- Wait 15-30 minutes (DNS propagation takes time)
- Check DNS records match exactly (no typos)
- Use [whatsmydns.net](https://whatsmydns.net) to check propagation
- Make sure TTL is set correctly

### SSL Certificate Issues?
- Vercel/Netlify/Render auto-generate SSL
- Just wait for DNS to propagate
- SSL activates automatically once DNS is correct

### Domain Already in Use?
- If domain was used elsewhere, clear old DNS records
- Remove all old A/CNAME records
- Add only the new platform's records

---

## 📞 Need Help?

If you get stuck:
1. Check the platform's documentation
2. Look at their DNS setup guides
3. Contact their support (usually very helpful)

**Most common issue:** DNS records not matching exactly - double-check the values!




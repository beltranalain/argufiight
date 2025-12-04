# Configure argufight.com Domain - Step-by-Step Guide

This guide will walk you through setting up `argufight.com` to work with your Vercel deployment.

---

## 📋 Prerequisites

- ✅ Vercel account with your project deployed
- ✅ GoDaddy account with `argufight.com` domain
- ✅ Access to both dashboards

---

## Part 1: Configure Vercel (Add Domain)

### Step 1: Go to Vercel Dashboard
1. Visit [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Log in to your account
3. Find and click on your project: **honorable-ai** (or whatever it's named)

### Step 2: Add Custom Domain
1. In your project dashboard, click on **Settings** (top menu)
2. Click on **Domains** (left sidebar)
3. Click **Add Domain** button
4. Enter: `argufight.com`
5. Click **Add**

### Step 3: Add WWW Subdomain (Optional but Recommended)
1. Still in the Domains section
2. Click **Add Domain** again
3. Enter: `www.argufight.com`
4. Click **Add**

### Step 4: Get DNS Records from Vercel
After adding the domains, Vercel will show you DNS records to configure. You'll see something like:

**For Root Domain (argufight.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW (www.argufight.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**OR** Vercel might give you:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**📝 IMPORTANT**: Copy these values - you'll need them for GoDaddy!

---

## Part 2: Configure GoDaddy DNS

### Step 1: Log into GoDaddy
1. Visit [https://www.godaddy.com](https://www.godaddy.com)
2. Click **Sign In** (top right)
3. Log in with your credentials

### Step 2: Access DNS Management
1. Click on your name (top right) → **My Products**
2. Find **Domains** section
3. Find `argufight.com` in the list
4. Click the **DNS** button (or three dots → **Manage DNS**)

### Step 3: Delete Existing A Records (if any)
1. Look for existing **A** records with Name `@` or blank
2. Click the **pencil icon** (edit) next to each one
3. Click **Delete** or **Remove**
4. Confirm deletion

### Step 4: Add Vercel A Record (Root Domain)
1. In the DNS records table, click **Add** button
2. Select **A** from the Type dropdown
3. Configure:
   - **Name**: `@` (or leave blank - depends on GoDaddy interface)
   - **Value**: `76.76.21.21` (use the IP from Vercel)
   - **TTL**: `600` (or default)
4. Click **Save**

### Step 5: Add Vercel CNAME Record (WWW)
1. Click **Add** button again
2. Select **CNAME** from the Type dropdown
3. Configure:
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com` (use the value from Vercel)
   - **TTL**: `600` (or default)
4. Click **Save**

### Step 6: Remove Conflicting Records
1. Look for any other A or CNAME records that might conflict
2. Common ones to check:
   - Any A records pointing to GoDaddy IPs
   - Any CNAME records for `www` pointing elsewhere
   - Any forwarding rules
3. Delete or disable conflicting records

### Step 7: Verify DNS Records
Your DNS table should now look like this:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

**Note**: The exact IP and CNAME values may differ - use what Vercel shows you!

---

## Part 3: Wait for DNS Propagation

### What is DNS Propagation?
DNS changes take time to spread across the internet. This can take:
- **Minimum**: 5-10 minutes
- **Average**: 1-2 hours
- **Maximum**: 24-48 hours

### How to Check if DNS is Working

**Option 1: Use Online Tools**
1. Visit [https://dnschecker.org](https://dnschecker.org)
2. Enter: `argufight.com`
3. Select **A** record type
4. Click **Search**
5. Wait for results - should show `76.76.21.21` (or your Vercel IP)

**Option 2: Use Command Line**
```powershell
# Check A record
nslookup argufight.com

# Check CNAME record
nslookup www.argufight.com
```

**Option 3: Check in Vercel**
1. Go back to Vercel → Your Project → Settings → Domains
2. Look at `argufight.com` status
3. It will show:
   - ⏳ **Pending** - DNS not configured yet
   - ✅ **Valid Configuration** - DNS is correct, waiting for SSL
   - ✅ **Valid** - Everything is working!

---

## Part 4: SSL Certificate (Automatic)

### Vercel Handles SSL Automatically
1. Once DNS is configured correctly
2. Vercel will automatically:
   - Detect the domain
   - Request SSL certificate from Let's Encrypt
   - Install the certificate
   - Enable HTTPS

**This usually takes 5-15 minutes after DNS is configured.**

### Check SSL Status
1. Go to Vercel → Your Project → Settings → Domains
2. Look for SSL status next to your domain
3. Statuses:
   - ⏳ **Pending** - Certificate being issued
   - ✅ **Valid** - SSL is active

---

## Part 5: Update Environment Variables

### Update NEXT_PUBLIC_APP_URL
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update it to: `https://argufight.com`
4. Make sure it's set for **Production**, **Preview**, and **Development**
5. Click **Save**

### Redeploy (if needed)
After updating environment variables:
1. Go to **Deployments** tab
2. Click the three dots on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

---

## Part 6: Verify Everything Works

### Test 1: Check Domain
1. Visit `https://argufight.com`
2. Should load your Next.js app (not GoDaddy placeholder)
3. Should show HTTPS (lock icon in browser)

### Test 2: Check WWW
1. Visit `https://www.argufight.com`
2. Should redirect to `https://argufight.com` (or load the same)

### Test 3: Test API Endpoints
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "https://argufight.com/api/health" -UseBasicParsing

# Test debates API
Invoke-WebRequest -Uri "https://argufight.com/api/debates?status=WAITING" -UseBasicParsing
```

### Test 4: Check Vercel Dashboard
1. Go to Vercel → Your Project → Settings → Domains
2. Both domains should show:
   - ✅ **Valid Configuration**
   - ✅ **SSL: Valid**

---

## 🚨 Troubleshooting

### Problem: Domain shows "Invalid Configuration" in Vercel

**Solution**:
1. Double-check DNS records in GoDaddy match Vercel exactly
2. Wait 10-15 minutes for DNS to propagate
3. Use [dnschecker.org](https://dnschecker.org) to verify DNS is correct globally
4. Make sure you're using the correct IP/CNAME from Vercel

---

### Problem: SSL Certificate Not Issuing

**Solution**:
1. Verify DNS is correctly configured (use dnschecker.org)
2. Wait 15-30 minutes (SSL can take time)
3. Check Vercel logs for SSL errors
4. Make sure domain is added correctly in Vercel

---

### Problem: Site Still Shows GoDaddy Placeholder

**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private window
3. Check DNS propagation (dnschecker.org)
4. Verify DNS records are correct
5. Wait longer (up to 24 hours for full propagation)

---

### Problem: "This site can't be reached" or Connection Error

**Solution**:
1. Check if DNS is propagated (dnschecker.org)
2. Verify A record points to correct Vercel IP
3. Check Vercel deployment is active
4. Try `www.argufight.com` instead
5. Wait for DNS propagation

---

### Problem: Mixed Content Warnings

**Solution**:
1. Make sure `NEXT_PUBLIC_APP_URL` is set to `https://argufight.com`
2. Check all API calls use HTTPS
3. Redeploy after updating environment variables

---

## 📝 Quick Checklist

### Vercel Setup
- [ ] Added `argufight.com` domain
- [ ] Added `www.argufight.com` domain (optional)
- [ ] Copied DNS records from Vercel
- [ ] Updated `NEXT_PUBLIC_APP_URL` to `https://argufight.com`

### GoDaddy Setup
- [ ] Deleted old A records
- [ ] Added new A record with Vercel IP
- [ ] Added CNAME record for www
- [ ] Removed conflicting records

### Verification
- [ ] DNS propagated (checked with dnschecker.org)
- [ ] SSL certificate issued (check Vercel dashboard)
- [ ] Site loads at `https://argufight.com`
- [ ] HTTPS works (lock icon in browser)
- [ ] API endpoints work

---

## 🎯 Expected Timeline

1. **DNS Configuration**: 5 minutes
2. **DNS Propagation**: 1-2 hours (can be up to 24 hours)
3. **SSL Certificate**: 5-15 minutes after DNS is correct
4. **Total**: Usually 1-3 hours, maximum 24-48 hours

---

## 📞 Need Help?

If you're stuck:
1. Check Vercel documentation: [https://vercel.com/docs/concepts/projects/domains](https://vercel.com/docs/concepts/projects/domains)
2. Check GoDaddy DNS help: [https://www.godaddy.com/help](https://www.godaddy.com/help)
3. Verify DNS with: [https://dnschecker.org](https://dnschecker.org)

---

**Last Updated**: After domain configuration  
**Status**: Ready to configure


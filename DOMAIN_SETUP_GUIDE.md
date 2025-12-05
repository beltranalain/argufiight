# Domain Setup Guide: Connect anyfight.com to Vercel

## Overview
This guide will help you connect your `anyfight.com` domain from GoDaddy to your Vercel deployment.

---

## Part 1: Vercel Setup

### Step 1: Add Domain to Vercel Project

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Log in with your account

2. **Select Your Project**
   - Click on your project (likely named "argufight" or "Honorable.AI")

3. **Go to Settings**
   - Click on the **"Settings"** tab at the top

4. **Open Domains Section**
   - In the left sidebar, click **"Domains"**

5. **Add Domain**
   - Click the **"Add"** or **"Add Domain"** button
   - Enter: `anyfight.com`
   - Click **"Add"**

6. **Vercel Will Show You DNS Records**
   - After adding, Vercel will display DNS records you need to add
   - You'll see something like:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```
   - **IMPORTANT:** Copy these values - you'll need them for GoDaddy

---

## Part 2: GoDaddy Setup

### Step 2: Access GoDaddy DNS Settings

1. **Log in to GoDaddy**
   - Visit: https://www.godaddy.com
   - Click **"Sign In"** (top right)
   - Enter your credentials

2. **Go to My Products**
   - Click **"My Products"** in the top menu
   - Or visit: https://sso.godaddy.com/products

3. **Find Your Domain**
   - Look for `anyfight.com` in your domain list
   - Click the **"DNS"** button next to it
   - Or click the three dots (⋯) → **"Manage DNS"**

### Step 3: Update DNS Records in GoDaddy

**IMPORTANT:** You need to replace existing records, not just add new ones.

#### Option A: If you see existing A records for @ (root domain)

1. **Find the A record for @ (root domain)**
   - Look for a record with:
     - **Type:** A
     - **Name:** @
     - **Value:** (some IP address)

2. **Edit the A record**
   - Click the **pencil icon** (✏️) next to the A record
   - Change the **Value** to the IP address Vercel provided (e.g., `76.76.21.21`)
   - Click **"Save"**

#### Option B: If there's no A record for @

1. **Add A record**
   - Click **"Add"** button
   - Select **Type:** A
   - **Name:** @ (or leave blank, or enter `anyfight.com`)
   - **Value:** The IP address from Vercel (e.g., `76.76.21.21`)
   - **TTL:** 600 (or default)
   - Click **"Save"**

#### Step 4: Add/Update CNAME for www

1. **Check for existing www CNAME**
   - Look for a record with:
     - **Type:** CNAME
     - **Name:** www

2. **If it exists:**
   - Click the **pencil icon** (✏️)
   - Change **Value** to: `cname.vercel-dns.com` (or what Vercel provided)
   - Click **"Save"**

3. **If it doesn't exist:**
   - Click **"Add"**
   - **Type:** CNAME
   - **Name:** www
   - **Value:** `cname.vercel-dns.com` (or what Vercel provided)
   - **TTL:** 600 (or default)
   - Click **"Save"**

### Step 5: Remove Conflicting Records (Important!)

**Check for these and DELETE them if they exist:**

1. **Other A records pointing to different IPs**
   - If you see multiple A records for @, keep only the one pointing to Vercel's IP

2. **CNAME records for @ (root domain)**
   - GoDaddy doesn't allow CNAME on root domain, so if you see one, delete it

3. **Parking page records**
   - Delete any records pointing to GoDaddy's parking pages

---

## Part 3: Verify and Wait

### Step 6: Wait for DNS Propagation

1. **DNS changes take time**
   - Usually: 5 minutes to 24 hours
   - Average: 1-2 hours
   - Can be as fast as 5-10 minutes

2. **Check DNS propagation**
   - Visit: https://www.whatsmydns.net
   - Enter: `anyfight.com`
   - Check if it shows Vercel's IP address

### Step 7: Verify in Vercel

1. **Go back to Vercel**
   - Go to your project → Settings → Domains
   - You should see `anyfight.com` listed

2. **Check Status**
   - It will show:
     - ✅ **"Valid Configuration"** (green) = Ready!
     - ⏳ **"Pending"** = Still waiting for DNS
     - ❌ **"Invalid Configuration"** = Check your DNS records

3. **Vercel will automatically:**
   - Issue SSL certificate (HTTPS)
   - Configure the domain
   - This usually takes 1-2 minutes after DNS is correct

---

## Part 4: Test Your Domain

### Step 8: Test the Connection

1. **Wait 10-15 minutes after DNS changes**

2. **Test root domain:**
   - Visit: `https://anyfight.com`
   - Should load your Vercel site

3. **Test www subdomain:**
   - Visit: `https://www.anyfight.com`
   - Should also load your Vercel site

4. **Both should redirect to HTTPS automatically**

---

## Troubleshooting

### Problem: Domain shows "Invalid Configuration" in Vercel

**Solutions:**
1. Double-check DNS records match exactly what Vercel provided
2. Make sure you're editing the correct domain in GoDaddy
3. Wait longer (DNS can take up to 24 hours)
4. Clear your browser cache
5. Try accessing from a different network/device

### Problem: Domain loads but shows "Not Found" or Vercel 404

**Solutions:**
1. Make sure your Vercel project is deployed
2. Check that the domain is added to the correct Vercel project
3. Verify your project settings in Vercel

### Problem: DNS changes not showing up

**Solutions:**
1. Clear DNS cache:
   - Windows: Open Command Prompt → `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
2. Try a different DNS server (use 8.8.8.8 or 1.1.1.1)
3. Wait longer - some regions take more time

### Problem: SSL Certificate not issued

**Solutions:**
1. Make sure DNS is fully propagated (check with whatsmydns.net)
2. Wait 5-10 minutes after DNS is correct
3. Vercel automatically issues SSL - it should work automatically

---

## Quick Reference: Common DNS Values

### Vercel DNS Records (Example - use what Vercel shows you)

```
A Record:
Type: A
Name: @
Value: 76.76.21.21
TTL: 600

CNAME Record:
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

**Note:** Your actual values may differ. Always use what Vercel shows in your project settings.

---

## After Setup: Update Environment Variables

Once your domain is working, update these in Vercel:

1. **Go to Vercel Project → Settings → Environment Variables**

2. **Update:**
   - `NEXTAUTH_URL` = `https://anyfight.com`
   - `NEXT_PUBLIC_APP_URL` = `https://anyfight.com`

3. **Redeploy** your project for changes to take effect

---

## Summary Checklist

- [ ] Added domain to Vercel project
- [ ] Copied DNS records from Vercel
- [ ] Updated A record in GoDaddy (@ → Vercel IP)
- [ ] Updated/Added CNAME record in GoDaddy (www → Vercel CNAME)
- [ ] Removed conflicting DNS records
- [ ] Waited for DNS propagation (check with whatsmydns.net)
- [ ] Verified domain shows "Valid Configuration" in Vercel
- [ ] Tested https://anyfight.com
- [ ] Tested https://www.anyfight.com
- [ ] Updated environment variables in Vercel
- [ ] Redeployed project

---

## Need Help?

If you get stuck:
1. Check Vercel's domain documentation: https://vercel.com/docs/concepts/projects/domains
2. Check GoDaddy's DNS help: https://www.godaddy.com/help
3. Verify DNS with: https://www.whatsmydns.net


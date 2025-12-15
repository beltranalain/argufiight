# Configure GoDaddy Domain to Point to Vercel

Your domain `honorable-ai.com` is currently pointing to GoDaddy's placeholder page. You need to configure DNS to point to Vercel.

## Step 1: Get DNS Records from Vercel

1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Domains**
3. Add domain: `honorable-ai.com`
4. Vercel will show you DNS records to add:
   - **A Record** or **CNAME Record**
   - Usually something like:
     - Type: `A` → Value: `76.76.21.21` (Vercel's IP)
     - OR Type: `CNAME` → Value: `cname.vercel-dns.com.`

## Step 2: Update DNS in GoDaddy

1. Go to: https://www.godaddy.com
2. Log in to your account
3. Go to **My Products** → **Domains**
4. Find `honorable-ai.com` → Click **DNS** (or **Manage DNS**)

### Option A: If Vercel gives you an A Record

1. Find the existing **A Record** for `@` (root domain)
2. **Edit** it:
   - **Type:** A
   - **Name:** @ (or leave blank)
   - **Value:** The IP address Vercel provides (e.g., `76.76.21.21`)
   - **TTL:** 600 (or default)
3. **Save**

### Option B: If Vercel gives you a CNAME Record

1. **Delete** any existing A records for `@`
2. **Add** a new record:
   - **Type:** CNAME
   - **Name:** @ (or leave blank for root domain)
   - **Value:** The CNAME Vercel provides (e.g., `cname.vercel-dns.com.`)
   - **TTL:** 600
3. **Save**

**Note:** Some DNS providers don't allow CNAME on root domain. If GoDaddy doesn't allow it:
- Use the A record option instead
- Or use a subdomain like `www.honorable-ai.com` with CNAME

## Step 3: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes**
- You can check status at: https://dnschecker.org

## Step 4: Verify in Vercel

1. Go back to Vercel → Your Project → **Settings** → **Domains**
2. Vercel will show:
   - ✅ **Valid Configuration** (when DNS is correct)
   - ⚠️ **Pending** (while waiting for DNS)
   - ❌ **Invalid Configuration** (if DNS is wrong)

## Step 5: Test

After DNS propagates:
- Visit: `https://honorable-ai.com` (should show your Vercel app)
- Visit: `https://honorable-ai.com/admin` (should work)

---

## Quick Reference

**Vercel Dashboard:**
- https://vercel.com/dashboard → Your Project → Settings → Domains

**GoDaddy DNS:**
- https://www.godaddy.com → My Products → Domains → honorable-ai.com → DNS

**Check DNS Status:**
- https://dnschecker.org (enter `honorable-ai.com`)

---

## If You Need Help

If you're not sure which DNS records to use:
1. Add the domain in Vercel first
2. Vercel will show you **exactly** what DNS records to add
3. Copy those records to GoDaddy







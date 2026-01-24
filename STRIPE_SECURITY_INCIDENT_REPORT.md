# 🚨 STRIPE SECURITY INCIDENT REPORT

## CRITICAL: Hardcoded API Keys Found

**Date**: 2026-01-24
**Severity**: CRITICAL
**Status**: COMPROMISED KEYS MUST BE ROTATED IMMEDIATELY

---

## What Happened

Found **LIVE Stripe API keys hardcoded** in the codebase:
- File: `scripts/update-stripe-keys.ts` (now deleted)
- Keys exposed:
  - `STRIPE_SECRET_KEY` starting with `sk_live_51ScEnJ...`
  - `STRIPE_PUBLISHABLE_KEY` starting with `pk_live_51ScEnJ...`

**Security Impact**: Anyone with access to this codebase (including Git history) can see these keys.

---

## IMMEDIATE ACTIONS REQUIRED

### ⚠️ Step 1: Rotate Stripe Keys (DO THIS NOW)

1. **Go to Stripe Dashboard**:
   - Login at [dashboard.stripe.com](https://dashboard.stripe.com)
   - Navigate to Developers → API keys

2. **Delete Compromised Keys**:
   - Find keys starting with `sk_live_51ScEnJGg1mkd57D1...`
   - Click "..." → **Roll key** or **Delete**
   - Confirm deletion

3. **Generate New Keys**:
   - Click "Create secret key"
   - Name it: "ArguFight Production" (or similar)
   - Copy the new secret key immediately (shown only once)
   - Also copy the new publishable key

4. **Update Environment Variables**:
   - **Vercel**: Dashboard → Settings → Environment Variables
     - Update `STRIPE_SECRET_KEY` with new key
     - Update `STRIPE_PUBLISHABLE_KEY` with new key
     - Apply to: Production, Preview, Development
     - **Redeploy** after updating

   - **Local Development** (`.env` and `.env.local`):
     ```env
     STRIPE_SECRET_KEY=sk_live_NEW_KEY_HERE
     STRIPE_PUBLISHABLE_KEY=pk_live_NEW_KEY_HERE
     ```

### ⚠️ Step 2: Check for Unauthorized Transactions

1. **Review Stripe Activity**:
   - Go to Payments → All payments
   - Filter: Last 30 days
   - Look for any suspicious transactions

2. **Check Webhook Logs**:
   - Developers → Webhooks → Logs
   - Look for unexpected webhook calls

3. **Review API Logs**:
   - Developers → Events & logs
   - Check for unauthorized API usage

### ⚠️ Step 3: Secure Git History

**IMPORTANT**: The keys are in Git history even though the file is deleted.

**Option A**: If this is a private repository and you trust all contributors:
- Accept that the keys are in history
- Ensure keys are rotated (Step 1)
- Monitor Stripe for suspicious activity

**Option B**: If you need to completely remove from history (advanced):
```bash
# WARNING: This rewrites Git history and breaks existing clones
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/update-stripe-keys.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (will break forks and clones)
git push --force --all
git push --force --tags
```

**Recommendation**: Just rotate the keys (simpler and safer).

---

## What Was Fixed

### 1. Removed Database Storage of Stripe Keys ✅

**Before** (INSECURE):
```typescript
// stripe-client.ts - INSECURE CODE REMOVED
const settings = await prisma.adminSetting.findMany({
  where: { key: { in: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'] } }
})
```

**After** (SECURE):
```typescript
// stripe-client.ts - NOW SECURE
export function getStripeKeys() {
  return {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    secretKey: process.env.STRIPE_SECRET_KEY || null,
  }
}
```

### 2. Deleted Dangerous Script ✅

Deleted `scripts/update-stripe-keys.ts` which:
- Had hardcoded LIVE Stripe keys
- Stored keys in database (security anti-pattern)

### 3. Created Cleanup Script ✅

Created `scripts/remove-stripe-keys-from-db.ts`:
```bash
npx tsx scripts/remove-stripe-keys-from-db.ts
```

This removes any existing Stripe keys from the AdminSettings table.

---

## Security Best Practices (Now Implemented)

### ✅ DO's

1. **Store API keys in environment variables only**
   - Vercel environment variables
   - Local `.env` files (gitignored)
   - Never in code or database

2. **Use separate keys for test and production**
   - Test: `sk_test_...` / `pk_test_...`
   - Production: `sk_live_...` / `pk_live_...`

3. **Rotate keys periodically**
   - Every 90 days minimum
   - Immediately if compromised
   - After team member leaves

4. **Monitor Stripe activity**
   - Enable email alerts for large transactions
   - Review logs regularly
   - Set up webhook signature verification

### ❌ DON'Ts

1. **Never hardcode API keys in code**
   ```typescript
   // ❌ NEVER DO THIS
   const STRIPE_KEY = 'sk_live_...'
   ```

2. **Never store keys in database**
   ```typescript
   // ❌ NEVER DO THIS
   await prisma.adminSetting.create({
     key: 'STRIPE_SECRET_KEY',
     value: stripeKey
   })
   ```

3. **Never commit keys to Git**
   - Always use `.gitignore` for `.env` files
   - Review commits before pushing
   - Use pre-commit hooks to scan for secrets

4. **Never share keys in chat/email**
   - Use secret management tools instead
   - Rotate keys after sharing if accidental

---

## Files Modified

### Security Fixes:
1. ✅ `lib/stripe/stripe-client.ts` - Removed database lookup
2. ✅ `scripts/update-stripe-keys.ts` - **DELETED** (contained hardcoded keys)
3. ✅ `scripts/remove-stripe-keys-from-db.ts` - **CREATED** (cleanup script)

### Still Secure:
- `prisma/schema.prisma` - Never had Stripe key columns (only has `stripeAccountId` which is correct)

---

## Testing After Key Rotation

After rotating keys and updating environment variables:

1. **Test Checkout Flow**:
   - Create test subscription
   - Verify payment processes
   - Check webhook delivery

2. **Test Admin Functions**:
   - View finance overview
   - Check advertiser/creator connections
   - Test payout flow

3. **Monitor Logs**:
   ```bash
   # Check Vercel logs for Stripe errors
   vercel logs --follow
   ```

4. **Verify Environment Variables**:
   ```bash
   # In your app, check keys are loaded
   console.log('Stripe configured:', !!process.env.STRIPE_SECRET_KEY)
   ```

---

## Prevention Checklist

Going forward, ensure:

- [ ] All Stripe keys are environment variables only
- [ ] `.env` files are in `.gitignore`
- [ ] No keys in code, comments, or TODOs
- [ ] Pre-commit hooks scan for secrets (optional but recommended)
- [ ] Team knows security policies
- [ ] Keys rotated every 90 days
- [ ] Stripe activity monitored monthly

---

## Additional Security Measures (Recommended)

### 1. Set Up Secret Scanning

```bash
# Install gitleaks (scans for secrets)
npm install -g gitleaks

# Scan repository
gitleaks detect --source . --verbose

# Add pre-commit hook
echo '#!/bin/sh\ngitleaks protect --staged --verbose' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 2. Stripe Webhook Signature Verification

Ensure all webhook endpoints verify signatures:
```typescript
const sig = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### 3. IP Whitelisting (Optional)

In Stripe dashboard:
- Settings → Security → IP whitelist
- Add your server IPs
- Blocks API calls from other IPs

### 4. Enable 2FA on Stripe Account

- Settings → Team settings
- Require 2FA for all team members
- Use authenticator app (not SMS)

---

## Timeline

- **2026-01-24 (Today)**:
  - ✅ Found hardcoded keys
  - ✅ Deleted dangerous script
  - ✅ Fixed stripe-client.ts to use env vars only
  - ⚠️ **PENDING**: User must rotate keys in Stripe dashboard

---

## Contact & Support

If you need help rotating keys:
1. [Stripe Support](https://support.stripe.com)
2. [Stripe API Keys Docs](https://stripe.com/docs/keys)
3. [Key Security Best Practices](https://stripe.com/docs/security/guide#keys)

---

## Summary

**What to do RIGHT NOW**:

1. ✅ Go to [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys)
2. ✅ Delete/roll keys starting with `sk_live_51ScEnJGg1mkd57D1...`
3. ✅ Generate new keys
4. ✅ Update Vercel environment variables with new keys
5. ✅ Redeploy application
6. ✅ Run: `npx tsx scripts/remove-stripe-keys-from-db.ts`
7. ✅ Test checkout flow
8. ✅ Monitor Stripe for suspicious activity for next 48 hours

**Never again**:
- ❌ Store keys in database
- ❌ Hardcode keys in code files
- ❌ Commit keys to Git

**Always**:
- ✅ Use environment variables
- ✅ Keep `.env` in `.gitignore`
- ✅ Rotate keys periodically
- ✅ Monitor Stripe activity

---

**Last Updated**: 2026-01-24
**Priority**: URGENT - COMPLETE KEY ROTATION IMMEDIATELY

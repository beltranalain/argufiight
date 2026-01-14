# Stripe Connect Setup Guide for Testing

## Quick Answer: Yes, Use Test Mode!

**For testing purposes, you MUST use Stripe Test Mode (not Live Mode).** Test Mode is Stripe's "sandbox" - it's free and perfect for development.

## Step-by-Step Setup

### 1. Enable Stripe Connect in Test Mode

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Switch to Test Mode**: Toggle "Test mode" in the top right corner (should show "Test mode" not "Live mode")
3. **Enable Stripe Connect**:
   - Go to: https://dashboard.stripe.com/settings/connect
   - Click **"Enable Connect"** or **"Get Started"**
   - Follow the setup wizard (it's quick in test mode)
   - Accept the terms

### 2. Verify Your API Keys Are Test Keys

In **Admin Settings → General**:
- **Payment Publishable Key**: Should start with `pk_test_...` (not `pk_live_...`)
- **Payment Secret Key**: Should start with `sk_test_...` (not `sk_live_...`)

### 3. Test the Connection

1. Go to **Advertiser Dashboard → Settings**
2. Click **"Connect Account"**
3. You should see the Stripe Connect onboarding form
4. Complete the form (simplified in test mode)
5. Once connected, you'll see "Payment account connected" ✅

## Common Issues

### Error: "Stripe Connect is not enabled"
**Solution**: 
- Make sure you're in **Test Mode** (toggle in top right of Stripe Dashboard)
- Go to https://dashboard.stripe.com/settings/connect
- Click "Enable Connect" or "Get Started"

### Error: "Invalid API Key"
**Solution**:
- Make sure you're using **Test Mode keys** (`pk_test_...` and `sk_test_...`)
- Get them from: https://dashboard.stripe.com/test/apikeys
- Update them in Admin Settings → General

### Error: "Expired API Key"
**Solution**:
- Generate new keys from Stripe Dashboard
- Update them in Admin Settings → General

## Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| **Purpose** | Development & Testing | Production |
| **Charges** | No real charges | Real charges |
| **API Keys** | `pk_test_...` / `sk_test_...` | `pk_live_...` / `sk_live_...` |
| **Connect** | Must enable separately | Must enable separately |
| **Cost** | Free | Transaction fees apply |

## Important Notes

- **Test Mode is completely separate** from Live Mode
- **Test transactions don't affect** your live account
- **You can switch between modes** anytime in Stripe Dashboard
- **Stripe Connect must be enabled** in both Test and Live modes separately

## Need Help?

- Stripe Connect Docs: https://stripe.com/docs/connect
- Enable Connect: https://dashboard.stripe.com/settings/connect
- Test API Keys: https://dashboard.stripe.com/test/apikeys

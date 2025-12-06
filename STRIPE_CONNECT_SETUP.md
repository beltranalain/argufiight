# Stripe Connect Setup Guide

## Issue
When trying to connect a Stripe account for advertisers or creators, you may see an error:
```
You can only create new accounts if you've signed up for Connect, which you can learn how to do at https://stripe.com/docs/connect.
```

## Solution

### Enable Stripe Connect in Your Stripe Dashboard

1. **Log in to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Make sure you're using the correct account (test or live mode)

2. **Navigate to Connect Settings**
   - Go to **Settings** → **Connect** (or visit https://dashboard.stripe.com/settings/connect)
   - Click **Get started** or **Activate Connect**

3. **Complete Connect Setup**
   - Follow the prompts to enable Stripe Connect
   - This is a one-time setup process
   - You'll need to provide some business information

4. **Verify Connect is Enabled**
   - After enabling, you should see "Connect" in your Stripe dashboard sidebar
   - You can create Connect accounts for advertisers and creators

## Test Mode vs Live Mode

- **Test Mode**: Enable Connect in test mode for development/testing
  - Test mode: https://dashboard.stripe.com/test/settings/connect
- **Live Mode**: Enable Connect in live mode for production
  - Live mode: https://dashboard.stripe.com/settings/connect

## After Enabling Connect

Once Connect is enabled:
1. Advertisers can click "Connect Stripe" to start onboarding
2. The system will create a Stripe Express account for them
3. They'll be redirected to Stripe's onboarding flow to complete:
   - Business information
   - Bank account details
   - Tax information (W-9 for US businesses)

## Error Handling

The application now provides clear error messages if Connect is not enabled:
- Users will see: "Stripe Connect Not Enabled"
- Instructions to visit the Stripe Dashboard settings
- Link to Stripe Connect documentation

## Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Express Accounts Guide](https://stripe.com/docs/connect/express-accounts)
- [Stripe Dashboard - Connect Settings](https://dashboard.stripe.com/settings/connect)


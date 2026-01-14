# Stripe Testing Guide for Advertisers

## Overview
When connecting a payment account for testing, you'll use **Stripe Test Mode**. This allows you to test the payment flow without using real money.

## Getting Started

### 1. Create a Stripe Test Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account (or log in if you already have one)
3. Once logged in, make sure you're in **Test Mode** (toggle in the top right of the Stripe Dashboard)

### 2. Test Mode vs Live Mode
- **Test Mode**: Use for development and testing. No real charges are made.
- **Live Mode**: Use for production. Real charges are processed.

The toggle is in the top right of your Stripe Dashboard.

### 3. Test Cards
Stripe provides test card numbers that you can use to simulate different scenarios:

#### Successful Payments
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

Use any:
- **Expiry date**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

#### Declined Payments
- **Card declined**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Expired card**: `4000 0000 0000 0069`

### 4. Connecting Your Test Account
1. In the Advertiser Dashboard, click **"Connect Account"** in the Payment Setup section
2. You'll be redirected to Stripe Connect
3. Use your Stripe test account credentials to connect
4. Complete the onboarding flow (this is simplified in test mode)

### 5. Testing Payment Flows
Once connected, you can:
- Create test campaigns
- Make test offers to creators
- Process test payments using the test card numbers above
- View test transactions in your Stripe Dashboard

### 6. Viewing Test Data
- All test transactions appear in your Stripe Dashboard under **Test Mode**
- You can see payments, refunds, and account activity
- No real money is charged in test mode

## Important Notes
- **Test Mode is Free**: No charges are made in test mode
- **Separate from Live**: Test and Live modes are completely separate
- **Test Data Only**: Test transactions don't affect your live account
- **Switch Anytime**: You can toggle between Test and Live mode in your Stripe Dashboard

## Need Help?
- Stripe Test Mode Documentation: https://stripe.com/docs/testing
- Stripe Test Cards: https://stripe.com/docs/testing#cards
- Contact support if you need assistance with the connection process

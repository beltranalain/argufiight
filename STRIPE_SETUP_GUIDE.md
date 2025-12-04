# Stripe Setup Guide for Tournament Payments

## Overview
Tournament creators pay $1/month subscription. To ensure Argu Fight receives the full $1.00, processing fees are passed to the user.

## Stripe Account Setup

### 1. Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete business verification (if required)

### 2. Get API Keys
1. Navigate to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key** (starts with `pk_test_` for test mode, `pk_live_` for production)
3. Copy your **Secret Key** (starts with `sk_test_` for test mode, `sk_live_` for production)
4. **Important**: Never expose your Secret Key in client-side code

### 3. Add Keys to Admin Settings
1. Go to Admin Dashboard → Settings
2. Scroll to "Stripe Payment Configuration"
3. Paste your Publishable Key
4. Paste your Secret Key
5. Click "Save Settings"

## Processing Fee Calculation

### Stripe Fee Structure
- **Fixed fee**: $0.32 per transaction
- **Percentage**: 2.9% of transaction amount

### For $1.00 Subscription
- Base amount: $1.00
- Processing fee: $0.32 + ($1.00 × 2.9%) = $0.32 + $0.029 = **$0.349**
- **Total user pays**: $1.00 + $0.349 = **$1.35/month**

### Implementation
When creating a subscription, calculate the total amount including fees:

```typescript
const baseAmount = 100 // $1.00 in cents
const fixedFee = 32 // $0.32 in cents
const percentageFee = Math.ceil(baseAmount * 0.029) // 2.9%
const totalAmount = baseAmount + fixedFee + percentageFee // $1.35 in cents = 135 cents
```

## Subscription Flow

### 1. User Initiates Subscription
- User clicks "Subscribe to Create Tournaments"
- Frontend calls `/api/tournaments/subscribe`

### 2. Server Creates Stripe Subscription
```typescript
// Calculate total with fees
const baseAmount = 100 // $1.00
const processingFee = 32 + Math.ceil(baseAmount * 0.029) // $0.32 + 2.9%
const totalAmount = baseAmount + processingFee // $1.35

// Create Stripe subscription
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Tournament Creator Subscription',
      },
      unit_amount: totalAmount, // $1.35
      recurring: {
        interval: 'month',
      },
    },
  }],
  metadata: {
    baseAmount: baseAmount.toString(),
    processingFee: processingFee.toString(),
  },
})
```

### 3. Store Subscription in Database
```typescript
await prisma.tournamentSubscription.create({
  data: {
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    status: 'ACTIVE',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  },
})
```

## Webhook Setup

### 1. Create Webhook Endpoint
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Get Webhook Secret
1. After creating the endpoint, click on it
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add to environment variables: `STRIPE_WEBHOOK_SECRET`

### 3. Verify Webhook Signature
```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle events
  switch (event.type) {
    case 'customer.subscription.created':
      // Handle subscription creation
      break
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break
    case 'invoice.payment_succeeded':
      // Handle successful payment
      break
    case 'invoice.payment_failed':
      // Handle failed payment
      break
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
```

## Testing

### Test Mode
1. Use test API keys (`pk_test_` and `sk_test_`)
2. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Production Mode
1. Switch to live keys (`pk_live_` and `sk_live_`)
2. Ensure webhook endpoint is accessible
3. Test with real payment method (small amount)

## Security Best Practices

1. **Never expose Secret Key**: Only use in server-side code
2. **Verify webhook signatures**: Always verify Stripe webhook signatures
3. **Use HTTPS**: All payment endpoints must use HTTPS
4. **Store securely**: Encrypt Stripe keys in database (already handled by AdminSetting.encrypted)
5. **Monitor logs**: Regularly check Stripe dashboard for failed payments

## Environment Variables

Add to your `.env.local` and Vercel environment variables:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Next Steps

1. Install Stripe SDK: `npm install stripe`
2. Create subscription API endpoint: `/api/tournaments/subscribe`
3. Create webhook handler: `/api/webhooks/stripe`
4. Add subscription UI to user dashboard
5. Test subscription flow in test mode
6. Deploy and test webhooks
7. Switch to production keys when ready

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)


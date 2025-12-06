# Finances Management System

## Overview

A comprehensive finances management page has been created at `/admin/finances` that provides complete visibility into all money flows in the system.

## Features

### 1. **Stripe Mode Detection**
- Automatically detects if Stripe is in **test mode** (`sk_test_`) or **live mode** (`sk_live_`)
- Displays a warning banner when in test mode
- Shows key prefixes (first 12 characters) for verification

### 2. **Revenue Tracking**

#### **Subscription Revenue**
- Tracks all PRO tier subscriptions
- Shows total revenue from subscriptions
- Lists individual subscription transactions
- Includes user information and dates
- Fetches data from Stripe invoices

#### **Advertisement Revenue**
- Tracks all advertisement contracts
- Shows total revenue from ads
- Displays platform fees collected
- Shows creator payouts
- Includes advertiser, creator, and campaign details
- Tracks payout status (sent/not sent)

### 3. **Financial Metrics**

#### **Summary Cards**
- **Total Revenue**: Combined subscriptions + advertisements
- **Platform Fees**: Fees collected from creator marketplace
- **Creator Payouts**: Total amount paid to creators
- **Net Revenue**: Revenue minus payouts (what platform keeps)

#### **Stripe Balance**
- Available balance in Stripe account
- Pending balance (in transit)
- Real-time balance updates

### 4. **Transaction History**

#### **Tabs**
1. **Overview**: High-level breakdown of revenue and payouts
2. **Subscriptions**: Detailed subscription transactions
3. **Advertisements**: Detailed advertisement contracts with fees
4. **All Transactions**: Combined view of all transactions

### 5. **Period Selection**
- View finances for: 7 days, 30 days, 90 days, 1 year
- Automatically updates all metrics based on selected period

## Money Flow

### **Money Coming In**

1. **Subscriptions (PRO Tier)**
   - Users pay monthly/yearly subscription fees
   - Money goes directly to platform Stripe account
   - Tracked via Stripe invoices
   - **Location**: `app/api/webhooks/stripe/route.ts`

2. **Advertisements**
   - Advertisers pay for ad contracts
   - Payment held in escrow when contract is signed
   - Money captured when contract completes
   - Platform fee deducted, remainder paid to creator
   - **Location**: `app/api/creator/offers/[id]/accept/route.ts`

### **Money Going Out**

1. **Creator Payouts**
   - Automatic payouts via cron job (`/api/cron/process-ad-tasks`)
   - Runs daily at 2 AM UTC
   - Transfers funds to creator's Stripe Connect account
   - Platform fee stays with platform
   - **Location**: `app/api/cron/process-ad-payouts/route.ts`

### **Fees**

1. **Platform Fees**
   - Calculated based on creator tier (Bronze, Silver, Gold, Platinum)
   - Configurable in Admin Settings
   - Deducted from advertisement contracts
   - **Location**: `lib/ads/helpers.ts` → `calculatePlatformFee()`

2. **Stripe Fees**
   - Standard Stripe processing fees (2.9% + $0.32)
   - Applied to all transactions
   - Currently not tracked separately (can be added)

## API Endpoints

### `GET /api/admin/finances/overview`
Returns comprehensive financial overview:
- Revenue breakdown (subscriptions + ads)
- Platform fees
- Creator payouts
- Net revenue
- Transaction history
- Stripe balance

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)

### `GET /api/admin/finances/stripe-mode`
Returns Stripe configuration status:
- Test/Live mode detection
- Key prefixes
- Configuration status

## Database Models

### **UserSubscription**
- Tracks user subscription tiers
- Links to Stripe customer/subscription IDs
- Stores billing cycle and status

### **AdContract**
- Tracks advertisement contracts
- Stores total amount, platform fee, creator payout
- Links to Stripe payment intents and transfers
- Tracks payout status

### **Campaign**
- Links to contracts
- Stores campaign details

### **Advertiser**
- Links to contracts
- Stores advertiser information

## Automation

### **Automatic Payouts**
- Cron job runs daily at 2 AM UTC
- Processes completed contracts
- Automatically transfers funds to creators
- Updates contract status
- Tracks yearly earnings for tax purposes

### **Payment Processing**
- Subscriptions: Handled automatically by Stripe webhooks
- Advertisements: Escrow system holds funds until contract completion

## Future Enhancements

1. **Manual Payouts**
   - Ability to manually trigger payouts
   - Push money to specific users
   - Push money to company bank account

2. **Stripe Fee Tracking**
   - Calculate and display Stripe fees separately
   - Show net revenue after Stripe fees

3. **Export Functionality**
   - Export financial reports to CSV/PDF
   - Tax reporting (1099 data)

4. **Advanced Analytics**
   - Revenue trends over time
   - Fee breakdown charts
   - Payout history graphs

5. **Bank Account Integration**
   - Connect company bank account
   - Automatic transfers to bank
   - Balance reconciliation

## Access

- **URL**: `/admin/finances`
- **Access**: Admin only
- **Navigation**: Added to AdminNav sidebar

## Testing

To test the finances page:
1. Ensure Stripe keys are configured (test or live)
2. Have some subscription and/or advertisement transactions
3. Navigate to `/admin/finances`
4. Select different time periods
5. Review transaction details in each tab

## Notes

- All amounts are in USD
- Dates are displayed in local timezone
- Stripe balance is fetched in real-time
- Transaction history is limited to 50 most recent
- Period selection affects all metrics automatically


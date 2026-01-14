# Testing Guide - Creator Network

## 🎯 Overview

This guide covers testing the Creator Network from three perspectives:
1. **Creator Dashboard** - Testing as a creator/user
2. **Advertiser Dashboard** - Testing as an advertiser
3. **Admin Dashboard** - Testing as an admin

---

## 👤 CREATOR DASHBOARD TESTING

### Prerequisites
- User account with email/password
- User should meet eligibility requirements (or we'll test eligibility checks)

### Test Flow 1: Become a Creator

1. **Login as User**
   - Navigate to `/login`
   - Login with test user credentials

2. **Navigate to Creator Dashboard**
   - Go to `/creator/dashboard`
   - Should see "Creator Mode Not Enabled" if not yet a creator

3. **Check Eligibility**
   - Click "Enable Creator Mode" button
   - If eligible: Creator mode enabled, tier assigned
   - If not eligible: See eligibility requirements and current status

4. **Verify Creator Status**
   - After enabling, should see creator dashboard
   - Check tier badge (BRONZE/SILVER/GOLD/PLATINUM)
   - Verify `isCreator` flag is true in database

### Test Flow 2: Configure Ad Slot Settings

1. **Navigate to Settings Tab**
   - Go to `/creator/dashboard?tab=settings`
   - Should see three ad slot cards:
     - Profile Banner
     - Post-Debate Ad
     - Debate Widget

2. **Update Prices**
   - Set Profile Banner price to $500
   - Set Post-Debate price to $250
   - Set Debate Widget price to $300
   - Click "Save Settings"
   - Verify success toast appears
   - Refresh page and verify prices persisted

3. **Toggle Availability**
   - Turn off "Post-Debate Available" toggle
   - Save settings
   - Verify toggle state persists
   - Turn it back on

### Test Flow 3: View and Respond to Offers

1. **Navigate to Offers Tab**
   - Go to `/creator/dashboard?tab=offers`
   - Should see list of offers (if any)

2. **Filter Offers**
   - Test filter buttons: PENDING, ACCEPTED, DECLINED, ALL
   - Verify offers filter correctly

3. **Accept an Offer**
   - Find a PENDING offer
   - Click "Accept" button
   - Verify:
     - Success toast appears
     - Offer status changes to ACCEPTED
     - Contract is created (check Contracts tab)
     - Contract has correct platform fee calculated
     - Contract status is SCHEDULED

4. **Decline an Offer**
   - Find a PENDING offer
   - Click "Decline" button
   - Verify:
     - Success toast appears
     - Offer status changes to DECLINED
     - Offer disappears from PENDING filter

5. **Counter an Offer**
   - Find a PENDING offer
   - Click "Counter" button (if available)
   - Enter new amount: $600
   - Enter new duration: 30 days
   - Add message: "Counter offer"
   - Submit
   - Verify:
     - Original offer status changes to COUNTERED
     - New counter offer appears in advertiser's inbox
     - Negotiation round increments

### Test Flow 4: Manage Contracts

1. **View Contracts**
   - Go to `/creator/dashboard?tab=overview` or `/creator/dashboard`
   - Should see "Active Contracts" section
   - Click on a contract to view details

2. **View Contract Details**
   - Navigate to contract detail page (if exists)
   - Or use API: `GET /api/creator/contracts/[id]`
   - Verify contract information displays:
     - Advertiser name
     - Campaign name
     - Total amount
     - Platform fee
     - Creator payout
     - Status
     - Dates

3. **Complete a Contract**
   - Find an ACTIVE contract
   - Use API: `POST /api/creator/contracts/[id]/complete`
   - Verify:
     - Contract status changes to COMPLETED
     - `completedAt` timestamp is set
     - Yearly earnings update (check tax info)

4. **Cancel a Contract**
   - Find an ACTIVE contract
   - Use API: `POST /api/creator/contracts/[id]/cancel`
   - Body: `{ "reason": "Test cancellation" }`
   - Verify:
     - Contract status changes to CANCELLED
     - `cancelledAt` timestamp is set
     - `cancellationReason` is saved

### Test Flow 5: View Earnings

1. **Overview Tab**
   - Go to `/creator/dashboard?tab=overview`
   - Verify earnings cards display:
     - Total Earned
     - Pending Payout
     - This Month

2. **Earnings Tab**
   - Go to `/creator/dashboard?tab=earnings`
   - Verify detailed earnings display:
     - Total earned
     - Pending payout
     - This month earnings
     - This year earnings
     - Contract list
     - Monthly breakdown chart

### Test Flow 6: Tax Documents

1. **Navigate to Tax Documents Tab**
   - Go to `/creator/dashboard?tab=tax-documents`
   - Should see W-9 status and earnings info

2. **Submit W-9 Form**
   - Click "Complete W-9" button
   - Fill out form:
     - Legal Name: "Test Creator"
     - Tax ID Type: SSN
     - Tax ID: "123-45-6789"
     - Address, City, State, ZIP
   - Submit form
   - Verify:
     - Success message
     - W-9 status shows as submitted
     - Form data saved

3. **View 1099 Forms**
   - If earnings >= $600 for a year, should see 1099 generation option
   - Admin can generate 1099
   - Verify 1099 appears in list
   - Download 1099 PDF
   - Verify PDF is valid and contains correct information

---

## 📢 ADVERTISER DASHBOARD TESTING

### Prerequisites
- Advertiser account created
- Advertiser status: APPROVED
- Payment method set up (`paymentReady: true`)

### Test Flow 1: Create Campaign

1. **Navigate to Campaigns**
   - Go to `/advertiser/campaigns`
   - Click "Create Campaign"

2. **Fill Campaign Details**
   - Campaign Name: "Test Campaign"
   - Description: "Testing creator network"
   - Budget: $1000
   - Start Date: Today
   - End Date: 30 days from now
   - Submit

3. **Verify Campaign Created**
   - Campaign appears in campaigns list
   - Status is ACTIVE or DRAFT

### Test Flow 2: Make Offer to Creator

1. **Browse Creators**
   - Navigate to creator marketplace/browse
   - Find a creator with available ad slots
   - View creator profile and pricing

2. **Create Offer**
   - Click "Make Offer" or similar
   - Select ad slot type (Profile Banner/Post-Debate/Debate Widget)
   - Enter amount: $500
   - Enter duration: 30 days
   - Add message: "Test offer"
   - Submit offer

3. **Verify Offer Sent**
   - Offer appears in advertiser's offers list
   - Status is PENDING
   - Creator receives notification (if implemented)

### Test Flow 3: Handle Counter Offers

1. **View Counter Offers**
   - Check offers list for COUNTERED status
   - View counter offer details

2. **Accept Counter Offer**
   - Review counter terms
   - Accept counter offer
   - Verify contract is created

3. **Decline Counter Offer**
   - Decline counter offer
   - Verify offer status updates

### Test Flow 4: Manage Contracts

1. **View Active Contracts**
   - Navigate to contracts section
   - See all active contracts

2. **View Contract Details**
   - Click on a contract
   - Verify all contract details display correctly

3. **Track Performance**
   - View impressions count
   - View clicks count
   - Verify analytics data

---

## 👨‍💼 ADMIN DASHBOARD TESTING

### Prerequisites
- Admin account with `isAdmin: true`

### Test Flow 1: Manage Creators

1. **View Creator List**
   - Go to `/admin/users` or creator management page
   - Filter by creators
   - Verify creator list displays:
     - Creator status/tier
     - Earnings
     - Contract count
     - Ad slot prices

2. **Approve/Manage Creator**
   - View creator details
   - Update creator status if needed
   - Verify changes persist

### Test Flow 2: Manage Advertisers

1. **View Advertiser List**
   - Go to advertiser management page
   - Verify advertiser list displays:
     - Status (PENDING/APPROVED/SUSPENDED)
     - Payment readiness
     - Campaign count

2. **Approve Advertiser**
   - Find PENDING advertiser
   - Approve advertiser
   - Set `paymentReady: true` if payment method configured
   - Verify advertiser can now make offers

### Test Flow 3: Manage Contracts

1. **View All Contracts**
   - Navigate to contracts management
   - Filter by status, creator, advertiser
   - Verify contract details display

2. **Process Payout**
   - Find COMPLETED contract with `payoutSent: false`
   - Process payout (manual or via Stripe)
   - Update contract:
     - Set `payoutSent: true`
     - Set `payoutDate: new Date()`
   - Verify yearly earnings update automatically

### Test Flow 4: Tax Management

1. **View Creator Tax Info**
   - Go to `/admin/creator-taxes`
   - See list of creators with tax info
   - Filter by W-9 status, earnings threshold

2. **Generate 1099**
   - Find creator with earnings >= $600 for a year
   - Verify W-9 is submitted
   - Click "Generate 1099" for specific year
   - Verify PDF is generated and stored

3. **Bulk Generate 1099s**
   - Click "Generate All 1099s" button
   - Select tax year
   - Submit
   - Verify:
     - Summary shows generated count
     - PDFs are created for all qualifying creators
     - Forms appear in creator's tax documents

### Test Flow 5: Platform Settings

1. **Configure Platform Fees**
   - Go to admin settings
   - Update creator fees:
     - BRONZE: 25%
     - SILVER: 20%
     - GOLD: 15%
     - PLATINUM: 10%
   - Verify fees apply to new contracts

2. **Configure Eligibility**
   - Update creator eligibility requirements:
     - Min ELO: 1500
     - Min Debates: 10
     - Min Age: 3 months
   - Verify new creators checked against these requirements

---

## 🔄 END-TO-END FLOW TEST

### Complete User Journey

1. **User Registration & Setup**
   - Register new user
   - Complete profile
   - Participate in debates to build ELO

2. **Become Creator**
   - User meets eligibility requirements
   - Enable creator mode
   - Configure ad slot prices

3. **Advertiser Makes Offer**
   - Advertiser creates campaign
   - Advertiser makes offer to creator
   - Creator receives offer notification

4. **Creator Responds**
   - Creator reviews offer
   - Creator accepts offer
   - Contract is created with proper fees

5. **Contract Execution**
   - Contract is ACTIVE
   - Ads are displayed
   - Impressions/clicks tracked

6. **Contract Completion**
   - Contract completes
   - Admin processes payout
   - Yearly earnings update automatically

7. **Tax Reporting**
   - Creator submits W-9
   - Earnings accumulate
   - Admin generates 1099 at year-end
   - Creator downloads 1099

---

## ✅ Testing Checklist

### Creator Features
- [ ] Enable creator mode
- [ ] Update ad slot prices
- [ ] Toggle ad slot availability
- [ ] Accept offer
- [ ] Decline offer
- [ ] Counter offer (3 rounds max)
- [ ] View contract details
- [ ] Complete contract
- [ ] Cancel contract
- [ ] View earnings overview
- [ ] View detailed earnings
- [ ] Submit W-9 form
- [ ] Download 1099 PDF

### Advertiser Features
- [ ] Create campaign
- [ ] Browse creators
- [ ] Make offer
- [ ] Handle counter offer
- [ ] View contracts
- [ ] Track ad performance

### Admin Features
- [ ] View creator list
- [ ] View advertiser list
- [ ] Approve advertiser
- [ ] Process contract payout
- [ ] Generate 1099 for creator
- [ ] Bulk generate 1099s
- [ ] Configure platform fees
- [ ] Configure eligibility requirements

---

## 🐛 Common Issues to Test

1. **Payment Not Ready**
   - Try accepting offer with advertiser `paymentReady: false`
   - Should return 402 error

2. **Offer Expired**
   - Try accepting expired offer
   - Should return error and update status to EXPIRED

3. **Max Negotiation Rounds**
   - Counter offer 3 times
   - Try countering 4th time
   - Should return error

4. **Eligibility Check**
   - Try enabling creator mode without meeting requirements
   - Should show eligibility details

5. **Contract Already Completed**
   - Try completing already completed contract
   - Should return error

6. **Unauthorized Access**
   - Try accessing another creator's contract
   - Should return 403 error

---

## 📊 Expected Results

### Platform Fee Calculation
- BRONZE creator: 25% fee
- SILVER creator: 20% fee
- GOLD creator: 15% fee
- PLATINUM creator: 10% fee

### Yearly Earnings
- Updates automatically when contract completes
- Updates automatically when payout is sent
- Stored in `CreatorTaxInfo.yearlyEarnings` JSON field

### Contract Status Flow
- SCHEDULED → ACTIVE → COMPLETED
- Can be CANCELLED at any time before COMPLETED

---

**Happy Testing! 🚀**

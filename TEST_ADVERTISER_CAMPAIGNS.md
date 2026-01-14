# Testing Advertiser Campaigns - Complete Guide

## 🎯 Overview

This guide will walk you through testing the complete Advertiser Campaigns flow, including payment using Stripe test mode.

---

## 📋 Prerequisites

1. **Stripe Test Mode Setup**
   - Your Stripe account should be in test mode
   - Test API keys should be in your `.env` file
   - Test mode allows fake payments with test cards

2. **Admin Access**
   - You need admin access to approve advertisers
   - Admin panel: `/admin/advertisers`

---

## 👤 Step 1: Create Test Advertiser Account

### Option A: Use Existing Test User

**Test Advertiser Account:**
- **Email:** `test-advertiser@argufight.com`
- **Password:** (Check with admin or reset it)
- **Company:** Test Ad Company
- **Status:** Needs to be APPROVED by admin

### Option B: Create New Test Advertiser

1. **Go to Advertise Page:**
   ```
   http://localhost:3000/advertise
   ```

2. **Fill Out Application Form:**
   - Company Name: `Test Ad Company`
   - Website: `https://testcompany.com`
   - Industry: `Technology`
   - Contact Email: `test-advertiser@argufight.com` (use a test email)
   - Contact Name: `Test Advertiser`
   - Business EIN: `12-3456789` (optional, for testing)

3. **Submit Application**
   - Status will be `PENDING`
   - You'll see a confirmation message

4. **Admin Approval:**
   - Go to `/admin/advertisers`
   - Find the advertiser application
   - Click "Approve"
   - System will auto-create a User account if needed
   - Advertiser receives approval email

---

## 🔐 Step 2: Login as Advertiser

1. **Login Page:**
   ```
   http://localhost:3000/login
   ```

2. **Credentials:**
   - Email: `test-advertiser@argufight.com`
   - Password: Check email for password reset link (if new account)
   - Or use existing password if account already exists

3. **First Time Login:**
   - If account was auto-created, you'll need to reset password
   - Check email for password reset link
   - Set a new password

---

## 💰 Step 3: Test Payment with Stripe Test Mode

### Stripe Test Cards

Stripe test mode allows you to use fake credit cards. Here are test card numbers:

**Success Cards:**
- **Visa:** `4242 4242 4242 4242`
- **Visa (Debit):** `4000 0566 5566 5556`
- **Mastercard:** `5555 5555 5555 4444`
- **American Express:** `3782 822463 10005`

**For all test cards:**
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

**Decline Cards (for testing failures):**
- **Card declined:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995`
- **Expired card:** `4000 0000 0000 0069`

### Payment Flow

1. **Create Campaign** (see Step 4)
2. **Reach Payment Step** (Step 6)
3. **Stripe Checkout Opens**
4. **Use Test Card:**
   - Enter: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
5. **Complete Payment**
6. **Redirected to Success Page**
7. **Campaign Status:** `PENDING_REVIEW`

---

## 📝 Step 4: Create Platform Ads Campaign

### Navigate to Campaign Creation

1. **Go to Advertiser Dashboard:**
   ```
   http://localhost:3000/advertiser/dashboard
   ```

2. **Click "Create Campaign"** button

### Step-by-Step Campaign Creation

#### **Step 1: Choose Campaign Type**
- Select: **"Platform Ads"**
- Click "Next"

#### **Step 2: Campaign Details**
- **Campaign Name:** `Test Campaign - January 2026`
- **Category:** `Technology` (or any category)
- **Budget:** `100` (or any amount - this is what you'll pay)
- **Start Date:** Today's date or future date
- **End Date:** Future date (e.g., 30 days from now)
- **Destination URL:** `https://testcompany.com`
- **CTA Text:** `Learn More` (default)
- Click "Next"

#### **Step 3: Creative Assets**
- **Upload Image:**
  - Click "Choose File"
  - Select an image (recommended: 728x90px for banners)
  - Or enter image URL
- Click "Next"

#### **Step 4: Targeting** (Skip for Platform Ads)
- This step is for Creator Sponsorships
- Click "Next" to skip

#### **Step 5: Review**
- Review all campaign details
- Verify:
  - Campaign name
  - Budget amount
  - Dates
  - Image preview
- Click "Continue to Payment"

#### **Step 6: Payment** ⚠️ **REQUIRED FOR PLATFORM ADS**
- **You'll see:**
  - Campaign Budget: $100.00
  - Processing Fee (2.9% + $0.30): ~$3.20
  - **Total:** ~$103.20
- **Click "Proceed to Payment"**
- **Stripe Checkout Opens**
- **Enter Test Card:**
  ```
  Card: 4242 4242 4242 4242
  Expiry: 12/25
  CVC: 123
  ZIP: 12345
  ```
- **Click "Pay"**
- **Success!** You'll be redirected to success page
- **Campaign Status:** Now `PENDING_REVIEW`

---

## ✅ Step 5: Admin Approval

1. **Login as Admin:**
   ```
   http://localhost:3000/admin/advertisers
   ```

2. **Go to "Advertiser Campaigns" Tab**

3. **Find Your Campaign:**
   - Look for: `Test Campaign - January 2026`
   - Status: `PENDING_REVIEW`
   - Should show: Budget, dates, advertiser name

4. **Approve Campaign:**
   - Click "Approve" button
   - Campaign status: `APPROVED`
   - Campaign will auto-activate when `startDate` is reached

5. **Verify:**
   - Campaign appears in list with "Approved" badge
   - Once `startDate` is reached, status becomes `ACTIVE`
   - Ad will start showing on website

---

## 🧪 Step 6: Test Ad Display

### Where Ads Should Appear

1. **BANNER Ads:**
   - Profile pages: `/profile` or `/profile/[user-id]`
   - Should appear at top of profile

2. **SPONSORED_DEBATE Ads:**
   - Debate sidebar: `/debate/[debate-id]`
   - Should appear in right sidebar during active debate

3. **IN_FEED Ads:**
   - Debates list: `/debates` (every 5th debate)
   - Trending topics: `/trending` (every 3rd topic)
   - Debate page: Between arguments and AI verdict

### Test Checklist

- [ ] BANNER ad shows on profile page
- [ ] SPONSORED_DEBATE ad shows in debate sidebar
- [ ] IN_FEED ad shows in debates list
- [ ] IN_FEED ad shows in trending topics
- [ ] IN_FEED ad shows on debate page (between arguments and verdict)
- [ ] Ads are clickable and redirect correctly
- [ ] Ads track impressions (check admin panel)
- [ ] Ads track clicks (check admin panel)

---

## 🔍 Step 7: Verify Analytics

1. **Go to Advertiser Dashboard:**
   ```
   http://localhost:3000/advertiser/dashboard
   ```

2. **View Campaign Stats:**
   - Total campaigns
   - Active campaigns
   - Total impressions
   - Total clicks

3. **View Individual Campaign:**
   - Click on a campaign
   - See detailed analytics:
     - Impressions
     - Clicks
     - CTR (Click-Through Rate)
     - Budget spent

---

## 🎯 Step 8: Test Multi-Advertiser Rotation

### Create Multiple Campaigns

1. **Create 2-3 Test Campaigns:**
   - Campaign 1: `Test Campaign A`
   - Campaign 2: `Test Campaign B`
   - Campaign 3: `Test Campaign C`

2. **All Should Be:**
   - Status: `ACTIVE`
   - Same ad type (e.g., all BANNER)
   - Overlapping date ranges
   - Paid (payment completed)

3. **Test Rotation:**
   - Visit the same page multiple times
   - Ads should rotate (changes every hour)
   - Different advertisers get fair exposure

---

## 🐛 Troubleshooting

### Payment Not Working

**Issue:** Stripe Checkout not opening
- **Fix:** Check `.env` has Stripe test keys:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

**Issue:** Payment fails
- **Fix:** Make sure you're using test card numbers
- **Fix:** Check Stripe dashboard for error logs

### Campaign Not Showing

**Issue:** Campaign created but not displaying
- **Check:** Campaign status is `ACTIVE` (not `PENDING_REVIEW`)
- **Check:** Campaign dates are valid (not expired)
- **Check:** Campaign has `bannerUrl` (image uploaded)
- **Check:** Payment was completed (`paymentStatus = 'PAID'`)

### Admin Can't Approve

**Issue:** Approve button not working
- **Check:** You're logged in as admin
- **Check:** Campaign status is `PENDING_REVIEW`
- **Check:** Campaign has been paid (for Platform Ads)

---

## 📊 Quick Test Checklist

### Advertiser Flow
- [ ] Apply as advertiser
- [ ] Get approved by admin
- [ ] Login to advertiser dashboard
- [ ] Create Platform Ads campaign
- [ ] Complete payment with test card
- [ ] Campaign shows as `PENDING_REVIEW`
- [ ] Admin approves campaign
- [ ] Campaign activates on `startDate`
- [ ] Ad displays on website

### Payment Flow
- [ ] Payment step appears (Step 6)
- [ ] Stripe Checkout opens
- [ ] Test card works (`4242 4242 4242 4242`)
- [ ] Payment succeeds
- [ ] Redirected to success page
- [ ] Campaign status updates to `PENDING_REVIEW`

### Ad Display
- [ ] BANNER ad on profile
- [ ] SPONSORED_DEBATE ad in sidebar
- [ ] IN_FEED ad in debates list
- [ ] IN_FEED ad in trending topics
- [ ] IN_FEED ad on debate page
- [ ] Ads are clickable
- [ ] Analytics tracking works

### Multi-Advertiser
- [ ] Multiple campaigns created
- [ ] All campaigns active
- [ ] Ads rotate fairly
- [ ] All advertisers get exposure

---

## 💡 Tips

1. **Use Stripe Dashboard:**
   - Check `https://dashboard.stripe.com/test` to see test payments
   - View payment logs and errors

2. **Test Different Scenarios:**
   - Test payment success
   - Test payment failure (use decline cards)
   - Test campaign rejection
   - Test campaign expiration

3. **Check Logs:**
   - Server console for API errors
   - Browser console for client errors
   - Stripe dashboard for payment logs

4. **Date Testing:**
   - Set `startDate` to today to see immediate activation
   - Set `endDate` in past to test expiration
   - Test auto-activation when date is reached

---

## 🎉 Success Criteria

Your Advertiser Campaigns system is working if:

✅ Advertisers can apply and get approved  
✅ Advertisers can create campaigns  
✅ Payment flow works with test cards  
✅ Campaigns require payment before submission  
✅ Admin can approve/reject campaigns  
✅ Ads display in correct locations  
✅ Multiple advertisers rotate fairly  
✅ Analytics track impressions/clicks  
✅ System auto-activates campaigns  
✅ System auto-completes campaigns  

---

**Happy Testing! 🚀**

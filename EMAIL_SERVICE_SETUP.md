# Email Service Setup Guide

## 🎯 Current Setup

Your application is already configured to use **Resend** for email services.

**Location:** `lib/email/resend.ts`

---

## 📧 Free Email API Services (2025)

### 1. **Resend** (Currently Configured) ⭐ RECOMMENDED

**Free Tier:**
- ✅ **3,000 emails/month** (100/day)
- ✅ No credit card required
- ✅ Great developer experience
- ✅ Fast delivery
- ✅ Built-in analytics
- ✅ React Email support

**Sign Up:** https://resend.com
**API Docs:** https://resend.com/docs

**Setup:**
1. Sign up at https://resend.com
2. Get your API key from dashboard
3. Add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Or add to Admin Settings:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx`

**Already Integrated:**
- ✅ `lib/email/resend.ts` - Client setup
- ✅ `lib/email/advertiser-notifications.ts` - Approval/rejection emails
- ✅ `lib/email/subscription-notifications.ts` - Subscription emails

---

### 2. **SendGrid**

**Free Tier:**
- ✅ **100 emails/day** (3,000/month)
- ✅ No credit card required
- ✅ Good deliverability
- ✅ Email validation API

**Sign Up:** https://sendgrid.com
**Setup:** Requires `@sendgrid/mail` package

---

### 3. **Mailgun**

**Free Tier:**
- ✅ **100 emails/day** (3,000/month)
- ✅ No credit card required
- ✅ Good for transactional emails
- ✅ Real-time logs

**Sign Up:** https://www.mailgun.com
**Setup:** Requires `mailgun.js` package

---

### 4. **Mailjet**

**Free Tier:**
- ✅ **6,000 emails/month** (200/day)
- ✅ No credit card required
- ✅ Drag-and-drop email editor
- ✅ Good analytics

**Sign Up:** https://www.mailjet.com
**Setup:** Requires `node-mailjet` package

---

## 🚀 Quick Start with Resend (Recommended)

### Step 1: Sign Up
1. Go to https://resend.com
2. Click "Get Started"
3. Sign up with email (no credit card needed)

### Step 2: Get API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "Argufight Production"
4. Copy the key (starts with `re_`)

### Step 3: Add to Environment
**Option A: `.env` file (for local dev)**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Option B: Admin Settings (for production)**
1. Go to `/admin/settings`
2. Find "Email Settings" or create new setting:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx`
   - Encrypted: `true`

### Step 4: Verify Domain (Optional but Recommended)
1. Go to https://resend.com/domains
2. Add your domain: `argufight.com`
3. Add DNS records (TXT, MX)
4. Verify domain
5. Update `from` email in email functions to use your domain

### Step 5: Test
1. Restart dev server
2. Submit an advertiser application
3. Check Resend dashboard for sent emails
4. Check spam folder if not received

---

## 📝 Email Templates Already Created

### 1. Advertiser Approval Email
**File:** `lib/email/advertiser-notifications.ts`
**Function:** `sendAdvertiserApprovalEmail()`
**Triggers:** When admin approves advertiser

**Content:**
- Welcome message
- Login credentials (if new user)
- Password reset link
- Dashboard access info

### 2. Advertiser Rejection Email
**File:** `lib/email/advertiser-notifications.ts`
**Function:** `sendAdvertiserRejectionEmail()`
**Triggers:** When admin rejects advertiser

**Content:**
- Rejection notice
- Reason (if provided)
- Contact info for questions

### 3. Subscription Activation Email
**File:** `lib/email/subscription-notifications.ts`
**Function:** `sendSubscriptionActivatedEmail()`
**Triggers:** When subscription activates

---

## 🔧 Where Emails Are Called

### Advertiser Approval
**File:** `app/api/admin/advertisers/[id]/approve/route.ts`
**Line:** Calls `sendAdvertiserApprovalEmail()`

### Advertiser Rejection
**File:** `app/api/admin/advertisers/[id]/reject/route.ts`
**Line:** Calls `sendAdvertiserRejectionEmail()`

---

## 🧪 Testing Emails Locally

### Method 1: Use Resend Test Mode
1. Resend has a test mode that logs emails instead of sending
2. Check Resend dashboard → "Logs" tab
3. All emails will appear there (even in test mode)

### Method 2: Use Test Email Address
1. Use a real email you control
2. Submit advertiser application
3. Check your inbox

### Method 3: Use Resend's Test API Key
1. Resend provides a test API key
2. Emails won't actually send but will be logged
3. Good for development

---

## ⚠️ Important Notes

1. **Rate Limits:**
   - Resend free tier: 100 emails/day
   - Don't exceed or emails will be queued

2. **Domain Verification:**
   - Unverified domains may go to spam
   - Verify your domain for better deliverability

3. **From Address:**
   - Must be a valid email
   - Use your domain email: `noreply@argufight.com`

4. **Environment Variables:**
   - Never commit API keys to git
   - Use `.env.local` for local dev
   - Use Vercel environment variables for production

---

## 📊 Email Service Comparison

| Service | Free Tier | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Resend** | 3,000/month | ⭐ Easy | Modern apps, React Email |
| **SendGrid** | 3,000/month | ⭐⭐ Medium | Enterprise, high volume |
| **Mailgun** | 3,000/month | ⭐⭐ Medium | Transactional emails |
| **Mailjet** | 6,000/month | ⭐⭐ Medium | Marketing + transactional |

---

## ✅ Recommended: Stick with Resend

**Why:**
- ✅ Already integrated
- ✅ Great free tier
- ✅ Easy to use
- ✅ Good documentation
- ✅ React Email support (if you want HTML templates)

**Next Steps:**
1. Sign up at https://resend.com
2. Get API key
3. Add to `.env` or Admin Settings
4. Test by approving an advertiser
5. Check Resend dashboard for sent emails

---

## 🐛 Troubleshooting

### Emails Not Sending
1. Check API key is correct
2. Check Resend dashboard for errors
3. Verify domain (if using custom domain)
4. Check spam folder
5. Check rate limits

### API Key Not Working
1. Verify key starts with `re_`
2. Check for extra spaces
3. Restart dev server after adding key
4. Check Admin Settings if using that method

### Emails Going to Spam
1. Verify your domain in Resend
2. Set up SPF/DKIM records
3. Use a proper "from" address
4. Avoid spam trigger words

---

**Ready to test? Sign up at https://resend.com and add your API key!**

# Vercel Cron Job Limitation (Hobby Plan)

**Date**: 2026-01-24
**Status**: WORKAROUND APPLIED ⚠️

---

## Issue

Vercel Hobby accounts are limited to **daily cron jobs only**. Cron expressions that run more frequently (hourly, every 15 minutes, etc.) require a **Vercel Pro plan** ($20/month).

### Original Cron Schedules (Ideal)

| Path | Original Schedule | Frequency | Status |
|------|------------------|-----------|--------|
| `/api/cron/expire-offers` | `0 1 * * *` | Daily 1 AM | ✅ Works on Hobby |
| `/api/cron/process-escrow` | `0 2 * * *` | Daily 2 AM | ✅ Works on Hobby |
| `/api/cron/process-ad-tasks` | `0 3 * * *` | Daily 3 AM | ✅ Works on Hobby |
| `/api/cron/ai-tasks` | `*/15 * * * *` | Every 15 min | ❌ Requires Pro |
| `/api/cron/tournament-auto-start` | `0 * * * *` | Hourly | ❌ Requires Pro |
| `/api/cron/tournament-progression` | `*/30 * * * *` | Every 30 min | ❌ Requires Pro |

### Current Workaround (Hobby Plan)

All cron jobs now run **once daily** at different times:

| Path | Current Schedule | Frequency |
|------|-----------------|-----------|
| `/api/cron/expire-offers` | `0 1 * * *` | Daily 1 AM |
| `/api/cron/process-escrow` | `0 2 * * *` | Daily 2 AM |
| `/api/cron/process-ad-tasks` | `0 3 * * *` | Daily 3 AM |
| `/api/cron/ai-tasks` | `0 4 * * *` | Daily 4 AM |
| `/api/cron/tournament-auto-start` | `0 5 * * *` | Daily 5 AM |
| `/api/cron/tournament-progression` | `0 6 * * *` | Daily 6 AM |

---

## Impact of Workaround

### ⚠️ Functionality Limitations

1. **AI Bot Responses** (ai-tasks)
   - **Ideal**: Every 15 minutes
   - **Current**: Once per day at 4 AM
   - **Impact**: AI bots will only auto-accept challenges and respond once daily, creating significant delays in debates

2. **Tournament Auto-Start** (tournament-auto-start)
   - **Ideal**: Every hour
   - **Current**: Once per day at 5 AM
   - **Impact**: Tournaments won't start immediately when full or past start date; will wait until next day

3. **Tournament Round Progression** (tournament-progression)
   - **Ideal**: Every 30 minutes
   - **Current**: Once per day at 6 AM
   - **Impact**: Round advancement significantly delayed; tournaments take much longer to complete

---

## Solutions

### Option 1: Upgrade to Vercel Pro ($20/month)

**Pros**:
- Unlimited cron job frequency
- All features work as designed
- Professional tier features (analytics, etc.)

**Cons**:
- Monthly cost

**How to Upgrade**:
1. Go to [Vercel Dashboard → Settings → Billing](https://vercel.com/dashboard/settings/billing)
2. Click "Upgrade to Pro"
3. Update `vercel.json` with original schedules
4. Redeploy

---

### Option 2: Self-Host Cron Jobs

**Pros**:
- Free
- Full control over frequency
- No vendor lock-in

**Cons**:
- Requires separate server/service
- More maintenance

**Implementation Options**:

#### A. GitHub Actions (Free)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Cron Jobs

on:
  schedule:
    # AI tasks every 15 minutes
    - cron: '*/15 * * * *'
    # Tournament auto-start every hour
    - cron: '0 * * * *'
    # Tournament progression every 30 minutes
    - cron: '*/30 * * * *'

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Cron Endpoint
        run: |
          curl -X GET "https://www.argufight.com/api/cron/ai-tasks?secret=${{ secrets.CRON_SECRET }}"
          curl -X GET "https://www.argufight.com/api/cron/tournament-auto-start?secret=${{ secrets.CRON_SECRET }}"
          curl -X GET "https://www.argufight.com/api/cron/tournament-progression?secret=${{ secrets.CRON_SECRET }}"
```

**Setup**:
1. Add `CRON_SECRET` to GitHub repository secrets
2. Add secret verification to cron endpoints
3. Commit workflow file
4. GitHub Actions will trigger endpoints on schedule

**Limitation**: GitHub Actions cron is not guaranteed to run exactly on schedule (can be delayed 5-10 minutes during high load).

---

#### B. Railway.app or Render.com (Free Tier)

Deploy a simple Node.js cron service:

```javascript
// cron-service.js
const cron = require('node-cron');
const axios = require('axios');

const BASE_URL = 'https://www.argufight.com';
const SECRET = process.env.CRON_SECRET;

// AI tasks every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  await axios.get(`${BASE_URL}/api/cron/ai-tasks?secret=${SECRET}`);
});

// Tournament auto-start every hour
cron.schedule('0 * * * *', async () => {
  await axios.get(`${BASE_URL}/api/cron/tournament-auto-start?secret=${SECRET}`);
});

// Tournament progression every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  await axios.get(`${BASE_URL}/api/cron/tournament-progression?secret=${SECRET}`);
});

console.log('Cron service started');
```

**Setup**:
1. Create new repository with above code
2. Deploy to Railway.app or Render.com (free tier)
3. Add `CRON_SECRET` environment variable
4. Service runs 24/7 triggering cron endpoints

---

#### C. Cloud-Based Cron Services (Free Tier Available)

**EasyCron** (https://www.easycron.com/):
- Free tier: 1 cron job
- Paid: $0.99/month for unlimited

**cron-job.org** (https://cron-job.org/):
- Free: unlimited cron jobs
- Reliable execution
- No credit card required

**Setup**:
1. Create account
2. Add cron jobs with URL: `https://www.argufight.com/api/cron/ai-tasks?secret=YOUR_SECRET`
3. Set schedule
4. Service pings endpoints on schedule

---

### Option 3: Hybrid Approach (Recommended for Testing)

**Keep daily crons on Vercel Hobby (current setup)**
- Use for testing and development
- Verify all cron jobs work correctly
- No cost

**When ready for production:**
- Upgrade to Vercel Pro for simplicity
- OR implement GitHub Actions for cost savings

---

## Security Recommendation

All cron endpoints should verify a secret token to prevent unauthorized execution:

```typescript
// In each cron endpoint
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... rest of cron logic
}
```

Add `CRON_SECRET` to Vercel environment variables.

---

## Current Status

✅ **Deployed with daily cron jobs** (Hobby plan compatible)
⚠️ **Reduced functionality** (AI bots, tournaments run once daily)
🔄 **Recommendation**: Upgrade to Pro when ready for production, or use GitHub Actions for free frequent crons

---

## Next Steps

1. **Test current daily cron setup** in production
2. **Decide on long-term solution**:
   - Upgrade to Vercel Pro ($20/month)
   - Implement GitHub Actions (free, 5-10 min delay)
   - Use external cron service (free/cheap)
3. **Update `vercel.json`** with chosen solution
4. **Redeploy**

---

**Last Updated**: 2026-01-24
**Deployment Status**: Daily crons active (Hobby plan workaround)

# Cron Jobs Setup Guide

## Vercel Hobby Plan Limitations

Vercel's Hobby plan only allows cron jobs that run **at most once per day**. This means:
- ✅ Daily cron jobs work fine
- ❌ Jobs that run multiple times per day (e.g., every 5 minutes, every hour) are not allowed

## Current Cron Jobs (Daily)

All cron jobs are configured to run once per day:

1. **Process Ad Payouts** - `0 2 * * *` (2:00 AM daily)
   - Route: `/api/cron/process-ad-payouts`
   - Processes completed ad contracts and releases payments

2. **Check Expired Offers** - `0 3 * * *` (3:00 AM daily)
   - Route: `/api/cron/check-expired-offers`
   - Marks expired offers as expired

3. **AI Tasks** - `0 4 * * *` (4:00 AM daily)
   - Route: `/api/cron/ai-tasks`
   - Combined endpoint that handles:
     - AI user auto-accepting challenges
     - AI user generating debate responses

## For More Frequent AI Tasks

If you need AI tasks to run more frequently (e.g., every 5-10 minutes), you have two options:

### Option 1: Use External Cron Service (Recommended)

Use a free external cron service like:
- **cron-job.org** (free tier available) - [Setup Guide](./CRON_JOB_SETUP_GUIDE.md)
- **EasyCron** (free tier available)
- **UptimeRobot** (free tier available)

**Quick Setup for cron-job.org:**
1. Sign up at https://cron-job.org
2. Create a new cron job
3. Set the URL to: `https://www.argufight.com/api/cron/ai-auto-accept`
4. Add Authorization header: `Bearer YOUR_CRON_SECRET` (if CRON_SECRET is set)
5. Set frequency: Every 5-10 minutes
6. Save and activate

**Note**: The web interface doesn't count against API rate limits. See [CRON_JOB_SETUP_GUIDE.md](./CRON_JOB_SETUP_GUIDE.md) for detailed instructions.

**Environment Variable:**
Make sure `CRON_SECRET` is set in your Vercel environment variables for security.

### Option 2: Upgrade to Vercel Pro

Vercel Pro plan allows unlimited cron jobs with any frequency. Upgrade at: https://vercel.com/pricing

## Manual Triggering

You can also manually trigger AI tasks using the scripts:

```bash
# Trigger AI auto-accept
npx tsx scripts/trigger-ai-auto-accept.ts

# Trigger AI response generation
npx tsx scripts/trigger-ai-response.ts
```

Or call the API endpoint directly:

```bash
curl -X GET "https://your-domain.com/api/cron/ai-tasks" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Security

All cron endpoints require authentication via the `CRON_SECRET` environment variable:

```typescript
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Make sure to:
1. Set `CRON_SECRET` in Vercel environment variables
2. Use the same secret when calling from external cron services
3. Keep the secret secure and don't commit it to git


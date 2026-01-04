# Belt System Automation Guide

## Overview

The belt system includes automated tasks that need to run periodically:
1. **Check for inactive belts** - Marks belts as inactive if not defended
2. **Clean up expired challenges** - Marks expired challenges as EXPIRED

## Automation Options

### Option 1: Daily Cron (Vercel Hobby Plan)

The belt tasks are **automatically included** in the existing `/api/cron/ai-tasks` cron job, which runs daily at 4 AM.

**No additional setup needed** - it's already running!

### Option 2: Standalone Endpoint (External Cron Service)

For more frequent runs (e.g., every 6-12 hours), use the standalone endpoint:

**Endpoint:** `POST /api/cron/belt-tasks`

**Setup with cron-job.org:**
1. Sign up at https://cron-job.org
2. Create a new cron job
3. URL: `https://www.argufight.com/api/cron/belt-tasks`
4. Method: `POST`
5. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
6. Schedule: Every 6-12 hours (or daily)

**Manual Trigger:**
```bash
curl -X POST https://www.argufight.com/api/cron/belt-tasks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 3: Manual Trigger (Admin UI)

Admins can manually trigger inactive belt checks from:
- `/admin/belts/inactive` - Click "Check for Inactive Belts" button

## What Gets Processed

### Inactive Belt Check
- Finds belts that haven't been defended within the inactivity period
- Marks them as `INACTIVE`
- Sends notifications to belt holders
- Returns count of belts marked inactive

### Expired Challenge Cleanup
- Finds challenges with status `PENDING` that have expired
- Marks them as `EXPIRED`
- Returns count of challenges cleaned up

## Environment Variables

Make sure `CRON_SECRET` is set in Vercel environment variables for security.

## Testing

Test the endpoint locally:
```bash
# Without auth (development)
curl -X POST http://localhost:3000/api/cron/belt-tasks

# With auth (production)
curl -X POST https://www.argufight.com/api/cron/belt-tasks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "results": {
    "inactiveBeltsChecked": 2,
    "expiredChallengesCleaned": 5,
    "errors": []
  },
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

# Cron Job Setup for Expired Rounds Processing

## Overview

The expired rounds processing system automatically handles debates where time has expired. It should run every 5-10 minutes to ensure timely processing.

## Automatic Processing

The system is automatically triggered in two ways:

1. **On API calls**: When fetching debates (`/api/debates`) or viewing a debate (`/api/debates/[id]`), expired rounds are processed in the background
2. **Manual/Cron**: Run the script manually or set up a cron job

## Manual Execution

### Using npm script:
```bash
npm run process-expired
```

### Using curl:
```bash
curl -X POST http://localhost:3000/api/debates/process-expired
```

### With authentication (production):
```bash
curl -X POST http://your-domain.com/api/debates/process-expired \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Setting Up a Cron Job

### Option 1: Using Windows Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Process Expired Debate Rounds"
4. Trigger: Daily (or every 5 minutes using "On a schedule")
5. Action: Start a program
   - Program: `node`
   - Arguments: `C:\path\to\your\project\node_modules\.bin\tsx scripts/process-expired-rounds.ts`
   - Start in: `C:\path\to\your\project`

### Option 2: Using cron (Linux/Mac)

Add to crontab (`crontab -e`):
```bash
# Process expired debate rounds every 5 minutes
*/5 * * * * cd /path/to/your/project && npm run process-expired >> /var/log/expired-rounds.log 2>&1
```

### Option 3: Using Vercel Cron Jobs

If deployed on Vercel, add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/debates/process-expired",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 4: Using External Cron Service

Services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Set up to call:
```
POST https://your-domain.com/api/debates/process-expired
Authorization: Bearer YOUR_CRON_SECRET
```

## Environment Variables

Add to `.env`:
```bash
# Optional: Set a secret for cron job authentication (production)
CRON_SECRET=your-secret-key-here
```

## What It Does

1. Finds all active debates with expired `roundDeadline`
2. Checks who submitted and who didn't
3. Creates penalty statements for non-submitters
4. Sends notifications
5. Advances rounds or ends debates
6. Triggers verdict generation if final round

## Monitoring

Check the logs to see:
- How many expired debates were found
- How many were processed
- Any errors that occurred

The endpoint returns:
```json
{
  "success": true,
  "timestamp": "2024-12-03T...",
  "results": {
    "processed": 2,
    "advanced": 1,
    "completed": 1,
    "errors": []
  }
}
```


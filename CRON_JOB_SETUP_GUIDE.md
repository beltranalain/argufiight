# Cron-Job.org Setup Guide for AI Auto-Accept

## Overview

cron-job.org is a free external cron service that can call your API endpoints at regular intervals. This is perfect for the AI auto-accept feature since Vercel Hobby plan only allows daily cron jobs.

## Setup Steps

### 1. Create Account

1. Go to https://cron-job.org
2. Sign up for a free account
3. Verify your email

### 2. Get Your API Key (Optional - for REST API)

If you want to use the REST API to manage jobs programmatically:
1. Go to Settings in the cron-job.org Console
2. Generate an API key
3. Save it securely (you'll need it for API calls)

### 3. Create Cron Job via Web Interface

1. **Login** to cron-job.org Console
2. **Click "Create Cronjob"**
3. **Fill in the form:**
   - **Title**: "AI Auto-Accept Challenges"
   - **Address (URL)**: `https://www.argufight.com/api/cron/ai-auto-accept`
   - **Request Method**: GET
   - **Schedule**: 
     - Select "Every X minutes"
     - Set to **5 minutes** (or 10 minutes if you prefer)
   - **Request Timeout**: 300 seconds (5 minutes)
   - **Save Responses**: Optional (helps with debugging)

4. **Add Authorization Header** (if CRON_SECRET is set:
   - Click "Request Options" or "Advanced"
   - Add Header:
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_CRON_SECRET`
   - (Replace `YOUR_CRON_SECRET` with your actual CRON_SECRET from Vercel environment variables)

5. **Click "Create Cronjob"**

### 4. Alternative: Create via REST API

If you prefer to use the REST API, here's a curl example:

```bash
curl -X PUT \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer YOUR_CRON_JOB_API_KEY' \
     -d '{
       "job": {
         "url": "https://www.argufight.com/api/cron/ai-auto-accept",
         "enabled": true,
         "title": "AI Auto-Accept Challenges",
         "requestMethod": 0,
         "requestTimeout": 300,
         "schedule": {
           "timezone": "UTC",
           "minutes": [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
           "hours": [-1],
           "mdays": [-1],
           "months": [-1],
           "wdays": [-1]
         },
         "extendedData": {
           "headers": {
             "Authorization": "Bearer YOUR_CRON_SECRET"
           }
         }
       }
     }' \
     https://api.cron-job.org/jobs
```

**Note**: Replace:
- `YOUR_CRON_JOB_API_KEY` with your cron-job.org API key
- `YOUR_CRON_SECRET` with your Vercel CRON_SECRET environment variable

### 5. Verify It's Working

1. **Check the cron job** in cron-job.org Console
2. **View execution history** to see if requests are being made
3. **Check your Vercel logs** to see if the endpoint is being called
4. **Test manually** by visiting: `https://www.argufight.com/api/cron/ai-auto-accept`

## Schedule Options

### Every 5 Minutes
- **Minutes**: `[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]`
- **Hours**: `[-1]` (every hour)
- **Days**: `[-1]` (every day)

### Every 10 Minutes
- **Minutes**: `[0, 10, 20, 30, 40, 50]`
- **Hours**: `[-1]` (every hour)
- **Days**: `[-1]` (every day)

## Free Tier Limits

According to the documentation:
- **Default**: 100 API requests per day
- **Sustaining members**: 5,000 requests per day
- **Rate limits**: Max 5 requests per second for listing/retrieving jobs

For calling your endpoint every 5 minutes:
- 12 calls per hour
- 288 calls per day
- This exceeds the free tier limit of 100 requests/day

**Solution**: Use the web interface instead of the REST API, or upgrade to sustaining member, or reduce frequency to every 10-15 minutes.

## Recommended Schedule

For AI auto-accept, **every 10 minutes** is a good balance:
- 6 calls per hour
- 144 calls per day
- Still exceeds free tier if using REST API, but web interface doesn't count against API limits

## Security Notes

1. **CRON_SECRET**: Make sure `CRON_SECRET` is set in Vercel environment variables
2. **IP Restriction**: You can optionally restrict the cron-job.org API key to specific IPs (if using REST API)
3. **HTTPS**: Always use HTTPS URLs

## Monitoring

1. **cron-job.org Console**: View execution history and success/failure rates
2. **Vercel Logs**: Check function logs to see if requests are being processed
3. **Application Logs**: The endpoint now has detailed logging to help debug

## Troubleshooting

### Cron job not executing
- Check cron-job.org Console for errors
- Verify the URL is correct
- Check if CRON_SECRET is set (if required)

### 401 Unauthorized
- Verify CRON_SECRET is set in Vercel
- Check the Authorization header is correct in cron-job.org

### AI bots not accepting
- Check AI user configuration (`isAI: true`, `aiPaused: false`)
- Verify `aiResponseDelay` is set correctly (600000 = 10 minutes)
- Check application logs for detailed logging

## Alternative Services

If cron-job.org doesn't work for you, other free options include:
- **EasyCron** (free tier available)
- **UptimeRobot** (free tier available)
- **Cronitor** (free tier available)


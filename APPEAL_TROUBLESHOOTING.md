# Appeal Troubleshooting Guide

## Problem
An appeal was submitted but is stuck in "PENDING" status and hasn't been processed.

## Why This Happens
The appeal system triggers verdict regeneration asynchronously via a `fetch` call. If this call fails (network error, timeout, or the regenerate endpoint errors), the appeal remains in PENDING status.

## How to Check Appeal Status

### Option 1: Use the Diagnostic Endpoint (After Deployment)
Once the new endpoints are deployed, you can check all appeals:

```powershell
# Check all appeals
$response = Invoke-WebRequest -Uri "https://honorable-ai.vercel.app/api/debates/check-appeals" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
$data.summary
$data.appeals
```

### Option 2: Check Vercel Function Logs
1. Go to your Vercel dashboard
2. Navigate to your project → Functions → Logs
3. Look for errors related to `/api/verdicts/regenerate` or `/api/debates/[id]/appeal`
4. Check for any timeout errors or failed fetch calls

## How to Fix a Stuck Appeal

### Step 1: Find the Debate ID
From the image you shared, the debate topic is "Ed Reed was a better safety at Miami". You can find the debate ID by:
- Looking at the URL when viewing the debate
- Or checking the browser's network tab when the appeal page loads

### Step 2: Manually Trigger Processing
Once you have the debate ID, use the process-appeal endpoint:

```powershell
# Replace DEBATE_ID with the actual debate ID
$debateId = "YOUR_DEBATE_ID"
$body = @{ debateId = $debateId } | ConvertTo-Json
$response = Invoke-WebRequest -Uri "https://honorable-ai.vercel.app/api/debates/process-appeal" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content | ConvertFrom-Json
```

### Step 3: Verify the Appeal Was Processed
Check the appeal status again:

```powershell
$response = Invoke-WebRequest -Uri "https://honorable-ai.vercel.app/api/debates/check-appeals" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
$data.appeals | Where-Object { $_.id -eq "YOUR_DEBATE_ID" }
```

## Common Issues

### Issue 1: `NEXT_PUBLIC_APP_URL` Not Set
**Symptom**: The fetch call uses `localhost:3000` instead of the Vercel URL.

**Fix**: Set `NEXT_PUBLIC_APP_URL` in Vercel environment variables to `https://honorable-ai.vercel.app` (or your custom domain).

### Issue 2: Regenerate Endpoint Timeout
**Symptom**: The regenerate endpoint times out (>10 seconds).

**Fix**: The regenerate endpoint now runs verdict generation in parallel and uses non-blocking AI reason generation to prevent timeouts.

### Issue 3: No Judges Available
**Symptom**: Error message about not having enough judges.

**Fix**: Ensure you have at least 3 judges in the database. Run the seed script if needed.

### Issue 4: DeepSeek API Key Missing
**Symptom**: Verdict generation fails with API key error.

**Fix**: Ensure `DEEPSEEK_API_KEY` is set in Vercel environment variables.

## Prevention
The appeal endpoint now includes better error logging. Check Vercel function logs to see if the fetch call is failing and why.


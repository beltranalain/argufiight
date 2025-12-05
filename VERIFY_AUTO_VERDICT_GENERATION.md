# How to Verify Automatic Verdict Generation is Working

## The Problem

Verdict generation works automatically **offline** but not **online**. This guide helps you diagnose and fix the issue.

---

## 🔍 Step 1: Check Diagnostic Endpoint

Run this command to see the current status:

```powershell
Invoke-WebRequest -Uri "https://honorable-ai.vercel.app/api/debates/check-auto-verdicts" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

Or visit in browser:
```
https://honorable-ai.vercel.app/api/debates/check-auto-verdicts
```

This will show you:
- ✅ Environment variables (NEXT_PUBLIC_APP_URL, VERCEL_URL)
- ✅ Configuration status (judges, DeepSeek API key)
- ✅ Debates that completed but don't have verdicts
- ✅ Recent completed debates and their verdict status
- ✅ Recommendations for fixes

---

## 🔍 Step 2: Check Vercel Environment Variables

### Required Variables:

1. **NEXT_PUBLIC_APP_URL** (Most Important!)
   - Should be: `https://argufight.com` (or your Vercel URL)
   - **Why**: The automatic trigger uses this to call `/api/verdicts/generate`
   - **If missing**: The trigger will try `http://localhost:3000` which won't work on Vercel

2. **VERCEL_URL** (Fallback)
   - Automatically set by Vercel
   - Only used if `NEXT_PUBLIC_APP_URL` is not set
   - Format: `your-project-xyz.vercel.app`

3. **DEEPSEEK_API_KEY**
   - Required for AI verdict generation
   - Check if it's set in Vercel dashboard

### How to Check:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_APP_URL` is set to `https://argufight.com`
3. Verify `DEEPSEEK_API_KEY` is set

---

## 🔍 Step 3: Check Vercel Function Logs

When a debate completes, check the logs:

1. Go to Vercel Dashboard → Your Project → Functions
2. Look for `/api/debates/[id]/submit` or `/api/debates/[id]/statements`
3. Check for these log messages:
   - ✅ `✅ Verdict generation triggered successfully for debate: [id]`
   - ❌ `❌ Failed to trigger verdict generation:`
   - ❌ `❌ Error triggering verdict generation:`

### What to Look For:

**Good Logs:**
```
✅ Verdict generation triggered successfully for debate: c1dca92a-6150-4686-bd6b-8e791daba989
```

**Bad Logs:**
```
❌ Failed to trigger verdict generation: {
  debateId: "...",
  status: 404,
  error: "Not Found",
  url: "http://localhost:3000/api/verdicts/generate"  // ← Wrong URL!
}
```

---

## 🔍 Step 4: Test Automatic Trigger

### Create a Test Debate:

1. Create a new debate with 2 rounds (quick test)
2. Complete both rounds
3. Watch the Vercel logs in real-time
4. Check if verdicts are generated automatically

### What Should Happen:

1. Last statement submitted → Debate status changes to `COMPLETED`
2. Code triggers `fetch('/api/verdicts/generate')`
3. Verdicts are generated
4. Debate status changes to `VERDICT_READY`

---

## 🐛 Common Issues & Fixes

### Issue 1: Wrong URL in Fetch Call

**Symptom**: Logs show `http://localhost:3000/api/verdicts/generate` instead of production URL

**Fix**: 
- Set `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- Value should be: `https://argufight.com`
- Redeploy after setting

### Issue 2: Fetch Fails Silently

**Symptom**: No error logs, but verdicts don't generate

**Possible Causes**:
- Network timeout (Vercel function timeout)
- CORS issue
- URL not accessible

**Fix**:
- Check Vercel function timeout settings
- Verify the URL is correct
- Check network tab in browser dev tools

### Issue 3: DeepSeek API Key Not Set

**Symptom**: Verdict generation fails with "AI service not configured"

**Fix**:
- Set `DEEPSEEK_API_KEY` in Vercel environment variables
- Verify it's set for Production, Preview, and Development

### Issue 4: No Judges in Database

**Symptom**: "No judges available" error

**Fix**:
- Run seed script: Click "Seed Database" in admin dashboard
- Or run locally: `npm run seed:all`

---

## 🔧 How the Automatic Trigger Works

### When a Debate Completes:

1. **User submits final statement** → `/api/debates/[id]/submit` or `/api/debates/[id]/statements`

2. **Code checks if debate is complete**:
   ```typescript
   if (debate.currentRound >= debate.totalRounds) {
     // Debate complete
     status = 'COMPLETED'
   }
   ```

3. **Triggers verdict generation** (non-blocking):
   ```typescript
   fetch(`${baseUrl}/api/verdicts/generate`, {
     method: 'POST',
     body: JSON.stringify({ debateId })
   })
   ```

4. **Verdict generation runs**:
   - Gets 3 random judges
   - Generates verdicts from each
   - Updates debate status to `VERDICT_READY`
   - Sets winner and ELO changes

### Why It Might Fail:

- **Wrong baseUrl**: If `NEXT_PUBLIC_APP_URL` is not set, it uses `localhost:3000`
- **Network error**: The fetch call fails (timeout, connection error)
- **Silent failure**: Errors are logged but don't stop execution
- **Function timeout**: Vercel function times out before verdict generation completes

---

## ✅ Verification Checklist

- [ ] `NEXT_PUBLIC_APP_URL` is set in Vercel (should be `https://argufight.com`)
- [ ] `DEEPSEEK_API_KEY` is set in Vercel
- [ ] Judges exist in database (check admin dashboard)
- [ ] Diagnostic endpoint shows no blockers
- [ ] Vercel logs show successful trigger messages
- [ ] Test debate generates verdicts automatically

---

## 🧪 Test Procedure

1. **Check current status**:
   ```powershell
   Invoke-WebRequest -Uri "https://honorable-ai.vercel.app/api/debates/check-auto-verdicts" -UseBasicParsing
   ```

2. **Create a test debate**:
   - Go to dashboard
   - Create debate with 2 rounds
   - Complete both rounds

3. **Monitor logs**:
   - Watch Vercel function logs
   - Look for verdict generation messages

4. **Verify result**:
   - Check debate page
   - Should show verdicts within 30-60 seconds

---

## 📊 Expected Behavior

**Offline (Local)**:
- ✅ Works automatically
- ✅ Uses `http://localhost:3000`
- ✅ Verdicts generate immediately

**Online (Vercel)**:
- ⚠️ Should work automatically
- ⚠️ Uses `NEXT_PUBLIC_APP_URL` or `VERCEL_URL`
- ⚠️ May fail if URL is wrong or environment variables not set

---

## 🚨 If It's Still Not Working

1. **Check Vercel Logs**: Look for error messages
2. **Verify Environment Variables**: Make sure all are set correctly
3. **Test Manually**: Use the diagnostic endpoint to trigger verdicts
4. **Check Network**: Verify the URL is accessible
5. **Add Fallback**: Consider adding a cron job to process completed debates

---

**Last Updated**: After adding diagnostic endpoint  
**Status**: Ready to diagnose automatic verdict generation issues


# Database Connection Troubleshooting

## Current Error
```
Can't reach database server at `db.prisma.io:5432`
```

This means the `DATABASE_URL` environment variable in Vercel is either:
1. **Not set** in Production environment
2. **Set incorrectly** (wrong format or expired credentials)
3. **Database server is down** (less likely)

## Quick Fix Steps

### Step 1: Verify Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Check that you have these variables set for **Production**:

#### Required Variables:

**DATABASE_URL**
```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```
- **Environment:** Must be set for **Production** (and Preview/Development if needed)
- **Important:** Make sure it's enabled for Production environment

**DIRECT_URL** (also required)
```
postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
```
- **Environment:** Must be set for **Production**
- **Value:** Same as DATABASE_URL

### Step 2: Check Environment Scope

**Critical:** Make sure the variables are set for the **Production** environment!

1. In Vercel, go to **Settings** → **Environment Variables**
2. For each variable (`DATABASE_URL` and `DIRECT_URL`):
   - Check the **Environment** column
   - Make sure **Production** is checked ✅
   - If not, click the variable → Edit → Check **Production** → Save

### Step 3: Verify Database Connection String

The connection string format should be:
```
postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

For your Prisma database:
- **Host:** `db.prisma.io`
- **Port:** `5432`
- **Database:** `postgres`
- **SSL:** Required (`?sslmode=require`)

### Step 4: Test Database Connection

1. Visit: `https://your-app.vercel.app/api/test-db`
2. This will show you:
   - Whether `DATABASE_URL` is set
   - Whether `DIRECT_URL` is set
   - The connection string prefix (first 30 chars)

### Step 5: Redeploy After Changes

After updating environment variables:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger a new deployment

**Important:** Environment variable changes require a redeploy to take effect!

## Common Issues

### Issue 1: Variable Not Set for Production
**Symptom:** Works locally but fails in production
**Fix:** Make sure `DATABASE_URL` and `DIRECT_URL` are enabled for **Production** environment

### Issue 2: Expired Database Credentials
**Symptom:** Connection string looks correct but connection fails
**Fix:** 
1. Check your Prisma dashboard
2. Regenerate database credentials if needed
3. Update `DATABASE_URL` and `DIRECT_URL` in Vercel

### Issue 3: Wrong Connection String Format
**Symptom:** Error parsing connection string
**Fix:** Make sure the format is exactly:
```
postgres://username:password@host:port/database?sslmode=require
```

## Verification Checklist

- [ ] `DATABASE_URL` is set in Vercel
- [ ] `DATABASE_URL` is enabled for **Production** environment
- [ ] `DIRECT_URL` is set in Vercel
- [ ] `DIRECT_URL` is enabled for **Production** environment
- [ ] Connection string format is correct (starts with `postgres://`)
- [ ] Connection string includes `?sslmode=require`
- [ ] Redeployed after setting/changing variables
- [ ] Tested with `/api/test-db` endpoint

## Next Steps

1. **Check Vercel Environment Variables** - Verify `DATABASE_URL` and `DIRECT_URL` are set for Production
2. **Redeploy** - After any changes, redeploy the application
3. **Test Connection** - Visit `/api/test-db` to verify the connection
4. **Check Prisma Dashboard** - Verify database is active and credentials are valid


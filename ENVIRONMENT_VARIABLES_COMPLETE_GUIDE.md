# 🔐 Complete Environment Variables Guide

**Date:** December 14, 2025  
**Purpose:** All required and optional environment variables for Argu Fight

---

## ✅ REQUIRED Environment Variables

### 1. DATABASE_URL ⚠️ CRITICAL
- **Key:** `DATABASE_URL`
- **Value:** Your Neon PostgreSQL connection string
- **Format:** `postgresql://user:password@host:port/database?sslmode=require`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Why:** Required for all database operations
- **Where to Get:** Neon Dashboard → Connection String

### 2. DIRECT_URL ⚠️ CRITICAL
- **Key:** `DIRECT_URL`
- **Value:** Same as DATABASE_URL (without connection pooling)
- **Format:** `postgresql://user:password@host:port/database?sslmode=require`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Why:** Required for Prisma migrations
- **Note:** For Neon, use the direct connection string (not pooled)

### 3. AUTH_SECRET
- **Key:** `AUTH_SECRET`
- **Value:** Random 64-character hex string
- **Generate:** `openssl rand -hex 32`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Why:** Used for session encryption and authentication

### 4. BLOB_READ_WRITE_TOKEN
- **Key:** `BLOB_READ_WRITE_TOKEN`
- **Value:** Vercel Blob Storage token
- **Format:** `vercel_blob_rw_...`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Why:** For file uploads and image storage
- **Where to Get:** Vercel Dashboard → Storage → Blob

### 5. DEEPSEEK_API_KEY
- **Key:** `DEEPSEEK_API_KEY`
- **Value:** Your DeepSeek API key
- **Format:** `sk-...`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Why:** For AI-powered features (debate judgments, moderation)
- **Where to Get:** https://platform.deepseek.com/api_keys

---

## 🔵 OPTIONAL Environment Variables

### 6. NEXT_PUBLIC_APP_URL (Recommended)
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** Your production domain (e.g., `https://www.argufight.com`)
- **Environments:** ✅ Production only
- **Why:** Used for generating absolute URLs, email links, redirects
- **Default:** Falls back to `https://www.argufight.com` if not set

### 7. NEXT_PUBLIC_GOOGLE_ANALYTICS_ID (Optional)
- **Key:** `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- **Value:** Your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`)
- **Environments:** ✅ Production
- **Why:** For Google Analytics tracking
- **Default:** Falls back to `G-41YDQDD6J3` if not set

### 8. GOOGLE_SEARCH_CONSOLE_VERIFICATION (Optional)
- **Key:** `GOOGLE_SEARCH_CONSOLE_VERIFICATION`
- **Value:** Google Search Console verification code
- **Environments:** ✅ Production
- **Why:** For Google Search Console verification
- **Note:** You're already verified via DNS, so this is optional

### 9. PRISMA_DATABASE_URL (Optional - for Prisma Accelerate)
- **Key:** `PRISMA_DATABASE_URL`
- **Value:** Prisma Accelerate connection string
- **Format:** `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
- **Environments:** ✅ Production
- **Why:** For faster database queries (connection pooling)
- **Note:** Reduces database connections, saves Neon usage

---

## 📋 Quick Setup Checklist

### In Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable below:

### Required (5 variables):
- [ ] `DATABASE_URL` - Neon PostgreSQL connection
- [ ] `DIRECT_URL` - Same as DATABASE_URL
- [ ] `AUTH_SECRET` - Random hex string
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- [ ] `DEEPSEEK_API_KEY` - DeepSeek API key

### Recommended (2 variables):
- [ ] `NEXT_PUBLIC_APP_URL` - Your domain
- [ ] `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - GA4 ID

### Optional (1 variable):
- [ ] `PRISMA_DATABASE_URL` - Prisma Accelerate (reduces Neon usage)

---

## 🎯 How to Reduce Neon Database Usage

### Strategy 1: Use Prisma Accelerate (Recommended) ⭐
**Impact:** Reduces database connections by 80-90%

**How it works:**
- Prisma Accelerate acts as a connection pooler
- Reduces direct connections to Neon
- Caches query results
- **Cost:** Free tier available, then ~$10/month

**Setup:**
1. Sign up at: https://www.prisma.io/data-platform/accelerate
2. Create a project
3. Get your Accelerate connection string
4. Add as `PRISMA_DATABASE_URL` in Vercel
5. Update `prisma/schema.prisma` to use Accelerate URL

**Benefits:**
- ✅ Reduces Neon compute time
- ✅ Faster queries (caching)
- ✅ Better connection management
- ✅ Can save 50-80% on Neon costs

---

### Strategy 2: Implement Query Caching
**Impact:** Reduces database queries by 30-50%

**What to Cache:**
1. **Homepage Content** (5-10 minutes)
   - Homepage sections
   - Categories
   - Popular debates

2. **Leaderboard** (5-10 minutes)
   - ELO leaderboard
   - Tournament leaderboard

3. **Debate Lists** (1-5 minutes)
   - Trending debates
   - Category listings
   - Search results

4. **Static Content** (1 hour)
   - Blog posts
   - Legal pages
   - FAQ content

**Implementation:**
- Already have `lib/utils/cache.ts` utility
- Use it for frequently accessed data
- Set appropriate TTL (time-to-live)

---

### Strategy 3: Optimize Database Queries
**Impact:** Reduces query time and compute usage

**Optimizations:**
1. **Use `select` instead of `include`** when possible
   - Only fetch fields you need
   - Reduces data transfer

2. **Add Database Indexes**
   - Already have indexes on: `status`, `category`, `createdAt`, `slug`
   - Consider adding: `updatedAt`, `visibility`, `challengerId`, `opponentId`

3. **Limit Query Results**
   - Always use `take` and `skip` for pagination
   - Don't fetch all records

4. **Use Aggregations**
   - Use `_count` instead of fetching all records
   - Use `groupBy` for statistics

---

### Strategy 4: Reduce Background Jobs
**Impact:** Reduces unnecessary database queries

**Current Background Jobs:**
- `/api/debates/process-expired` - Called on every debate fetch
- `/api/cron/ai-auto-accept` - Called on every debate fetch

**Optimization:**
- Run these via scheduled cron jobs instead
- Don't trigger on every page load
- Use Vercel Cron Jobs (free tier available)

---

### Strategy 5: Use Connection Pooling
**Impact:** Reduces connection overhead

**Neon Connection Pooling:**
- Neon provides pooled connections automatically
- Use `?pgbouncer=true` in connection string
- Reduces connection overhead

**Example:**
```
postgresql://user:pass@host/db?sslmode=require&pgbouncer=true
```

---

### Strategy 6: Optimize Page Loads
**Impact:** Reduces database queries per page

**Current Issues:**
1. **Homepage** - Fetches homepage sections on every load
   - **Fix:** Cache for 5-10 minutes

2. **Debate Pages** - Multiple queries per page
   - **Fix:** Combine queries where possible
   - **Fix:** Cache debate data for 1-2 minutes

3. **Leaderboard** - Fetches all users
   - **Fix:** Already paginated, but cache results

---

## 📊 Estimated Cost Savings

### Without Optimizations:
- **Estimated Neon Usage:** ~100-200 compute hours/month
- **Cost:** ~$20-40/month (depending on plan)

### With Optimizations:
- **Prisma Accelerate:** -50% compute time
- **Query Caching:** -30% queries
- **Query Optimization:** -20% query time
- **Total Savings:** ~60-70% reduction
- **New Cost:** ~$6-12/month

---

## 🚀 Quick Wins (Implement First)

### 1. Add Prisma Accelerate (30 minutes)
**Impact:** High (50-80% reduction)
**Cost:** Free tier available

### 2. Cache Homepage Content (15 minutes)
**Impact:** Medium (reduces queries)
**Cost:** Free (in-memory cache)

### 3. Cache Leaderboard (15 minutes)
**Impact:** Medium (reduces heavy queries)
**Cost:** Free (in-memory cache)

### 4. Optimize Background Jobs (30 minutes)
**Impact:** Medium (reduces unnecessary queries)
**Cost:** Free (use Vercel Cron)

---

## 📝 Implementation Priority

### Week 1: High Impact
1. ✅ Add Prisma Accelerate
2. ✅ Cache homepage content
3. ✅ Cache leaderboard

### Week 2: Medium Impact
4. ✅ Optimize background jobs
5. ✅ Add query result caching
6. ✅ Optimize debate page queries

### Week 3: Fine-tuning
7. ✅ Add more indexes
8. ✅ Optimize admin queries
9. ✅ Monitor and adjust

---

## 🔍 Monitoring Neon Usage

### Check Usage:
1. Go to Neon Dashboard
2. View **Usage** tab
3. Monitor:
   - Compute hours
   - Storage used
   - Connections

### Set Alerts:
1. Set usage alerts at 80% of limit
2. Monitor daily usage
3. Track trends over time

---

## ✅ Summary

### Required Variables (5):
1. `DATABASE_URL`
2. `DIRECT_URL`
3. `AUTH_SECRET`
4. `BLOB_READ_WRITE_TOKEN`
5. `DEEPSEEK_API_KEY`

### Recommended Variables (2):
6. `NEXT_PUBLIC_APP_URL`
7. `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`

### Optional (Reduces Neon Usage):
8. `PRISMA_DATABASE_URL` - **Highly recommended for cost savings**

---

## 💡 Best Practices

1. **Never commit secrets** - Use environment variables only
2. **Use different values** for Production vs Development
3. **Rotate secrets** periodically (especially AUTH_SECRET)
4. **Monitor usage** regularly
5. **Use connection pooling** (Neon provides this)
6. **Cache aggressively** - Better to serve stale data than hit DB

---

**Need help?** Check `VERCEL_ENV_VARIABLES_CHECKLIST.md` for step-by-step setup instructions.

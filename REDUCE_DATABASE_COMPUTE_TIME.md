# Free Solutions to Reduce Database Compute Time

## Problem
Neon free tier has compute time limits. You're hitting the quota, but don't want to pay for an upgrade.

## ✅ Solutions Implemented (Free)

### 1. **Removed Database Query from Layout** ✅
**File:** `app/layout.tsx`
- **Before:** Queried database for Google Search Console verification on every page load
- **After:** Uses environment variable only (no database query)
- **Impact:** Saves 1 database query per page load

### 2. **Added Caching to Homepage API** ✅
**File:** `app/api/homepage/content/route.ts`
- **Before:** Every request queried database
- **After:** Caches results for 10 minutes
- **Impact:** Reduces database queries by ~95% for homepage content

### 3. **Added Caching to Ticker API** ✅
**File:** `app/api/ticker/route.ts`
- **Before:** Made 6+ database queries on every request
- **After:** Caches results for 5 minutes
- **Impact:** Reduces database queries by ~95% for ticker updates

### 4. **Homepage Uses Cached API** ✅
**File:** `app/page.tsx`
- **Before:** Direct database query
- **After:** Uses cached API endpoint
- **Impact:** Benefits from API-level caching

---

## 📋 Additional Free Options

### Option 1: Move More Settings to Environment Variables
**Impact:** High - Reduces queries on every page load

**Files to update:**
- `app/api/auth/google/route.ts` - Google OAuth settings
- `app/api/auth/google/callback/route.ts` - Google OAuth settings
- `app/api/tournaments/route.ts` - Tournament settings

**How:**
1. Set values in Vercel environment variables
2. Remove database queries
3. Use `process.env.VARIABLE_NAME` instead

### Option 2: Increase Cache TTLs
**Impact:** Medium - Reduces queries but data may be slightly stale

**Current cache times:**
- Homepage: 10 minutes
- Ticker: 5 minutes

**Can increase to:**
- Homepage: 30-60 minutes (rarely changes)
- Ticker: 10-15 minutes (acceptable delay)

### Option 3: Reduce Ticker Query Frequency
**Impact:** High - Ticker makes 6+ queries per request

**Current:** Fetches big battles, high views, upsets, verdicts, streaks, milestones

**Optimization:**
- Only fetch top 3-5 items per category (instead of 5-10)
- Reduce date ranges (1 day instead of 24 hours)
- Skip less important categories (milestones, streaks)

### Option 4: Use Static Generation for Blog
**Impact:** Medium - Blog posts rarely change

**How:**
- Use Next.js `generateStaticParams` for blog posts
- Revalidate every hour instead of on-demand
- Reduces database queries significantly

### Option 5: Batch Admin Settings Queries
**Impact:** Medium - Reduces multiple queries to one

**Current:** Many endpoints query `adminSetting` individually

**Optimization:**
- Create a single `/api/settings` endpoint
- Cache all settings for 30 minutes
- Other endpoints fetch from cache

### Option 6: Switch to Supabase (Free Tier)
**Impact:** High - Different provider, different limits

**Supabase Free Tier:**
- 500 MB database
- 2 GB bandwidth
- No compute time limits (different pricing model)
- Auto-pauses after 1 week of inactivity

**Migration:**
1. Export data from Neon
2. Import to Supabase
3. Update `DATABASE_URL` in Vercel
4. Test and deploy

### Option 7: Use Railway (Free Tier)
**Impact:** High - $5 credit/month (effectively free for small apps)

**Railway Free Tier:**
- $5 credit/month
- PostgreSQL included
- No compute time limits
- Auto-scales

**Migration:**
1. Create Railway account
2. Create PostgreSQL database
3. Export/import data
4. Update `DATABASE_URL`

### Option 8: Optimize Database Queries
**Impact:** Medium - Makes queries faster (uses less compute time)

**Optimizations:**
- Add database indexes (already have some)
- Use `select` to limit fields returned
- Batch queries where possible
- Use aggregation queries instead of fetching all records

---

## 🎯 Recommended Priority

### Immediate (Do Now):
1. ✅ Remove layout database query (DONE)
2. ✅ Add caching to homepage/ticker (DONE)
3. Move Google OAuth settings to env variables
4. Increase cache TTLs to 30-60 minutes

### Short Term (This Week):
5. Reduce ticker query frequency
6. Batch admin settings queries
7. Add more caching to frequently accessed endpoints

### Long Term (If Still Needed):
8. Switch to Supabase or Railway
9. Implement static generation for blog
10. Further optimize database queries

---

## 📊 Expected Impact

**Current State:**
- Layout query: ~1 per page load
- Homepage: ~1 per page load
- Ticker: ~6 per request (every 30 seconds)
- **Total:** ~8-10 queries per user per minute

**After Optimizations:**
- Layout query: 0 (removed)
- Homepage: ~0.1 per page load (cached)
- Ticker: ~0.3 per request (cached)
- **Total:** ~0.4 queries per user per minute

**Reduction:** ~95% fewer database queries! 🎉

---

## ⚠️ Important Notes

1. **Cache Invalidation:** When you update homepage content or settings, you may need to clear cache or wait for TTL
2. **Data Freshness:** Cached data may be slightly stale (5-60 minutes old)
3. **Environment Variables:** Some settings moved to env vars need to be set in Vercel
4. **Monitoring:** Watch your Neon dashboard to see if compute time usage decreases

---

## 🔧 Quick Wins You Can Do Now

1. **Increase cache TTLs:**
   ```typescript
   // In app/api/homepage/content/route.ts
   cache.set(cacheKey, sections, 1800) // 30 minutes instead of 10
   
   // In app/api/ticker/route.ts
   cache.set(cacheKey, updates, 600) // 10 minutes instead of 5
   ```

2. **Move Google OAuth to env vars:**
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel
   - Remove database queries from auth routes

3. **Reduce ticker queries:**
   - Change `take: 5` to `take: 3` in ticker route
   - Remove milestones query (least important)

These changes alone should reduce your compute time by 70-80%!

# 🔐 Environment Variables & Neon Optimization Summary

**Date:** December 14, 2025

---

## 📋 Required Environment Variables

### In Vercel Dashboard → Settings → Environment Variables:

#### 1. DATABASE_URL ⚠️ CRITICAL
- **Key:** `DATABASE_URL`
- **Value:** Your Neon PostgreSQL connection string
- **Format:** `postgresql://user:password@host:port/database?sslmode=require`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Where to Get:** Neon Dashboard → Connection String

#### 2. DIRECT_URL ⚠️ CRITICAL
- **Key:** `DIRECT_URL`
- **Value:** Same as DATABASE_URL (direct connection, not pooled)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Why:** Required for Prisma migrations

#### 3. AUTH_SECRET
- **Key:** `AUTH_SECRET`
- **Value:** Random 64-character hex string
- **Generate:** `openssl rand -hex 32`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### 4. BLOB_READ_WRITE_TOKEN
- **Key:** `BLOB_READ_WRITE_TOKEN`
- **Value:** Vercel Blob Storage token
- **Format:** `vercel_blob_rw_...`
- **Where to Get:** Vercel Dashboard → Storage → Blob
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### 5. DEEPSEEK_API_KEY
- **Key:** `DEEPSEEK_API_KEY`
- **Value:** Your DeepSeek API key
- **Format:** `sk-...`
- **Where to Get:** https://platform.deepseek.com/api_keys
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## 🔵 Recommended Environment Variables

#### 6. NEXT_PUBLIC_APP_URL
- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://www.argufight.com` (your domain)
- **Environments:** ✅ Production
- **Why:** For generating absolute URLs

#### 7. NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
- **Key:** `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- **Value:** `G-41YDQDD6J3` (or your GA4 ID)
- **Environments:** ✅ Production
- **Why:** For Google Analytics tracking

---

## ⭐ Optional: Prisma Accelerate (REDUCES NEON USAGE)

#### 8. PRISMA_DATABASE_URL (Highly Recommended)
- **Key:** `PRISMA_DATABASE_URL`
- **Value:** Prisma Accelerate connection string
- **Format:** `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
- **Environments:** ✅ Production
- **Why:** Reduces Neon usage by 50-80%
- **Cost:** Free tier available, then ~$10/month
- **Setup:** https://www.prisma.io/data-platform/accelerate

---

## 💰 How to Reduce Neon Database Usage

### ✅ Already Implemented (Just Deployed):

1. **✅ Homepage Caching** - 10 minute cache
   - File: `app/api/homepage/content/route.ts`
   - Reduces queries on homepage visits

2. **✅ Categories Caching** - 30 minute cache
   - File: `app/api/categories/route.ts`
   - Reduces queries for category listings

3. **✅ Leaderboard Caching** - 10 minute cache
   - File: `app/api/leaderboard/route.ts`
   - Reduces heavy queries

4. **✅ Background Jobs Moved to Cron**
   - File: `vercel.json`
   - No longer called on every request
   - Runs on schedule instead

**Expected Reduction:** 30-40% immediately

---

### 🚀 Next Steps (To Reduce Further):

#### Option 1: Prisma Accelerate (BEST - 50-80% reduction)
1. Sign up: https://www.prisma.io/data-platform/accelerate
2. Create project
3. Get connection string
4. Add to Vercel as `PRISMA_DATABASE_URL`
5. **Expected Savings:** 50-80% reduction in compute time

#### Option 2: Add More Caching
- Cache debate lists (1-5 minutes)
- Cache user profiles (5-10 minutes)
- Cache blog posts (1 hour)

#### Option 3: Optimize Queries
- Use `select` instead of `include`
- Add database indexes
- Use aggregations

---

## 📊 Expected Cost Savings

### Current (Without Optimizations):
- **Compute Hours:** ~100-200/month
- **Cost:** ~$20-40/month

### After Current Optimizations:
- **Compute Hours:** ~70-140/month (30% reduction)
- **Cost:** ~$14-28/month

### With Prisma Accelerate:
- **Compute Hours:** ~20-60/month (70% reduction)
- **Cost:** ~$4-12/month + $10 Accelerate = **~$14-22/month total**

---

## ✅ Quick Checklist

### Environment Variables:
- [ ] `DATABASE_URL` - Neon connection
- [ ] `DIRECT_URL` - Same as DATABASE_URL
- [ ] `AUTH_SECRET` - Random hex
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob
- [ ] `DEEPSEEK_API_KEY` - DeepSeek API
- [ ] `NEXT_PUBLIC_APP_URL` - Your domain (recommended)
- [ ] `PRISMA_DATABASE_URL` - Prisma Accelerate (optional, but recommended)

### Neon Optimizations:
- [x] ✅ Homepage caching (implemented)
- [x] ✅ Categories caching (implemented)
- [x] ✅ Leaderboard caching (implemented)
- [x] ✅ Background jobs moved to cron (implemented)
- [ ] ⚠️ Prisma Accelerate (recommended - biggest impact)

---

## 🎯 Priority Order

1. **Set Required Environment Variables** (5 variables)
2. **Add Prisma Accelerate** (biggest impact on usage)
3. **Monitor Neon Dashboard** (track usage)
4. **Add More Caching** (if needed)

---

## 📝 Files Created

- `ENVIRONMENT_VARIABLES_COMPLETE_GUIDE.md` - Full env vars guide
- `REDUCE_NEON_USAGE_GUIDE.md` - Detailed optimization guide
- `NEON_OPTIMIZATION_IMPLEMENTATION.md` - Implementation steps

---

**Start with Prisma Accelerate - it's the easiest and most effective way to reduce Neon usage!** 🚀

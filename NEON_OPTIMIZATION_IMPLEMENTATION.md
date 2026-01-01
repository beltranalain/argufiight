# 🚀 Neon Usage Optimization - Implementation Guide

**Goal:** Reduce Neon database usage by 50-80%

---

## ✅ Quick Implementation (30 minutes)

### 1. Add Caching to Homepage
**File:** `app/page.tsx`
**Impact:** Reduces queries on every homepage visit

### 2. Add Caching to Categories API
**File:** `app/api/categories/route.ts`
**Impact:** Reduces queries for category listings

### 3. Remove Background Job Calls
**File:** `app/api/debates/route.ts`
**Impact:** Prevents unnecessary queries on every debate fetch

### 4. Add Prisma Accelerate (Recommended)
**Impact:** 50-80% reduction in compute time
**Setup:** See guide below

---

## 📋 Environment Variables Needed

### Required (5):
1. ✅ `DATABASE_URL` - Neon PostgreSQL connection
2. ✅ `DIRECT_URL` - Same as DATABASE_URL (for migrations)
3. ✅ `AUTH_SECRET` - Session encryption
4. ✅ `BLOB_READ_WRITE_TOKEN` - File uploads
5. ✅ `DEEPSEEK_API_KEY` - AI features

### Recommended (2):
6. `NEXT_PUBLIC_APP_URL` - Your domain
7. `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` - Analytics

### Optional (Reduces Usage):
8. `PRISMA_DATABASE_URL` - Prisma Accelerate (highly recommended)

---

## 🎯 Prisma Accelerate Setup (Best Option)

### Step 1: Sign Up
1. Go to: https://www.prisma.io/data-platform/accelerate
2. Sign up (free tier available)
3. Create a project

### Step 2: Get Connection String
1. Copy the Accelerate connection string
2. Format: `prisma+postgres://accelerate.prisma-data.net/?api_key=...`

### Step 3: Add to Vercel
1. Go to Vercel Dashboard → Environment Variables
2. Add `PRISMA_DATABASE_URL` with Accelerate connection string
3. Enable for Production

### Step 4: Update Schema (Optional)
- Current setup uses `DATABASE_URL` directly
- You can keep it as is, or switch to Accelerate
- Accelerate works as a proxy, so you can use both

**Expected Savings:** 50-80% reduction in Neon compute time

---

## 💡 Other Optimizations

### Cache Strategy:
- **Homepage:** 10 minutes
- **Leaderboard:** 10 minutes
- **Categories:** 30 minutes
- **Blog Posts:** 1 hour
- **Static Pages:** 1 hour

### Query Optimization:
- Use `select` instead of `include`
- Limit results with pagination
- Use aggregations (`_count`, `groupBy`)
- Add database indexes

---

## 📊 Expected Results

**Before:** ~100-200 compute hours/month  
**After:** ~30-60 compute hours/month (70% reduction)

**Cost Savings:** ~$14-28/month

---

**Start with Prisma Accelerate - it's the easiest win!** 🚀

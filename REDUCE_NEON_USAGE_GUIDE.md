# 💰 How to Reduce Neon Database Usage

**Goal:** Reduce Neon compute hours and costs by 50-80%

---

## 🎯 Quick Wins (Implement These First)

### 1. ⭐ Use Prisma Accelerate (BEST OPTION)
**Impact:** 50-80% reduction in compute time  
**Time:** 30 minutes  
**Cost:** Free tier available, then ~$10/month

**How:**
1. Sign up: https://www.prisma.io/data-platform/accelerate
2. Create project and get connection string
3. Add to Vercel as `PRISMA_DATABASE_URL`
4. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("PRISMA_DATABASE_URL") // Use Accelerate
     directUrl = env("DIRECT_URL") // For migrations
   }
   ```

**Why it works:**
- Connection pooling (reduces connections)
- Query caching (reduces queries)
- Better connection management
- **Can save 50-80% on Neon costs**

---

### 2. Cache Frequently Accessed Data
**Impact:** 30-50% reduction in queries  
**Time:** 1-2 hours

**What to Cache:**

#### Homepage Content (5-10 min cache)
```typescript
// In app/page.tsx
import { cache } from '@/lib/utils/cache'

const sections = await cache.get('homepage:sections') || 
  await prisma.homepageSection.findMany(...)
cache.set('homepage:sections', sections, 600) // 10 min
```

#### Leaderboard (5-10 min cache)
```typescript
// In app/api/leaderboard/route.ts
const leaderboard = await cache.get('leaderboard:elo') ||
  await prisma.user.findMany(...)
cache.set('leaderboard:elo', leaderboard, 600)
```

#### Categories (30 min cache)
```typescript
// In app/api/categories/route.ts
const categories = await cache.get('categories:all') ||
  await prisma.category.findMany(...)
cache.set('categories:all', categories, 1800)
```

---

### 3. Optimize Background Jobs
**Impact:** Reduces unnecessary queries  
**Time:** 30 minutes

**Current Problem:**
- `/api/debates/process-expired` called on every debate fetch
- `/api/cron/ai-auto-accept` called on every debate fetch

**Solution:**
- Move to Vercel Cron Jobs (scheduled, not on-demand)
- Run every 5-10 minutes instead of on every request

**Setup Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-expired",
    "schedule": "*/5 * * * *" // Every 5 minutes
  }]
}
```

---

### 4. Use Database Indexes
**Impact:** Faster queries = less compute time  
**Time:** 15 minutes

**Already Have:**
- ✅ `debates.status`
- ✅ `debates.category`
- ✅ `debates.createdAt`
- ✅ `debates.slug`

**Add These:**
```sql
-- For faster filtering
CREATE INDEX IF NOT EXISTS idx_debates_visibility_status 
  ON debates(visibility, status);

-- For faster date queries
CREATE INDEX IF NOT EXISTS idx_debates_updated_at 
  ON debates(updated_at DESC);

-- For user queries
CREATE INDEX IF NOT EXISTS idx_debates_challenger_opponent 
  ON debates(challenger_id, opponent_id);
```

---

### 5. Optimize Query Patterns
**Impact:** 20-30% reduction in query time

**Best Practices:**

#### Use `select` instead of `include` when possible
```typescript
// ❌ Bad: Fetches all fields
const debate = await prisma.debate.findUnique({
  where: { id },
  include: { challenger: true } // Gets ALL user fields
})

// ✅ Good: Only fetch what you need
const debate = await prisma.debate.findUnique({
  where: { id },
  select: {
    id: true,
    topic: true,
    challenger: {
      select: {
        id: true,
        username: true,
        avatarUrl: true
      }
    }
  }
})
```

#### Limit results with pagination
```typescript
// ✅ Always use pagination
const debates = await prisma.debate.findMany({
  take: 20, // Limit results
  skip: (page - 1) * 20,
  orderBy: { updatedAt: 'desc' }
})
```

#### Use aggregations instead of fetching all
```typescript
// ❌ Bad: Fetches all records
const allDebates = await prisma.debate.findMany()
const count = allDebates.length

// ✅ Good: Use count
const count = await prisma.debate.count()
```

---

## 📊 Implementation Plan

### Phase 1: Quick Wins (2-3 hours)
1. ✅ Add Prisma Accelerate
2. ✅ Cache homepage content
3. ✅ Cache leaderboard
4. ✅ Move background jobs to cron

**Expected Reduction:** 50-60%

### Phase 2: Optimizations (3-4 hours)
5. ✅ Add database indexes
6. ✅ Optimize query patterns
7. ✅ Cache categories and static content
8. ✅ Optimize debate page queries

**Expected Reduction:** Additional 20-30%

### Phase 3: Fine-tuning (2-3 hours)
9. ✅ Monitor usage patterns
10. ✅ Add more targeted caching
11. ✅ Optimize admin queries
12. ✅ Fine-tune cache TTLs

**Expected Reduction:** Additional 10-20%

---

## 💡 Specific Code Changes

### 1. Cache Homepage (app/page.tsx)
```typescript
import { cache } from '@/lib/utils/cache'

// Before fetching
const cacheKey = 'homepage:sections'
let sections = cache.get(cacheKey)

if (!sections) {
  sections = await prisma.homepageSection.findMany({
    where: { isVisible: true },
    // ... rest of query
  })
  cache.set(cacheKey, sections, 600) // 10 min
}
```

### 2. Cache Leaderboard (app/api/leaderboard/route.ts)
```typescript
import { cache } from '@/lib/utils/cache'

const cacheKey = 'leaderboard:elo'
let leaderboard = cache.get(cacheKey)

if (!leaderboard) {
  leaderboard = await prisma.user.findMany({
    // ... query
  })
  cache.set(cacheKey, leaderboard, 600) // 10 min
}
```

### 3. Remove Background Job Calls
```typescript
// In app/api/debates/route.ts
// ❌ Remove these:
fetch('/api/debates/process-expired', ...)
fetch('/api/cron/ai-auto-accept', ...)

// ✅ These will run via Vercel Cron instead
```

---

## 📈 Expected Results

### Before Optimizations:
- **Compute Hours:** ~100-200/month
- **Cost:** ~$20-40/month
- **Queries:** ~10,000-20,000/day

### After Optimizations:
- **Compute Hours:** ~30-60/month (70% reduction)
- **Cost:** ~$6-12/month (70% savings)
- **Queries:** ~3,000-6,000/day (70% reduction)

---

## 🎯 Priority Order

1. **Prisma Accelerate** - Biggest impact, easiest setup
2. **Cache Homepage** - High traffic, easy to cache
3. **Cache Leaderboard** - Heavy query, easy to cache
4. **Move to Cron Jobs** - Reduces unnecessary queries
5. **Add Indexes** - Faster queries
6. **Optimize Queries** - Better patterns

---

## ✅ Checklist

- [ ] Add Prisma Accelerate connection
- [ ] Cache homepage content (10 min)
- [ ] Cache leaderboard (10 min)
- [ ] Cache categories (30 min)
- [ ] Move background jobs to Vercel Cron
- [ ] Add database indexes
- [ ] Optimize query patterns
- [ ] Monitor Neon usage dashboard

---

**Start with Prisma Accelerate - it's the easiest and most effective!** 🚀

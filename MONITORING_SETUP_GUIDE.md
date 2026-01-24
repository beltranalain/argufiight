# Sentry Monitoring & Rate Limiting Setup Guide

## Overview

This guide walks through setting up error monitoring with Sentry and rate limiting with Upstash Redis to prevent API abuse and track errors.

---

## 1. Install Dependencies

```bash
npm install @sentry/nextjs @upstash/ratelimit @upstash/redis
```

**Packages**:
- `@sentry/nextjs` - Error monitoring and performance tracking
- `@upstash/ratelimit` - Serverless-friendly rate limiting
- `@upstash/redis` - Redis client for Upstash

---

## 2. Set Up Sentry

### Step 2.1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new project
   - Platform: **Next.js**
   - Name: **ArguFight** (or your preference)
3. Copy your **DSN** (Data Source Name)
   - Example: `https://examplePublicKey@o0.ingest.sentry.io/0`

### Step 2.2: Add Environment Variables

Add to `.env` and `.env.local`:

```env
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional: Sentry Auth Token (for source maps)
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

Also add to **Vercel Environment Variables**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SENTRY_DSN` for all environments (Production, Preview, Development)

### Step 2.3: Initialize Sentry in App

Edit `app/layout.tsx` to initialize Sentry:

```typescript
import { initSentry } from '@/lib/monitoring/sentry'

// Initialize Sentry on app start
if (typeof window === 'undefined') {
  initSentry()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ... rest of your layout
}
```

### Step 2.4: Usage in Code

#### Capture Errors

```typescript
import { captureException } from '@/lib/monitoring/sentry'

try {
  // Your code
} catch (error) {
  captureException(error as Error, {
    context: 'debate_submission',
    debateId: debate.id,
  })
  throw error
}
```

#### Track Slow Queries

```typescript
import { trackSlowQuery } from '@/lib/monitoring/sentry'

const start = Date.now()
const debates = await prisma.debate.findMany({ where: { status: 'ACTIVE' } })
const duration = Date.now() - start

trackSlowQuery('debate.findMany', duration, { status: 'ACTIVE' })
```

#### Track API Performance

```typescript
import { trackAPIRequest } from '@/lib/monitoring/sentry'

const start = Date.now()
const response = await fetch('/api/debates')
const duration = Date.now() - start

trackAPIRequest('/api/debates', 'GET', response.status, duration)
```

---

## 3. Set Up Upstash Redis (Rate Limiting)

### Step 3.1: Create Upstash Account

1. Go to [upstash.com](https://upstash.com) and sign up
2. Create a new Redis database:
   - Name: **argufight-ratelimit**
   - Region: **US-East-1** (or closest to your users)
   - Type: **Pay as you go** (free tier available)

### Step 3.2: Get Redis Credentials

1. Click on your database
2. Copy **REST URL** and **REST TOKEN**
   - Example URL: `https://your-db.upstash.io`
   - Example Token: `AXasdfASDF...`

### Step 3.3: Add Environment Variables

Add to `.env` and `.env.local`:

```env
# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_URL=https://your-database-id.upstash.io
UPSTASH_REDIS_TOKEN=your_rest_token_here
```

Also add to **Vercel Environment Variables**:
- `UPSTASH_REDIS_URL`
- `UPSTASH_REDIS_TOKEN`

---

## 4. Apply Rate Limiting to API Routes

### Example 1: General API Rate Limit

```typescript
// app/api/debates/route.ts
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // Check rate limit (100 req/min per IP)
  const rateLimit = await rateLimitMiddleware(request, 'general')

  if (!rateLimit.success) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.headers['Retry-After'],
      },
      {
        status: 429,
        headers: rateLimit.headers,
      }
    )
  }

  // Your route logic
  const debates = await prisma.debate.findMany()

  return Response.json(debates, {
    headers: rateLimit.headers, // Include rate limit headers
  })
}
```

### Example 2: Auth Endpoints (Stricter Limits)

```typescript
// app/api/auth/login/route.ts
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Stricter limit: 5 req/15min per IP
  const rateLimit = await rateLimitMiddleware(request, 'auth')

  if (!rateLimit.success) {
    return Response.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  // Login logic
  // ...

  return Response.json({ success: true }, { headers: rateLimit.headers })
}
```

### Example 3: AI Endpoints (Per-User Limits)

```typescript
// app/api/verdicts/generate/route.ts
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit per user ID (10 req/hour)
  const rateLimit = await rateLimitMiddleware(
    request,
    'ai',
    session.user.id // Use user ID instead of IP
  )

  if (!rateLimit.success) {
    return Response.json(
      { error: 'AI rate limit exceeded. Please try again later.' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  // Generate verdict
  // ...

  return Response.json(verdict, { headers: rateLimit.headers })
}
```

### Example 4: Using the `withRateLimit` Helper

```typescript
// app/api/debates/[id]/submit/route.ts
import { withRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/auth'

export const POST = withRateLimit(
  'debate', // 30 debates/day per user
  async (request: Request) => {
    // Your handler logic
    const body = await request.json()
    const debate = await submitDebateArgument(body)
    return Response.json(debate)
  },
  // Custom identifier function (use user ID instead of IP)
  async (request: Request) => {
    const session = await getSession()
    return session?.user?.id || 'anonymous'
  }
)
```

---

## 5. Rate Limit Tiers

| Tier | Limit | Use Case |
|------|-------|----------|
| **General** | 100 req/min per IP | Default for most API routes |
| **Auth** | 5 req/15min per IP | Login, signup, password reset |
| **AI** | 10 req/hour per user | Verdicts, moderation, AI responses |
| **Upload** | 20 uploads/hour per user | File/image uploads |
| **Debate** | 30 debates/day per user | Create debate, submit statement |

### Adjusting Limits

Edit `lib/rate-limit/index.ts`:

```typescript
export const generalRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, '1 m'), // Change 100 → 200
      analytics: true,
      prefix: 'ratelimit:general',
    })
  : null
```

---

## 6. Monitoring & Alerts

### Sentry Dashboard

1. **Errors**: View all captured exceptions
2. **Performance**: Monitor slow API routes
3. **Releases**: Track errors per deployment
4. **Alerts**: Set up notifications for:
   - Error spikes
   - Slow queries (>5s)
   - High error rates

### Upstash Dashboard

1. **Request Count**: Monitor rate limit checks
2. **Memory Usage**: Track Redis memory
3. **Analytics**: View rate limit violations per endpoint

---

## 7. Testing

### Test Rate Limiting

```bash
# Test general rate limit (should block after 100 requests)
for i in {1..105}; do
  curl http://localhost:3000/api/debates
done

# Should return 429 after 100 requests
```

### Test Sentry Error Capture

Create a test error route:

```typescript
// app/api/test-error/route.ts
import { captureException } from '@/lib/monitoring/sentry'

export async function GET() {
  try {
    throw new Error('Test error for Sentry')
  } catch (error) {
    captureException(error as Error, { context: 'test' })
    return Response.json({ error: 'Test error sent to Sentry' })
  }
}
```

Visit `/api/test-error` and check Sentry dashboard for the error.

---

## 8. Best Practices

### Error Handling

```typescript
try {
  // Risky operation
} catch (error) {
  // Log to Sentry with context
  captureException(error as Error, {
    operation: 'debate_submission',
    userId: user.id,
    debateId: debate.id,
  })

  // Return user-friendly error
  return Response.json(
    { error: 'Failed to submit argument. Please try again.' },
    { status: 500 }
  )
}
```

### Performance Tracking

```typescript
import { trackAPIRequest, trackSlowQuery } from '@/lib/monitoring/sentry'

const start = Date.now()

// Your operation
const result = await expensiveOperation()

const duration = Date.now() - start

// Automatically alerts if >5s
trackSlowQuery('expensiveOperation', duration)
```

### User Context

```typescript
import { setUser, clearUser } from '@/lib/monitoring/sentry'

// On login
setUser({
  id: user.id,
  email: user.email,
  username: user.username,
})

// On logout
clearUser()
```

---

## 9. Cost Estimates

### Sentry (Free Tier)

- **10,000 errors/month** - Free
- **10,000 transactions/month** - Free
- After that: ~$26/month for 50k errors

**Recommendation**: Start with free tier, upgrade if needed

### Upstash Redis (Free Tier)

- **10,000 commands/day** - Free
- **256 MB storage** - Free
- After that: $0.20 per 100k commands

**Recommendation**: Free tier should cover most usage

---

## 10. Troubleshooting

### Rate Limiting Not Working

1. Check environment variables are set
2. Verify Upstash Redis connection:
   ```typescript
   console.log('Redis URL:', process.env.UPSTASH_REDIS_URL)
   console.log('Redis Token:', process.env.UPSTASH_REDIS_TOKEN?.substring(0, 10) + '...')
   ```
3. Check Upstash dashboard for errors

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check `initSentry()` is called
3. Test with intentional error (see section 7)
4. Check Sentry dashboard filters (not filtered out)

---

## Summary

**Installed**:
- ✅ Sentry for error monitoring
- ✅ Upstash Redis for rate limiting

**Features**:
- ✅ 5 rate limit tiers (general, auth, AI, upload, debate)
- ✅ Error tracking with context
- ✅ Performance monitoring
- ✅ Slow query alerts
- ✅ User-friendly rate limit responses

**Next Steps**:
1. Apply rate limiting to all API routes
2. Set up Sentry alerts for critical errors
3. Monitor rate limit violations
4. Adjust limits based on usage patterns

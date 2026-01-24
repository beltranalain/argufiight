# ArguFight Production Deployment Checklist

**Date**: 2026-01-24
**Deployment Type**: Week 1-4 Improvements (Critical Fixes + SEO + Admin Settings)
**Status**: Pre-deployment preparation

---

## 🚨 CRITICAL - Security Tasks (DO FIRST)

### 1. Rotate Stripe API Keys (URGENT)

**Why**: Stripe keys were previously stored in database and may be compromised. Week 2 removed them from code, but they need rotation.

- [ ] Go to [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
- [ ] Click "Roll" on both Secret Key and Publishable Key
- [ ] Copy new keys immediately
- [ ] Update Vercel environment variables:
  - [ ] `STRIPE_SECRET_KEY` (new secret key)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (new publishable key)
- [ ] Update local `.env.local` for testing
- [ ] Test a payment flow with new keys
- [ ] Revoke old keys in Stripe Dashboard
- [ ] Monitor Stripe for any suspicious activity (7 days)

**Script to remove old keys from database** (run AFTER rotating):
```bash
npx tsx scripts/remove-stripe-keys-from-db.ts
```

---

## 📦 NPM Package Installation

### 2. Install Monitoring & Rate Limiting Dependencies

```bash
# Install Sentry for error monitoring
npm install @sentry/nextjs

# Install Upstash for rate limiting
npm install @upstash/ratelimit @upstash/redis

# Verify installations
npm list @sentry/nextjs @upstash/ratelimit @upstash/redis
```

- [ ] Run npm install command
- [ ] Verify no dependency conflicts
- [ ] Commit updated `package.json` and `package-lock.json`

---

## 🗄️ Database Setup

### 3. Apply Performance Indexes

**What**: Adds indexes for faster queries on Debate, Notification, BeltChallenge, Tournament tables.

```bash
# Run index creation script
npx tsx scripts/add-performance-indexes.ts

# Verify indexes created
npx prisma db execute --stdin <<SQL
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
SQL
```

- [ ] Run index script
- [ ] Verify all 8 indexes created
- [ ] Monitor query performance improvement (use Neon dashboard)

**Expected indexes**:
- `Debate_status_visibility_idx`
- `Debate_challengerId_status_idx`
- `Debate_opponentId_status_idx`
- `Debate_createdAt_idx`
- `Notification_userId_read_idx`
- `Notification_createdAt_idx`
- `BeltChallenge_beltId_status_idx`
- `BeltChallenge_expiresAt_status_idx`
- `Tournament_status_startDate_idx`

### 4. Run Database Migrations

```bash
# Generate Prisma client with new schema changes
npx prisma generate

# Apply pending migrations (Tournament prize pool fields, etc.)
npx prisma migrate deploy

# Verify schema is up to date
npx prisma migrate status
```

- [ ] Run prisma generate
- [ ] Run prisma migrate deploy
- [ ] Verify no migration errors
- [ ] Check new fields exist: `Tournament.prizePool`, `Tournament.entryFee`, `Tournament.prizeDistribution`

### 5. Initialize Default Settings

**VAPID Keys** (Web Push Notifications):
```bash
# Generate VAPID keys if you don't have them
npx web-push generate-vapid-keys

# Copy output and run initialization script
npx tsx scripts/init-vapid-settings.ts
```

**Verdict Settings**:
```bash
# Initialize default verdict threshold and settings
npx tsx scripts/init-verdict-settings.ts
```

- [ ] Generate VAPID keys (if not already done)
- [ ] Store public/private keys in `.env` and Vercel
- [ ] Run init-vapid-settings.ts
- [ ] Run init-verdict-settings.ts
- [ ] Verify settings in AdminSettings table:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VERDICT_TIE_THRESHOLD` (default: 5)
  - `VERDICT_DEADLINE_PENALTY_ENABLED` (default: true)
  - `VERDICT_AUTO_GENERATE` (default: true)

---

## 🔧 External Services Setup

### 6. Set Up Sentry (Error Monitoring)

- [ ] Go to [sentry.io](https://sentry.io) and create account
- [ ] Create new project: "ArguFight Production"
- [ ] Select "Next.js" as platform
- [ ] Copy DSN (looks like: `https://abc123@o123456.ingest.sentry.io/789012`)
- [ ] Add to Vercel environment variables:
  - `NEXT_PUBLIC_SENTRY_DSN` = your DSN
  - `SENTRY_AUTH_TOKEN` = (generate in Sentry → Settings → Auth Tokens)
- [ ] Configure Sentry settings:
  - Sample rate: 10% (adjust based on traffic)
  - Environment: "production"
  - Release tracking: enabled
- [ ] Test by triggering an error in staging

### 7. Set Up Upstash Redis (Rate Limiting)

- [ ] Go to [upstash.com](https://upstash.com) and create account
- [ ] Create new Redis database:
  - Name: "ArguFight Rate Limiting"
  - Type: Regional (choose closest to your users)
  - Plan: Free tier (50K commands/day)
- [ ] Copy credentials from dashboard
- [ ] Add to Vercel environment variables:
  - `UPSTASH_REDIS_URL` = REST URL from dashboard
  - `UPSTASH_REDIS_TOKEN` = REST Token from dashboard
- [ ] Test connection:
```bash
# Test script
node -e "const { Redis } = require('@upstash/redis'); const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN }); redis.ping().then(console.log);"
```

### 8. Verify Neon Database Configuration

- [ ] Go to [Neon Console](https://console.neon.tech)
- [ ] Verify connection pooling is enabled
- [ ] Check connection limit (recommended: 10-20)
- [ ] Verify both URLs are in Vercel:
  - `DATABASE_URL` (pooled connection with `?pgbouncer=true`)
  - `DIRECT_URL` (direct connection for migrations)
- [ ] Test connection:
```bash
npx prisma db execute --stdin <<SQL
SELECT version();
SQL
```

---

## ⚙️ Vercel Configuration

### 9. Update Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add/Update these variables** (check each as you complete):

#### Database (verify existing)
- [ ] `DATABASE_URL` - Neon pooled connection
- [ ] `DIRECT_URL` - Neon direct connection

#### Authentication (verify existing)
- [ ] `NEXTAUTH_SECRET` - Random 32+ character string
- [ ] `NEXTAUTH_URL` - https://www.argufight.com

#### Stripe (NEW ROTATED KEYS)
- [ ] `STRIPE_SECRET_KEY` - sk_live_... (NEW)
- [ ] `STRIPE_PUBLISHABLE_KEY` - pk_live_... (NEW)
- [ ] `STRIPE_WEBHOOK_SECRET` - whsec_... (verify existing)

#### Web Push Notifications (NEW)
- [ ] `VAPID_PUBLIC_KEY` - From web-push generate
- [ ] `VAPID_PRIVATE_KEY` - From web-push generate
- [ ] `VAPID_SUBJECT` - mailto:support@argufight.com

#### AI APIs (verify existing)
- [ ] `DEEPSEEK_API_KEY` - For AI judges and bots

#### Email (verify existing)
- [ ] `RESEND_API_KEY` - For transactional emails
- [ ] `RESEND_FROM_EMAIL` - noreply@argufight.com

#### Monitoring (NEW)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN
- [ ] `SENTRY_AUTH_TOKEN` - Sentry auth token
- [ ] `SENTRY_ORG` - Your Sentry org slug
- [ ] `SENTRY_PROJECT` - Your Sentry project slug

#### Rate Limiting (NEW)
- [ ] `UPSTASH_REDIS_URL` - Upstash REST URL
- [ ] `UPSTASH_REDIS_TOKEN` - Upstash REST token

#### Firebase (verify existing, for mobile push)
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`

#### Google Analytics (verify existing)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID`

#### App Configuration (verify existing)
- [ ] `NEXT_PUBLIC_APP_URL` - https://www.argufight.com
- [ ] `NODE_ENV` - production

**Total**: ~25 environment variables

### 10. Verify Cron Jobs Configuration

- [ ] Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
- [ ] Verify all 6 cron jobs are configured:

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/expire-offers` | `0 1 * * *` | Daily 1 AM - Expire old ad offers |
| `/api/cron/process-escrow` | `0 2 * * *` | Daily 2 AM - Release escrow funds |
| `/api/cron/process-ad-tasks` | `0 3 * * *` | Daily 3 AM - Process ad campaigns |
| `/api/cron/ai-tasks` | `*/15 * * * *` | Every 15 min - AI bot responses |
| `/api/cron/tournament-auto-start` | `0 * * * *` | Hourly - Start ready tournaments |
| `/api/cron/tournament-progression` | `*/30 * * * *` | Every 30 min - Advance rounds |

- [ ] Verify `vercel.json` is committed with cron config
- [ ] Enable cron jobs in Vercel (if not auto-enabled)

---

## 🧪 Pre-Deployment Testing

### 11. Local Testing

```bash
# Build the application locally
npm run build

# Check for build errors
# Fix any TypeScript errors or build failures

# Run production build locally
npm start

# Test critical flows
```

- [ ] Build succeeds with no errors
- [ ] No TypeScript type errors
- [ ] No console warnings about missing env vars
- [ ] Test these flows locally:
  - [ ] User login/signup
  - [ ] Create debate
  - [ ] Submit argument
  - [ ] Generate verdict (AI judge)
  - [ ] Join tournament
  - [ ] Admin settings page (navigate to /admin/settings?tab=system)
  - [ ] View debate with dynamic OG image
  - [ ] Check sitemap: http://localhost:3000/sitemap.xml

### 12. Staging Deployment (Recommended)

- [ ] Create a staging deployment in Vercel
- [ ] Use same environment variables as production
- [ ] Use a staging database (Neon branch or separate instance)
- [ ] Deploy latest code to staging
- [ ] Run full test suite on staging:
  - [ ] All cron jobs execute successfully
  - [ ] Notifications are delivered
  - [ ] AI bots auto-accept and respond
  - [ ] Tournaments auto-start and progress
  - [ ] Verdict generation works correctly
  - [ ] Finance calculations are accurate
  - [ ] Admin settings save/load correctly
  - [ ] Structured data validates (Google Rich Results Test)
  - [ ] OG images generate correctly
- [ ] Load test with realistic traffic
- [ ] Monitor error rates in Sentry
- [ ] Check database connection pool usage

---

## 🚀 Production Deployment

### 13. Pre-Deployment Backup

```bash
# Backup production database (Neon Console)
# Go to Neon → Your Project → Backups → Create Manual Backup
# Name: "Pre Week1-4 Deployment - 2026-01-24"
```

- [ ] Create database backup
- [ ] Export current AdminSettings table (for rollback)
- [ ] Tag current production version:
```bash
git tag v1.0-pre-week1-4
git push origin v1.0-pre-week1-4
```

### 14. Deploy to Production

**Option A: Vercel Dashboard (Recommended)**
- [ ] Go to Vercel Dashboard → Your Project
- [ ] Click "Deployments" tab
- [ ] Find latest commit from `main` branch
- [ ] Click "Promote to Production"
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete (~3-5 minutes)

**Option B: Git Push (Automatic)**
- [ ] Ensure all changes are pushed to `main` branch
- [ ] Vercel will auto-deploy on push
- [ ] Monitor deployment in Vercel dashboard

### 15. Post-Deployment Verification (CRITICAL)

**Immediate Checks** (within 5 minutes):
- [ ] Visit https://www.argufight.com
- [ ] Check homepage loads without errors
- [ ] Open browser console - no JavaScript errors
- [ ] Check Sentry dashboard - no critical errors
- [ ] Check Vercel logs - no 500 errors

**Functional Tests** (within 15 minutes):
- [ ] User login/signup works
- [ ] Create new debate works
- [ ] Submit argument works
- [ ] AI bot accepts challenge (wait for cron job)
- [ ] Notifications are sent
- [ ] Admin dashboard loads (/admin)
- [ ] Admin settings UI works (/admin/settings?tab=system)
- [ ] Change a setting, save, reload - verify persisted

**SEO Verification** (within 30 minutes):
- [ ] Visit debate page, view page source, verify DebateSchema JSON-LD
- [ ] Test OG image: https://www.argufight.com/api/og/debate?topic=Test&challenger=Alice&opponent=Bob&status=active
- [ ] Check sitemap: https://www.argufight.com/sitemap.xml
- [ ] Validate structured data: [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Share debate on Twitter/Facebook - verify OG image appears

**Cron Job Verification** (within 1 hour):
- [ ] Check Vercel Logs → Cron Jobs tab
- [ ] Verify all 6 cron jobs executed successfully
- [ ] Check for any cron errors in Sentry
- [ ] Verify tournament auto-start runs (check database for started tournaments)
- [ ] Verify AI tasks run (check for new AI responses)

**Performance Monitoring** (within 24 hours):
- [ ] Neon Dashboard → Connections tab - verify no connection spikes/leaks
- [ ] Sentry → Performance tab - check API response times
- [ ] Vercel Analytics → check page load times
- [ ] Upstash Dashboard → check rate limit hits
- [ ] Check database query performance (should be faster with indexes)

---

## 📊 Monitoring & Alerts

### 16. Set Up Monitoring Dashboards

**Sentry Alerts**:
- [ ] Configure alert for error rate >1% (10+ errors/hour)
- [ ] Configure alert for slow API endpoints (>2s p95)
- [ ] Configure alert for failed cron jobs
- [ ] Add Slack/email notification channel

**Vercel Monitoring**:
- [ ] Check Functions tab for execution time
- [ ] Monitor bandwidth usage
- [ ] Check for any 4xx/5xx spikes

**Database Monitoring (Neon)**:
- [ ] Set alert for connections >80% of limit
- [ ] Monitor query duration (slow queries)
- [ ] Check storage usage

### 17. Success Metrics (Track for 7 Days)

**Performance Metrics**:
- [ ] Average API response time: <200ms (should improve with indexes)
- [ ] Database query time: <50ms p95 (should improve with indexes)
- [ ] Page load time: <3s (Lighthouse)
- [ ] Error rate: <0.1%
- [ ] Uptime: >99.9%

**Feature Adoption Metrics**:
- [ ] Tournaments created with prize pools: >5
- [ ] Tournaments auto-started: 100%
- [ ] Tournaments auto-progressed: 100%
- [ ] AI bot acceptance rate: >90%
- [ ] AI bot response rate: >95%
- [ ] Notification delivery rate: >80%
- [ ] Verdicts with reasoning-score match: 100%
- [ ] Admin settings changes via UI: >10

**SEO Metrics** (Google Search Console - track for 30 days):
- [ ] Organic impressions: baseline → +200-300% (target)
- [ ] Click-through rate: baseline → +15-25% (target)
- [ ] Rich snippets: 0 → >50 debate pages (target)
- [ ] Indexed pages: ~1100 → ~3000+ (target)

---

## 🔄 Rollback Procedures

### 18. If Critical Issues Occur

**Immediate Rollback** (if site is down or major functionality broken):

```bash
# Rollback to previous deployment in Vercel
# Go to Vercel → Deployments → Previous deployment → Promote to Production

# OR via CLI:
vercel rollback
```

- [ ] Identify issue in Sentry/Vercel logs
- [ ] Execute rollback (< 2 minutes)
- [ ] Verify site is stable
- [ ] Debug issue in local/staging
- [ ] Fix and redeploy when ready

**Database Rollback** (if schema migration caused issues):

```bash
# Restore from backup created in step 13
# Neon Console → Backups → Restore "Pre Week1-4 Deployment"

# OR revert specific migration:
npx prisma migrate resolve --rolled-back "MIGRATION_NAME"
```

**Environment Variable Rollback**:
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Check "Previous Values" for any changed vars
- [ ] Revert to previous values
- [ ] Redeploy

### 19. Post-Rollback Actions

- [ ] Document what went wrong
- [ ] Create incident report
- [ ] Fix issue in development
- [ ] Test fix thoroughly in staging
- [ ] Schedule new deployment attempt

---

## ✅ Deployment Complete Checklist

### Final Verification (Check all before considering deployment successful):

**Core Functionality**:
- [ ] Users can create debates
- [ ] Users can submit arguments
- [ ] Verdicts are generated correctly (reasoning matches scores)
- [ ] Notifications are delivered
- [ ] AI bots auto-accept challenges
- [ ] AI bots submit responses
- [ ] Tournaments can be created
- [ ] Tournaments auto-start when ready
- [ ] Tournaments auto-progress through rounds
- [ ] Tournament prizes are distributed correctly
- [ ] Belt challenges work
- [ ] Finance calculations are accurate
- [ ] Admin dashboard is accessible
- [ ] Admin settings UI works

**New Features (Week 1-4)**:
- [ ] Verdict tie threshold is configurable
- [ ] Advertisement platform fees are configurable
- [ ] Tournament entry fees and prize pools work
- [ ] All 6 cron jobs execute successfully
- [ ] Structured data appears in page source
- [ ] OG images generate dynamically
- [ ] Sitemap includes all content types (debates, profiles, tournaments, categories)
- [ ] Rate limiting is active (test by making 100+ rapid requests)
- [ ] Sentry captures errors
- [ ] Database indexes improve query performance

**Security**:
- [ ] Stripe keys rotated and old keys revoked
- [ ] No sensitive data in git history
- [ ] All secrets in environment variables
- [ ] Rate limiting prevents abuse
- [ ] HTTPS enforced
- [ ] CORS configured correctly

**Performance**:
- [ ] Lighthouse score >90
- [ ] PageSpeed Insights score >85
- [ ] API response time <200ms p95
- [ ] No connection pool exhaustion
- [ ] No memory leaks

---

## 📝 Post-Deployment Tasks

### 20. Documentation & Communication

- [ ] Update `PROGRESS_SUMMARY.md` with deployment date
- [ ] Update `SEO_AND_ADMIN_IMPROVEMENTS_SUMMARY.md` with live URLs
- [ ] Create deployment announcement:
  - What was deployed
  - New features available
  - Known issues (if any)
  - Links to documentation
- [ ] Notify team/stakeholders of successful deployment
- [ ] Schedule post-deployment review (7 days)

### 21. SEO Submission

- [ ] Submit sitemap to Google Search Console
  - Go to [Google Search Console](https://search.google.com/search-console)
  - Add property: https://www.argufight.com
  - Verify ownership (HTML tag or DNS)
  - Submit sitemap: https://www.argufight.com/sitemap.xml
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Request indexing for key pages
- [ ] Monitor crawl stats

### 22. Ongoing Optimization

**Week 1 Post-Deployment**:
- [ ] Monitor error rates daily
- [ ] Check cron job execution logs
- [ ] Review Sentry performance insights
- [ ] Optimize slow queries (if any found)
- [ ] Gather user feedback on new features

**Week 2-4 Post-Deployment**:
- [ ] Review SEO metrics (Search Console)
- [ ] A/B test OG images (if needed)
- [ ] Optimize admin settings UX (based on usage)
- [ ] Review tournament participation rates
- [ ] Adjust AI bot personalities based on feedback

---

## 🆘 Emergency Contacts

**If you encounter critical issues during deployment**:

- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/docs/introduction/support
- **Sentry Support**: https://sentry.io/support/
- **Stripe Support**: https://support.stripe.com/

**Internal Escalation**:
- Document issue in Sentry
- Check Vercel logs for error details
- Review recent commits for potential causes
- Consider immediate rollback if user-impacting

---

## 📅 Timeline Estimate

**Estimated Time**: 3-4 hours (depending on experience)

| Task | Estimated Time |
|------|----------------|
| Security (Stripe rotation) | 30 minutes |
| NPM packages + indexes | 20 minutes |
| Database migrations | 15 minutes |
| External services (Sentry, Upstash) | 45 minutes |
| Environment variables | 30 minutes |
| Testing (local + staging) | 60 minutes |
| Production deployment | 15 minutes |
| Post-deployment verification | 30 minutes |

**Best Time to Deploy**:
- Low-traffic hours (e.g., 2-4 AM PST)
- Weekday (not Friday/weekend)
- When team is available for monitoring

---

**Status**: Ready for deployment ✅
**Deployment Date**: _______________
**Deployed By**: _______________
**Deployment Time**: _______________
**Issues Encountered**: _______________
**Resolution**: _______________

---

*This checklist is based on the Week 1-4 improvements completed on 2026-01-24. For detailed technical documentation, see `SEO_AND_ADMIN_IMPROVEMENTS_SUMMARY.md` and `PROGRESS_SUMMARY.md`.*











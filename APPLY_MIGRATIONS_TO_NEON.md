# Apply Migrations to Neon Database

## Current Situation

✅ **Connection Fixed** - Now connecting to Neon instead of old Prisma Data Platform  
❌ **Migrations Not Applied** - All 19 migrations are pending, so database tables don't exist

## The Problem

When the database was migrated from Prisma Data Platform to Neon, the **migrations were never run** on the new database. This means:
- ✅ Code exists (all models, API routes, pages)
- ❌ Database tables don't exist (migrations not applied)
- ❌ That's why everything appears "gone"

## Solution: Apply All Migrations

### Step 1: Verify Connection

```bash
npx prisma migrate status
```

Should show:
- ✅ Connected to Neon
- ❌ 19 migrations pending

### Step 2: Apply Migrations

**For Production/Staging (Neon):**
```bash
npx prisma migrate deploy
```

This will:
- Apply all 19 pending migrations
- Create all database tables
- Set up all relationships and indexes

**For Development (if you want to test first):**
```bash
npx prisma migrate dev
```

### Step 3: Verify Tables Were Created

After running migrations, verify:

```bash
# Check migration status (should show all applied)
npx prisma migrate status

# Or check what tables exist
npx prisma db pull
```

### Step 4: Generate Prisma Client

After migrations, regenerate Prisma Client:

```bash
npx prisma generate
```

## What Migrations Will Be Applied

1. `20251201030439_init` - Initial schema
2. `20251201030941_add_all_tables` - Core tables
3. `20251201055607_add_api_usage_tracking` - API tracking
4. `20251201130035_add_employee_fields` - Employee features
5. `20251201130908_add_ai_moderation_fields` - AI moderation
6. `20251201140121_add_debate_interactions` - Debate interactions
7. `20251201160749_add_appeal_reason` - Appeals
8. `20251201161202_add_appealed_statements` - Appeal statements
9. `20251201175634_add_llm_model_management` - LLM models
10. `20251201181727_add_appeal_rejection_reason` - Appeal rejections
11. `20251201192320_add_direct_challenges` - Direct challenges
12. `20251201202741_add_category_model` - Categories
13. `20251201224602_add_homepage_content_management` - Homepage CMS
14. `20251202005145_add_legal_pages` - Legal pages
15. `20251202021648_add_tutorial_completed` - Tutorial tracking
16. `20251205092805_add_support_and_messaging` - Support & messaging
17. `20251205163351_add_subscription_models` - **Subscription system**
18. `20251205173302_add_advertising_system` - **Advertising system**
19. `20251206000000_add_subscription_models` - Additional subscription features

## Important Notes

⚠️ **This will create ALL tables** - Including:
- User subscriptions
- Promo codes
- Usage tracking
- Advertisers
- Campaigns
- Offers
- Contracts
- Impressions
- Clicks
- Creator tax info
- And all other tables

⚠️ **Data will be empty** - Migrations only create structure, not data. You'll need to:
- Recreate admin users
- Re-add categories, judges, etc.
- Or restore from backup if you have one

## After Migrations

Once migrations are applied:

1. **Verify tables exist:**
   ```bash
   npx prisma studio
   ```
   This opens a GUI to browse your database

2. **Create admin user:**
   ```bash
   npx tsx scripts/create-admin.ts
   ```

3. **Test the application:**
   - Check admin dashboard
   - Verify subscription features work
   - Verify advertising features work

## Rollback (If Needed)

If something goes wrong, you can't easily rollback migrations, but you can:
- Drop the database and start fresh
- Or restore from a backup

## Summary

**The issue:** Code exists, but database tables don't exist because migrations weren't applied to Neon.

**The fix:** Run `npx prisma migrate deploy` to apply all 19 migrations and create all tables.

**After that:** Everything should work because the code is already there!


# Belt System Migration - Ready to Apply

## ✅ Schema Changes Complete

All schema changes have been added to `prisma/schema.prisma`:
- ✅ 4 new enums (BeltType, BeltStatus, ChallengeStatus, BeltTransferReason)
- ✅ 4 new models (Belt, BeltHistory, BeltChallenge, BeltSettings)
- ✅ User model updated (belt stats fields + relations)
- ✅ Debate model updated (belt fields + relations)
- ✅ Tournament model updated (belt fields + relations)

## ✅ Migration File Created

**Location:** `prisma/migrations/20250101190000_add_belt_system/migration.sql`

The migration includes:
- Creation of 4 new enum types
- Creation of 4 new tables (belts, belt_history, belt_challenges, belt_settings)
- Addition of belt fields to users, debates, tournaments tables
- All necessary indexes for performance
- All foreign key constraints

## ✅ Seed Script Created

**Location:** `prisma/seed-belt-settings.ts`

This will populate default settings for all 5 belt types:
- ROOKIE
- CATEGORY
- CHAMPIONSHIP
- UNDEFEATED
- TOURNAMENT

## 🚀 Next Steps

### 1. Review Migration (IMPORTANT)
```bash
# Review the migration SQL file
cat prisma/migrations/20250101190000_add_belt_system/migration.sql
```

### 2. Test Locally First
```bash
# Apply migration to local database
npx prisma migrate dev

# This will:
# - Apply the migration
# - Regenerate Prisma Client
# - Mark migration as applied
```

### 3. Seed Default Settings
```bash
# Populate belt settings
npx tsx prisma/seed-belt-settings.ts
```

### 4. Verify Everything Works
```bash
# Generate Prisma Client (if not done automatically)
npx prisma generate

# Validate schema
npx prisma validate
```

### 5. Test in Development
- Test that existing features still work
- Verify no errors in console
- Check that Prisma Client includes belt models

### 6. Deploy to Production
```bash
# On production, apply migration
npx prisma migrate deploy

# Seed settings
npx tsx prisma/seed-belt-settings.ts
```

## ⚠️ Important Notes

1. **Feature Flags**: Make sure belt system is disabled in production:
   ```
   ENABLE_BELT_SYSTEM=false
   ENABLE_BELT_CHALLENGES=false
   ENABLE_BELT_STAKING=false
   ```

2. **Backup**: Always backup your database before running migrations in production

3. **Rollback Plan**: If something goes wrong:
   ```sql
   -- Drop tables (in reverse order)
   DROP TABLE IF EXISTS belt_challenges;
   DROP TABLE IF EXISTS belt_history;
   DROP TABLE IF EXISTS belt_settings;
   DROP TABLE IF EXISTS belts;
   
   -- Drop enums
   DROP TYPE IF EXISTS "BeltTransferReason";
   DROP TYPE IF EXISTS "ChallengeStatus";
   DROP TYPE IF EXISTS "BeltStatus";
   DROP TYPE IF EXISTS "BeltType";
   
   -- Remove columns from existing tables
   ALTER TABLE "users" DROP COLUMN IF EXISTS "total_belt_wins";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "total_belt_defenses";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "longest_belt_held";
   ALTER TABLE "users" DROP COLUMN IF EXISTS "current_belts_count";
   
   ALTER TABLE "debates" DROP COLUMN IF EXISTS "has_belt_at_stake";
   ALTER TABLE "debates" DROP COLUMN IF EXISTS "belt_stake_type";
   
   ALTER TABLE "tournaments" DROP COLUMN IF EXISTS "belt_created";
   ALTER TABLE "tournaments" DROP COLUMN IF EXISTS "belt_creation_cost";
   ALTER TABLE "tournaments" DROP COLUMN IF EXISTS "belt_created_by";
   ```

## 📋 Migration Checklist

Before applying to production:

- [ ] Migration SQL reviewed and approved
- [ ] Tested locally successfully
- [ ] Default settings seeded
- [ ] Prisma Client regenerated
- [ ] Existing features still work
- [ ] Feature flags set to `false`
- [ ] Database backup created
- [ ] Rollback plan ready

## 🎯 What's Next After Migration

1. Create belt logic functions (`lib/belts/`)
2. Create API routes (`app/api/belts/`)
3. Create admin interface (`app/admin/belts/`)
4. Create user interface (hidden until flag enabled)
5. Test thoroughly
6. Enable feature flags when ready

---

**Status**: ✅ Migration file ready for review and testing

# Deploy King of the Hill Enum to Production

## Issue
The database enum `TournamentFormat` is missing the `KING_OF_THE_HILL` value in production, causing this error:
```
invalid input value for enum "TournamentFormat": "KING_OF_THE_HILL"
```

## Solution

### Option 1: Run Migration on Production (Recommended)
The migration file already exists at `prisma/migrations/20251210000002_add_king_of_the_hill_format/migration.sql`

**On Production Database:**
1. Connect to your production PostgreSQL database
2. Run this SQL:
```sql
DO $$
BEGIN
    -- Check if enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'KING_OF_THE_HILL' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TournamentFormat')
    ) THEN
        ALTER TYPE "TournamentFormat" ADD VALUE 'KING_OF_THE_HILL';
    END IF;
END $$;
```

### Option 2: Use Prisma Migrate Deploy
If you have access to run migrations on production:
```bash
npx prisma migrate deploy
```

### Option 3: Run Script on Production
If you have Node.js access to production:
```bash
npx tsx scripts/add-king-of-the-hill-enum.ts
```

## Verification
After running the migration, verify the enum value exists:
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TournamentFormat');
```

You should see:
- BRACKET
- CHAMPIONSHIP
- KING_OF_THE_HILL

## Notes
- The migration file `20251210000002_add_king_of_the_hill_format/migration.sql` already contains the correct SQL
- This migration is idempotent (safe to run multiple times)
- The enum value must be added before tournaments can be created with this format

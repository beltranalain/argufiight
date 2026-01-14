import { prisma } from '../lib/db/prisma'

async function runMigration() {
  console.log('🔄 Running campaign payment fields migration...\n')

  try {
    // Step 1: Add payment_status column
    console.log('1️⃣ Adding payment_status column...')
    await prisma.$executeRaw`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20);
    `
    console.log('   ✅ payment_status column added\n')

    // Step 2: Add stripe_payment_id column
    console.log('2️⃣ Adding stripe_payment_id column...')
    await prisma.$executeRaw`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
    `
    console.log('   ✅ stripe_payment_id column added\n')

    // Step 3: Add paid_at column
    console.log('3️⃣ Adding paid_at column...')
    await prisma.$executeRaw`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
    `
    console.log('   ✅ paid_at column added\n')

    // Step 4: Add PENDING_PAYMENT to enum (if not exists)
    console.log('4️⃣ Adding PENDING_PAYMENT to CampaignStatus enum...')
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'PENDING_PAYMENT' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus')
            ) THEN
                ALTER TYPE "CampaignStatus" ADD VALUE 'PENDING_PAYMENT';
            END IF;
        END $$;
      `
      console.log('   ✅ PENDING_PAYMENT enum value added\n')
    } catch (enumError: any) {
      // Check if it already exists
      if (enumError.message?.includes('already exists') || enumError.message?.includes('duplicate')) {
        console.log('   ℹ️  PENDING_PAYMENT already exists in enum\n')
      } else {
        throw enumError
      }
    }

    // Verify the changes
    console.log('5️⃣ Verifying changes...')
    const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      AND column_name IN ('payment_status', 'stripe_payment_id', 'paid_at')
      ORDER BY column_name;
    `

    console.log('   Columns found:')
    columns.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}`)
    })

    const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus')
      ORDER BY enumsortorder;
    `

    console.log('\n   CampaignStatus enum values:')
    enumValues.forEach(val => {
      console.log(`     - ${val.enumlabel}`)
    })

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Run: npx prisma generate')
    console.log('   2. Restart your dev server')

  } catch (error: any) {
    console.error('\n❌ Migration failed:')
    console.error('   Error:', error.message)
    console.error('   Code:', error.code)
    if (error.stack) {
      console.error('\n   Stack:', error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()

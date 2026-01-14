import { prisma } from '../lib/db/prisma'

async function runMigration() {
  try {
    console.log('\n=== Running Advertiser Fields Migration Locally ===\n')

    console.log('Adding new columns to advertisers table...')

    // Run the migration SQL
    await prisma.$executeRaw`
      ALTER TABLE advertisers 
      ADD COLUMN IF NOT EXISTS contact_phone TEXT,
      ADD COLUMN IF NOT EXISTS company_size TEXT,
      ADD COLUMN IF NOT EXISTS monthly_ad_budget TEXT,
      ADD COLUMN IF NOT EXISTS marketing_goals TEXT;
    `

    console.log('✅ Migration completed successfully!')
    console.log('\nAdded columns:')
    console.log('  - contact_phone')
    console.log('  - company_size')
    console.log('  - monthly_ad_budget')
    console.log('  - marketing_goals')

    // Verify the columns were added
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'advertisers' 
      AND column_name IN ('contact_phone', 'company_size', 'monthly_ad_budget', 'marketing_goals')
      ORDER BY column_name;
    ` as Array<{ column_name: string }>

    console.log('\n✅ Verified columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}`)
    })

    console.log('\n📋 Next step: Run npx prisma generate')
    console.log('   (Make sure to stop your dev server first if it\'s running)')

  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️  Columns may already exist. Checking...')
      
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'advertisers' 
        AND column_name IN ('contact_phone', 'company_size', 'monthly_ad_budget', 'marketing_goals')
        ORDER BY column_name;
      ` as Array<{ column_name: string }>

      if (columns.length > 0) {
        console.log('✅ Columns already exist:')
        columns.forEach(col => {
          console.log(`  - ${col.column_name}`)
        })
        console.log('\n✅ Migration already complete!')
      } else {
        console.error('❌ Error:', error.message)
        throw error
      }
    } else {
      console.error('❌ Migration failed:', error.message)
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()

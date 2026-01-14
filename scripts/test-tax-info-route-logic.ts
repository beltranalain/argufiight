import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testRouteLogic() {
  const userId = 'cec34454-8ca4-416e-9715-0aebee4c7731' // kubancane user ID
  
  try {
    console.log('Testing route logic for user:', userId)
    console.log('')
    
    // Simulate the exact route logic
    console.log('Step 1: Finding tax info...')
    let taxInfo = await prisma.creatorTaxInfo.findUnique({
      where: { creatorId: userId },
    })
    console.log('✅ Found tax info:', taxInfo ? 'yes' : 'no')
    
    if (taxInfo) {
      console.log('Step 2: Fetching tax forms separately...')
      const forms = await prisma.taxForm1099.findMany({
        where: { creatorTaxInfoId: taxInfo.id },
        orderBy: { taxYear: 'desc' },
      })
      console.log(`✅ Found ${forms.length} tax forms`)
      
      // Add forms manually
      ;(taxInfo as any).taxForms1099 = forms
      
      console.log('Step 3: Processing data...')
      const yearlyEarnings = taxInfo.yearlyEarnings as Record<string, number> || {}
      console.log('✅ Yearly earnings:', yearlyEarnings)
      
      // Map tax forms
      let taxForms1099 = []
      if (taxInfo.taxForms1099 && Array.isArray(taxInfo.taxForms1099)) {
        taxForms1099 = taxInfo.taxForms1099.map(form => ({
          id: form.id,
          taxYear: form.taxYear,
          totalCompensation: Number(form.totalCompensation || 0),
          status: form.status,
          pdfUrl: form.pdfUrl,
          generatedAt: form.generatedAt ? (form.generatedAt instanceof Date ? form.generatedAt.toISOString() : new Date(form.generatedAt).toISOString()) : null,
          sentToCreator: form.sentToCreator || false,
        }))
      }
      
      console.log('Step 4: Building response...')
      const responseData = {
        w9Submitted: taxInfo.w9Submitted || false,
        w9SubmittedAt: taxInfo.w9SubmittedAt ? taxInfo.w9SubmittedAt.toISOString() : null,
        legalName: taxInfo.legalName,
        taxIdType: taxInfo.taxIdType,
        yearlyEarnings: yearlyEarnings,
        taxForms1099: taxForms1099,
      }
      
      console.log('Step 5: Serializing to JSON...')
      const jsonString = JSON.stringify(responseData)
      console.log('✅ JSON serialization successful, length:', jsonString.length)
      
      console.log('')
      console.log('✅ Final response:')
      console.log(JSON.stringify(responseData, null, 2))
      console.log('')
      console.log('✅ All steps completed successfully!')
      
    } else {
      console.log('⚠️ No tax info found - would create new record')
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    console.error('Name:', error.name)
    console.error('Code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

testRouteLogic()

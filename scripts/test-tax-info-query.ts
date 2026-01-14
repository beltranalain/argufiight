import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testTaxInfoQuery() {
  const userId = 'cec34454-8ca4-416e-9715-0aebee4c7731' // kubancane user ID
  
  try {
    console.log('Testing tax info query for user:', userId)
    console.log('')
    
    // Test 1: Find tax info without relation
    console.log('1. Testing findUnique without relation...')
    const taxInfo = await prisma.creatorTaxInfo.findUnique({
      where: { creatorId: userId },
    })
    
    if (!taxInfo) {
      console.log('❌ No tax info found')
      return
    }
    
    console.log('✅ Tax info found:', {
      id: taxInfo.id,
      w9Submitted: taxInfo.w9Submitted,
      legalName: taxInfo.legalName,
      yearlyEarnings: taxInfo.yearlyEarnings,
    })
    console.log('')
    
    // Test 2: Fetch tax forms separately
    console.log('2. Testing tax forms query...')
    const taxForms = await prisma.taxForm1099.findMany({
      where: { creatorTaxInfoId: taxInfo.id },
      orderBy: { taxYear: 'desc' },
    })
    
    console.log(`✅ Found ${taxForms.length} tax forms`)
    taxForms.forEach(form => {
      console.log(`   - ${form.taxYear}: $${Number(form.totalCompensation)} (${form.status})`)
    })
    console.log('')
    
    // Test 3: Build response object
    console.log('3. Building response object...')
    const yearlyEarnings = taxInfo.yearlyEarnings as Record<string, number> || {}
    const taxForms1099 = taxForms.map(form => ({
      id: form.id,
      taxYear: form.taxYear,
      totalCompensation: Number(form.totalCompensation),
      status: form.status,
      pdfUrl: form.pdfUrl,
      generatedAt: form.generatedAt,
      sentToCreator: form.sentToCreator,
    }))
    
    const responseData = {
      w9Submitted: taxInfo.w9Submitted || false,
      w9SubmittedAt: taxInfo.w9SubmittedAt,
      legalName: taxInfo.legalName,
      taxIdType: taxInfo.taxIdType,
      yearlyEarnings: yearlyEarnings,
      taxForms1099: taxForms1099,
    }
    
    console.log('✅ Response data:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')
    console.log('✅ All tests passed!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testTaxInfoQuery()

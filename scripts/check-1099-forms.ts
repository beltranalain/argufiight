import { prisma } from '../lib/db/prisma'

async function checkForms() {
  const userId = 'cec34454-8ca4-416e-9715-0aebee4c7731'
  
  console.log('Checking tax info for user:', userId)
  
  const taxInfo = await prisma.creatorTaxInfo.findUnique({
    where: { creatorId: userId },
  })
  
  if (!taxInfo) {
    console.log('No tax info found')
    process.exit(1)
  }
  
  console.log('Tax Info ID:', taxInfo.id)
  console.log('Creator ID:', taxInfo.creatorId)
  
  const forms = await prisma.taxForm1099.findMany({
    where: { creatorTaxInfoId: taxInfo.id },
    orderBy: { taxYear: 'desc' },
  })
  
  console.log('\nForms found:', forms.length)
  forms.forEach(form => {
    console.log(`- Form ${form.id}: Year ${form.taxYear}, Status: ${form.status}, PDF: ${form.pdfUrl ? 'Yes' : 'No'}`)
  })
  
  // Also check all forms
  const allForms = await prisma.taxForm1099.findMany({
    orderBy: { taxYear: 'desc' },
  })
  
  console.log('\nAll forms in database:', allForms.length)
  allForms.forEach(form => {
    console.log(`- Form ${form.id}: CreatorTaxInfoId: ${form.creatorTaxInfoId}, Year ${form.taxYear}, Status: ${form.status}`)
  })
  
  await prisma.$disconnect()
}

checkForms().catch(console.error)

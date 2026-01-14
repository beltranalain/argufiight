import { prisma } from '../lib/db/prisma.js'
import bcrypt from 'bcryptjs'

async function checkPassword() {
  try {
    const email = 'beltranalain@yahoo.com'
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    })
    
    if (!user) {
      console.log('User not found')
      return
    }
    
    console.log('User found:')
    console.log(`  Email: ${user.email}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Has Password: ${!!user.password}`)
    
    // Try common passwords to see which one works
    const testPasswords = [
      'Kamioi123!',
      'Password123!',
      'Test123!',
      'Kubancane123!',
      'beltran123!',
    ]
    
    console.log('\nTesting passwords:')
    for (const testPwd of testPasswords) {
      if (user.password) {
        const matches = await bcrypt.compare(testPwd, user.password)
        if (matches) {
          console.log(`  ✅ MATCH: "${testPwd}"`)
        } else {
          console.log(`  ❌ No match: "${testPwd}"`)
        }
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkPassword()

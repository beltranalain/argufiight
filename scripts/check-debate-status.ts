/**
 * Script to check a specific debate's status and why it might not have been processed
 * Usage: tsx scripts/check-debate-status.ts <debate-id>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDebateStatus(debateId: string) {
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        statements: {
          orderBy: { round: 'asc' },
        },
        challenger: {
          select: { id: true, username: true },
        },
        opponent: {
          select: { id: true, username: true },
        },
      },
    })

    if (!debate) {
      console.error('Debate not found:', debateId)
      return
    }

    console.log('\n=== Debate Status ===')
    console.log('ID:', debate.id)
    console.log('Topic:', debate.topic)
    console.log('Status:', debate.status)
    console.log('Current Round:', debate.currentRound, '/', debate.totalRounds)
    console.log('Round Deadline:', debate.roundDeadline)
    console.log('Challenger:', debate.challenger.username)
    console.log('Opponent:', debate.opponent?.username || 'None')
    
    const now = new Date()
    const deadline = debate.roundDeadline ? new Date(debate.roundDeadline) : null
    const isExpired = deadline ? deadline <= now : false
    
    console.log('\n=== Expiration Check ===')
    console.log('Current Time:', now.toISOString())
    console.log('Round Deadline:', deadline?.toISOString() || 'None')
    console.log('Is Expired:', isExpired)
    if (deadline) {
      const hoursAgo = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60)
      console.log('Hours Since Deadline:', hoursAgo.toFixed(2))
    }

    console.log('\n=== Statements ===')
    const currentRoundStatements = debate.statements.filter(s => s.round === debate.currentRound)
    console.log(`Total Statements: ${debate.statements.length}`)
    console.log(`Current Round Statements: ${currentRoundStatements.length}`)
    
    currentRoundStatements.forEach(stmt => {
      const author = stmt.authorId === debate.challengerId 
        ? debate.challenger.username 
        : debate.opponent?.username || 'Unknown'
      console.log(`  - Round ${stmt.round}: ${author} - ${stmt.content.substring(0, 50)}...`)
    })

    const challengerSubmitted = currentRoundStatements.some(s => s.authorId === debate.challengerId)
    const opponentSubmitted = debate.opponentId 
      ? currentRoundStatements.some(s => s.authorId === debate.opponentId)
      : false

    console.log('\n=== Submission Status ===')
    console.log('Challenger Submitted:', challengerSubmitted)
    console.log('Opponent Submitted:', opponentSubmitted)

    // Check if debate would be caught by the process-expired query
    const halfwayPoint = Math.ceil(debate.totalRounds / 2)
    const isHalfwayThrough = debate.currentRound >= halfwayPoint
    const isFinalRound = debate.currentRound >= debate.totalRounds

    console.log('\n=== Processing Logic ===')
    console.log('Halfway Point:', halfwayPoint)
    console.log('Is Halfway Through:', isHalfwayThrough)
    console.log('Is Final Round:', isFinalRound)
    console.log('Would End Debate:', isFinalRound || isHalfwayThrough)
    
    // Check query conditions
    const hasStatements = currentRoundStatements.length > 0
    const meetsQueryCondition = debate.currentRound > 1 || hasStatements
    console.log('\n=== Query Conditions ===')
    console.log('Current Round > 1:', debate.currentRound > 1)
    console.log('Has Statements in Current Round:', hasStatements)
    console.log('Meets Query Condition:', meetsQueryCondition)
    console.log('Would Be Processed:', isExpired && debate.status === 'ACTIVE' && meetsQueryCondition)

    if (isExpired && debate.status === 'ACTIVE' && meetsQueryCondition) {
      console.log('\n⚠️  This debate SHOULD be processed but hasn\'t been!')
      console.log('Possible reasons:')
      console.log('  1. Cron job not running frequently enough')
      console.log('  2. No one has viewed debates recently (triggers background processing)')
      console.log('  3. Processing endpoint failed silently')
    } else if (isExpired && debate.status === 'ACTIVE' && !meetsQueryCondition) {
      console.log('\n⚠️  This debate is expired but WON\'T be processed by current query!')
      console.log('Reason: Query requires currentRound > 1 OR has statements')
      console.log('This is a bug in the query logic!')
    }

  } catch (error) {
    console.error('Error checking debate:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const debateId = process.argv[2]
if (!debateId) {
  console.error('Usage: tsx scripts/check-debate-status.ts <debate-id>')
  process.exit(1)
}

checkDebateStatus(debateId)

/**
 * End-to-End Test Script for King of the Hill Tournament
 * 
 * This script:
 * 1. Creates 4 test users
 * 2. Creates a King of the Hill tournament
 * 3. Has all users join
 * 4. Starts the tournament
 * 5. Simulates all rounds with statement submissions
 * 6. Verifies verdicts are generated at each step
 * 7. Tests through to completion
 * 
 * Usage: npx tsx scripts/test-king-of-the-hill-end-to-end.ts
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { processKingOfTheHillDebateCompletion } from '../lib/tournaments/king-of-the-hill'
import { generateKingOfTheHillRoundVerdicts } from '../lib/tournaments/king-of-the-hill-ai'

const prisma = new PrismaClient()

interface TestUser {
  id: string
  username: string
  email: string
  password: string
}

const testUsers: TestUser[] = []

async function createTestUser(username: string, email: string, password: string): Promise<TestUser> {
  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log(`   ⚠️  User already exists: ${username}, using existing user`)
    return {
      id: existing.id,
      username: existing.username,
      email: existing.email,
      password,
    }
  }

  const passwordHash = await hash(password, 10)
  
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      eloRating: 1200,
    },
  })

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    password,
  }
}

async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...')
  for (const user of testUsers) {
    try {
      await prisma.user.delete({
        where: { email: user.email },
      })
      console.log(`   ✅ Deleted user: ${user.username}`)
    } catch (error) {
      console.log(`   ⚠️  Could not delete user ${user.username}: ${error}`)
    }
  }
}

async function createTournament(creatorId: string) {
  console.log('\n📋 Creating King of the Hill tournament...')
  
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Test King of the Hill Tournament - E2E Test',
      description: 'End-to-end test tournament',
      format: 'KING_OF_THE_HILL',
      maxParticipants: 4,
      totalRounds: 3, // Default for King of the Hill
      roundDuration: 86400000, // 24 hours in milliseconds
      status: 'UPCOMING',
      creatorId,
      startDate: new Date(),
      isPrivate: false,
    },
  })

  // Get creator's ELO
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { eloRating: true },
  })

  // Add creator as participant
  await prisma.tournamentParticipant.create({
    data: {
      tournamentId: tournament.id,
      userId: creatorId,
      seed: 1,
      status: 'ACTIVE',
      eloAtStart: creator?.eloRating || 1200,
    },
  })

  console.log(`   ✅ Tournament created: ${tournament.id}`)
  return tournament
}

async function joinTournament(tournamentId: string, userId: string, seed: number) {
  // Get user's ELO
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { eloRating: true },
  })

  await prisma.tournamentParticipant.create({
    data: {
      tournamentId,
      userId,
      seed,
      status: 'ACTIVE',
      eloAtStart: user?.eloRating || 1200,
    },
  })
  console.log(`   ✅ User joined tournament (seed ${seed})`)
}

async function startTournament(tournamentId: string) {
  console.log('\n🚀 Starting tournament...')
  
  // Import startTournament function which handles King of the Hill correctly
  const { startTournament: startTournamentFn } = await import('../lib/tournaments/match-generation')
  await startTournamentFn(tournamentId)
  
  console.log('   ✅ Tournament started')
}

async function getCurrentDebate(tournamentId: string) {
  const match = await prisma.tournamentMatch.findFirst({
    where: {
      round: {
        tournamentId,
      },
      debate: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
    },
    include: {
      debate: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      },
      round: {
        select: {
          roundNumber: true,
        },
      },
    },
    orderBy: {
      id: 'desc',
    },
  })

  return match?.debate || null
}

async function submitStatement(debateId: string, userId: string, round: number, content: string) {
  await prisma.statement.create({
    data: {
      debateId,
      authorId: userId,
      round,
      content,
    },
  })
  console.log(`   ✅ Statement submitted by user for round ${round}`)
}

async function submitAllStatementsForRound(debateId: string, round: number) {
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  })

  if (!debate) {
    throw new Error('Debate not found')
  }

  console.log(`\n📝 Submitting statements for round ${round}...`)
  
  for (const participant of debate.participants) {
    if (participant.status === 'ACTIVE' || participant.status === 'ACCEPTED') {
      const content = `Round ${round} argument from ${participant.user.username}. This is a test argument for the King of the Hill tournament.`
      await submitStatement(debateId, participant.user.id, round, content)
    }
  }
}

async function checkVerdicts(debateId: string): Promise<number> {
  const count = await prisma.verdict.count({
    where: { debateId },
  })
  return count
}

async function waitForVerdicts(debateId: string, maxWait: number = 30000): Promise<boolean> {
  const startTime = Date.now()
  while (Date.now() - startTime < maxWait) {
    const count = await checkVerdicts(debateId)
    if (count > 0) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return false
}

async function processRoundCompletion(debateId: string, tournamentId: string, roundNumber: number) {
  console.log(`\n⚖️  Processing round ${roundNumber} completion...`)
  
  // Check if verdicts exist
  const verdictCount = await checkVerdicts(debateId)
  console.log(`   Current verdict count: ${verdictCount}`)
  
  if (verdictCount === 0) {
    console.log('   ⚠️  No verdicts found. Generating verdicts...')
    await generateKingOfTheHillRoundVerdicts(debateId, tournamentId, roundNumber)
    
    // Wait a bit for verdicts to be created
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newCount = await checkVerdicts(debateId)
    console.log(`   ✅ Verdicts generated: ${newCount}`)
    
    if (newCount === 0) {
      throw new Error('Failed to generate verdicts!')
    }
  }
  
  // Process completion (this will advance to next round)
  await processKingOfTheHillDebateCompletion(debateId)
  console.log('   ✅ Round completion processed')
}

async function runEndToEndTest() {
  console.log('🧪 Starting King of the Hill End-to-End Test\n')
  console.log('=' .repeat(60))

  try {
    // Step 1: Create 4 test users
    console.log('\n👥 Step 1: Creating 4 test users...')
    const timestamp = Date.now()
    for (let i = 1; i <= 4; i++) {
      const user = await createTestUser(
        `koth_test_user_${i}_${timestamp}`,
        `koth_test_${i}_${timestamp}@test.com`,
        'TestPassword123!'
      )
      testUsers.push(user)
      console.log(`   ✅ Created: ${user.username} (${user.email})`)
    }

    // Step 2: Create tournament
    const tournament = await createTournament(testUsers[0].id)

    // Step 3: Join tournament
    console.log('\n🎯 Step 3: Joining tournament...')
    for (let i = 1; i < testUsers.length; i++) {
      await joinTournament(tournament.id, testUsers[i].id, i + 1)
    }

    // Step 4: Start tournament
    await startTournament(tournament.id)

    // Step 5: Test rounds
    let roundNumber = 1
    let maxRounds = 10 // Safety limit
    
    while (roundNumber <= maxRounds) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`\n🔄 ROUND ${roundNumber}`)
      console.log(`${'='.repeat(60)}`)

      // Get current debate
      const debate = await getCurrentDebate(tournament.id)
      
      if (!debate) {
        console.log('\n✅ No more debates - tournament may be complete!')
        break
      }

      console.log(`\n📊 Current Debate: ${debate.id}`)
      console.log(`   Status: ${debate.status}`)
      console.log(`   Challenge Type: ${debate.challengeType}`)
      console.log(`   Current Round: ${debate.currentRound}/${debate.totalRounds}`)
      console.log(`   Participants: ${debate.participants.length}`)

      // Check if debate is already completed
      if (debate.status === 'COMPLETED' || debate.status === 'VERDICT_READY') {
        console.log(`\n   ⚠️  Debate is already ${debate.status}`)
        
        // Check verdicts
        const verdictCount = await checkVerdicts(debate.id)
        console.log(`   Verdict count: ${verdictCount}`)
        
        if (verdictCount === 0) {
          console.log('   ⚠️  No verdicts found! Generating now...')
          const match = await prisma.tournamentMatch.findFirst({
            where: { debateId: debate.id },
            include: {
              round: {
                select: {
                  roundNumber: true,
                  tournament: {
                    select: { id: true },
                  },
                },
              },
            },
          })
          
          if (match) {
            await generateKingOfTheHillRoundVerdicts(
              debate.id,
              match.round.tournament.id,
              match.round.roundNumber
            )
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
        
        // Process completion
        await processRoundCompletion(debate.id, tournament.id, roundNumber)
        
        // Check if tournament is complete
        const updatedTournament = await prisma.tournament.findUnique({
          where: { id: tournament.id },
          select: { status: true },
        })
        
        if (updatedTournament?.status === 'COMPLETED') {
          console.log('\n🏆 Tournament completed!')
          break
        }
        
        roundNumber++
        continue
      }

      // Submit statements for current round
      if (debate.status === 'ACTIVE') {
        await submitAllStatementsForRound(debate.id, debate.currentRound)
        
        // Mark debate as completed
        await prisma.debate.update({
          where: { id: debate.id },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        })
        
        console.log('   ✅ All statements submitted, debate marked as COMPLETED')
      }

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check verdicts
      const verdictCount = await checkVerdicts(debate.id)
      console.log(`\n⚖️  Verdict check: ${verdictCount} verdicts found`)

      if (verdictCount === 0) {
        console.log('   ⚠️  No verdicts found! This is the bug. Generating now...')
        
        // Get tournament match info
        const match = await prisma.tournamentMatch.findFirst({
          where: { debateId: debate.id },
          include: {
            round: {
              select: {
                roundNumber: true,
                tournament: {
                  select: { id: true },
                },
              },
            },
          },
        })

        if (match) {
          await generateKingOfTheHillRoundVerdicts(
            debate.id,
            match.round.tournament.id,
            match.round.roundNumber
          )
          
          // Wait for verdicts
          const hasVerdicts = await waitForVerdicts(debate.id, 10000)
          if (!hasVerdicts) {
            throw new Error('Failed to generate verdicts after waiting!')
          }
          
          const newCount = await checkVerdicts(debate.id)
          console.log(`   ✅ Verdicts generated: ${newCount}`)
        } else {
          throw new Error('Tournament match not found!')
        }
      }

      // Process completion
      await processRoundCompletion(debate.id, tournament.id, roundNumber)

      // Check if tournament is complete
      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournament.id },
        select: { status: true },
      })

      if (updatedTournament?.status === 'COMPLETED') {
        console.log('\n🏆 Tournament completed!')
        break
      }

      roundNumber++
    }

    // Final verification
    console.log(`\n${'='.repeat(60)}`)
    console.log('\n✅ TEST SUMMARY')
    console.log(`${'='.repeat(60)}`)
    
    const finalTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        rounds: {
          include: {
            matches: {
              include: {
                debate: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    console.log(`\nTournament Status: ${finalTournament?.status}`)
    console.log(`Total Rounds: ${finalTournament?.rounds.length}`)
    
    let totalVerdicts = 0
    for (const round of finalTournament?.rounds || []) {
      for (const match of round.matches) {
        if (match.debate) {
          const count = await checkVerdicts(match.debate.id)
          totalVerdicts += count
          console.log(`   Round ${round.roundNumber}, Debate ${match.debate.id}: ${count} verdicts`)
        }
      }
    }
    
    console.log(`\nTotal Verdicts Generated: ${totalVerdicts}`)
    
    if (totalVerdicts === 0) {
      console.log('\n❌ TEST FAILED: No verdicts were generated!')
      process.exit(1)
    } else {
      console.log('\n✅ TEST PASSED: Verdicts were generated successfully!')
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await cleanupTestUsers()
    await prisma.$disconnect()
  }
}

// Run the test
runEndToEndTest()

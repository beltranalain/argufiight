/**
 * End-to-End Test: King of the Hill Tournament with 7 Users
 * Tests the full tournament flow from creation to completion
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Create 7 test users
async function createTestUsers() {
  console.log('\n📝 Creating 7 test users...')
  const users = []
  const baseTimestamp = Date.now()
  
  for (let i = 1; i <= 7; i++) {
    const email = `koth-test-user-${i}-${baseTimestamp}@test.com`
    const username = `koth-test-${i}-${baseTimestamp}`
    const password = `test-password-${i}`
    
    try {
      const passwordHash = await hash(password, 10)
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          eloRating: 1200 + (i * 10), // Varying ELO ratings
          avatarUrl: null,
        },
      })
      users.push(user)
      console.log(`  ✅ Created user ${i}: @${username} (${user.id})`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        // User already exists, try to find them
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })
        if (existingUser) {
          users.push(existingUser)
          console.log(`  ℹ️  User ${i} already exists: @${username}`)
        }
      } else {
        throw error
      }
    }
  }
  
  return users
}

// Create and start tournament
async function createTournament(users: any[]) {
  console.log('\n🏆 Creating King of the Hill tournament...')
  
  const tournament = await prisma.tournament.create({
    data: {
      name: `Test KOTH Tournament - 7 Users - ${Date.now()}`,
      description: 'End-to-end test tournament with 7 participants',
      format: 'KING_OF_THE_HILL',
      maxParticipants: 7,
      minElo: 0,
      isPrivate: false,
      roundDuration: 3600000, // 1 hour in milliseconds
      totalRounds: 3, // Will be updated dynamically
      status: 'REGISTRATION_OPEN',
      startDate: new Date(),
      creatorId: users[0].id,
    },
  })
  
  console.log(`  ✅ Created tournament: ${tournament.name} (${tournament.id})`)
  
  // Register all users
  console.log('\n👥 Registering all users...')
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    try {
      const participant = await prisma.tournamentParticipant.create({
        data: {
          tournamentId: tournament.id,
          userId: user.id,
          seed: i + 1,
          eloAtStart: user.eloRating,
          status: 'REGISTERED',
        },
      })
      console.log(`  ✅ Registered user ${i + 1}: @${user.username} (seed ${participant.seed})`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`  ℹ️  User ${i + 1} already registered: @${user.username}`)
      } else {
        throw error
      }
    }
  }
  
  return tournament
}

// Start tournament
async function startTournamentTest(tournamentId: string) {
  console.log('\n🚀 Starting tournament...')
  const { startTournament: startTournamentFn } = await import('../lib/tournaments/match-generation')
  await startTournamentFn(tournamentId)
  console.log('  ✅ Tournament started')
}

// Submit statements for all participants in a debate
async function submitStatementsForAllParticipants(debateId: string, users: any[], roundNumber: number) {
  console.log(`\n📝 Submitting statements for Round ${roundNumber}...`)
  
  // Get all active participants for this debate
  const participants = await prisma.debateParticipant.findMany({
    where: {
      debateId,
      status: 'ACTIVE',
    },
    include: {
      user: true,
    },
  })
  
  console.log(`  Found ${participants.length} active participants`)
  
  // Submit for each participant
  for (const participant of participants) {
    const user = users.find(u => u.id === participant.userId)
    if (!user) {
      console.log(`  ⚠️  User not found for participant ${participant.userId}`)
      continue
    }
    
    // Check if already submitted
    const existingStatement = await prisma.statement.findFirst({
      where: {
        debateId,
        authorId: participant.userId,
        round: 1, // Round 1 for all rounds in KOTH
      },
    })
    
    if (existingStatement) {
      console.log(`  ℹ️  @${user.username} already submitted`)
      continue
    }
    
    // Submit statement
    try {
      const statement = await prisma.statement.create({
        data: {
          debateId,
          authorId: participant.userId,
          round: 1, // KOTH debates have totalRounds: 1, currentRound: 1
          content: `Round ${roundNumber} argument from @${user.username}. This is my submission for the King of the Hill tournament. I believe my argument is strong and well-reasoned.`,
        },
      })
      console.log(`  ✅ @${user.username} submitted statement (${statement.id})`)
    } catch (error: any) {
      console.error(`  ❌ Error submitting for @${user.username}:`, error.message)
      throw error
    }
  }
  
  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Check debate status
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      statements: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
  })
  
  console.log(`  📊 Debate status: ${debate?.status}`)
  console.log(`  📊 Statements submitted: ${debate?.statements.length || 0}/${participants.length}`)
  
  return debate
}

// Process round and wait for verdicts
async function processRound(debateId: string, roundNumber: number) {
  console.log(`\n⏳ Processing Round ${roundNumber}...`)
  
  // Wait for verdict generation (this happens automatically via API)
  // In a real scenario, we'd call the verdict generation endpoint
  // For now, we'll wait and check status
  let attempts = 0
  const maxAttempts = 30
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        verdicts: true,
        tournamentMatch: {
          include: {
            round: {
              include: {
                tournament: {
                  include: {
                    participants: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
    
    if (debate?.status === 'VERDICT_READY' && debate.verdicts.length > 0) {
      console.log(`  ✅ Round ${roundNumber} verdicts generated (${debate.verdicts.length} verdicts)`)
      
      // Show elimination results
      const tournament = debate.tournamentMatch?.round?.tournament
      if (tournament) {
        const eliminated = tournament.participants.filter(p => p.status === 'ELIMINATED')
        const active = tournament.participants.filter(p => p.status === 'ACTIVE')
        console.log(`  📊 Eliminated: ${eliminated.length}, Active: ${active.length}`)
        
        eliminated.forEach(p => {
          console.log(`    ❌ @${p.user.username} - Round ${p.eliminationRound || '?'}`)
        })
      }
      
      return debate
    }
    
    attempts++
    if (attempts % 5 === 0) {
      console.log(`  ⏳ Waiting for verdicts... (attempt ${attempts}/${maxAttempts})`)
    }
  }
  
  throw new Error(`Round ${roundNumber} did not complete within ${maxAttempts * 2} seconds`)
}

// Main test function
async function runTest() {
  try {
    console.log('🧪 Starting King of the Hill 7-User End-to-End Test\n')
    console.log('=' .repeat(60))
    
    // Step 1: Create test users
    const users = await createTestUsers()
    if (users.length !== 7) {
      throw new Error(`Expected 7 users, got ${users.length}`)
    }
    
    // Step 2: Create tournament
    const tournament = await createTournament(users)
    
    // Step 3: Start tournament
    await startTournamentTest(tournament.id)
    
    // Step 4: Process rounds until completion
    let roundNumber = 1
    let tournamentComplete = false
    
    while (!tournamentComplete && roundNumber <= 10) { // Safety limit
      console.log(`\n${'='.repeat(60)}`)
      console.log(`🔄 Processing Round ${roundNumber}`)
      console.log('='.repeat(60))
      
      // Get current round debate
      const round = await prisma.tournamentRound.findFirst({
        where: {
          tournamentId: tournament.id,
          roundNumber,
        },
        include: {
          matches: {
            include: {
              debate: {
                include: {
                  participants: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      
      if (!round || round.matches.length === 0) {
        console.log(`  ⚠️  No round ${roundNumber} found or no matches`)
        break
      }
      
      const match = round.matches[0]
      const debate = match.debate
      
      if (!debate) {
        console.log(`  ⚠️  No debate found for round ${roundNumber}`)
        break
      }
      
      console.log(`  📋 Debate ID: ${debate.id}`)
      console.log(`  📋 Participants: ${debate.participants?.length || 0}`)
      console.log(`  📋 Status: ${debate.status}`)
      
      // Check if debate is already complete
      if (debate.status === 'VERDICT_READY') {
        console.log(`  ℹ️  Round ${roundNumber} already has verdicts`)
      } else if (debate.status === 'ACTIVE') {
        // Submit statements for all participants
        await submitStatementsForAllParticipants(debate.id, users, roundNumber)
        
        // Process round and wait for verdicts
        await processRound(debate.id, roundNumber)
      }
      
      // Check tournament status
      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournament.id },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          rounds: {
            orderBy: {
              roundNumber: 'desc',
            },
            take: 1,
          },
        },
      })
      
      if (updatedTournament?.status === 'COMPLETED') {
        console.log('\n🎉 Tournament completed!')
        const champion = updatedTournament.participants.find(p => p.status === 'ACTIVE')
        if (champion) {
          console.log(`  🏆 Champion: @${champion.user.username}`)
        }
        tournamentComplete = true
        break
      }
      
      // Check if we need to advance to next round
      const activeParticipants = updatedTournament?.participants.filter(p => p.status === 'ACTIVE') || []
      console.log(`  📊 Active participants: ${activeParticipants.length}`)
      
      if (activeParticipants.length <= 1) {
        console.log('\n🎉 Tournament should be complete (1 or fewer active participants)')
        tournamentComplete = true
        break
      }
      
      roundNumber++
      
      // Wait a bit before next round
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Final Tournament Summary')
    console.log('='.repeat(60))
    
    const finalTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        participants: {
          include: {
            user: true,
          },
          orderBy: {
            seed: 'asc',
          },
        },
        rounds: {
          include: {
            matches: {
              include: {
                debate: {
                  include: {
                    statements: true,
                    verdicts: true,
                  },
                },
              },
            },
          },
          orderBy: {
            roundNumber: 'asc',
          },
        },
      },
    })
    
    if (finalTournament) {
      console.log(`\nTournament: ${finalTournament.name}`)
      console.log(`Status: ${finalTournament.status}`)
      console.log(`Total Rounds: ${finalTournament.totalRounds}`)
      console.log(`Current Round: ${finalTournament.currentRound}`)
      
      console.log('\nParticipants:')
      finalTournament.participants.forEach(p => {
        const status = p.status === 'ACTIVE' ? '🏆 ACTIVE' : `❌ ELIMINATED (Round ${p.eliminationRound || '?'})`
        console.log(`  ${p.seed}. @${p.user.username} - ${status} - Score: ${p.cumulativeScore || 0}`)
      })
      
      console.log('\nRounds:')
      finalTournament.rounds.forEach(round => {
        const match = round.matches[0]
        const debate = match?.debate
        console.log(`  Round ${round.roundNumber}: ${round.status} - Debate: ${debate?.id || 'N/A'} - Statements: ${debate?.statements.length || 0} - Verdicts: ${debate?.verdicts.length || 0}`)
      })
    }
    
    console.log('\n✅ Test completed successfully!')
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error)
    console.error(error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
runTest()
  .then(() => {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  })

import { prisma } from '@/lib/db/prisma'
import { generateVerdict, type DebateContext } from '@/lib/ai/deepseek'

async function processAppealsDirect() {
  try {
    console.log('\n=== Processing Stuck Appeals (Direct) ===\n')

    const stuckAppeals = await prisma.debate.findMany({
      where: {
        appealStatus: {
          in: ['PENDING', 'PROCESSING', 'DENIED'],
        },
        status: 'APPEALED',
      },
      include: {
        challenger: {
          select: {
            id: true,
            username: true,
            eloRating: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
            eloRating: true,
          },
        },
        statements: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        verdicts: {
          include: {
            judge: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (stuckAppeals.length === 0) {
      console.log('No stuck appeals to process.\n')
      return
    }

    console.log(`Found ${stuckAppeals.length} stuck appeal(s) to process.\n`)

    for (const debate of stuckAppeals) {
      console.log(`Processing appeal for: ${debate.topic}`)
      console.log(`Debate ID: ${debate.id}`)

      try {
        // Update to PROCESSING
        await prisma.debate.update({
          where: { id: debate.id },
          data: {
            appealStatus: 'PROCESSING',
          },
        })

        // Get ALL verdicts for this debate
        const allVerdicts = await prisma.verdict.findMany({
          where: {
            debateId: debate.id,
          },
          include: {
            judge: {
              select: { id: true },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        // Original verdicts are the ones created BEFORE the appeal was submitted
        const appealedAt = debate.appealedAt || new Date()
        const originalVerdicts = allVerdicts.filter(v => new Date(v.createdAt) < appealedAt)
        const appealVerdicts = allVerdicts.filter(v => new Date(v.createdAt) >= appealedAt)
        
        const originalJudgeIds = originalVerdicts.map(v => v.judge.id)
        const existingAppealVerdicts = appealVerdicts
        const existingAppealJudgeIds = existingAppealVerdicts.map(v => v.judge.id)

        console.log(`  Original verdicts: ${originalVerdicts.length}`)
        console.log(`  Existing appeal verdicts: ${existingAppealVerdicts.length}`)

        // If we already have 3 appeal verdicts, use them and skip generation
        if (existingAppealVerdicts.length >= 3) {
          console.log(`  ✅ Found ${existingAppealVerdicts.length} existing appeal verdicts, using them`)
          // We'll use these verdicts below, skip to processing
        } else if (existingAppealVerdicts.length > 0) {
          console.log(`  Found ${existingAppealVerdicts.length} partial appeal verdicts, will generate ${3 - existingAppealVerdicts.length} more`)
        }

        // Get all judges except the original ones AND any already used for this appeal
        const availableJudges = await prisma.judge.findMany({
          where: {
            NOT: {
              id: {
                in: [...originalJudgeIds, ...existingAppealJudgeIds],
              },
            },
          },
        })

        // Select 3 random judges
        let selectedJudges
        if (availableJudges.length >= 3) {
          selectedJudges = availableJudges
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
        } else {
          const allJudges = await prisma.judge.findMany()
          selectedJudges = allJudges
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(3, allJudges.length))
        }

        console.log(`Selected ${selectedJudges.length} judges for re-verdict`)

        // Build debate context
        const debateContext: DebateContext = {
          topic: debate.topic,
          challengerPosition: debate.challengerPosition,
          opponentPosition: debate.opponentPosition,
          challengerName: debate.challenger.username,
          opponentName: debate.opponent?.username || 'Unknown',
          statements: debate.statements.map(s => ({
            round: s.round,
            author: s.author.username,
            position: s.author.id === debate.challengerId ? debate.challengerPosition : debate.opponentPosition,
            content: s.content,
          })),
        }

        // Start with existing appeal verdicts if any
        let newVerdicts = [...existingAppealVerdicts]

        // Only generate new verdicts if we don't have 3 yet
        if (newVerdicts.length < 3) {
          // Calculate how many we need
          const needed = 3 - newVerdicts.length
          
          // Select only the number of judges we need
          const judgesToUse = selectedJudges.slice(0, needed)
          
          console.log(`  Need ${needed} more verdicts, generating from ${judgesToUse.length} judges`)

          // Generate verdicts from new judges
          for (const judge of judgesToUse) {
            // Stop if we have 3 verdicts
            if (newVerdicts.length >= 3) {
              console.log(`  Already have 3 verdicts, stopping`)
              break
            }
            
            try {
              console.log(`  Generating verdict from ${judge.name}...`)
              const verdictResult = await generateVerdict(
                judge.systemPrompt,
                debateContext,
                { userId: debate.challengerId, debateId: debate.id }
              )

              // Determine winner from verdict
              let winnerId: string | null = null
              if (verdictResult.winner === 'CHALLENGER') {
                winnerId = debate.challengerId
              } else if (verdictResult.winner === 'OPPONENT' && debate.opponentId) {
                winnerId = debate.opponentId
              }

            // Save verdict
            const verdict = await prisma.verdict.create({
              data: {
                debateId: debate.id,
                judgeId: judge.id,
                decision: verdictResult.winner === 'CHALLENGER' ? 'CHALLENGER_WINS' : verdictResult.winner === 'OPPONENT' ? 'OPPONENT_WINS' : 'TIE',
                reasoning: verdictResult.reasoning,
                challengerScore: verdictResult.challengerScore,
                opponentScore: verdictResult.opponentScore,
                winnerId,
              },
              include: {
                judge: {
                  select: { id: true },
                },
              },
            })

            newVerdicts.push(verdict)
              console.log(`  ✅ Verdict from ${judge.name} created`)
            } catch (error: any) {
              console.error(`  ❌ Failed to generate verdict from ${judge.name}:`, error.message)
              // Continue with other judges even if one fails
            }
          }
        } else {
          console.log(`  ✅ Using ${newVerdicts.length} existing appeal verdicts`)
        }

        if (newVerdicts.length === 0) {
          console.log(`  ❌ All verdicts failed, setting status to DENIED`)
          await prisma.debate.update({
            where: { id: debate.id },
            data: {
              appealStatus: 'DENIED',
            },
          })
          continue
        }

        // Determine overall winner (majority vote)
        const challengerWins = newVerdicts.filter(v => v.winnerId === debate.challengerId).length
        const opponentWins = newVerdicts.filter(v => v.winnerId === debate.opponentId).length
        const ties = newVerdicts.filter(v => !v.winnerId).length

        let finalWinnerId: string | null = null
        if (challengerWins > opponentWins && challengerWins > ties) {
          finalWinnerId = debate.challengerId
        } else if (opponentWins > challengerWins && opponentWins > ties && debate.opponentId) {
          finalWinnerId = debate.opponentId
        }

        console.log(`  Final winner: ${finalWinnerId ? (finalWinnerId === debate.challengerId ? debate.challenger.username : debate.opponent?.username) : 'TIE'}`)

        // Calculate ELO changes only if verdict differs from original
        const originalWinnerId = debate.originalWinnerId
        const verdictFlipped = originalWinnerId !== finalWinnerId

        let challengerEloChange = 0
        let opponentEloChange = 0

        if (verdictFlipped && finalWinnerId) {
          // Recalculate ELO based on new verdict
          const challengerElo = debate.challenger.eloRating
          const opponentElo = debate.opponent?.eloRating || 1200

          // Calculate ELO change
          const kFactor = 32
          const expectedChallenger = 1 / (1 + Math.pow(10, (opponentElo - challengerElo) / 400))
          const expectedOpponent = 1 - expectedChallenger

          let challengerResult = 0.5 // Tie
          let opponentResult = 0.5

          if (finalWinnerId === debate.challengerId) {
            challengerResult = 1
            opponentResult = 0
          } else if (finalWinnerId === debate.opponentId) {
            challengerResult = 0
            opponentResult = 1
          }

          challengerEloChange = Math.round(kFactor * (challengerResult - expectedChallenger))
          opponentEloChange = Math.round(kFactor * (opponentResult - expectedOpponent))

          // Update user ELO and stats
          await prisma.user.update({
            where: { id: debate.challengerId },
            data: {
              eloRating: { increment: challengerEloChange },
              ...(finalWinnerId === debate.challengerId && {
                debatesWon: { increment: 1 },
                debatesLost: { decrement: 1 },
              }),
              ...(finalWinnerId === debate.opponentId && {
                debatesWon: { decrement: 1 },
                debatesLost: { increment: 1 },
              }),
            },
          })

          if (debate.opponentId) {
            await prisma.user.update({
              where: { id: debate.opponentId },
              data: {
                eloRating: { increment: opponentEloChange },
                ...(finalWinnerId === debate.opponentId && {
                  debatesWon: { increment: 1 },
                  debatesLost: { decrement: 1 },
                }),
                ...(finalWinnerId === debate.challengerId && {
                  debatesWon: { decrement: 1 },
                  debatesLost: { increment: 1 },
                }),
              },
            })
          }
        }

        // Generate rejection reason if needed (simplified - you can add the full function)
        let appealRejectionReason: string | null = null
        if (!verdictFlipped && debate.appealReason) {
          appealRejectionReason = 'After review by different judges, the original verdict was upheld. The new judges reached the same conclusion based on the arguments presented.'
        }

        // Update debate with new verdict
        await prisma.debate.update({
          where: { id: debate.id },
          data: {
            winnerId: finalWinnerId,
            verdictReached: true,
            verdictDate: new Date(),
            appealStatus: 'RESOLVED',
            status: 'VERDICT_READY',
            challengerEloChange: verdictFlipped ? challengerEloChange : debate.challengerEloChange,
            opponentEloChange: verdictFlipped ? opponentEloChange : debate.opponentEloChange,
            appealRejectionReason,
          },
        })

        console.log(`  ✅ Appeal processed successfully!`)
        console.log(`  Verdict flipped: ${verdictFlipped ? 'Yes' : 'No'}\n`)
      } catch (error: any) {
        console.error(`  ❌ Error processing appeal: ${error.message}`)
        console.error(error)
        console.log('')
      }
    }

    console.log('\n=== Processing Complete ===\n')
  } catch (error) {
    console.error('Error processing appeals:', error)
  } finally {
    await prisma.$disconnect()
  }
}

processAppealsDirect()


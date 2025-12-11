import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/debates/[id] - Get single debate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const shareToken = searchParams.get('shareToken') // For accessing private debates
    
    // Get current user session for access control
    const session = await verifySession()
    const currentUserId = session ? getUserIdFromSession(session) : null
    
    // Try to fetch debate with participants, but handle errors gracefully
    let debate
    try {
      debate = await prisma.debate.findUnique({
        where: { id },
        select: {
          id: true,
          topic: true,
          description: true,
          category: true,
          status: true,
          challengerId: true,
          opponentId: true,
          challengerPosition: true,
          opponentPosition: true,
          totalRounds: true,
          currentRound: true,
          roundDeadline: true,
          speedMode: true,
          allowCopyPaste: true,
          isPrivate: true,
          shareToken: true,
          winnerId: true,
          verdictReached: true,
          verdictDate: true,
          appealedAt: true,
          appealStatus: true,
          appealCount: true,
          appealedBy: true,
          originalWinnerId: true,
          appealReason: true,
          appealedStatements: true,
          appealRejectionReason: true,
          spectatorCount: true,
          challengeType: true,
          createdAt: true,
          // viewCount fetched separately below (Prisma client may not have it)
          challenger: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              eloRating: true,
            }
          },
          opponent: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              eloRating: true,
            }
          },
          statements: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                }
              }
            },
            orderBy: {
              round: 'asc',
            }
          },
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
              caption: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            }
          },
          verdicts: {
            include: {
              judge: {
                select: {
                  id: true,
                  name: true,
                  emoji: true,
                  personality: true,
                }
              }
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: 3, // EXACTLY 3 judges (SAME as regular debates)
          },
          tournamentMatch: {
            select: {
              id: true,
              status: true,
              tournament: {
                select: {
                  id: true,
                  name: true,
                  currentRound: true,
                  totalRounds: true,
                  format: true, // Include tournament format for King of the Hill detection
                  participants: {
                    select: {
                      id: true,
                      userId: true,
                      cumulativeScore: true,
                      eliminationRound: true,
                      eliminationReason: true,
                      status: true,
                      user: {
                        select: {
                          id: true,
                          username: true,
                          avatarUrl: true,
                          eloRating: true,
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
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  eloRating: true,
                },
              },
            },
            orderBy: {
              joinedAt: 'asc',
            },
          },
        },
      })
    } catch (queryError: any) {
      // If participants relation fails, try without it
      console.error('Error fetching debate with participants, retrying without:', queryError)
      debate = await prisma.debate.findUnique({
        where: { id },
        select: {
          id: true,
          topic: true,
          description: true,
          category: true,
          status: true,
          challengerId: true,
          opponentId: true,
          challengerPosition: true,
          opponentPosition: true,
          totalRounds: true,
          currentRound: true,
          roundDeadline: true,
          speedMode: true,
          allowCopyPaste: true,
          isPrivate: true,
          shareToken: true,
          winnerId: true,
          verdictReached: true,
          verdictDate: true,
          appealedAt: true,
          appealStatus: true,
          appealCount: true,
          appealedBy: true,
          originalWinnerId: true,
          appealReason: true,
          appealedStatements: true,
          appealRejectionReason: true,
          spectatorCount: true,
          challengeType: true,
          createdAt: true,
          challenger: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              eloRating: true,
            }
          },
          opponent: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              eloRating: true,
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  eloRating: true,
                },
              },
            },
            orderBy: {
              joinedAt: 'asc',
            },
          },
          statements: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                }
              }
            },
            orderBy: {
              round: 'asc',
            }
          },
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
              caption: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            }
          },
          verdicts: {
            include: {
              judge: {
                select: {
                  id: true,
                  name: true,
                  emoji: true,
                  personality: true,
                }
              }
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: 3, // EXACTLY 3 judges (SAME as regular debates)
          },
          tournamentMatch: {
            select: {
              id: true,
              status: true,
              tournament: {
                select: {
                  id: true,
                  name: true,
                  currentRound: true,
                  totalRounds: true,
                  format: true, // Include tournament format for King of the Hill detection
                  participants: {
                    select: {
                      id: true,
                      userId: true,
                      cumulativeScore: true,
                      eliminationRound: true,
                      eliminationReason: true,
                      status: true,
                      user: {
                        select: {
                          id: true,
                          username: true,
                          avatarUrl: true,
                          eloRating: true,
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
          },
        },
      })
      // Set participants to empty array if query failed
      if (debate) {
        (debate as any).participants = []
      }
    }

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Auto-process King of the Hill debates that are COMPLETED but not yet evaluated
    // This handles debates that were completed before the fix was deployed
    if (
      debate.status === 'COMPLETED' &&
      debate.tournamentMatch &&
      debate.tournamentMatch.tournament.format === 'KING_OF_THE_HILL' &&
      debate.tournamentMatch.status !== 'COMPLETED'
    ) {
      // Trigger evaluation in the background (non-blocking)
      import('@/lib/tournaments/match-completion')
        .then(async (matchModule) => {
          try {
            console.log(`[Auto-Process] Triggering King of the Hill evaluation for debate ${id}`)
            await matchModule.updateTournamentMatchOnDebateComplete(id)
            console.log(`[Auto-Process] ✅ Successfully processed debate ${id}`)
          } catch (error: any) {
            console.error(`[Auto-Process] ❌ Error processing debate ${id}:`, error.message)
          }
        })
        .catch((importError: any) => {
          console.error(`[Auto-Process] Failed to import match completion module:`, importError.message)
        })
    }

    // Check access for private debates
    if (debate.isPrivate) {
      const participants = (debate as any).participants || []
      const isParticipant = currentUserId && (
        debate.challengerId === currentUserId || 
        debate.opponentId === currentUserId ||
        participants.some((p: any) => p.userId === currentUserId)
      )
      const hasValidToken = shareToken && debate.shareToken === shareToken
      
      if (!isParticipant && !hasValidToken) {
        return NextResponse.json(
          { error: 'This debate is private. A share token is required to access it.' },
          { status: 403 }
        )
      }
    }

    // Fetch viewCount separately (Prisma client may not have this field yet)
    let viewCount = 0
    try {
      const result = await prisma.$queryRaw<Array<{ view_count: number }>>`
        SELECT view_count FROM debates WHERE id = ${id}
      `
      viewCount = result[0]?.view_count || 0
    } catch (error) {
      // If query fails, default to 0
      viewCount = 0
    }

    // Fetch the user who appealed if there's an appeal
    let appealedByUser = null
    if (debate.appealedBy) {
      try {
        const appealedByUserData = await prisma.user.findUnique({
          where: { id: debate.appealedBy },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        })
        appealedByUser = appealedByUserData
      } catch (error) {
        console.error('Failed to fetch appealedBy user:', error)
      }
    }

    // Fetch rematch fields using raw SQL if Prisma doesn't have them yet
    let rematchData = {
      rematchRequestedBy: null as string | null,
      rematchRequestedAt: null as Date | string | null,
      rematchStatus: null as string | null,
      originalDebateId: null as string | null,
      rematchDebateId: null as string | null,
    }

    try {
      const rematchResult = await prisma.$queryRawUnsafe<Array<{
        rematch_requested_by: string | null
        rematch_requested_at: Date | null
        rematch_status: string | null
        original_debate_id: string | null
        rematch_debate_id: string | null
      }>>(`
        SELECT 
          rematch_requested_by,
          rematch_requested_at,
          rematch_status,
          original_debate_id,
          rematch_debate_id
        FROM debates
        WHERE id = $1
      `, id)

      if (rematchResult.length > 0) {
        rematchData = {
          rematchRequestedBy: rematchResult[0].rematch_requested_by,
          rematchRequestedAt: rematchResult[0].rematch_requested_at,
          rematchStatus: rematchResult[0].rematch_status,
          originalDebateId: rematchResult[0].original_debate_id,
          rematchDebateId: rematchResult[0].rematch_debate_id,
        }
      }
    } catch (error) {
      console.error('Failed to fetch rematch data:', error)
      // Continue without rematch data if query fails
    }

    return NextResponse.json({
      ...debate,
      viewCount,
      images: debate.images || [],
      participants: (debate as any).participants || [],
      appealedByUser,
      ...rematchData,
    })
  } catch (error: any) {
    console.error('Failed to fetch debate:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch debate',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}


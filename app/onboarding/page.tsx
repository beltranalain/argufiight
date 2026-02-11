import { redirect } from 'next/navigation'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export const metadata = {
  title: 'Welcome to Argufight | Pick Your First Debate',
  description: 'Choose a category and jump into your first debate with an AI opponent.',
}

export default async function OnboardingPage() {
  const session = await verifySessionWithDb().catch(() => null)

  if (!session?.userId) {
    redirect('/login')
  }

  // Check if already onboarded
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { hasCompletedOnboarding: true },
  })

  if (user?.hasCompletedOnboarding) {
    redirect('/')
  }

  // Check for existing active onboarding debate
  const existingDebate = await prisma.debate.findFirst({
    where: {
      challengerId: session.userId,
      isOnboardingDebate: true,
      status: { in: ['ACTIVE', 'WAITING'] },
    },
    select: { id: true },
  })

  if (existingDebate) {
    redirect(`/debate/${existingDebate.id}`)
  }

  return <OnboardingFlow />
}

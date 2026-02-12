import { requireFeature } from '@/lib/features'

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireFeature('CREATOR_MARKETPLACE')
  return <>{children}</>
}

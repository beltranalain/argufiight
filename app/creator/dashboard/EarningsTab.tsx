'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Badge } from '@/components/ui/Badge'

interface EarningsData {
  totalEarned: number
  pendingPayout: number
  thisMonth: number
  thisYear: number
  contracts: Array<{
    id: string
    status: string
    creatorPayout: number
    totalAmount: number
    payoutDate: string | null
    completedAt: string | null
    advertiser: {
      companyName: string
    }
    campaign: {
      name: string
    }
  }>
  monthlyBreakdown: Array<{
    month: string
    earnings: number
  }>
}

export function EarningsTab() {
  const { data: earnings, isLoading, error, refetch } = useQuery<EarningsData>({
    queryKey: ['creator', 'earnings', 'detailed'],
    queryFn: () => fetchClient<EarningsData>('/api/creator/earnings/detailed'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <ErrorDisplay
            title="Failed to load earnings"
            message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
            onRetry={() => refetch()}
          />
        </CardBody>
      </Card>
    )
  }

  if (!earnings) {
    return (
      <Card>
        <CardBody>
          <ErrorDisplay
            title="No earnings data"
            message="No earnings data available."
            onRetry={() => refetch()}
          />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-cyber-green">
              ${(earnings.totalEarned ?? 0).toLocaleString()}
            </div>
            <div className="text-text-secondary">Total Earned</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-electric-blue">
              ${(earnings.pendingPayout ?? 0).toLocaleString()}
            </div>
            <div className="text-text-secondary">Pending Payout</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-neon-orange">
              ${(earnings.thisMonth ?? 0).toLocaleString()}
            </div>
            <div className="text-text-secondary">This Month</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-text-primary">
              ${(earnings.thisYear ?? 0).toLocaleString()}
            </div>
            <div className="text-text-secondary">This Year</div>
          </CardBody>
        </Card>
      </div>

      {/* Monthly Breakdown Chart */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-text-primary">Monthly Earnings</h2>
        </CardHeader>
        <CardBody>
          <div className="h-64 flex items-center justify-center bg-bg-secondary rounded-lg">
            <p className="text-text-secondary">
              Chart visualization coming soon (monthly earnings over time)
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Contract History */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-text-primary">Payout History</h2>
        </CardHeader>
        <CardBody>
          {earnings.contracts.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              No payouts yet. Complete contracts to start earning!
            </p>
          ) : (
            <div className="space-y-4">
              {earnings.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-text-primary">
                        {contract.campaign.name}
                      </h3>
                      <Badge
                        className={
                          contract.status === 'COMPLETED'
                            ? 'bg-cyber-green/20 text-cyber-green'
                            : contract.status === 'ACTIVE' || contract.status === 'SCHEDULED'
                            ? 'bg-electric-blue/20 text-electric-blue'
                            : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>Advertiser: {contract.advertiser.companyName}</p>
                      <p>
                        Payout: ${Number(contract.creatorPayout ?? 0).toLocaleString()} / $
                        {Number(contract.totalAmount ?? 0).toLocaleString()} total
                      </p>
                      {contract.payoutDate && (
                        <p>Paid: {new Date(contract.payoutDate).toLocaleDateString()}</p>
                      )}
                      {contract.completedAt && !contract.payoutDate && (
                        <p className="text-neon-orange">
                          Completed: {new Date(contract.completedAt).toLocaleDateString()} (Payout pending)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

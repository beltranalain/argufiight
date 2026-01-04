'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { TopNav } from '@/components/layout/TopNav'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  status: string
  amount: number
  balanceAfter: number
  description: string | null
  metadata: any
  createdAt: string
  beltChallenge: { id: string; belt: { name: string } } | null
  belt: { id: string; name: string } | null
  tournament: { id: string; name: string } | null
}

export default function MyCoinsPage() {
  const { showToast } = useToast()
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [profileRes, transactionsRes] = await Promise.all([
        fetch('/api/profile', { credentials: 'include' }),
        fetch('/api/coins/transactions', { credentials: 'include' }),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setCoinBalance(profileData.coins || 0)
      }

      if (transactionsRes.ok) {
        const txData = await transactionsRes.json()
        setTransactions(txData.transactions || [])
      } else if (transactionsRes.status === 404) {
        // Endpoint doesn't exist yet, that's okay
        setTransactions([])
      }
    } catch (error) {
      console.error('Failed to fetch coin data:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load coin information',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'COIN_PURCHASE':
        return 'bg-green-500 text-white'
      case 'BELT_CHALLENGE_ENTRY':
        return 'bg-blue-500 text-white'
      case 'BELT_CHALLENGE_REWARD':
        return 'bg-yellow-500 text-white'
      case 'BELT_CHALLENGE_CONSOLATION':
        return 'bg-purple-500 text-white'
      case 'ADMIN_GRANT':
        return 'bg-indigo-500 text-white'
      case 'ADMIN_DEDUCT':
        return 'bg-red-500 text-white'
      case 'REFUND':
        return 'bg-orange-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="My Coins" />
        <div className="pt-20 md:pt-24 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="My Coins" />
      
      <div className="pt-20 md:pt-24 px-4 md:px-8 pb-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              My Coins
            </h1>
            <p className="text-text-secondary">
              View your coin balance and transaction history
            </p>
          </div>
          <Link href="/coins/purchase">
            <Button className="bg-electric-blue hover:bg-[#00B8E6] text-black">
              Buy Coins
            </Button>
          </Link>
        </div>

        {/* Balance Card */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Current Balance</h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-electric-blue/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-4xl font-bold text-electric-blue mb-1">
                    {coinBalance !== null ? coinBalance.toLocaleString() : '0'}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {coinBalance !== null ? `$${(coinBalance / 100).toFixed(2)} USD value` : 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
            <p className="text-sm text-text-secondary">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardBody>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-text-secondary mb-4">No transactions yet</div>
                <Link href="/coins/purchase">
                  <Button variant="outline">Buy Your First Coins</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border border-bg-tertiary rounded-lg p-4 bg-bg-secondary"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getTransactionTypeColor(tx.type)}>
                            {tx.type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={tx.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                            {tx.status}
                          </Badge>
                          <span className={cn(
                            'font-semibold',
                            tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} coins
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-text-secondary text-sm mb-2">{tx.description}</p>
                        )}
                        {tx.beltChallenge && (
                          <p className="text-text-secondary text-sm">
                            Belt Challenge: {tx.beltChallenge.belt.name}
                          </p>
                        )}
                        {tx.belt && (
                          <p className="text-text-secondary text-sm">
                            Belt: {tx.belt.name}
                          </p>
                        )}
                        {tx.tournament && (
                          <p className="text-text-secondary text-sm">
                            Tournament: {tx.tournament.name}
                          </p>
                        )}
                        {tx.metadata?.packageName && (
                          <p className="text-text-secondary text-sm">
                            Package: {tx.metadata.packageName} ({tx.metadata.totalCoins} coins)
                          </p>
                        )}
                        <p className="text-text-secondary text-xs mt-2">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm text-text-secondary">Balance After</div>
                        <div className="text-lg font-bold text-white">{tx.balanceAfter.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Info Section */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-white">How to Use Coins</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-text-secondary">
            <p>
              Coins are used to participate in belt challenges and create tournament belts.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Belt Challenge Entry: 50-500 coins (varies by belt value)</li>
              <li>Tournament Belt Creation: 1,000-5,000 coins</li>
              <li>Win belt challenges to earn coins back</li>
              <li>Coins never expire</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

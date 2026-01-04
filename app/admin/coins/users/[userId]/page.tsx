'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface User {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  coins: number
}

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

export default function UserCoinDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const userId = params.userId as string
  
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [grantAmount, setGrantAmount] = useState('')
  const [deductAmount, setDeductAmount] = useState('')
  const [grantReason, setGrantReason] = useState('')
  const [deductReason, setDeductReason] = useState('')

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const [userRes, transactionsRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch(`/api/admin/coins/users/${userId}/transactions`),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }

      if (transactionsRes.ok) {
        const txData = await transactionsRes.json()
        setTransactions(txData.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load user data',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantCoins = async () => {
    if (!grantAmount || !grantReason) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter amount and reason',
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/coins/users/${userId}/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(grantAmount),
          reason: grantReason,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: `Granted ${grantAmount} coins to user`,
        })
        setGrantAmount('')
        setGrantReason('')
        fetchUserData()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to grant coins')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to grant coins',
      })
    }
  }

  const handleDeductCoins = async () => {
    if (!deductAmount || !deductReason) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter amount and reason',
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/coins/users/${userId}/deduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(deductAmount),
          reason: deductReason,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: `Deducted ${deductAmount} coins from user`,
        })
        setDeductAmount('')
        setDeductReason('')
        fetchUserData()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to deduct coins')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to deduct coins',
      })
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
      case 'ADMIN_GRANT':
        return 'bg-purple-500 text-white'
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
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8 text-text-secondary">User not found</div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="secondary" onClick={() => router.back()}>
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">
            {user.username} - Coin History
          </h1>
          <p className="text-text-secondary">{user.email}</p>
        </div>
      </div>

      {/* User Info & Manual Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Current Balance</h2>
          </CardHeader>
          <CardBody>
            <div className="text-4xl font-bold text-electric-blue mb-4">
              {user.coins.toLocaleString()} coins
            </div>
            <div className="text-sm text-text-secondary">
              Equivalent to ${(user.coins / 100).toFixed(2)} USD
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Manual Actions</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Grant Coins
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1"
                />
                <Input
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Reason"
                  className="flex-1"
                />
                <Button
                  onClick={handleGrantCoins}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Grant
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Deduct Coins
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1"
                />
                <Input
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="Reason"
                  className="flex-1"
                />
                <Button
                  onClick={handleDeductCoins}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Deduct
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Transaction History</h2>
          <p className="text-sm text-text-secondary">{transactions.length} transactions</p>
        </CardHeader>
        <CardBody>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">No transactions found</div>
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
                    <div className="text-right">
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
    </div>
  )
}

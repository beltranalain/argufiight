'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CoinPackage {
  id: string
  name: string
  priceUSD: number
  baseCoins: number
  bonusCoins: number
  totalCoins: number
  bonusPercent: number
  isPopular: boolean
}

interface CoinTransaction {
  id: string
  userId: string
  user: {
    id: string
    username: string
    email: string
    avatarUrl: string | null
  }
  type: string
  status: string
  amount: number
  balanceAfter: number
  description: string | null
  metadata: any
  createdAt: string
}

interface CoinStats {
  totalRevenue: number
  totalCoinsSold: number
  totalPurchases: number
  averagePurchaseAmount: number
  mostPopularPackage: string
  todayRevenue: number
  todayPurchases: number
}

interface CoinUser {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  coins: number
  totalPurchased: number
  purchaseCount: number
  lastPurchase: string | null
}

export default function CoinsAdminPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'packages' | 'transactions' | 'users' | 'stats'>('packages')
  const [editingPackage, setEditingPackage] = useState<string | null>(null)
  const [packageEditData, setPackageEditData] = useState<Partial<CoinPackage>>({})
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  })

  // Fetch packages
  const {
    data: packages = [],
    isLoading: isLoadingPackages,
    isError: isPackagesError,
    refetch: refetchPackages,
  } = useQuery<CoinPackage[]>({
    queryKey: ['admin-coin-packages'],
    queryFn: async () => {
      const data = await fetchClient<{ packages: CoinPackage[] }>('/api/admin/coins/packages')
      return data.packages || []
    },
    enabled: activeTab === 'packages',
    staleTime: 60_000,
  })

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useQuery<CoinTransaction[]>({
    queryKey: ['admin-coin-transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      const data = await fetchClient<{ transactions: CoinTransaction[] }>(
        `/api/admin/coins/transactions?${params.toString()}`
      )
      return data.transactions || []
    },
    enabled: activeTab === 'transactions',
    staleTime: 60_000,
  })

  // Fetch users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useQuery<CoinUser[]>({
    queryKey: ['admin-coin-users'],
    queryFn: async () => {
      const data = await fetchClient<{ users: CoinUser[] }>('/api/admin/coins/users')
      return data.users || []
    },
    enabled: activeTab === 'users',
    staleTime: 60_000,
  })

  // Fetch stats
  const {
    data: stats = null,
    isLoading: isLoadingStats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useQuery<CoinStats | null>({
    queryKey: ['admin-coin-stats'],
    queryFn: async () => {
      const data = await fetchClient<CoinStats>('/api/admin/coins/stats')
      return data
    },
    enabled: activeTab === 'stats',
    staleTime: 60_000,
  })

  // Save package mutation
  const savePackageMutation = useMutation({
    mutationFn: ({ packageId, body }: { packageId: string; body: Partial<CoinPackage> }) =>
      fetchClient(`/api/admin/coins/packages/${packageId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Success',
        description: 'Package updated successfully',
      })
      setEditingPackage(null)
      setPackageEditData({})
      queryClient.invalidateQueries({ queryKey: ['admin-coin-packages'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update package',
      })
    },
  })

  const isLoading =
    (activeTab === 'packages' && isLoadingPackages) ||
    (activeTab === 'transactions' && isLoadingTransactions) ||
    (activeTab === 'users' && isLoadingUsers) ||
    (activeTab === 'stats' && isLoadingStats)

  const isError =
    (activeTab === 'packages' && isPackagesError) ||
    (activeTab === 'transactions' && isTransactionsError) ||
    (activeTab === 'users' && isUsersError) ||
    (activeTab === 'stats' && isStatsError)

  const handleRetry = () => {
    if (activeTab === 'packages') refetchPackages()
    else if (activeTab === 'transactions') refetchTransactions()
    else if (activeTab === 'users') refetchUsers()
    else if (activeTab === 'stats') refetchStats()
  }

  const startEditing = (pkg: CoinPackage) => {
    setEditingPackage(pkg.id)
    setPackageEditData({
      priceUSD: pkg.priceUSD,
      baseCoins: pkg.baseCoins,
      bonusCoins: pkg.bonusCoins,
    })
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
      case 'DAILY_LOGIN_REWARD':
        return 'bg-cyan-500 text-white'
      case 'STREAK_BONUS':
        return 'bg-pink-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (isError) {
    return (
      <ErrorDisplay
        title="Failed to load data"
        message="Something went wrong while loading coin data. Please try again."
        onRetry={handleRetry}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Coin Management</h1>
          <p className="text-text-secondary">Manage coin packages, transactions, and user balances</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary">
        {(['packages', 'transactions', 'users', 'stats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 font-medium transition-colors',
              activeTab === tab
                ? 'text-electric-blue border-b-2 border-electric-blue'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Coin Packages</h2>
            <p className="text-sm text-text-secondary">Manage pricing and coin amounts for each package</p>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border border-bg-tertiary rounded-lg p-4 bg-bg-secondary"
                  >
                    {editingPackage === pkg.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              Price (USD)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={packageEditData.priceUSD || pkg.priceUSD}
                              onChange={(e) =>
                                setPackageEditData({
                                  ...packageEditData,
                                  priceUSD: parseFloat(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              Base Coins
                            </label>
                            <Input
                              type="number"
                              value={packageEditData.baseCoins || pkg.baseCoins}
                              onChange={(e) =>
                                setPackageEditData({
                                  ...packageEditData,
                                  baseCoins: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                              Bonus Coins
                            </label>
                            <Input
                              type="number"
                              value={packageEditData.bonusCoins || pkg.bonusCoins}
                              onChange={(e) =>
                                setPackageEditData({
                                  ...packageEditData,
                                  bonusCoins: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => savePackageMutation.mutate({ packageId: pkg.id, body: packageEditData })}
                            className="bg-electric-blue hover:bg-[#00B8E6] text-black"
                            isLoading={savePackageMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingPackage(null)
                              setPackageEditData({})
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                            {pkg.isPopular && (
                              <Badge className="bg-electric-blue text-black">Popular</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-text-secondary">Price: </span>
                              <span className="text-white font-semibold">${pkg.priceUSD.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Base: </span>
                              <span className="text-white font-semibold">{pkg.baseCoins.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Bonus: </span>
                              <span className="text-electric-blue font-semibold">{pkg.bonusCoins.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Total: </span>
                              <span className="text-white font-semibold">{pkg.totalCoins.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                            variant="secondary"
                          onClick={() => startEditing(pkg)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Filters</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                  >
                    <option value="">All Types</option>
                    <option value="COIN_PURCHASE">Coin Purchase</option>
                    <option value="BELT_CHALLENGE_ENTRY">Belt Challenge Entry</option>
                    <option value="BELT_CHALLENGE_REWARD">Belt Challenge Reward</option>
                    <option value="ADMIN_GRANT">Admin Grant</option>
                    <option value="ADMIN_DEDUCT">Admin Deduct</option>
                    <option value="REFUND">Refund</option>
                    <option value="DAILY_LOGIN_REWARD">Daily Login Reward</option>
                    <option value="STREAK_BONUS">Streak Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">User ID</label>
                  <Input
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                    placeholder="Filter by user ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Coin Transactions</h2>
              <p className="text-sm text-text-secondary">{transactions.length} transactions found</p>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-bg-tertiary">
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">User</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">Balance After</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-bg-tertiary hover:bg-bg-secondary">
                          <td className="py-3 px-4 text-white">
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/admin/coins/users/${tx.userId}`}
                              className="text-electric-blue hover:text-[#00B8E6]"
                            >
                              {tx.user.username}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getTransactionTypeColor(tx.type)}>
                              {tx.type.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className={cn(
                            'py-3 px-4 font-semibold',
                            tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-white">{tx.balanceAfter.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <Badge className={tx.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/admin/coins/transactions/${tx.id}`}
                              className="text-electric-blue hover:text-[#00B8E6] text-sm"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Users Who Purchased Coins</h2>
            <p className="text-sm text-text-secondary">{users.length} users found</p>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-bg-tertiary">
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">User</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Current Balance</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Total Purchased</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Purchase Count</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Last Purchase</th>
                      <th className="text-left py-3 px-4 text-text-secondary font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-bg-tertiary hover:bg-bg-secondary">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl && (
                              <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div>
                              <div className="text-white font-medium">{user.username}</div>
                              <div className="text-sm text-text-secondary">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-electric-blue font-semibold">
                            {user.coins.toLocaleString()} coins
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          {user.totalPurchased.toLocaleString()} coins
                        </td>
                        <td className="py-3 px-4 text-white">{user.purchaseCount}</td>
                        <td className="py-3 px-4 text-text-secondary text-sm">
                          {user.lastPurchase
                            ? new Date(user.lastPurchase).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/coins/users/${user.id}`}
                            className="text-electric-blue hover:text-[#00B8E6] text-sm"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-white">Total Revenue</h3>
              </CardHeader>
              <CardBody>
                <div className="text-3xl font-bold text-electric-blue">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
                <div className="text-sm text-text-secondary mt-2">
                  Today: ${stats.todayRevenue.toFixed(2)}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-white">Total Coins Sold</h3>
              </CardHeader>
              <CardBody>
                <div className="text-3xl font-bold text-electric-blue">
                  {stats.totalCoinsSold.toLocaleString()}
                </div>
                <div className="text-sm text-text-secondary mt-2">
                  {stats.totalPurchases} purchases
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-white">Average Purchase</h3>
              </CardHeader>
              <CardBody>
                <div className="text-3xl font-bold text-electric-blue">
                  ${stats.averagePurchaseAmount.toFixed(2)}
                </div>
                <div className="text-sm text-text-secondary mt-2">
                  Most popular: {stats.mostPopularPackage}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">No stats available</div>
        )
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatCard } from '@/components/admin/StatCard'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { DebateDetailsModal } from '@/components/admin/DebateDetailsModal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'
import { cardHover, cardTap } from '@/lib/animations'
import { useToast } from '@/components/ui/Toast'

interface Debate {
  id: string
  topic: string
  category: string
  status: string
  winnerId: string | null
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  createdAt: string
}

interface Stats {
  totalUsers: number
  totalEmployees: number
  totalDebates: number
  activeDebates: number
  completedToday: number
}

export default function AdminDashboard() {
  const { showToast } = useToast()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentDebates, setRecentDebates] = useState<Debate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tournamentsEnabled, setTournamentsEnabled] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    fetchData()
    fetchTournamentStatus()
  }, [])

  const fetchTournamentStatus = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setTournamentsEnabled(data.TOURNAMENTS_ENABLED === 'true')
      }
    } catch (error) {
      console.error('Failed to fetch tournament status:', error)
    }
  }

  const toggleTournaments = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TOURNAMENTS_ENABLED: (!tournamentsEnabled).toString(),
        }),
      })

      if (response.ok) {
        setTournamentsEnabled(!tournamentsEnabled)
        showToast({
          type: 'success',
          title: 'Tournaments Updated',
          description: `Tournaments feature ${!tournamentsEnabled ? 'enabled' : 'disabled'}`,
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update tournaments feature',
      })
    }
  }

  const handleSeedDatabase = async () => {
    if (!confirm('This will seed the database with initial data (Categories, Judges, Homepage Sections, Legal Pages). Continue?')) {
      return
    }

    setIsSeeding(true)
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Database Seeded',
          description: `Seeded ${data.results.categories} categories, ${data.results.judges} judges, ${data.results.homepageSections} sections, and ${data.results.legalPages} legal pages.`,
        })
        // Refresh data
        fetchData()
      } else {
        showToast({
          type: 'error',
          title: 'Seed Failed',
          description: data.error || 'Failed to seed database',
        })
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to seed database',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [statsRes, debatesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/debates?limit=10'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (debatesRes.ok) {
        const debatesData = await debatesRes.json()
        // Handle both array and object response formats
        const debates = Array.isArray(debatesData) 
          ? debatesData 
          : (debatesData?.debates || debatesData?.data || [])
        setRecentDebates(Array.isArray(debates) ? debates : [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDebateClick = (debateId: string) => {
    setSelectedDebateId(debateId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDebateId(null)
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('ready') || statusLower.includes('completed')) {
      return 'bg-cyber-green text-black'
    }
    if (statusLower.includes('active')) {
      return 'bg-electric-blue text-black'
    }
    if (statusLower.includes('waiting')) {
      return 'bg-neon-orange text-black'
    }
    if (statusLower.includes('appealed')) {
      return 'bg-purple-500 text-white'
    }
    return 'bg-text-muted text-white'
  }

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-text-secondary">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-bg-tertiary rounded-lg border border-bg-tertiary">
            <span className="text-white font-medium text-sm">Tournaments:</span>
            <button
              onClick={toggleTournaments}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                tournamentsEnabled ? 'bg-electric-blue' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tournamentsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${tournamentsEnabled ? 'text-electric-blue' : 'text-text-secondary'}`}>
              {tournamentsEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StaggerItem>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            color="blue"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Total Debates"
            value={stats.totalDebates.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            color="pink"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Active Debates"
            value={stats.activeDebates.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="green"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            title="Completed Today"
            value={stats.completedToday.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="orange"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Debates</h2>
            <Link href="/admin/debates" className="text-electric-blue hover:text-neon-orange text-sm font-medium">
              View All →
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {recentDebates.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No debates yet</p>
            </div>
          ) : (
            <StaggerContainer className="space-y-4">
              {recentDebates.map((debate) => (
                <StaggerItem key={debate.id}>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDebateClick(debate.id)
                    }}
                    whileHover={cardHover}
                    whileTap={cardTap}
                    className="w-full text-left p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue hover:bg-bg-secondary transition-all cursor-pointer"
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={debate.category.toLowerCase() as any} size="sm">
                          {debate.category}
                        </Badge>
                        <Badge variant="default" size="sm" className={getStatusColor(debate.status)}>
                          {formatStatus(debate.status)}
                        </Badge>
                        {debate.winnerId && (
                          <Badge variant="default" size="sm" className="bg-cyber-green text-black">
                            Winner: {debate.winnerId === debate.challenger.id ? debate.challenger.username : debate.opponent?.username || 'Unknown'}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-2">{debate.topic}</h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <Avatar 
                            username={debate.challenger.username}
                            src={debate.challenger.avatarUrl}
                            size="sm"
                            className={debate.winnerId === debate.challenger.id ? 'border-2 border-cyber-green' : ''}
                          />
                          <span className={debate.winnerId === debate.challenger.id ? 'text-cyber-green font-semibold' : ''}>
                            {debate.challenger.username}
                            {debate.winnerId === debate.challenger.id && ' ✓'}
                          </span>
                        </div>
                        <span>VS</span>
                        {debate.opponent ? (
                          <div className="flex items-center gap-2">
                            <Avatar 
                              username={debate.opponent.username}
                              src={debate.opponent.avatarUrl}
                              size="sm"
                              className={debate.winnerId === debate.opponent.id ? 'border-2 border-cyber-green' : ''}
                            />
                            <span className={debate.winnerId === debate.opponent.id ? 'text-cyber-green font-semibold' : ''}>
                              {debate.opponent.username}
                              {debate.winnerId === debate.opponent.id && ' ✓'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted">Waiting...</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {new Date(debate.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.button>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </CardBody>
      </Card>

      <DebateDetailsModal
        debateId={selectedDebateId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      </div>
    </>
  )
}


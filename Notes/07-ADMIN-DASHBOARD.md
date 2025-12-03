# PART 8: ADMIN DASHBOARD

Complete admin panel with user management, moderation, and API key settings.

---

## OVERVIEW

This part covers:
- Admin layout and navigation
- Dashboard overview with stats
- User management
- Moderation queue
- Settings page (API keys)
- Seed debates tool

---

## ADMIN ROUTES

### File: app/admin/layout.tsx

```typescript
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if user is admin
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
  })

  if (!profile?.isAdmin) {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-black">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
```

---

### File: app/admin/page.tsx

```typescript
import { prisma } from '@/lib/db/prisma'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatCard } from '@/components/admin/StatCard'

export default async function AdminDashboard() {
  // Fetch stats
  const [
    totalUsers,
    totalDebates,
    activeDebates,
    completedToday,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.debate.count(),
    prisma.debate.count({ where: { status: 'ACTIVE' } }),
    prisma.debate.count({
      where: {
        status: 'VERDICT_READY',
        verdictDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
      <p className="text-text-secondary mb-8">Platform overview and management</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={totalUsers.toString()}
          icon="👥"
          gradient="from-electric-blue to-neon-orange"
        />
        <StatCard
          title="Total Debates"
          value={totalDebates.toString()}
          icon="⚔️"
          gradient="from-hot-pink to-electric-blue"
        />
        <StatCard
          title="Active Debates"
          value={activeDebates.toString()}
          icon="🔥"
          gradient="from-cyber-green to-electric-blue"
        />
        <StatCard
          title="Completed Today"
          value={completedToday.toString()}
          icon="✅"
          gradient="from-neon-orange to-hot-pink"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Recent Debates</h2>
        </CardHeader>
        <CardBody>
          {/* Recent debates list */}
        </CardBody>
      </Card>
    </div>
  )
}
```

---

### File: app/admin/settings/page.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export default function AdminSettingsPage() {
  const { showToast } = useToast()
  const [deepseekKey, setDeepseekKey] = useState('')
  const [resendKey, setResendKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      
      setDeepseekKey(data.DEEPSEEK_API_KEY || '')
      setResendKey(data.RESEND_API_KEY || '')
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DEEPSEEK_API_KEY: deepseekKey,
          RESEND_API_KEY: resendKey,
        }),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'API keys have been updated',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
      <p className="text-text-secondary mb-8">Configure platform settings and API keys</p>

      <div className="max-w-2xl space-y-6">
        
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">API Keys</h2>
            <p className="text-sm text-text-secondary mt-1">
              Configure external service API keys
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            
            {/* DeepSeek API Key */}
            <div>
              <Input
                label="DeepSeek API Key"
                type="password"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="sk-..."
                helpText="Required for AI judge verdicts"
              />
              <div className="mt-2 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue">
                  <strong>Get your API key:</strong> Visit{' '}
                  <a
                    href="https://platform.deepseek.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-neon-orange"
                  >
                    platform.deepseek.com
                  </a>
                </p>
              </div>
            </div>

            {/* Resend API Key */}
            <div>
              <Input
                label="Resend API Key"
                type="password"
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                placeholder="re_..."
                helpText="Optional for email notifications"
              />
              <div className="mt-2 p-3 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Get your API key:</strong> Visit{' '}
                  <a
                    href="https://resend.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-electric-blue"
                  >
                    resend.com
                  </a>
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isLoading}
              >
                Save Settings
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Platform Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Platform Settings</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Maintenance Mode</p>
                <p className="text-sm text-text-secondary">
                  Disable all debates and show maintenance message
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Allow New Signups</p>
                <p className="text-sm text-text-secondary">
                  Enable or disable new user registrations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
```

---

### File: app/api/admin/settings/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
    })

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all settings
    const settings = await prisma.adminSetting.findMany()

    // Convert to object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings - Update settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
    })

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Update each setting
    for (const [key, value] of Object.entries(body)) {
      await prisma.adminSetting.upsert({
        where: { key },
        update: {
          value: value as string,
          updatedBy: session.user.id,
        },
        create: {
          key,
          value: value as string,
          encrypted: key.includes('KEY') || key.includes('SECRET'),
          updatedBy: session.user.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
```

---

## CURSOR.AI PROMPTS

### PROMPT 1: Admin Navigation

```
Create admin sidebar navigation:

File: components/admin/AdminNav.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/debates', label: 'Debates', icon: '⚔️' },
  { href: '/admin/moderation', label: 'Moderation', icon: '⚖️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r border-bg-tertiary p-6">
      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-blue to-neon-orange flex items-center justify-center text-xl">
          ⚖
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-electric-blue to-neon-orange bg-clip-text text-transparent">
          ADMIN
        </span>
      </Link>

      {/* Navigation */}
      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/30'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-white'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Back to App */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-white transition-all mt-8"
      >
        <span className="text-xl">←</span>
        <span className="font-medium">Back to App</span>
      </Link>
    </div>
  )
}
```

---

### PROMPT 2: Stat Card Component

```
Create stat card component for admin dashboard:

File: components/admin/StatCard.tsx

interface StatCardProps {
  title: string
  value: string
  icon: string
  gradient: string
}

export function StatCard({ title, value, icon, gradient }: StatCardProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 relative overflow-hidden group hover:border-electric-blue transition-all">
      {/* Gradient Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <span className="text-3xl">{icon}</span>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}
```

---

## IMPLEMENTATION ORDER

1. Create admin layout with auth check
2. Create admin navigation component
3. Create dashboard page with stats
4. Create settings page with API key inputs
5. Create settings API routes
6. Test API key storage and retrieval

---

## SECURITY NOTES

**IMPORTANT:** 
- API keys are stored in `admin_settings` table
- Only admins can read/write settings
- Consider encrypting sensitive values in production
- Never expose API keys in client-side code
- Settings API routes verify admin status

PART 8 COMPLETE!

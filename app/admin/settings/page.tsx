'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import FeaturesTab from './FeaturesTab'
import ApiUsageTab from './ApiUsageTab'
import SystemSettingsTab from './SystemSettingsTab'

export default function AdminSettingsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'general' | 'features' | 'system' | 'api-usage' | null
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'system' | 'api-usage'>(
    tabFromUrl || 'general'
  )

  useEffect(() => {
    if (tabFromUrl && ['general', 'features', 'system', 'api-usage'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const [deepseekKey, setDeepseekKey] = useState('')
  const [resendKey, setResendKey] = useState('')
  const [googleAnalyticsKey, setGoogleAnalyticsKey] = useState('')
  const [googleAnalyticsPropertyId, setGoogleAnalyticsPropertyId] = useState('')
  const [stripePublishableKey, setStripePublishableKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [firebaseApiKey, setFirebaseApiKey] = useState('')
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('')
  const [firebaseProjectId, setFirebaseProjectId] = useState('')
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState('')
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState('')
  const [firebaseAppId, setFirebaseAppId] = useState('')
  const [firebaseServiceAccount, setFirebaseServiceAccount] = useState('')
  const [firebaseOAuthClientId, setFirebaseOAuthClientId] = useState('')
  const [firebaseOAuthClientSecret, setFirebaseOAuthClientSecret] = useState('')
  const [firebaseOAuthRefreshToken, setFirebaseOAuthRefreshToken] = useState('')
  const [vapidPublicKey, setVapidPublicKey] = useState('')
  const [vapidPrivateKey, setVapidPrivateKey] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [tournamentsEnabled, setTournamentsEnabled] = useState(false)

  // Advertising settings
  const [platformAdsEnabled, setPlatformAdsEnabled] = useState(false)
  const [creatorMarketplaceEnabled, setCreatorMarketplaceEnabled] = useState(false)
  const [creatorMinELO, setCreatorMinELO] = useState('1500')
  const [creatorMinDebates, setCreatorMinDebates] = useState('10')
  const [creatorMinAgeMonths, setCreatorMinAgeMonths] = useState('3')
  const [creatorFeeBronze, setCreatorFeeBronze] = useState('25')
  const [creatorFeeSilver, setCreatorFeeSilver] = useState('20')
  const [creatorFeeGold, setCreatorFeeGold] = useState('15')
  const [creatorFeePlatinum, setCreatorFeePlatinum] = useState('10')

  // Test results state (these stay as local state since they are transient UI state)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testGoogleResult, setTestGoogleResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testResendResult, setTestResendResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testStripeResult, setTestStripeResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [pushTestResult, setPushTestResult] = useState<{ success: boolean; message?: string; error?: string; isServiceAccountError?: boolean } | null>(null)

  // Notification state (browser-side, not fetched from server)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [hasFCMToken, setHasFCMToken] = useState(false)
  const [testNotificationTitle, setTestNotificationTitle] = useState('Test Notification')
  const [testNotificationBody, setTestNotificationBody] = useState('This is a test push notification!')
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<any>(null)
  const [diagnostics, setDiagnostics] = useState<any>(null)

  // --- Queries ---

  const {
    data: settingsData,
    isLoading: isFetching,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => fetchClient<Record<string, string>>(`/api/admin/settings?t=${Date.now()}`),
    staleTime: 0,
  })

  // Sync form fields when settings data loads
  useEffect(() => {
    if (!settingsData) return
    const data = settingsData
    setDeepseekKey(data.DEEPSEEK_API_KEY || '')
    setResendKey(data.RESEND_API_KEY || '')
    setGoogleAnalyticsKey(data.GOOGLE_ANALYTICS_API_KEY || '')
    setGoogleAnalyticsPropertyId(data.GOOGLE_ANALYTICS_PROPERTY_ID || '')
    setStripePublishableKey(data.STRIPE_PUBLISHABLE_KEY || '')
    setStripeSecretKey(data.STRIPE_SECRET_KEY || '')
    setFirebaseApiKey(data.FIREBASE_API_KEY || '')
    setFirebaseAuthDomain(data.FIREBASE_AUTH_DOMAIN || '')
    setFirebaseProjectId(data.FIREBASE_PROJECT_ID || '')
    setFirebaseStorageBucket(data.FIREBASE_STORAGE_BUCKET || '')
    setFirebaseMessagingSenderId(data.FIREBASE_MESSAGING_SENDER_ID || '')
    setFirebaseAppId(data.FIREBASE_APP_ID || '')
    setFirebaseServiceAccount(data.FIREBASE_SERVICE_ACCOUNT || '')
    setFirebaseOAuthClientId(data.FIREBASE_OAUTH_CLIENT_ID || '')
    setFirebaseOAuthClientSecret(data.FIREBASE_OAUTH_CLIENT_SECRET || '')
    setFirebaseOAuthRefreshToken(data.FIREBASE_OAUTH_REFRESH_TOKEN || '')
    setVapidPublicKey(data.VAPID_PUBLIC_KEY || '')
    setVapidPrivateKey(data.VAPID_PRIVATE_KEY || '')
    setGoogleClientId(data.GOOGLE_CLIENT_ID || '')
    setGoogleClientSecret(data.GOOGLE_CLIENT_SECRET || '')
    setTournamentsEnabled(data.TOURNAMENTS_ENABLED === 'true')
    setPlatformAdsEnabled(data.ADS_PLATFORM_ENABLED === 'true')
    setCreatorMarketplaceEnabled(data.ADS_CREATOR_MARKETPLACE_ENABLED === 'true')
    setCreatorMinELO(data.CREATOR_MIN_ELO || '1500')
    setCreatorMinDebates(data.CREATOR_MIN_DEBATES || '10')
    setCreatorMinAgeMonths(data.CREATOR_MIN_ACCOUNT_AGE_MONTHS || '3')
    setCreatorFeeBronze(data.CREATOR_FEE_BRONZE || '25')
    setCreatorFeeSilver(data.CREATOR_FEE_SILVER || '20')
    setCreatorFeeGold(data.CREATOR_FEE_GOLD || '15')
    setCreatorFeePlatinum(data.CREATOR_FEE_PLATINUM || '10')
  }, [settingsData])

  // Refresh settings when features tab is opened
  useEffect(() => {
    if (activeTab === 'features') {
      refetchSettings()
    }
  }, [activeTab, refetchSettings])

  // Check notification status on mount
  useEffect(() => {
    checkNotificationStatus()
  }, [])

  // --- Mutations ---

  const saveSettingsMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetchClient<any>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'API keys have been updated',
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Please try again',
      })
    },
  })

  const testDeepSeekMutation = useMutation({
    mutationFn: () => fetchClient<any>('/api/admin/settings/test-deepseek', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        setTestResult({
          success: true,
          message: `Connection successful! Response: "${data.response}" (${data.tokensUsed} tokens used)`,
        })
        showToast({ type: 'success', title: 'API Test Successful', description: 'DeepSeek API is working correctly' })
      } else {
        setTestResult({ success: false, error: data.error || 'Connection failed' })
        showToast({ type: 'error', title: 'API Test Failed', description: data.error || 'Please check your API key' })
      }
    },
    onError: (error: Error) => {
      setTestResult({ success: false, error: error.message || 'Failed to test connection' })
      showToast({ type: 'error', title: 'Test Failed', description: 'Could not connect to DeepSeek API' })
    },
  })

  const testResendMutation = useMutation({
    mutationFn: () => fetchClient<any>('/api/admin/settings/test-resend', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        setTestResendResult({
          success: true,
          message: 'Connection successful! API key is valid. (Note: This checks your API key, not emails sent. Emails are tracked separately.)',
        })
        showToast({ type: 'success', title: 'API Test Successful', description: 'Resend API is working correctly' })
      } else {
        setTestResendResult({ success: false, error: data.error || 'Connection failed' })
        showToast({ type: 'error', title: 'API Test Failed', description: data.error || 'Please check your API key' })
      }
    },
    onError: (error: Error) => {
      setTestResendResult({ success: false, error: error.message || 'Failed to test connection' })
      showToast({ type: 'error', title: 'Test Failed', description: 'Could not connect to Resend API' })
    },
  })

  const testGoogleAnalyticsMutation = useMutation({
    mutationFn: async () => {
      // First save the current values
      await fetchClient<any>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          GOOGLE_ANALYTICS_API_KEY: googleAnalyticsKey,
          GOOGLE_ANALYTICS_PROPERTY_ID: googleAnalyticsPropertyId,
        }),
      })
      return fetchClient<any>('/api/admin/settings/test-google-analytics', { method: 'POST' })
    },
    onSuccess: (data) => {
      if (data.success) {
        setTestGoogleResult({ success: true, message: data.message || 'Connection successful!' })
        showToast({ type: 'success', title: 'Google Analytics Connected', description: `Successfully connected to Property ${data.propertyId}` })
      } else {
        setTestGoogleResult({ success: false, error: data.error || 'Connection failed' })
        showToast({ type: 'error', title: 'Connection Failed', description: data.error || 'Please check your credentials' })
      }
    },
    onError: (error: Error) => {
      setTestGoogleResult({ success: false, error: error.message || 'Failed to test connection' })
      showToast({ type: 'error', title: 'Test Failed', description: 'Could not connect to Google Analytics' })
    },
  })

  const testStripeMutation = useMutation({
    mutationFn: async () => {
      // First save the current values
      await fetchClient<any>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
          STRIPE_SECRET_KEY: stripeSecretKey,
        }),
      })
      return fetchClient<any>('/api/admin/settings/test-stripe', { method: 'POST' })
    },
    onSuccess: (data) => {
      if (data.success) {
        setTestStripeResult({ success: true, message: data.message || 'Connection successful!' })
        showToast({ type: 'success', title: 'Stripe Connected', description: `Successfully connected to Stripe (${data.details?.mode || 'unknown'} mode)` })
      } else {
        setTestStripeResult({ success: false, error: data.error || 'Connection failed' })
        showToast({ type: 'error', title: 'Connection Failed', description: data.error || 'Please check your Stripe keys' })
      }
    },
    onError: (error: Error) => {
      setTestStripeResult({ success: false, error: error.message || 'Failed to test connection' })
      showToast({ type: 'error', title: 'Test Failed', description: 'Could not connect to Stripe' })
    },
  })

  const testPushMutation = useMutation({
    mutationFn: async () => {
      // Run diagnostics first
      const diag = await runDiagnostics()
      setDiagnostics(diag)

      // Check service worker status
      const swStatus = await checkServiceWorkerStatus()
      setServiceWorkerStatus(swStatus)

      if (!swStatus.registered) {
        showToast({
          type: 'warning',
          title: 'Service Worker Issue',
          description: `Service worker not registered: ${swStatus.error}. Notifications may not work.`,
        })
      }

      // Warn if tab is active
      if (!document.hidden) {
        showToast({
          type: 'info',
          title: 'Tab is Active',
          description: 'Notifications work best when the tab is closed. Try closing this tab and sending again.',
        })
      }

      // Get current user ID
      const userData = await fetchClient<{ user: { id: string } }>('/api/auth/me')
      const userId = userData.user?.id
      if (!userId) throw new Error('User not found')

      // Send test notification
      return fetchClient<any>('/api/fcm/send', {
        method: 'POST',
        body: JSON.stringify({
          userIds: [userId],
          title: testNotificationTitle,
          body: testNotificationBody,
          data: { type: 'TEST', url: '/admin/settings' },
        }),
      })
    },
    onSuccess: (data) => {
      if (data.success) {
        setPushTestResult({
          success: true,
          message: `Notification sent! (${data.sent || 0} sent, ${data.failed || 0} failed)`,
        })
        showToast({
          type: 'success',
          title: 'Test Notification Sent',
          description: 'Check your browser for the push notification! If you don\'t see it, try closing this tab and sending again.',
        })
      } else {
        const errorMessage = data.message || data.error || 'Failed to send notification'
        const isVAPIDError = errorMessage.includes('VAPID keys not configured') ||
          (data.errors && Array.isArray(data.errors) && data.errors.some((err: string) => err.includes('VAPID keys not configured')))

        setPushTestResult({ success: false, error: errorMessage, isServiceAccountError: isVAPIDError })

        if (isVAPIDError) {
          showToast({ type: 'error', title: 'VAPID Keys Not Configured', description: 'Please add your VAPID keys in the settings above, then save and try again.' })
        } else {
          showToast({ type: 'error', title: 'Test Failed', description: errorMessage })
        }
      }
    },
    onError: (error: Error) => {
      setPushTestResult({ success: false, error: error.message || 'Failed to send test notification' })
      showToast({ type: 'error', title: 'Test Failed', description: error.message || 'Could not send test notification' })
    },
  })

  const toggleMarketplaceMutation = useMutation({
    mutationFn: (newValue: boolean) =>
      fetchClient<any>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ ADS_CREATOR_MARKETPLACE_ENABLED: newValue.toString() }),
      }),
    onSuccess: (_data, newValue) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      showToast({
        type: 'success',
        title: 'Setting Saved',
        description: `Creator Marketplace ${newValue ? 'enabled' : 'disabled'}`,
      })
    },
    onError: (error: Error, newValue) => {
      setCreatorMarketplaceEnabled(!newValue)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save setting',
      })
    },
  })

  // --- Handlers ---

  const handleSave = () => {
    saveSettingsMutation.mutate({
      DEEPSEEK_API_KEY: deepseekKey,
      RESEND_API_KEY: resendKey,
      GOOGLE_ANALYTICS_API_KEY: googleAnalyticsKey,
      GOOGLE_ANALYTICS_PROPERTY_ID: googleAnalyticsPropertyId,
      STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
      STRIPE_SECRET_KEY: stripeSecretKey,
      FIREBASE_API_KEY: firebaseApiKey,
      FIREBASE_AUTH_DOMAIN: firebaseAuthDomain,
      FIREBASE_PROJECT_ID: firebaseProjectId,
      FIREBASE_STORAGE_BUCKET: firebaseStorageBucket,
      FIREBASE_MESSAGING_SENDER_ID: firebaseMessagingSenderId,
      FIREBASE_APP_ID: firebaseAppId,
      FIREBASE_SERVICE_ACCOUNT: firebaseServiceAccount,
      FIREBASE_OAUTH_CLIENT_ID: firebaseOAuthClientId,
      FIREBASE_OAUTH_CLIENT_SECRET: firebaseOAuthClientSecret,
      FIREBASE_OAUTH_REFRESH_TOKEN: firebaseOAuthRefreshToken,
      VAPID_PUBLIC_KEY: vapidPublicKey,
      VAPID_PRIVATE_KEY: vapidPrivateKey,
      GOOGLE_CLIENT_ID: googleClientId,
      GOOGLE_CLIENT_SECRET: googleClientSecret,
      TOURNAMENTS_ENABLED: tournamentsEnabled.toString(),
      ADS_PLATFORM_ENABLED: platformAdsEnabled.toString(),
      ADS_CREATOR_MARKETPLACE_ENABLED: creatorMarketplaceEnabled.toString(),
      CREATOR_MIN_ELO: creatorMinELO,
      CREATOR_MIN_DEBATES: creatorMinDebates,
      CREATOR_MIN_ACCOUNT_AGE_MONTHS: creatorMinAgeMonths,
      CREATOR_FEE_BRONZE: creatorFeeBronze,
      CREATOR_FEE_SILVER: creatorFeeSilver,
      CREATOR_FEE_GOLD: creatorFeeGold,
      CREATOR_FEE_PLATINUM: creatorFeePlatinum,
    })
  }

  const handleTestDeepSeek = () => {
    setTestResult(null)
    testDeepSeekMutation.mutate()
  }

  const handleTestResend = () => {
    setTestResendResult(null)
    testResendMutation.mutate()
  }

  const handleTestGoogleAnalytics = () => {
    setTestGoogleResult(null)
    testGoogleAnalyticsMutation.mutate()
  }

  const handleTestStripe = () => {
    setTestStripeResult(null)
    testStripeMutation.mutate()
  }

  const handleTestPushNotification = () => {
    setPushTestResult(null)
    testPushMutation.mutate()
  }

  // --- Browser-side notification functions ---

  const checkNotificationStatus = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    try {
      const data = await fetchClient<{ hasToken: boolean }>('/api/fcm/status')
      setHasFCMToken(data.hasToken || false)
    } catch {
      // Silently handle - FCM status check is non-critical
    }
  }

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast({ type: 'error', title: 'Not Supported', description: 'Your browser does not support notifications' })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        showToast({ type: 'success', title: 'Permission Granted', description: 'Notification permission granted! The FCM token will be registered automatically.' })
        setTimeout(() => { checkNotificationStatus() }, 2000)
      } else if (permission === 'denied') {
        showToast({ type: 'error', title: 'Permission Denied', description: 'Notification permission was denied. Please enable it in your browser settings (click the lock icon in the address bar).' })
      } else {
        showToast({ type: 'warning', title: 'Permission Denied', description: 'Please allow notifications to test push notifications' })
      }
    } catch (error: any) {
      showToast({ type: 'error', title: 'Error', description: error.message || 'Failed to request permission' })
    }
  }

  const handleRegisterToken = async () => {
    try {
      const config = await fetchClient<any>('/api/firebase/config')

      if (!config.vapidKey) {
        throw new Error('VAPID key is missing. Please add it in Firebase settings.')
      }

      const { initializeApp, getApps } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')

      let app
      const apps = getApps()
      if (apps.length === 0) {
        app = initializeApp(config)
      } else {
        app = apps[0]
      }

      let serviceWorkerRegistration = null
      if ('serviceWorker' in navigator) {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope',
          })
        } catch (error) {
          throw new Error('Failed to register service worker: ' + (error as Error).message)
        }
      }

      const messaging = getMessaging(app)

      const token = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: serviceWorkerRegistration || undefined,
      })

      if (!token) {
        throw new Error('Failed to get FCM token. Make sure notifications are allowed.')
      }

      const device = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
      await fetchClient<any>('/api/fcm/register', {
        method: 'POST',
        body: JSON.stringify({ token, device, userAgent: navigator.userAgent }),
      })

      showToast({ type: 'success', title: 'Token Registered', description: 'FCM token has been registered successfully!' })
      setTimeout(() => { checkNotificationStatus() }, 1000)
    } catch (error: any) {
      showToast({ type: 'error', title: 'Registration Failed', description: error.message || 'Failed to register FCM token' })
    }
  }

  const handleTestBrowserNotification = () => {
    if (!('Notification' in window)) {
      showToast({ type: 'error', title: 'Not Supported', description: 'Your browser does not support notifications' })
      return
    }

    if (Notification.permission !== 'granted') {
      showToast({ type: 'error', title: 'Permission Required', description: 'Please grant notification permission first' })
      return
    }

    try {
      new Notification('Browser Test Notification', {
        body: 'If you see this, browser notifications work! This tests the browser directly, not FCM.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      })
      showToast({ type: 'success', title: 'Browser Notification Test', description: 'A notification should have appeared. If not, check Windows Focus Assist or browser settings.' })
    } catch (error: any) {
      showToast({ type: 'error', title: 'Test Failed', description: error.message || 'Failed to show browser notification' })
    }
  }

  const checkServiceWorkerStatus = async () => {
    if (!('serviceWorker' in navigator)) {
      return { registered: false, error: 'Service workers not supported' }
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const fcmWorker = registrations.find(
        (reg) => reg.scope.includes('firebase-cloud-messaging-push-scope')
      )

      if (!fcmWorker) {
        return { registered: false, error: 'FCM service worker not found' }
      }

      const state = fcmWorker.active?.state || fcmWorker.installing?.state || 'unknown'
      return { registered: true, state, scope: fcmWorker.scope }
    } catch (error: any) {
      return { registered: false, error: error.message }
    }
  }

  const runDiagnostics = async () => {
    const diag: any = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      notificationSupport: 'Notification' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      permission: Notification.permission,
      focusAssist: 'Windows Focus Assist cannot be detected programmatically. Check manually: Press Windows Key + A',
    }

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        diag.serviceWorkers = registrations.map(reg => ({
          scope: reg.scope,
          state: reg.active?.state || reg.installing?.state || 'unknown',
        }))

        const fcmWorker = registrations.find(
          (reg) => reg.scope.includes('firebase-cloud-messaging-push-scope')
        )
        diag.fcmWorker = fcmWorker ? {
          registered: true,
          state: fcmWorker.active?.state || fcmWorker.installing?.state || 'unknown',
          scope: fcmWorker.scope,
        } : { registered: false }
      } catch (error: any) {
        diag.serviceWorkerError = error.message
      }
    }

    diag.tabActive = !document.hidden
    diag.tabVisibility = document.visibilityState

    try {
      const tokenData = await fetchClient<{ hasToken: boolean; count?: number }>('/api/fcm/check-token')
      diag.hasToken = tokenData.hasToken
      diag.tokenCount = tokenData.count || 0
    } catch {
      diag.tokenCheckError = 'Could not check token status'
    }

    setDiagnostics(diag)
    return diag
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (settingsError) {
    return (
      <ErrorDisplay
        title="Failed to load settings"
        message={(settingsError as Error).message || 'Could not load settings.'}
        onRetry={() => refetchSettings()}
      />
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-text-secondary">Manage API keys, features, integrations, and platform configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-bg-tertiary">
        {[
          { id: 'general', label: 'General', icon: null },
          { id: 'features', label: 'Features', icon: null },
          { id: 'system', label: 'System', icon: '⚙️' },
          { id: 'api-usage', label: 'API Usage', icon: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
          <div className="max-w-2xl space-y-6">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">API Keys</h2>
            <p className="text-sm text-text-secondary mt-1">
              Configure external service API keys. These are stored securely in the database.
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* DeepSeek API Key */}
            <div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeepseekKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">Required for AI judge verdicts</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleTestDeepSeek}
                  isLoading={testDeepSeekMutation.isPending}
                >
                  {testDeepSeekMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              {testResult && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  testResult.success
                    ? 'bg-cyber-green/10 border-cyber-green/30'
                    : 'bg-neon-orange/10 border-neon-orange/30'
                }`}>
                  <p className={`text-sm ${
                    testResult.success ? 'text-cyber-green' : 'text-neon-orange'
                  }`}>
                    {testResult.success ? testResult.message : testResult.error}
                  </p>
                </div>
              )}
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

            {/* Google OAuth */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Google OAuth</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Google Client ID
                  </label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoogleClientId(e.target.value)}
                    placeholder="xxx-xxx.apps.googleusercontent.com"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">OAuth 2.0 Client ID from Google Cloud Console</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Google Client Secret
                  </label>
                  <input
                    type="password"
                    value={googleClientSecret}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoogleClientSecret(e.target.value)}
                    placeholder="GOCSPX-..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">OAuth 2.0 Client Secret (stored encrypted)</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue mb-2">
                  <strong>Get your Google OAuth credentials:</strong>
                </p>
                <p className="text-xs text-text-secondary mb-2">
                  1. Go to{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-electric-blue"
                  >
                    Google Cloud Console → APIs & Services → Credentials
                  </a>
                </p>
                <p className="text-xs text-text-secondary mb-2">
                  2. Create OAuth 2.0 Client ID (Web application)
                </p>
                <p className="text-xs text-text-secondary">
                  3. Add redirect URI: <code className="bg-bg-secondary px-1 rounded">https://www.argufight.com/api/auth/google/callback</code>
                </p>
              </div>
            </div>

            {/* Resend API Key */}
            <div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    Resend API Key
                  </label>
                  <input
                    type="password"
                    value={resendKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResendKey(e.target.value)}
                    placeholder="re_..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">Optional for email notifications</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleTestResend}
                  isLoading={testResendMutation.isPending}
                >
                  {testResendMutation.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
              {testResendResult && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  testResendResult.success
                    ? 'bg-cyber-green/10 border-cyber-green/30'
                    : 'bg-neon-orange/10 border-neon-orange/30'
                }`}>
                  <p className={`text-sm ${
                    testResendResult.success ? 'text-cyber-green' : 'text-neon-orange'
                  }`}>
                    {testResendResult.success ? testResendResult.message : testResendResult.error}
                  </p>
                </div>
              )}
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

            {/* Google Analytics */}
            <div className="space-y-4">
              <div className="p-4 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary mb-2">
                  <strong>Note:</strong> This is for <strong>API integration</strong> to display Google Analytics data in your admin dashboard.
                  If you just want to track visitors, you can skip this and add the tracking code to your website HTML separately.
                </p>
                <p className="text-xs text-text-muted mt-1">
                  The admin Analytics page will use your database data if Google Analytics API is not configured.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Google Analytics Property ID
                </label>
                <div className="flex gap-2">
                <input
                  type="text"
                  value={googleAnalyticsPropertyId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoogleAnalyticsPropertyId(e.target.value)}
                  placeholder="123456789"
                    className="flex-1 px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                  <Button
                    variant="secondary"
                    onClick={handleTestGoogleAnalytics}
                    isLoading={testGoogleAnalyticsMutation.isPending}
                    disabled={!googleAnalyticsPropertyId || !googleAnalyticsKey}
                  >
                    Test Connection
                  </Button>
                </div>
                <p className="text-xs text-text-secondary mt-1">GA4 Property ID (found in Admin → Property Settings)</p>
                {testGoogleResult && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    testGoogleResult.success
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {testGoogleResult.success ? testGoogleResult.message : testGoogleResult.error}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Google Analytics Service Account JSON
                </label>
                <textarea
                  value={googleAnalyticsKey}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setGoogleAnalyticsKey(e.target.value)
                    setTestGoogleResult(null)
                  }}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  rows={4}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Service account JSON credentials from Google Cloud Console (NOT the gtag.js script)
                </p>
                {googleAnalyticsKey && googleAnalyticsKey.includes('gtag') && (
                  <div className="mt-2 p-2 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <span>⚠️ Warning: It looks like you pasted the gtag.js script. You need the Service Account JSON file from Google Cloud Console, which starts with {`{"type": "service_account", ...}`}</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Setup Instructions:</strong>
                </p>
                <ol className="text-xs text-text-secondary mt-2 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-electric-blue">Google Cloud Console</a></li>
                  <li>Create a project or select existing one</li>
                  <li>Enable "Google Analytics Data API"</li>
                  <li>Create a Service Account and download JSON key</li>
                  <li>Add service account email to GA4 property with "Viewer" role</li>
                  <li>Paste JSON credentials and Property ID above</li>
                </ol>
              </div>
            </div>

            {/* Stripe Payment Keys */}
            <div className="space-y-4 pt-4 border-t border-bg-tertiary">
              <h3 className="text-lg font-semibold text-white mb-4">Stripe Payment Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  value={stripePublishableKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStripePublishableKey(e.target.value)}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">Public key for client-side Stripe integration</p>
              </div>
              <div>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white mb-2">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      value={stripeSecretKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setStripeSecretKey(e.target.value)
                        setTestStripeResult(null)
                      }}
                      placeholder="sk_test_..."
                      className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                    />
                    <p className="text-xs text-text-secondary mt-1">Secret key for server-side Stripe operations (stored encrypted)</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestStripe}
                    isLoading={testStripeMutation.isPending}
                    disabled={!stripeSecretKey || !stripePublishableKey}
                  >
                    Test Connection
                  </Button>
                </div>
                {testStripeResult && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    testStripeResult.success
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {testStripeResult.success ? testStripeResult.message : testStripeResult.error}
                  </div>
                )}
              </div>
              <div className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue mb-2">
                  <strong>Important:</strong> Processing fees will be passed to users
                </p>
                <p className="text-xs text-text-secondary">
                  When charging $1/month for tournaments, Stripe processing fees (~$0.32 + 2.9%) will be added to the user's charge.
                  This ensures Argu Fight receives the full $1.00. Users will pay approximately $1.35/month.
                </p>
              </div>
              <div className="p-3 bg-text-muted/10 border border-text-muted/30 rounded-lg">
                <p className="text-sm text-text-secondary">
                  <strong>Get your Stripe keys:</strong> Visit{' '}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-electric-blue"
                  >
                    dashboard.stripe.com/apikeys
                  </a>
                </p>
              </div>
            </div>

            {/* Firebase Push Notifications */}
            <div className="space-y-4 pt-4 border-t border-bg-tertiary">
              <h3 className="text-lg font-semibold text-white mb-4">Firebase Push Notifications</h3>
              <div className="p-4 bg-text-muted/10 border border-text-muted/30 rounded-lg mb-4">
                <p className="text-sm text-text-secondary mb-2">
                  <strong>Firebase Cloud Messaging (FCM)</strong> enables push notifications to users even when they're not on your site.
                </p>
                <p className="text-xs text-text-muted">
                  Users will be asked to allow notifications. When it's their turn in a debate, they'll receive a push notification.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Firebase API Key *
                  </label>
                  <input
                    type="text"
                    value={firebaseApiKey}
                    onChange={(e) => setFirebaseApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Auth Domain *
                  </label>
                  <input
                    type="text"
                    value={firebaseAuthDomain}
                    onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    value={firebaseProjectId}
                    onChange={(e) => setFirebaseProjectId(e.target.value)}
                    placeholder="your-project-id"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={firebaseStorageBucket}
                    onChange={(e) => setFirebaseStorageBucket(e.target.value)}
                    placeholder="your-project.appspot.com"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Messaging Sender ID *
                  </label>
                  <input
                    type="text"
                    value={firebaseMessagingSenderId}
                    onChange={(e) => setFirebaseMessagingSenderId(e.target.value)}
                    placeholder="123456789"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    App ID *
                  </label>
                  <input
                    type="text"
                    value={firebaseAppId}
                    onChange={(e) => setFirebaseAppId(e.target.value)}
                    placeholder="1:123456789:web:..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                <p className="text-sm text-yellow-400 mb-2">
                  <strong>⚠️ Organization Policy Blocking Service Account Keys?</strong>
                </p>
                <p className="text-xs text-text-secondary">
                  If you can't create service account keys due to organization policies, use <strong>OAuth2 credentials</strong> below instead. You only need ONE method (Service Account OR OAuth2).
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Service Account JSON (Option 1 - Preferred if available)
                </label>
                <textarea
                  value={firebaseServiceAccount}
                  onChange={(e) => setFirebaseServiceAccount(e.target.value)}
                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                  rows={6}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Found in Firebase Console → Project Settings → Service Accounts → Generate new private key
                </p>
                {firebaseServiceAccount && !firebaseServiceAccount.includes('"type": "service_account"') && (
                  <div className="mt-2 p-2 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    ⚠️ Warning: This doesn't look like a valid Service Account JSON. It should start with {`{"type": "service_account", ...}`}
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue mb-2">
                  <strong>OR Use OAuth2 (Option 2 - If Service Account is Blocked)</strong>
                </p>
                <p className="text-xs text-text-secondary mb-3">
                  If organization policies block service account keys, use OAuth2 instead. See <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="underline hover:text-electric-blue">OAuth Playground</a> to get refresh token.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      OAuth2 Client ID
                    </label>
                    <input
                      type="text"
                      value={firebaseOAuthClientId}
                      onChange={(e) => setFirebaseOAuthClientId(e.target.value)}
                      placeholder="xxx.apps.googleusercontent.com"
                      className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      OAuth2 Client Secret
                    </label>
                    <input
                      type="password"
                      value={firebaseOAuthClientSecret}
                      onChange={(e) => setFirebaseOAuthClientSecret(e.target.value)}
                      placeholder="GOCSPX-..."
                      className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-white mb-2">
                    OAuth2 Refresh Token
                  </label>
                  <input
                    type="password"
                    value={firebaseOAuthRefreshToken}
                    onChange={(e) => setFirebaseOAuthRefreshToken(e.target.value)}
                    placeholder="1//..."
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Get from <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="underline hover:text-electric-blue">OAuth Playground</a> with scope: <code className="text-xs">https://www.googleapis.com/auth/firebase.messaging</code>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">
                  VAPID Public Key (Required for web push)
                </label>
                <input
                  type="text"
                  value={vapidPublicKey}
                  onChange={(e) => setVapidPublicKey(e.target.value)}
                  placeholder="BK..."
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Public key for Web Push API (safe to share)
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">
                  VAPID Private Key (Required for web push)
                </label>
                <input
                  type="password"
                  value={vapidPrivateKey}
                  onChange={(e) => setVapidPrivateKey(e.target.value)}
                  placeholder="Enter private key..."
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Private key for Web Push API (keep secret)
                </p>
              </div>

              <div className="mt-4 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue mb-2">
                  <strong>Generate VAPID Keys (No Firebase Required!):</strong>
                </p>
                <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                  <li>Install web-push: <code className="bg-bg-secondary px-1 rounded">npm install -g web-push</code></li>
                  <li>Run: <code className="bg-bg-secondary px-1 rounded">web-push generate-vapid-keys</code></li>
                  <li>Copy the <strong>Public Key</strong> to the field above</li>
                  <li>Copy the <strong>Private Key</strong> to the field above</li>
                  <li>Click "Save Settings"</li>
                  <li>See <a href="/VAPID_KEYS_SETUP_GUIDE.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-electric-blue">VAPID Keys Setup Guide</a> for more details</li>
                </ol>
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ <strong>Note:</strong> This uses Web Push API directly - no Firebase service account needed!
                </p>
              </div>

              {/* Test Push Notifications */}
              <div className="mt-6 pt-6 border-t border-bg-tertiary">
                <h4 className="text-md font-semibold text-white mb-4">Test Push Notifications</h4>

                {/* Status */}
                <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Browser Permission:</span>
                    <span className={`text-sm font-medium ${
                      notificationPermission === 'granted' ? 'text-green-400' :
                      notificationPermission === 'denied' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {notificationPermission === 'granted' ? '✅ Granted' :
                       notificationPermission === 'denied' ? '❌ Denied' :
                       '⚠️ Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">FCM Token Registered:</span>
                    <span className={`text-sm font-medium ${
                      hasFCMToken ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {hasFCMToken ? '✅ Yes' : '⚠️ No'}
                    </span>
                  </div>
                </div>

                {/* Request Permission Button */}
                {notificationPermission !== 'granted' && (
                  <div className="mb-4">
                    {notificationPermission === 'denied' ? (
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-3">
                        <p className="text-sm text-red-400 mb-2">
                          <strong>⚠️ Notification Permission Denied</strong>
                        </p>
                        <p className="text-xs text-text-secondary mb-2">
                          You previously denied notification permission. To re-enable it:
                        </p>
                        <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside mb-2">
                          <li><strong>Chrome/Edge:</strong> Click the lock icon (🔒) in the address bar → Site settings → Notifications → Allow</li>
                          <li><strong>Or:</strong> Go to <code className="bg-bg-secondary px-1 rounded">chrome://settings/content/notifications</code> → Find "argufight.com" → Change to "Allow"</li>
                          <li><strong>Or:</strong> Use a different browser/Incognito mode to test</li>
                        </ol>
                        <p className="text-xs text-text-secondary">
                          After changing the setting, refresh this page.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={handleRequestNotificationPermission}
                      >
                        Request Notification Permission
                      </Button>
                    )}
                  </div>
                )}

                {/* Register Token Button */}
                {notificationPermission === 'granted' && !hasFCMToken && (
                  <div className="mb-4">
                    <Button
                      variant="primary"
                      onClick={handleRegisterToken}
                    >
                      Register FCM Token Now
                    </Button>
                    <p className="text-xs text-text-secondary mt-2">
                      Click this button to manually register your FCM token. This will initialize Firebase and register your device for push notifications.
                    </p>
                  </div>
                )}

                {/* Test Form */}
                {notificationPermission === 'granted' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Test Notification Title
                      </label>
                      <input
                        type="text"
                        value={testNotificationTitle}
                        onChange={(e) => setTestNotificationTitle(e.target.value)}
                        placeholder="Test Notification"
                        className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Test Notification Body
                      </label>
                      <input
                        type="text"
                        value={testNotificationBody}
                        onChange={(e) => setTestNotificationBody(e.target.value)}
                        placeholder="This is a test push notification!"
                        className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        variant="secondary"
                        onClick={handleTestBrowserNotification}
                      >
                        Test Browser Notification
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={runDiagnostics}
                      >
                        Run Diagnostics
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleTestPushNotification}
                        isLoading={testPushMutation.isPending}
                      >
                        Send Web Push Test Notification
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await fetchClient<any>('/api/fcm/register', {
                              method: 'DELETE',
                            })
                            showToast({
                              type: 'success',
                              title: 'Old Tokens Cleared',
                              description: 'Please refresh the page to register a new Web Push subscription.',
                            })
                            setTimeout(() => window.location.reload(), 2000)
                          } catch (error: any) {
                            showToast({
                              type: 'error',
                              title: 'Failed to Clear Tokens',
                              description: error.message,
                            })
                          }
                        }}
                      >
                        Clear Old Tokens & Refresh
                      </Button>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      <strong>Test Browser Notification:</strong> Tests if your browser can show notifications at all (bypasses Web Push).<br/>
                      <strong>Send Web Push Test Notification:</strong> Sends a real push notification through Web Push API (works even when tab is closed).<br/>
                      <strong>Clear Old Tokens & Refresh:</strong> Removes old FCM tokens and refreshes the page to register a new Web Push subscription.<br/>
                      <strong>⚠️ If notifications don't work:</strong> Your browser may have cached Firebase settings. Try: (1) Close all tabs, (2) Go to <code className="bg-gray-800 px-1 rounded">chrome://settings/content/all</code> and delete "argufight.com", (3) Refresh this page, or (4) Use Incognito mode.
                    </p>

                    {/* Test Result */}
                    {pushTestResult && (
                      <div className={`p-3 rounded-lg ${
                        pushTestResult.success
                          ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                          : 'bg-red-500/20 border border-red-500/30 text-red-400'
                      }`}>
                        <p className="text-sm font-medium">
                          {pushTestResult.success ? '✅ Success' : '❌ Error'}
                        </p>
                        <p className="text-xs mt-1">
                          {pushTestResult.message || pushTestResult.error}
                        </p>
                        {pushTestResult.isServiceAccountError && (
                          <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded">
                            <p className="text-xs text-yellow-400 font-semibold mb-2">
                              ⚠️ Firebase Service Account Required
                            </p>
                            <ol className="text-xs text-yellow-300 space-y-1 list-decimal list-inside">
                              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                              <li>Select your project → Gear icon → Project Settings</li>
                              <li>Go to <strong>Service Accounts</strong> tab</li>
                              <li>Click <strong>"Generate new private key"</strong></li>
                              <li>Download the JSON file</li>
                              <li>Copy the <strong>entire JSON content</strong> and paste it in the "Service Account JSON" field above</li>
                              <li>Click <strong>"Save Settings"</strong></li>
                              <li>Try sending a test notification again</li>
                            </ol>
                          </div>
                        )}
                        {pushTestResult.success && (
                          <div className="mt-3 p-3 bg-bg-secondary rounded border border-bg-tertiary">
                            <p className="text-xs text-text-secondary mb-2">
                              <strong>💡 Troubleshooting Tips:</strong>
                            </p>
                            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
                              <li>If you don't see a notification, check <strong>Windows Focus Assist</strong> (Press Windows Key + A, turn off Focus Assist)</li>
                              <li>Try <strong>closing this tab</strong> and sending another test notification</li>
                              <li>Check browser notification settings in your browser's settings under Notifications</li>
                              <li>Open DevTools (F12) → Application → Service Workers to check service worker status</li>
                              <li>See <a href="/PUSH_NOTIFICATION_TROUBLESHOOTING.md" target="_blank" className="underline text-electric-blue">full troubleshooting guide</a> for more help</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Diagnostics Display */}
                    {diagnostics && (
                      <div className="mt-4 p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                        <h5 className="text-sm font-semibold text-white mb-3">🔍 Diagnostic Information</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Browser:</span>
                            <span className="text-white">{diagnostics.browser?.split(' ')[0] || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Platform:</span>
                            <span className="text-white">{diagnostics.platform || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Notification Support:</span>
                            <span className={diagnostics.notificationSupport ? 'text-green-400' : 'text-red-400'}>
                              {diagnostics.notificationSupport ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Service Worker Support:</span>
                            <span className={diagnostics.serviceWorkerSupport ? 'text-green-400' : 'text-red-400'}>
                              {diagnostics.serviceWorkerSupport ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Permission:</span>
                            <span className={
                              diagnostics.permission === 'granted' ? 'text-green-400' :
                              diagnostics.permission === 'denied' ? 'text-red-400' :
                              'text-yellow-400'
                            }>
                              {diagnostics.permission === 'granted' ? '✅ Granted' :
                               diagnostics.permission === 'denied' ? '❌ Denied' :
                               '⚠️ Not Set'}
                            </span>
                          </div>
                          {diagnostics.fcmWorker && (
                            <div className="flex justify-between">
                              <span className="text-text-secondary">FCM Service Worker:</span>
                              <span className={diagnostics.fcmWorker.registered ? 'text-green-400' : 'text-red-400'}>
                                {diagnostics.fcmWorker.registered
                                  ? `✅ Registered (${diagnostics.fcmWorker.state})`
                                  : '❌ Not Registered'}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Tab Active:</span>
                            <span className={diagnostics.tabActive ? 'text-yellow-400' : 'text-green-400'}>
                              {diagnostics.tabActive ? '⚠️ Yes (notifications may be suppressed)' : '✅ No (ideal for notifications)'}
                            </span>
                          </div>
                          {diagnostics.hasToken !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-text-secondary">FCM Token:</span>
                              <span className={diagnostics.hasToken ? 'text-green-400' : 'text-red-400'}>
                                {diagnostics.hasToken ? `✅ Registered (${diagnostics.tokenCount || 1} token(s))` : '❌ Not Registered'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-bg-tertiary">
                          <p className="text-xs text-text-secondary">
                            <strong>⚠️ Important:</strong> {diagnostics.focusAssist}
                          </p>
                        </div>
                      </div>
                    )}

                    {!hasFCMToken && notificationPermission === 'granted' && (
                      <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-xs text-yellow-400">
                          ⚠️ No FCM token registered yet. Make sure you're logged in and have visited a page that initializes Firebase (like the homepage). The token will be registered automatically.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={saveSettingsMutation.isPending}
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
            <p className="text-sm text-text-secondary mt-1">
              Control platform-wide features and behavior
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Maintenance Mode</p>
                <p className="text-sm text-text-secondary">
                  Disable all debates and show maintenance message
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Allow New Signups</p>
                <p className="text-sm text-text-secondary">
                  Enable or disable new user registrations
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Tournaments Feature</p>
                <p className="text-sm text-text-secondary">
                  Enable tournament creation and participation
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={tournamentsEnabled}
                  onChange={(e) => setTournamentsEnabled(e.target.checked)}
                />
                <div className={`w-11 h-6 rounded-full peer transition-colors ${
                  tournamentsEnabled ? 'bg-electric-blue' : 'bg-bg-secondary'
                } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  tournamentsEnabled ? 'after:translate-x-5' : 'after:translate-x-0'
                }`}></div>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Advertising Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Advertising Settings</h2>
            <p className="text-sm text-text-secondary mt-1">
              Configure Platform Ads and Creator Marketplace
            </p>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div>
                  <p className="font-semibold text-white">Platform Ads</p>
                  <p className="text-sm text-text-secondary">
                    Enable platform-wide advertising campaigns
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={platformAdsEnabled}
                    onChange={(e) => setPlatformAdsEnabled(e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    platformAdsEnabled ? 'bg-electric-blue' : 'bg-bg-secondary'
                  } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    platformAdsEnabled ? 'after:translate-x-5' : 'after:translate-x-0'
                  }`}></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                <div>
                  <p className="font-semibold text-white">Creator Marketplace</p>
                  <p className="text-sm text-text-secondary">
                    Enable creator-advertiser sponsorship system
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={creatorMarketplaceEnabled}
                    onChange={(e) => {
                      const newValue = e.target.checked
                      setCreatorMarketplaceEnabled(newValue)
                      toggleMarketplaceMutation.mutate(newValue)
                    }}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    creatorMarketplaceEnabled ? 'bg-electric-blue' : 'bg-bg-secondary'
                  } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    creatorMarketplaceEnabled ? 'after:translate-x-5' : 'after:translate-x-0'
                  }`}></div>
                </label>
              </div>
            </div>

            {/* Creator Eligibility */}
            <div className="border-t border-bg-tertiary pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Creator Eligibility Requirements</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Minimum ELO
                  </label>
                  <input
                    type="number"
                    value={creatorMinELO}
                    onChange={(e) => setCreatorMinELO(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Minimum Debates
                  </label>
                  <input
                    type="number"
                    value={creatorMinDebates}
                    onChange={(e) => setCreatorMinDebates(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Minimum Account Age (Months)
                  </label>
                  <input
                    type="number"
                    value={creatorMinAgeMonths}
                    onChange={(e) => setCreatorMinAgeMonths(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Platform Fees */}
            <div className="border-t border-bg-tertiary pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Platform Fees (%)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Bronze (1500-1999 ELO)
                  </label>
                  <input
                    type="number"
                    value={creatorFeeBronze}
                    onChange={(e) => setCreatorFeeBronze(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Silver (2000-2499 ELO)
                  </label>
                  <input
                    type="number"
                    value={creatorFeeSilver}
                    onChange={(e) => setCreatorFeeSilver(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Gold (2500+ ELO)
                  </label>
                  <input
                    type="number"
                    value={creatorFeeGold}
                    onChange={(e) => setCreatorFeeGold(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Platinum (Top 1%)
                  </label>
                  <input
                    type="number"
                    value={creatorFeePlatinum}
                    onChange={(e) => setCreatorFeePlatinum(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && <FeaturesTab />}

      {/* System Settings Tab */}
      {activeTab === 'system' && <SystemSettingsTab />}

      {/* API Usage Tab */}
      {activeTab === 'api-usage' && <ApiUsageTab />}
    </div>
  )
}

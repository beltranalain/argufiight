'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function AdminSettingsPage() {
  const { showToast } = useToast()
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
  const [firebaseVapidKey, setFirebaseVapidKey] = useState('')
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
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [isTestingResend, setIsTestingResend] = useState(false)
  const [isTestingGoogle, setIsTestingGoogle] = useState(false)
  const [isTestingStripe, setIsTestingStripe] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testGoogleResult, setTestGoogleResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testResendResult, setTestResendResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [testStripeResult, setTestStripeResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [isTestingPush, setIsTestingPush] = useState(false)
  const [pushTestResult, setPushTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [hasFCMToken, setHasFCMToken] = useState(false)
  const [testNotificationTitle, setTestNotificationTitle] = useState('Test Notification')
  const [testNotificationBody, setTestNotificationBody] = useState('This is a test push notification!')

  useEffect(() => {
    fetchSettings()
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    // Check browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Check if user has FCM token registered
    try {
      const response = await fetch('/api/fcm/status')
      if (response.ok) {
        const data = await response.json()
        setHasFCMToken(data.hasToken || false)
      }
    } catch (error) {
      console.error('Failed to check FCM status:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
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
        setFirebaseVapidKey(data.FIREBASE_VAPID_KEY || '')
        setGoogleClientId(data.GOOGLE_CLIENT_ID || '')
        setGoogleClientSecret(data.GOOGLE_CLIENT_SECRET || '')
        setTournamentsEnabled(data.TOURNAMENTS_ENABLED === 'true')
        
        // Advertising settings
        setPlatformAdsEnabled(data.ADS_PLATFORM_ENABLED === 'true')
        setCreatorMarketplaceEnabled(data.ADS_CREATOR_MARKETPLACE_ENABLED === 'true')
        setCreatorMinELO(data.CREATOR_MIN_ELO || '1500')
        setCreatorMinDebates(data.CREATOR_MIN_DEBATES || '10')
        setCreatorMinAgeMonths(data.CREATOR_MIN_ACCOUNT_AGE_MONTHS || '3')
        setCreatorFeeBronze(data.CREATOR_FEE_BRONZE || '25')
        setCreatorFeeSilver(data.CREATOR_FEE_SILVER || '20')
        setCreatorFeeGold(data.CREATOR_FEE_GOLD || '15')
        setCreatorFeePlatinum(data.CREATOR_FEE_PLATINUM || '10')
      }
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
          FIREBASE_VAPID_KEY: firebaseVapidKey,
          GOOGLE_CLIENT_ID: googleClientId,
          GOOGLE_CLIENT_SECRET: googleClientSecret,
          TOURNAMENTS_ENABLED: tournamentsEnabled.toString(),
          // Advertising settings
          ADS_PLATFORM_ENABLED: platformAdsEnabled.toString(),
          ADS_CREATOR_MARKETPLACE_ENABLED: creatorMarketplaceEnabled.toString(),
          CREATOR_MIN_ELO: creatorMinELO,
          CREATOR_MIN_DEBATES: creatorMinDebates,
          CREATOR_MIN_ACCOUNT_AGE_MONTHS: creatorMinAgeMonths,
          CREATOR_FEE_BRONZE: creatorFeeBronze,
          CREATOR_FEE_SILVER: creatorFeeSilver,
          CREATOR_FEE_GOLD: creatorFeeGold,
          CREATOR_FEE_PLATINUM: creatorFeePlatinum,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'API keys have been updated',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestDeepSeek = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/settings/test-deepseek', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `✅ Connection successful! Response: "${data.response}" (${data.tokensUsed} tokens used)`,
        })
        showToast({
          type: 'success',
          title: 'API Test Successful',
          description: 'DeepSeek API is working correctly',
        })
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'API Test Failed',
          description: data.error || 'Please check your API key',
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to DeepSeek API',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleTestResend = async () => {
    setIsTestingResend(true)
    setTestResendResult(null)

    try {
      const response = await fetch('/api/admin/settings/test-resend', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestResendResult({
          success: true,
          message: `✅ Connection successful! Found ${data.apiKeysFound || 0} API keys`,
        })
        showToast({
          type: 'success',
          title: 'API Test Successful',
          description: 'Resend API is working correctly',
        })
      } else {
        setTestResendResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'API Test Failed',
          description: data.error || 'Please check your API key',
        })
      }
    } catch (error: any) {
      setTestResendResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to Resend API',
      })
    } finally {
      setIsTestingResend(false)
      }
    }

  const handleTestGoogleAnalytics = async () => {
    setIsTestingGoogle(true)
    setTestGoogleResult(null)

    try {
      // First save the current values
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GOOGLE_ANALYTICS_API_KEY: googleAnalyticsKey,
          GOOGLE_ANALYTICS_PROPERTY_ID: googleAnalyticsPropertyId,
        }),
      })

      const response = await fetch('/api/admin/settings/test-google-analytics', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestGoogleResult({
          success: true,
          message: data.message || '✅ Connection successful!',
        })
        showToast({
          type: 'success',
          title: 'Google Analytics Connected',
          description: `Successfully connected to Property ${data.propertyId}`,
        })
      } else {
        setTestGoogleResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'Connection Failed',
          description: data.error || 'Please check your credentials',
        })
      }
    } catch (error: any) {
      setTestGoogleResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to Google Analytics',
      })
    } finally {
      setIsTestingGoogle(false)
    }
  }

  const handleTestStripe = async () => {
    setIsTestingStripe(true)
    setTestStripeResult(null)

    try {
      // First save the current values
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
          STRIPE_SECRET_KEY: stripeSecretKey,
        }),
      })

      const response = await fetch('/api/admin/settings/test-stripe', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTestStripeResult({
          success: true,
          message: data.message || '✅ Connection successful!',
        })
        showToast({
          type: 'success',
          title: 'Stripe Connected',
          description: `Successfully connected to Stripe (${data.details?.mode || 'unknown'} mode)`,
        })
      } else {
        setTestStripeResult({
          success: false,
          error: data.error || 'Connection failed',
        })
        showToast({
          type: 'error',
          title: 'Connection Failed',
          description: data.error || 'Please check your Stripe keys',
        })
      }
    } catch (error: any) {
      setTestStripeResult({
        success: false,
        error: error.message || 'Failed to test connection',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not connect to Stripe',
      })
    } finally {
      setIsTestingStripe(false)
    }
  }

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast({
        type: 'error',
        title: 'Not Supported',
        description: 'Your browser does not support notifications',
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        showToast({
          type: 'success',
          title: 'Permission Granted',
          description: 'Notification permission granted! The FCM token will be registered automatically.',
        })
        // Refresh status after a short delay to allow token registration
        setTimeout(() => {
          checkNotificationStatus()
        }, 2000)
      } else {
        showToast({
          type: 'error',
          title: 'Permission Denied',
          description: 'Please allow notifications to test push notifications',
        })
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to request permission',
      })
    }
  }

  const handleRegisterToken = async () => {
    try {
      // Get Firebase config
      const configResponse = await fetch('/api/firebase/config')
      if (!configResponse.ok) {
        throw new Error('Firebase not configured. Please save your Firebase settings first.')
      }
      const config = await configResponse.json()

      if (!config.vapidKey) {
        throw new Error('VAPID key is missing. Please add it in Firebase settings.')
      }

      // Initialize Firebase
      const { initializeApp, getApps } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')

      let app
      const apps = getApps()
      if (apps.length === 0) {
        app = initializeApp(config)
      } else {
        app = apps[0]
      }

      // Register service worker first
      let serviceWorkerRegistration = null
      if ('serviceWorker' in navigator) {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope',
          })
          console.log('[Push Notifications] Service worker registered')
        } catch (error) {
          console.error('[Push Notifications] Service worker registration failed:', error)
          throw new Error('Failed to register service worker: ' + (error as Error).message)
        }
      }

      const messaging = getMessaging(app, serviceWorkerRegistration || undefined)

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: serviceWorkerRegistration || undefined,
      })

      if (!token) {
        throw new Error('Failed to get FCM token. Make sure notifications are allowed.')
      }

      // Register token with server
      const device = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
      const response = await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          device,
          userAgent: navigator.userAgent,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Token Registered',
          description: 'FCM token has been registered successfully!',
        })
        // Refresh status
        setTimeout(() => {
          checkNotificationStatus()
        }, 1000)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to register token')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        description: error.message || 'Failed to register FCM token',
      })
    }
  }

  const handleTestPushNotification = async () => {
    setIsTestingPush(true)
    setPushTestResult(null)

    try {
      // Get current user ID
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) {
        throw new Error('Failed to get user ID')
      }
      const userData = await userResponse.json()
      const userId = userData.user?.id

      if (!userId) {
        throw new Error('User not found')
      }

      // Send test notification
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [userId],
          title: testNotificationTitle,
          body: testNotificationBody,
          data: {
            type: 'TEST',
            url: '/admin/settings',
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPushTestResult({
          success: true,
          message: `✅ Notification sent! (${data.sent || 0} sent, ${data.failed || 0} failed)`,
        })
        showToast({
          type: 'success',
          title: 'Test Notification Sent',
          description: 'Check your browser for the push notification!',
        })
      } else {
        setPushTestResult({
          success: false,
          error: data.message || data.error || 'Failed to send notification',
        })
        showToast({
          type: 'error',
          title: 'Test Failed',
          description: data.message || data.error || 'Please check your Firebase configuration',
        })
      }
    } catch (error: any) {
      setPushTestResult({
        success: false,
        error: error.message || 'Failed to send test notification',
      })
      showToast({
        type: 'error',
        title: 'Test Failed',
        description: error.message || 'Could not send test notification',
      })
    } finally {
      setIsTestingPush(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
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
                  isLoading={isTesting}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
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
                  isLoading={isTestingResend}
                >
                  {isTestingResend ? 'Testing...' : 'Test Connection'}
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
                    isLoading={isTestingGoogle}
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
                    setTestGoogleResult(null) // Clear test result when editing
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
                        setTestStripeResult(null) // Clear test result when editing
                      }}
                      placeholder="sk_test_..."
                      className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                    />
                    <p className="text-xs text-text-secondary mt-1">Secret key for server-side Stripe operations (stored encrypted)</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleTestStripe}
                    isLoading={isTestingStripe}
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
                  VAPID Key (Required for web push)
                </label>
                <input
                  type="text"
                  value={firebaseVapidKey}
                  onChange={(e) => setFirebaseVapidKey(e.target.value)}
                  placeholder="BK..."
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Found in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
                </p>
              </div>

              <div className="mt-4 p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <p className="text-sm text-electric-blue mb-2">
                  <strong>Get your Firebase credentials:</strong>
                </p>
                <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-electric-blue">Firebase Console</a></li>
                  <li>Select your project → Gear icon → Project Settings</li>
                  <li>Scroll to "Your apps" → Web app → Copy config values</li>
                  <li>Go to <strong>Service Accounts</strong> tab → Click "Generate new private key" → Download JSON</li>
                  <li>Go to Cloud Messaging tab → Generate VAPID key pair if needed → Copy public key</li>
                  <li>Paste the entire Service Account JSON file content above</li>
                </ol>
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
                    <Button
                      variant="secondary"
                      onClick={handleRequestNotificationPermission}
                    >
                      Request Notification Permission
                    </Button>
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
                    <Button
                      variant="primary"
                      onClick={handleTestPushNotification}
                      isLoading={isTestingPush}
                    >
                      Send Test Notification
                    </Button>

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
                    onChange={(e) => setCreatorMarketplaceEnabled(e.target.checked)}
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
  )
}


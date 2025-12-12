import { NextResponse } from 'next/server'
import { getFirebaseConfig } from '@/lib/firebase/config'

// GET /api/firebase/config - Get Firebase configuration for frontend
export async function GET() {
  try {
    const config = await getFirebaseConfig()

    if (!config) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 404 }
      )
    }

    // Only return public config (no server keys)
    // VAPID key is required for web push notifications
    if (!config.vapidKey) {
      console.warn('Firebase VAPID key is missing. Push notifications will not work.')
    }

    return NextResponse.json({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      vapidKey: config.vapidKey || null, // Return null if missing so frontend can detect it
    })
  } catch (error) {
    console.error('Failed to get Firebase config:', error)
    return NextResponse.json(
      { error: 'Failed to get Firebase config' },
      { status: 500 }
    )
  }
}


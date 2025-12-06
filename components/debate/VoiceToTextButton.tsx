'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface VoiceToTextButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

export function VoiceToTextButton({ onTranscript, disabled, className }: VoiceToTextButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        onTranscript(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        // Handle common errors
        if (event.error === 'no-speech') {
          // User didn't speak, just stop listening
          setIsListening(false)
        } else if (event.error === 'not-allowed' || event.error === 'aborted') {
          // Show permission modal instead of alert
          setShowPermissionModal(true)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      // First, try to check using MediaDevices API (more reliable)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          // If we got the stream, we have permission - stop it immediately
          stream.getTracks().forEach(track => track.stop())
          return true
        } catch (error: any) {
          // Permission denied or not available
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setShowPermissionModal(true)
            return false
          }
          // Other errors (e.g., no microphone) - let it try anyway
          console.warn('Microphone access check failed:', error)
        }
      }
      
      // Fallback: Check using Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          if (result.state === 'denied') {
            setShowPermissionModal(true)
            return false
          }
          return result.state === 'granted'
        } catch (error) {
          // Permissions API might not support 'microphone' in all browsers
          console.warn('Permissions API check failed:', error)
        }
      }
      
      // If we can't check, try to start and handle error
      return true
    } catch (error) {
      console.error('Error checking microphone permission:', error)
      // Fall through to try starting anyway
      return true
    }
  }

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      // Check permission first
      const hasPermission = await checkMicrophonePermission()
      if (!hasPermission) {
        return
      }

      try {
        recognitionRef.current.start()
      } catch (error: any) {
        console.error('Failed to start speech recognition:', error)
        // If error is permission-related, show modal
        if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
          setShowPermissionModal(true)
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  if (!isSupported) {
    return null // Don't show button if not supported
  }

  return (
    <>
      <Button
        type="button"
        variant={isListening ? "danger" : "secondary"}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={className}
      >
        {isListening ? (
          <>
            <svg className="w-4 h-4 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Stop Listening
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Voice Input
          </>
        )}
      </Button>

      {/* Permission Help Modal */}
      <Modal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        title="Enable Talk-to-Text"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4">
            <p className="text-text-primary mb-2">
              <strong>This is Talk-to-Text, not a voice recorder.</strong> Your speech is converted to text in real-time using your browser's speech recognition feature.
            </p>
            <p className="text-sm text-text-secondary">
              Your voice is processed by your browser and converted to text. No audio is recorded or saved.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">How to Enable Microphone Access:</h3>
            
            <div className="space-y-4">
              {/* Chrome/Edge Instructions */}
              <div className="border border-bg-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-electric-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-text-primary">Chrome / Edge / Brave</h4>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary ml-2">
                  <li>Click the lock icon (🔒) or info icon (ℹ️) in the address bar</li>
                  <li>Find "Microphone" in the permissions list</li>
                  <li>Change from "Block" to "Allow"</li>
                  <li>Refresh the page and try again</li>
                </ol>
                <p className="text-xs text-text-muted mt-2 ml-2">
                  Or go to: Settings → Privacy and security → Site Settings → Microphone
                </p>
              </div>

              {/* Firefox Instructions */}
              <div className="border border-bg-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-electric-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-text-primary">Firefox</h4>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary ml-2">
                  <li>Click the shield icon in the address bar</li>
                  <li>Click "Permissions" → "Microphone"</li>
                  <li>Select "Allow" and check "Remember this decision"</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>

              {/* Safari Instructions */}
              <div className="border border-bg-tertiary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-electric-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-text-primary">Safari</h4>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary ml-2">
                  <li>Go to Safari → Settings (or Preferences)</li>
                  <li>Click "Websites" tab</li>
                  <li>Select "Microphone" from the left sidebar</li>
                  <li>Find this website and set to "Allow"</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-bg-tertiary rounded-lg p-3">
            <p className="text-sm text-text-secondary">
              <strong>Note:</strong> If you've already allowed microphone access but it's still not working, try:
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary mt-2 space-y-1 ml-2">
              <li>Make sure your microphone is not muted or disabled in system settings</li>
              <li>Check that no other application is using your microphone</li>
              <li>Try refreshing the page after enabling permissions</li>
              <li>Ensure you're using HTTPS (required for microphone access)</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => setShowPermissionModal(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// TypeScript definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}


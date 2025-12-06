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
        console.log('Speech recognition started')
        setIsListening(true)
        setShowPermissionModal(false) // Hide modal if it was showing
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        onTranscript(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event.message)
        setIsListening(false)
        
        // Handle common errors - only show modal for actual permission errors
        if (event.error === 'no-speech') {
          // User didn't speak, just stop listening - don't show modal
          setIsListening(false)
        } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          // Permission was denied - show modal to help user enable it
          // This error only fires AFTER the browser has already tried and been denied
          console.log('Permission denied by browser, showing help modal')
          setShowPermissionModal(true)
        } else if (event.error === 'service-not-allowed') {
          // Service not allowed usually means the speech recognition service itself is blocked
          // This is different from microphone permission - don't show the permission modal
          console.warn('Speech recognition service not allowed (might be blocked by browser settings)')
          setIsListening(false)
        } else if (event.error === 'aborted') {
          // User or system aborted - don't show modal, just stop
          setIsListening(false)
        } else if (event.error === 'network') {
          // Network error - don't show permission modal
          console.warn('Network error in speech recognition')
          setIsListening(false)
        } else {
          // Other errors - log but don't show modal
          console.warn('Speech recognition error (non-permission):', event.error)
          setIsListening(false)
        }
      }

      recognition.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      console.warn('Speech Recognition API not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [onTranscript])

  const startListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized')
      return
    }

    if (isListening) {
      console.log('Already listening')
      return
    }

    // CRITICAL: Just try to start - DO NOT check permissions first
    // The Speech Recognition API will trigger the browser's native permission prompt
    // If we check permissions first, we prevent the browser from showing its prompt
    try {
      console.log('Attempting to start speech recognition (will trigger browser permission prompt if needed)...')
      recognitionRef.current.start()
      // If we get here without error, it started successfully
      // The browser will show its permission prompt if needed
    } catch (error: any) {
      console.error('Failed to start speech recognition:', error)
      setIsListening(false)
      
      // Only show modal if it's clearly a permission error
      // Most errors here are synchronous and happen immediately if permission is denied
      if (error.name === 'NotAllowedError' || 
          error.name === 'PermissionDeniedError' || 
          (error.message && (error.message.includes('permission') || error.message.includes('not allowed')))) {
        // Permission was denied - show help modal
        console.log('Permission error detected, showing help modal')
        setShowPermissionModal(true)
      } else {
        // For other errors, log but don't show permission modal
        console.warn('Speech recognition start failed (non-permission):', error.name, error.message)
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
                  <li>Click the lock icon or info icon in the address bar</li>
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


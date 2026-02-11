'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const testRecognitionRef = useRef<SpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const shouldListenRef = useRef(false)
  const restartCountRef = useRef(0)
  const onTranscriptRef = useRef(onTranscript)

  // Keep onTranscript ref current to avoid stale closures
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const createRecognitionInstance = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return null

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setShowPermissionModal(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Reset restart count on any result — mic is working
      restartCountRef.current = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Send only the NEW final text — caller appends it
          const finalText = result[0].transcript.trim()
          if (finalText) {
            onTranscriptRef.current(finalText)
          }
          setInterimText('')
        } else {
          // Show interim text visually
          setInterimText(result[0].transcript)
        }
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Normal — mic is on but user hasn't spoken yet. Let onend restart gracefully.
        return
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        shouldListenRef.current = false
        setIsListening(false)
        setShowPermissionModal(true)
      } else if (event.error === 'service-not-allowed') {
        shouldListenRef.current = false
        setIsListening(false)
      } else if (event.error === 'aborted') {
        // User or system aborted — onend will handle restart if needed
      } else if (event.error === 'audio-capture') {
        shouldListenRef.current = false
        setIsListening(false)
      }
      // For network and other errors, let onend handle restart
    }

    recognition.onend = () => {
      if (!shouldListenRef.current) {
        setIsListening(false)
        setInterimText('')
        return
      }

      // Cap auto-restarts to prevent infinite loops
      restartCountRef.current++
      if (restartCountRef.current > 50) {
        console.warn('Voice input: too many restarts, stopping')
        shouldListenRef.current = false
        setIsListening(false)
        setInterimText('')
        return
      }

      // Restart after a reasonable delay — gives the browser time to release resources
      setTimeout(() => {
        if (!shouldListenRef.current) return

        const newRecognition = createRecognitionInstance()
        if (newRecognition) {
          recognitionRef.current = newRecognition
          try {
            newRecognition.start()
          } catch (error: any) {
            if (error.message?.includes('already started')) {
              // Already running, that's fine
            } else {
              console.error('Voice input: failed to restart:', error)
              shouldListenRef.current = false
              setIsListening(false)
              setInterimText('')
            }
          }
        }
      }, 300)
    }

    return recognition
  }, [])

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognitionAPI) {
      setIsSupported(true)
    }

    return () => {
      shouldListenRef.current = false
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (testRecognitionRef.current) {
        try { testRecognitionRef.current.stop() } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const startListening = async () => {
    if (!isSupported || isListening) return

    shouldListenRef.current = true
    restartCountRef.current = 0
    setInterimText('')

    try {
      // Request microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      stream.getTracks().forEach(track => {
        track.onended = () => {
          stopListening()
        }
      })

      // Create and start recognition
      const recognition = createRecognitionInstance()
      if (!recognition) {
        throw new Error('Failed to create recognition instance')
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error: any) {
      shouldListenRef.current = false
      setIsListening(false)

      if (error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError' ||
          error.name === 'NotReadableError') {
        setShowPermissionModal(true)
      }
    }
  }

  const stopListening = () => {
    shouldListenRef.current = false

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setIsListening(false)
    setInterimText('')
    restartCountRef.current = 0
  }

  const testMicrophone = async () => {
    if (!isSupported) {
      setTestStatus('error')
      setTestMessage('Speech recognition is not supported in this browser')
      return
    }

    setTestStatus('testing')
    setTestMessage('Requesting microphone access...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)

      stream.getTracks().forEach(track => track.stop())
      audioContext.close()

      setTestStatus('success')
      setTestMessage('Microphone is working! Permission granted. You can now use Voice Input.')

      try {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const testRecognition = new SpeechRecognitionAPI()
        testRecognition.continuous = false
        testRecognition.interimResults = false
        testRecognition.lang = 'en-US'

        testRecognition.onstart = () => {
          setTestMessage('Microphone is working! Speech recognition is ready. You can now use Voice Input.')
          setTimeout(() => {
            if (testRecognitionRef.current) {
              try { testRecognitionRef.current.stop() } catch {}
            }
          }, 2000)
        }

        testRecognition.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            setTestMessage('Microphone is working! (No speech detected, but mic is connected)')
          }
        }

        testRecognitionRef.current = testRecognition
        testRecognition.start()
      } catch {}
    } catch (error: any) {
      setTestStatus('error')
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setTestMessage('Microphone permission denied. Please click "Allow" when your browser asks for permission.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setTestMessage('No microphone found. Please connect a microphone and try again.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setTestMessage('Microphone is being used by another application. Please close other apps using the mic.')
      } else {
        setTestMessage(`Error: ${error.message || 'Failed to access microphone'}. Please check your browser settings.`)
      }
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2">
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
      </div>

      {isListening && interimText && (
        <div className="mt-2 p-2 bg-electric-blue/10 border border-electric-blue/30 rounded text-xs text-electric-blue italic">
          {interimText}...
        </div>
      )}

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
                  Or go to: Settings &rarr; Privacy and security &rarr; Site Settings &rarr; Microphone
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
                  <li>Click "Permissions" &rarr; "Microphone"</li>
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
                  <li>Go to Safari &rarr; Settings (or Preferences)</li>
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

          {/* Test Microphone Section */}
          <div className="border-t border-bg-tertiary pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-text-primary mb-1">Test Microphone</h4>
                <p className="text-sm text-text-secondary">
                  Click the button below to test if your microphone is working
                </p>
              </div>
              <Button
                variant={testStatus === 'success' ? 'success' : testStatus === 'error' ? 'danger' : 'primary'}
                onClick={testMicrophone}
                disabled={testStatus === 'testing'}
                className="ml-4"
              >
                {testStatus === 'testing' ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-1.657.663-3.157 1.734-4.266l-1.415-1.414A9.97 9.97 0 000 12c0 5.523 4.477 10 10 10s10-4.477 10-10S15.523 2 10 2V0c5.523 0 10 4.477 10 10s-4.477 10-10 10z"></path>
                    </svg>
                    Testing...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Working!
                  </>
                ) : testStatus === 'error' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Try Again
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Test Microphone
                  </>
                )}
              </Button>
            </div>
            {testMessage && (
              <div className={`p-3 rounded-lg ${
                testStatus === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : testStatus === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-electric-blue/10 border border-electric-blue/30 text-electric-blue'
              }`}>
                <p className="text-sm">{testMessage}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => {
                setShowPermissionModal(false)
                setTestStatus('idle')
                setTestMessage('')
                if (testRecognitionRef.current) {
                  try { testRecognitionRef.current.stop() } catch {}
                  testRecognitionRef.current = null
                }
              }}
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
  maxAlternatives: number
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

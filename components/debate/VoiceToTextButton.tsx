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
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const testRecognitionRef = useRef<SpeechRecognition | null>(null)

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
      if (testRecognitionRef.current) {
        try {
          testRecognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [onTranscript])

  const startListening = async () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized')
      return
    }

    if (isListening) {
      console.log('Already listening')
      return
    }

    // NEW APPROACH: Explicitly request microphone permission first using getUserMedia
    // This is more reliable than relying on SpeechRecognition to trigger the prompt
    try {
      console.log('Step 1: Requesting microphone permission explicitly...')
      
      // Request microphone access explicitly - this will show the browser's permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Permission granted! Stop the stream (we don't need it, just needed permission)
      stream.getTracks().forEach(track => track.stop())
      
      console.log('Step 2: Microphone permission granted, starting speech recognition...')
      
      // Now start speech recognition - it should work since we have permission
      recognitionRef.current.start()
      
    } catch (error: any) {
      console.error('Failed to get microphone permission or start speech recognition:', error)
      setIsListening(false)
      
      // Handle permission denial
      if (error.name === 'NotAllowedError' || 
          error.name === 'PermissionDeniedError' ||
          error.name === 'NotReadableError' ||
          (error.message && (error.message.includes('permission') || error.message.includes('not allowed') || error.message.includes('denied')))) {
        // Permission was denied - show help modal
        console.log('Permission error detected, showing help modal')
        setShowPermissionModal(true)
      } else {
        // For other errors, try to start speech recognition anyway (might work)
        console.warn('getUserMedia failed, trying speech recognition directly:', error.name, error.message)
        try {
          recognitionRef.current.start()
        } catch (recognitionError: any) {
          console.error('Speech recognition also failed:', recognitionError)
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

  // Test microphone function - uses getUserMedia to explicitly request permission
  const testMicrophone = async () => {
    if (!isSupported) {
      setTestStatus('error')
      setTestMessage('Speech recognition is not supported in this browser')
      return
    }

    setTestStatus('testing')
    setTestMessage('Requesting microphone access...')

    try {
      // Step 1: Explicitly request microphone permission using getUserMedia
      console.log('Test: Requesting microphone permission via getUserMedia...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Permission granted! Test that we can actually access the audio
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)
      
      // Check if we're getting audio data
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop())
      audioContext.close()
      
      console.log('Test: Microphone permission granted and audio stream accessible')
      setTestStatus('success')
      setTestMessage('Microphone is working! Permission granted. You can now use Voice Input.')
      
      // Now try speech recognition to confirm it works
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const testRecognition = new SpeechRecognition()
        testRecognition.continuous = false
        testRecognition.interimResults = false
        testRecognition.lang = 'en-US'
        
        testRecognition.onstart = () => {
          console.log('Test: Speech recognition also started successfully')
          setTestMessage('Microphone is working! Speech recognition is ready. You can now use Voice Input.')
          setTimeout(() => {
            if (testRecognitionRef.current) {
              try {
                testRecognitionRef.current.stop()
              } catch (e) {
                // Ignore errors
              }
            }
          }, 2000)
        }
        
        testRecognition.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            // This is fine - mic works, just no speech detected
            setTestMessage('Microphone is working! (No speech detected, but mic is connected)')
          }
        }
        
        testRecognition.onend = () => {
          // Keep success status
        }
        
        testRecognitionRef.current = testRecognition
        testRecognition.start()
      } catch (recognitionError) {
        // Speech recognition failed but mic permission works - that's still success
        console.log('Test: Speech recognition test failed but mic permission works:', recognitionError)
      }
      
    } catch (error: any) {
      console.error('Test: Failed to get microphone permission:', error)
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
                // Clean up test recognition
                if (testRecognitionRef.current) {
                  try {
                    testRecognitionRef.current.stop()
                  } catch (e) {
                    // Ignore errors
                  }
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


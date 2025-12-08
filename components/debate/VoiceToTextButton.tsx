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
  const [isRestarting, setIsRestarting] = useState(false) // Track restart state
  const [restartCount, setRestartCount] = useState(0) // Count auto-restarts
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const testRecognitionRef = useRef<SpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null) // Keep microphone stream open
  const shouldListenRef = useRef(false) // Track if we should be listening (for immediate restart)
  const accumulatedTranscriptRef = useRef('') // Store transcript separately from recognition instance

  // Function to create a new recognition instance
  const createRecognitionInstance = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.continuous = true  // Keep listening until user stops
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
      setShowPermissionModal(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build transcript from all results
      let accumulated = accumulatedTranscriptRef.current
      let newTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Final result - add to accumulated transcript
          accumulated += result[0].transcript + ' '
          accumulatedTranscriptRef.current = accumulated
          newTranscript = accumulated
        } else {
          // Interim result - show accumulated + current interim
          newTranscript = accumulated + result[0].transcript
        }
      }
      onTranscript(newTranscript.trim())
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event.message)
      
      // Handle common errors
      if (event.error === 'no-speech') {
        // No speech detected - this is normal, don't stop, let onend handle restart
        console.log('No speech detected, will restart automatically')
        // Don't set isListening to false - keep it active
        return
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        shouldListenRef.current = false
        setIsListening(false)
        console.log('Permission denied by browser, showing help modal')
        setShowPermissionModal(true)
      } else if (event.error === 'service-not-allowed') {
        shouldListenRef.current = false
        setIsListening(false)
        console.warn('Speech recognition service not allowed')
      } else if (event.error === 'aborted') {
        // Only stop if user explicitly stopped
        if (!shouldListenRef.current) {
          setIsListening(false)
        } else {
          // If aborted but we should still be listening, restart immediately
          console.log('Recognition aborted but should continue, restarting...')
          setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) {
                console.error('Failed to restart after abort:', e)
              }
            }
          }, 50)
        }
      } else if (event.error === 'network') {
        console.warn('Network error in speech recognition, will retry')
        // Don't stop on network errors - let onend handle restart
      } else {
        console.warn('Speech recognition error (non-permission):', event.error)
        // Only stop on critical errors
        if (event.error === 'audio-capture' || event.error === 'bad-grammar') {
          shouldListenRef.current = false
          setIsListening(false)
        }
        // For other errors, try to continue
      }
    }

    recognition.onend = () => {
      console.log('Speech recognition ended - restarting immediately if still listening')
      // If we're still supposed to be listening, IMMEDIATELY create a NEW instance and start it
      if (shouldListenRef.current) {
        // Show restarting indicator
        setIsRestarting(true)
        setRestartCount(prev => prev + 1)
        
        // Keep isListening true - don't set it to false
        // Create a fresh recognition instance immediately
        const newRecognition = createRecognitionInstance()
        if (newRecognition) {
          recognitionRef.current = newRecognition
          // Use requestAnimationFrame for immediate restart (faster than setTimeout)
          requestAnimationFrame(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try {
                console.log('Immediately restarting recognition instance...')
                recognitionRef.current.start()
                // Clear restarting indicator after a brief moment
                setTimeout(() => setIsRestarting(false), 500)
              } catch (error: any) {
                // Handle "already started" error - this means recognition is already running
                if (error.message && (error.message.includes('already started') || error.message.includes('started'))) {
                  console.log('Recognition already running, this is fine')
                  setIsRestarting(false)
                  return
                }
                console.error('Failed to start new recognition instance:', error)
                // If immediate start fails, try with a minimal delay
                setTimeout(() => {
                  if (shouldListenRef.current && recognitionRef.current) {
                    try {
                      console.log('Retrying recognition start after delay...')
                      recognitionRef.current.start()
                      setIsRestarting(false)
                    } catch (retryError: any) {
                      console.error('Failed to start after retry:', retryError)
                      // If it's "already started", that's fine
                      if (retryError.message && (retryError.message.includes('already started') || retryError.message.includes('started'))) {
                        console.log('Recognition already running after retry, continuing...')
                        setIsRestarting(false)
                        return
                      }
                      // Try one more time with a fresh instance
                      setTimeout(() => {
                        if (shouldListenRef.current) {
                          const finalRetry = createRecognitionInstance()
                          if (finalRetry) {
                            recognitionRef.current = finalRetry
                            try {
                              finalRetry.start()
                              setIsRestarting(false)
                            } catch (finalError: any) {
                              console.error('Failed to start after final retry:', finalError)
                              // Only stop if it's not "already started"
                              if (!finalError.message || (!finalError.message.includes('already started') && !finalError.message.includes('started'))) {
                                shouldListenRef.current = false
                                setIsListening(false)
                                setIsRestarting(false)
                              } else {
                                setIsRestarting(false)
                              }
                            }
                          }
                        }
                      }, 100)
                    }
                  }
                }, 10) // Minimal delay
              }
            }
          })
        } else {
          shouldListenRef.current = false
          setIsListening(false)
          setIsRestarting(false)
        }
      } else {
        setIsListening(false)
        setIsRestarting(false)
      }
    }

    return recognition
  }

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      // Don't create instance here - create it when user starts listening
    } else {
      console.warn('Speech Recognition API not supported in this browser')
    }

    return () => {
      shouldListenRef.current = false
      
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
      
      // Clean up microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [onTranscript])

  const startListening = async () => {
    if (!isSupported) {
      console.error('Speech recognition not supported')
      return
    }

    if (isListening) {
      console.log('Already listening')
      return
    }

    // Set flag that we should be listening
    shouldListenRef.current = true

    // Reset accumulated transcript and restart count when starting fresh
    accumulatedTranscriptRef.current = ''
    setRestartCount(0)
    setIsRestarting(false)

    // NEW APPROACH: Keep microphone stream open while listening
    // This prevents the browser from stopping recognition due to stream closure
    try {
      console.log('Step 1: Requesting microphone permission and keeping stream open...')
      
      // Request microphone access and KEEP IT OPEN
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream // Store reference to keep it alive
      
      console.log('Step 2: Microphone permission granted, creating new recognition instance...')
      
      // Create a fresh recognition instance
      const recognition = createRecognitionInstance()
      if (!recognition) {
        throw new Error('Failed to create recognition instance')
      }
      
      recognitionRef.current = recognition
      
      // Start recognition
      console.log('Step 3: Starting speech recognition...')
      recognition.start()
      
    } catch (error: any) {
      console.error('Failed to get microphone permission or start speech recognition:', error)
      shouldListenRef.current = false
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
          const recognition = createRecognitionInstance()
          if (recognition) {
            recognitionRef.current = recognition
            recognition.start()
          }
        } catch (recognitionError: any) {
          console.error('Speech recognition also failed:', recognitionError)
          setShowPermissionModal(true)
        }
      }
    }
  }

  const stopListening = () => {
    // Set flag to stop listening
    shouldListenRef.current = false
    
    // Stop speech recognition
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Close microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsListening(false)
    setIsRestarting(false)
    setRestartCount(0)
  }

  // Manual restart function
  const restartListening = () => {
    if (!isListening || !shouldListenRef.current) {
      return
    }
    
    // Stop current recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Create new instance and start
    const newRecognition = createRecognitionInstance()
    if (newRecognition) {
      recognitionRef.current = newRecognition
      try {
        newRecognition.start()
        setRestartCount(0) // Reset count on manual restart
        setIsRestarting(false)
      } catch (error) {
        console.error('Failed to manually restart:', error)
      }
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
              {isRestarting ? 'Restarting...' : 'Stop Listening'}
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
        
        {isListening && (
          <>
            {isRestarting && (
              <span className="text-xs text-neon-orange animate-pulse">
                Restarting...
              </span>
            )}
            {restartCount > 0 && !isRestarting && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={restartListening}
                className="text-xs text-text-secondary hover:text-text-primary"
                title="Voice input may pause during silence. Click to restart manually."
              >
                ↻ Restart
              </Button>
            )}
          </>
        )}
      </div>
      
      {isListening && restartCount > 2 && (
        <div className="mt-2 p-2 bg-neon-orange/10 border border-neon-orange/30 rounded text-xs text-neon-orange">
          💡 Voice input may pause during silence. Click "Restart" if it stops, or use the "Stop Listening" button to end.
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


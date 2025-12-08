/**
 * Deepgram WebSocket Client for Real-time Speech-to-Text
 * Handles streaming audio transcription without timeout issues
 */

export interface DeepgramTranscriptionResult {
  transcript: string
  isFinal: boolean
  confidence?: number
}

export class DeepgramClient {
  private ws: WebSocket | null = null
  private apiKey: string
  private onTranscript: (result: DeepgramTranscriptionResult) => void
  private onError: (error: Error) => void
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private isConnected = false

  constructor(
    apiKey: string,
    onTranscript: (result: DeepgramTranscriptionResult) => void,
    onError: (error: Error) => void
  ) {
    this.apiKey = apiKey
    this.onTranscript = onTranscript
    this.onError = onError
  }

  async start(mediaStream: MediaStream): Promise<void> {
    try {
      this.mediaStream = mediaStream

      // Create WebSocket connection to Deepgram
      const wsUrl = `wss://api.deepgram.com/v1/listen?language=en-US&punctuate=true&interim_results=true`
      this.ws = new WebSocket(wsUrl, ['token', this.apiKey])

      this.ws.onopen = () => {
        console.log('Deepgram WebSocket connected')
        this.isConnected = true
        this.startAudioStream(mediaStream)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript || ''
            const isFinal = data.is_final || false
            const confidence = data.channel?.alternatives?.[0]?.confidence

            if (transcript) {
              this.onTranscript({
                transcript,
                isFinal,
                confidence,
              })
            }
          } else if (data.type === 'Metadata') {
            // Connection metadata
            console.log('Deepgram metadata:', data)
          }
        } catch (error) {
          console.error('Failed to parse Deepgram message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error)
        this.onError(new Error('Deepgram connection error'))
      }

      this.ws.onclose = () => {
        console.log('Deepgram WebSocket closed')
        this.isConnected = false
        this.cleanup()
      }
    } catch (error: any) {
      console.error('Failed to start Deepgram:', error)
      this.onError(error)
    }
  }

  private startAudioStream(mediaStream: MediaStream): void {
    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = this.audioContext.createMediaStreamSource(mediaStream)

      // Create script processor for audio chunks
      // Note: ScriptProcessorNode is deprecated but works for this use case
      // In production, you might want to use AudioWorkletNode
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)

      this.processor.onaudioprocess = (event) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0)
          
          // Convert Float32Array to Int16Array for Deepgram
          const int16Data = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            // Clamp and convert to 16-bit PCM
            const s = Math.max(-1, Math.min(1, inputData[i]))
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }

          // Send audio data to Deepgram
          this.ws.send(int16Data.buffer)
        }
      }

      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)
    } catch (error: any) {
      console.error('Failed to start audio stream:', error)
      this.onError(error)
    }
  }

  stop(): void {
    this.cleanup()
  }

  private cleanup(): void {
    if (this.processor) {
      try {
        this.processor.disconnect()
      } catch (e) {
        // Ignore
      }
      this.processor = null
    }

    if (this.audioContext) {
      try {
        this.audioContext.close()
      } catch (e) {
        // Ignore
      }
      this.audioContext = null
    }

    if (this.ws) {
      try {
        this.ws.close()
      } catch (e) {
        // Ignore
      }
      this.ws = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    this.isConnected = false
  }

  isActive(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN
  }
}


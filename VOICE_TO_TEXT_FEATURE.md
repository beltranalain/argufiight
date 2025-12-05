# Voice-to-Text Feature Implementation

## Overview
The voice-to-text feature allows users to speak their arguments instead of typing them. This uses the browser's built-in Web Speech API (Speech Recognition).

## How It Works

### Browser Support
- **Chrome/Edge**: Full support ✅
- **Safari**: Partial support (webkit prefix) ✅
- **Firefox**: Not supported ❌
- **Mobile**: iOS Safari and Chrome Android support it ✅

### Implementation Details

1. **Component**: `components/debate/VoiceToTextButton.tsx`
   - Reusable button component for voice input
   - Automatically detects browser support
   - Handles microphone permissions
   - Shows visual feedback when recording

2. **Integration**: 
   - Added to `SubmitArgumentForm` component
   - Transcribed text is appended to the textarea
   - Users can edit transcribed text before submitting

## Usage

### For Users:
1. Click the "Voice Input" button
2. Grant microphone permission when prompted
3. Speak your argument clearly
4. Click "Stop Recording" when done
5. Review and edit the transcribed text
6. Submit as normal

### For Developers:

```tsx
import { VoiceToTextButton } from '@/components/debate/VoiceToTextButton'

<VoiceToTextButton
  onTranscript={(text) => {
    // Handle transcribed text
    setContent(text)
  }}
  disabled={false}
  className="custom-class"
/>
```

## Features

- ✅ Real-time transcription (interim results)
- ✅ Automatic punctuation
- ✅ Language: English (US) - can be changed
- ✅ Visual feedback (pulsing animation when recording)
- ✅ Error handling for permissions and errors
- ✅ Graceful fallback (button hidden if not supported)

## Browser Permissions

Users will be prompted to allow microphone access:
- **First time**: Browser shows permission dialog
- **Denied**: User must enable in browser settings
- **Granted**: Works seamlessly

## Customization Options

### Change Language
In `VoiceToTextButton.tsx`, modify:
```tsx
recognition.lang = 'en-US' // Change to 'es-ES', 'fr-FR', etc.
```

### Continuous Mode
For longer arguments, enable continuous mode:
```tsx
recognition.continuous = true // Default is false
```

### Confidence Threshold
Filter low-confidence results:
```tsx
recognition.onresult = (event) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i]
    if (result.isFinal && result[0].confidence > 0.7) {
      // Only use high-confidence results
    }
  }
}
```

## Troubleshooting

### "Microphone permission denied"
- User needs to enable microphone in browser settings
- Chrome: Settings → Privacy → Site Settings → Microphone
- Safari: Preferences → Websites → Microphone

### "No speech detected"
- User didn't speak or microphone is muted
- Check microphone hardware
- Ensure browser has permission

### Not working on mobile
- iOS: Requires HTTPS (works on production)
- Android: Should work on Chrome
- Check browser console for errors

## Future Enhancements

1. **Multiple Language Support**: Allow users to select language
2. **Punctuation Control**: Toggle automatic punctuation
3. **Voice Commands**: "New paragraph", "Delete last sentence"
4. **Offline Support**: Use local speech recognition API
5. **Mobile App**: Native speech recognition for React Native

## Testing

1. Test on Chrome/Edge (best support)
2. Test microphone permissions (grant/deny)
3. Test with different accents
4. Test in noisy environments
5. Test on mobile devices

## Notes

- Speech recognition requires internet connection (uses Google's service)
- Accuracy depends on:
  - Microphone quality
  - Background noise
  - Speaking clarity
  - Internet connection speed
- Privacy: Audio is sent to Google's servers for processing
- Always allow users to edit transcribed text before submitting


# Deepgram Voice Input Implementation

## ✅ Implementation Complete

Deepgram has been integrated into the voice input system to provide reliable, continuous speech-to-text without timeout issues.

## 📊 Free Tier Math

**12,000 free minutes/month breakdown:**
- **12,000 minutes** = **200 hours** = **8.33 days** of continuous listening
- **Average debate argument**: ~2-3 minutes of speech
- **Arguments per month**: ~4,000-6,000 arguments on free tier
- **Per user estimate**: Even heavy users (100+ arguments/month) would use <1% of free tier

**Conclusion**: The free tier is extremely generous and should cover all normal usage.

## 🎯 Access Control Recommendation

**Recommendation: Make Deepgram available to ALL users (free and paid)**

**Reasons:**
1. **Free tier is very generous** - 12,000 minutes/month is way more than any user would need
2. **Better user experience** - All users get reliable voice input
3. **Competitive advantage** - Better than competitors who limit voice features
4. **Cost-effective** - Free tier covers normal usage, only pay if we exceed it
5. **Simple implementation** - No need for tier-based checks

**If we need to restrict later:**
- Can add usage tracking per user
- Can limit free users to X minutes/month
- Can make it Pro-only if costs become an issue

**Current Implementation**: Available to all users (no restrictions)

## 🔑 API Key Setup

### Step 1: Add API Key to Admin Settings
1. Go to Admin Dashboard → Settings
2. Find "Deepgram API Key" section
3. Paste your API key: `651d1c583c5cf83d8445a560ce5b6bc95cedf45a`
4. Click "Save Settings"

### Step 2: Verify It's Working
1. Go to any debate page
2. Click "Voice Input" button
3. Check browser console - should see "Deepgram is available, will use it for voice input"
4. Speak - should see real-time transcription without timeouts

## 🔄 How It Works

### Priority Order:
1. **Deepgram** (if API key configured) - Reliable, no timeouts
2. **Web Speech API** (fallback) - Browser native, has timeout issues

### Flow:
1. User clicks "Voice Input"
2. System checks if Deepgram API key exists
3. If yes → Uses Deepgram WebSocket streaming
4. If no → Falls back to Web Speech API
5. If Deepgram fails → Automatically falls back to Web Speech API

## 📁 Files Created/Modified

### New Files:
- `lib/ai/deepgram.ts` - API key management
- `lib/ai/deepgram-client.ts` - WebSocket client for streaming
- `app/api/speech/transcribe/route.ts` - API endpoint to get Deepgram credentials

### Modified Files:
- `components/debate/VoiceToTextButton.tsx` - Integrated Deepgram with fallback
- `app/admin/admin/settings/page.tsx` - Added Deepgram API key input field

## 🧪 Testing

### Test Deepgram:
1. Add API key in admin settings
2. Open debate page
3. Click "Voice Input"
4. Speak continuously for 30+ seconds
5. Should see real-time transcription without stopping

### Test Fallback:
1. Remove API key from admin settings
2. Open debate page
3. Click "Voice Input"
4. Should use Web Speech API (may timeout after silence)

## 💰 Cost Analysis

### Free Tier:
- **12,000 minutes/month** = FREE
- Covers ~4,000-6,000 arguments/month
- More than enough for normal usage

### Paid Tier (if we exceed free):
- **$0.0043 per minute** after free tier
- **$4.30 per 1,000 minutes** = ~333-500 arguments
- Only pay if we exceed 12,000 minutes/month

### Cost Estimate:
- **100 active users** × **10 arguments/month** × **2.5 min/argument** = **2,500 minutes/month** ✅ FREE
- **1,000 active users** × **10 arguments/month** × **2.5 min/argument** = **25,000 minutes/month** = **$55.90/month** (13,000 paid minutes × $0.0043)

## 🚀 Benefits

1. **No Timeouts** - Continuous listening without stopping
2. **Better Accuracy** - Deepgram's AI is more accurate than Web Speech API
3. **Real-time** - Instant transcription as you speak
4. **Reliable** - No browser-specific issues
5. **Scalable** - Works for all users

## 📝 Next Steps

1. ✅ Add API key to admin settings (you can do this now)
2. ✅ Test voice input in a debate
3. ⏳ Monitor usage in Deepgram dashboard
4. ⏳ Add usage tracking if needed later

## 🔗 Resources

- **Deepgram Console**: https://console.deepgram.com
- **API Documentation**: https://developers.deepgram.com
- **Pricing**: https://www.deepgram.com/pricing


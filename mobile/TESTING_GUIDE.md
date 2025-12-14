# Mobile App Testing Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (installed globally or via npx)
4. **Expo Go app** on your phone (iOS App Store or Google Play Store)
5. **Physical device** (recommended) or emulator

## Installation

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Testing Methods

### Method 1: Physical Device (Recommended)

This is the easiest and most realistic way to test the app.

#### Steps:

1. **Start the development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

2. **You'll see a QR code in the terminal**

3. **On your phone:**
   - **iOS:** Open the Camera app and scan the QR code
   - **Android:** Open the Expo Go app and scan the QR code
   - Or press `i` for iOS simulator, `a` for Android emulator

4. **The app will load on your device**

#### Troubleshooting Connection Issues:

If your phone can't connect:

1. **Make sure phone and computer are on the same WiFi network**
2. **Check your computer's local IP address:**
   - Windows: Run `ipconfig` in PowerShell/CMD, look for "IPv4 Address"
   - Mac/Linux: Run `ifconfig` in Terminal
3. **Update API URL in `mobile/src/services/api.ts`:**
   ```typescript
   const API_URL = __DEV__ 
     ? 'http://YOUR_LOCAL_IP:3000/api'  // Replace YOUR_LOCAL_IP
     : 'https://www.argufight.com/api';
   ```
4. **Restart the Expo server:**
   ```bash
   npm start
   ```

### Method 2: iOS Simulator (Mac only)

1. **Install Xcode** from Mac App Store
2. **Start Expo:**
   ```bash
   npm start
   ```
3. **Press `i`** in the terminal to open iOS simulator
4. **Or run directly:**
   ```bash
   npm run ios
   ```

### Method 3: Android Emulator

1. **Install Android Studio**
2. **Set up an Android Virtual Device (AVD)**
3. **Start Expo:**
   ```bash
   npm start
   ```
4. **Press `a`** in the terminal to open Android emulator
5. **Or run directly:**
   ```bash
   npm run android
   ```

### Method 4: Web Browser (Limited)

For quick UI testing only (some features won't work):

```bash
npm run web
```

## Testing Checklist

### ✅ Basic Functionality
- [ ] App launches without errors
- [ ] Login/Signup works
- [ ] Home screen loads debates
- [ ] Navigation between screens works
- [ ] Profile screen displays correctly

### ✅ New Features (Recently Added)
- [ ] **Tournaments:**
  - [ ] Tournaments list screen loads
  - [ ] Can filter tournaments (status, format)
  - [ ] Can view tournament details
  - [ ] Can join tournaments
  - [ ] Tournament bracket displays (for BRACKET/CHAMPIONSHIP)
  - [ ] Leaderboard shows (for King of the Hill)

- [ ] **Past Debates:**
  - [ ] Past debates show on profile
  - [ ] Shows all participants for GROUP debates
  - [ ] Result badges display correctly (Won/Lost/Tie)

- [ ] **Live Battle:**
  - [ ] Live Battle panel appears on Home screen
  - [ ] Shows active debate
  - [ ] Links to debate detail correctly

- [ ] **GROUP Debates:**
  - [ ] DebateCard shows all participants
  - [ ] DebateDetailScreen shows all participants
  - [ ] Can submit simultaneously (not turn-based)
  - [ ] Tournament round numbers display correctly

- [ ] **Tournament Features:**
  - [ ] Tournament badge shows on debate cards
  - [ ] Tournament round number (not debate's 1/1)
  - [ ] Tournament bracket visualization
  - [ ] Tournament subscription button

## Common Issues

### Issue: "Unable to connect to Metro bundler"
**Solution:** 
- Make sure Expo server is running (`npm start`)
- Check firewall settings
- Try `expo start --tunnel` for network issues

### Issue: "Network request failed"
**Solution:**
- Update `API_URL` in `mobile/src/services/api.ts` with your local IP
- Make sure web server is running on port 3000
- Check that phone and computer are on same WiFi

### Issue: "Module not found"
**Solution:**
- Run `npm install` again
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall

### Issue: "Expo Go app crashes"
**Solution:**
- Check console for errors
- Make sure all dependencies are installed
- Try clearing Expo Go app cache
- Restart Expo server

## Debugging

### View Logs:
- **Terminal:** Logs appear in the terminal where you ran `npm start`
- **Expo DevTools:** Press `j` to open in browser
- **React Native Debugger:** Install and connect for advanced debugging

### Enable Debug Mode:
- Shake device (or press `Cmd+D` on iOS simulator, `Cmd+M` on Android)
- Select "Debug Remote JS"
- Open Chrome DevTools at `chrome://inspect`

### Check Network Requests:
- Open Expo DevTools (press `j`)
- Go to Network tab
- Monitor API calls to see if they're reaching your server

## Testing Specific Features

### Test Tournaments:
1. Create a tournament on web app
2. Open mobile app → Tournaments tab
3. Verify tournament appears
4. Join tournament
5. Check tournament detail screen
6. Verify bracket/leaderboard displays

### Test Live Battle:
1. Start a debate on web app
2. Open mobile app
3. Check if Live Battle panel appears on Home screen
4. Tap to navigate to debate

### Test Past Debates:
1. Complete a debate on web app
2. Open mobile app → Profile
3. Scroll to "Past Debates" section
4. Verify debate appears with correct info

## Production Testing

Before deploying to App Store/Google Play:

1. **Test on physical devices** (both iOS and Android)
2. **Test all major features**
3. **Test with slow network** (throttle in DevTools)
4. **Test with no network** (airplane mode)
5. **Test notifications** (if implemented)
6. **Test deep linking** (if implemented)

## Quick Start Commands

```bash
# Start development server
npm start

# Start for iOS
npm run ios

# Start for Android
npm run android

# Start for web
npm run web

# Clear cache and restart
expo start -c

# Start with tunnel (for network issues)
expo start --tunnel
```

## API Configuration

Make sure your API URL is correct in `mobile/src/services/api.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.152:3000/api'  // Your local IP
  : 'https://www.argufight.com/api';  // Production
```

**To find your local IP:**
- Windows: `ipconfig` → Look for "IPv4 Address"
- Mac/Linux: `ifconfig` → Look for "inet" under your WiFi adapter

## Need Help?

- Check Expo documentation: https://docs.expo.dev/
- Check React Native documentation: https://reactnative.dev/
- Check terminal logs for error messages
- Check browser console if using web version

# Mobile App Loading Screen Fix

## Issue
The app was stuck on the loading screen because:
1. The `refreshUser()` API call was blocking the app startup
2. The API call was timing out (backend not accessible or wrong IP)

## Fix Applied

1. ✅ Made `refreshUser()` non-blocking - app now continues even if API is unavailable
2. ✅ Added 5-second timeout to API calls to prevent indefinite hanging
3. ✅ App now uses cached user data if API is unavailable

## Next Steps

### 1. Verify Backend is Running
```powershell
# In the main project directory (not mobile/)
npm run dev
```

The server should show:
```
▲ Next.js 16.0.6
- Local:         http://localhost:3000
- Network:       http://192.168.1.152:3000
```

### 2. Verify IP Address
```powershell
# Check your current IP
ipconfig
```

Look for "IPv4 Address" - it should match `192.168.1.152` in `mobile/src/services/api.ts`

### 3. Test Connection
- On your phone's browser, try: `http://192.168.1.152:3000`
- If it loads, the IP is correct
- If not, update the IP in `mobile/src/services/api.ts`

### 4. Restart Expo
```powershell
cd mobile
npx expo start -c
```

The `-c` flag clears the cache.

## Current Status

✅ **App will no longer hang on loading screen**
- If API is available: User data refreshes
- If API is unavailable: App uses cached data and continues

The app should now load even if the backend isn't running!


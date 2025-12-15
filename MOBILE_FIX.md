# Mobile App Fix - Missing Dependencies

## Issue
The mobile app was missing `babel-preset-expo` and had outdated package versions.

## Fix Applied
1. ✅ Added `babel-preset-expo` to devDependencies
2. ✅ Updated `expo-haptics` to `~15.0.7` (compatible with Expo 54)
3. ✅ Updated `expo-notifications` to `~0.32.13` (compatible with Expo 54)

## Next Steps

Run these commands:

```powershell
cd mobile
npm install
npx expo start
```

The app should now bundle correctly!







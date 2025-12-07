# Mobile App - Next Steps Guide

## ✅ What's Been Built

Your mobile app now has a complete foundation:

### 1. **Navigation System** ✅
- React Navigation with Stack and Bottom Tabs
- Protected routes (shows auth screens when logged out, main app when logged in)
- Bottom tab navigation with 4 main sections

### 2. **Authentication** ✅
- Login screen with email/password
- Signup screen with username, email, and password
- AuthContext for global user state management
- Token storage with AsyncStorage
- Auto-login on app restart

### 3. **API Service Layer** ✅
- Axios-based API client
- Automatic token injection
- Error handling
- Ready to connect to your backend

### 4. **Main Screens** ✅
- **Home** - Welcome screen (Arena)
- **Debates** - Active debates list (placeholder)
- **Leaderboard** - Top debaters (placeholder)
- **Profile** - User profile with stats and logout

## 🔧 Configuration Needed

### 1. Update API URL

Edit `mobile/src/services/api.ts`:

```typescript
const API_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:3000/api'  // Change this!
  : 'https://your-production-url.com/api';
```

**For local development:**
- Find your computer's local IP address (e.g., `192.168.1.152`)
- Update the URL to: `http://192.168.1.152:3000/api`
- Make sure your phone and computer are on the same WiFi network

### 2. Backend API Endpoints Expected

Your backend should have these endpoints:

```
POST /api/auth/login
  Body: { email, password }
  Returns: { token, user }

POST /api/auth/signup
  Body: { email, password, username }
  Returns: { token, user }

POST /api/auth/logout
  Headers: { Authorization: "Bearer <token>" }

GET /api/auth/me
  Headers: { Authorization: "Bearer <token>" }
  Returns: { user }
```

## 🚀 Testing the App

1. **Start your backend server** (if not running):
   ```bash
   npm run dev
   ```

2. **Update the API URL** in `mobile/src/services/api.ts`

3. **Start Expo**:
   ```bash
   cd mobile
   npx expo start -c
   ```

4. **Test the flow**:
   - You should see the Login screen
   - Try signing up with a new account
   - After login, you'll see the bottom tab navigation
   - Navigate between Home, Debates, Leaderboard, and Profile
   - Test logout from Profile screen

## 📱 Next Development Steps

### Phase 1: Connect to Real Data
1. **Debates Screen**
   - Fetch debates from `/api/debates`
   - Display debate cards
   - Add pull-to-refresh

2. **Home Screen**
   - Show trending debates
   - Add "Create Debate" button
   - Display live debates feed

3. **Leaderboard Screen**
   - Fetch leaderboard from `/api/leaderboard`
   - Display top users with ELO ratings

### Phase 2: Debate Features
1. **Debate Detail Screen**
   - Create debate detail view
   - Show rounds and arguments
   - Submit argument functionality

2. **Create Debate Screen**
   - Form to create new debates
   - Category selection
   - Topic input

### Phase 3: Enhanced Features
1. **Notifications**
   - Push notifications setup
   - Notification center

2. **Profile Enhancement**
   - Edit profile
   - Avatar upload
   - View debate history

3. **Search & Filters**
   - Search debates
   - Filter by category
   - Sort options

## 🐛 Troubleshooting

### "Network Error" when trying to login
- Check that your backend is running
- Verify the API URL in `api.ts` matches your backend
- Make sure your phone and computer are on the same network
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Navigation not working
- Make sure `react-native-gesture-handler` is properly installed
- Check that all screen components are exported correctly

### Token not persisting
- Verify AsyncStorage is working
- Check that token is being saved in the login response

## 📁 File Structure

```
mobile/
├── App.tsx                    # Main entry point
├── src/
│   ├── context/
│   │   └── AuthContext.tsx    # User authentication state
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation setup
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignupScreen.tsx
│   │   ├── Home/
│   │   │   └── HomeScreen.tsx
│   │   ├── Debates/
│   │   │   └── DebatesScreen.tsx
│   │   ├── Profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── Leaderboard/
│   │       └── LeaderboardScreen.tsx
│   └── services/
│       └── api.ts             # API client
```

## 🎨 Design Notes

- **Theme**: Dark/black cyberpunk aesthetic
- **Colors**: 
  - Background: `#000`
  - Text: `#fff`
  - Secondary text: `#888`
  - Borders: `#333`
  - Buttons: `#fff` on `#000`

## 📚 Resources

- [React Navigation Docs](https://reactnavigation.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)

---

**Ready to build!** Start by updating the API URL and testing the authentication flow. Then gradually add features to each screen.





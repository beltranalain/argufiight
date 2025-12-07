# Fixes and Features Scope

## Issues to Fix

### 1. ✅ Profile Pictures Not Saving
**Problem**: Profile pictures are not saving on Vercel because they're using local filesystem.

**Solution**: 
- Migrated `/api/profile/avatar` to use Vercel Blob Storage
- Added fallback to base64 data URL if Blob Storage not configured
- Same pattern as content images

**Status**: Fixed

---

### 2. 🔄 Debate Images Not Showing in Open Challenges/Live Battles
**Problem**: Debate images are not visible in the challenge/battle lists.

**Investigation**:
- API endpoint `/api/debates` DOES include images in response (lines 78-89)
- `ChallengesPanel` component DOES render images (lines 271-291)
- `LiveBattlePanel` component DOES render images (lines 107-127)

**Possible Issues**:
- Images might not be saved correctly when creating debates
- Image URLs might be broken (Blob Storage URLs not loading)
- Images might not be included in the specific API query used

**Solution**: 
- Verify debate creation saves images correctly
- Check image URL format (should be Blob Storage URLs)
- Ensure images are included in all debate list queries

**Status**: In Progress

---

### 3. 🔄 Turn Notification Logic
**Problem**: Users don't know when it's their turn to submit arguments.

**Current Implementation**:
- Turn detection logic exists in `LiveBattlePanel` (lines 91-94)
- Notifications are created when it's user's turn (see `app/api/debates/[id]/statements/route.ts`)
- Notification type: `YOUR_TURN` and `DEBATE_TURN`

**Possible Issues**:
- Turn detection might not be accurate
- Notifications might not be displayed prominently
- No visual indicator on debate page

**Solution**:
- Improve turn detection logic
- Add prominent "Your Turn" banner on debate page
- Ensure notifications are sent correctly
- Add to notification ticker (see feature #5)

**Status**: In Progress

---

### 4. 🔄 Admin Dashboard API Sync
**Problem**: Admin dashboard APIs not synced - shouldn't need to add all APIs in Vercel settings.

**Investigation Needed**:
- Check which APIs are being referenced
- Verify environment variables are properly set
- Check if APIs are using correct endpoints

**Status**: Pending Investigation

---

## New Feature: ESPN-Style Notification Ticker

### Overview
An animated scrolling notification bar at the top or bottom of the page that displays all user notifications in real-time, similar to ESPN's ticker.

### Features

1. **Animated Scrolling**
   - Continuous horizontal scroll of notifications
   - Smooth animation
   - Pause on hover

2. **Notification Types**
   - **Your Turn** - When it's user's turn in a debate (Orange/Red highlight)
   - **Verdict Ready** - When verdicts are generated (Green highlight)
   - **Appeal Status** - When appeal is submitted/resolved (Yellow highlight)
   - **New Challenge** - When someone challenges you (Blue highlight)
   - **Rematch Request** - When rematch is requested (Purple highlight)
   - **General Notifications** - Other notifications (Default color)

3. **Color Coding**
   - **New/Unread**: Bright, attention-grabbing color (e.g., neon orange, electric blue)
   - **Read**: Muted color (e.g., gray)
   - **Urgent** (Your Turn): Pulsing red/orange
   - **Success** (Verdict Ready): Green
   - **Warning** (Appeal): Yellow

4. **Interaction**
   - Click notification to navigate to relevant page
   - Hover to pause scroll
   - Close button to dismiss individual notifications
   - Settings to toggle ticker on/off

5. **Position**
   - Top or bottom of page (configurable)
   - Fixed position (stays visible when scrolling)
   - Responsive (hides on mobile if needed)

6. **Real-time Updates**
   - Polls for new notifications every 30 seconds
   - WebSocket support (future enhancement)
   - Highlights new notifications with color change

### Technical Implementation

**Components Needed**:
- `NotificationTicker.tsx` - Main ticker component
- `NotificationItem.tsx` - Individual notification item
- `useNotifications.ts` - Hook for fetching notifications
- API endpoint: `/api/notifications` (already exists)

**Styling**:
- Dark theme to match app
- Smooth CSS animations
- Color-coded badges
- Responsive design

**Performance**:
- Limit to last 20 notifications
- Virtual scrolling for many notifications
- Debounce API calls

### User Experience
- Non-intrusive but visible
- Easy to ignore if not interested
- Clear visual hierarchy
- Accessible (keyboard navigation, screen readers)

---

## Priority Order

1. ✅ Fix profile picture upload (DONE)
2. Fix debate images display
3. Fix turn notification logic
4. Check admin dashboard API sync
5. Implement notification ticker feature

---

## Testing Checklist

- [ ] Profile pictures save and display correctly
- [ ] Debate images show in Open Challenges
- [ ] Debate images show in Live Battles
- [ ] Turn notifications work correctly
- [ ] "Your Turn" indicator appears on debate page
- [ ] Admin dashboard APIs work without manual Vercel config
- [ ] Notification ticker displays correctly
- [ ] Notification ticker scrolls smoothly
- [ ] Notification ticker color changes for new notifications
- [ ] Notification ticker is clickable and navigates correctly
- [ ] Notification ticker is responsive



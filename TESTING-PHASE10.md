# Testing Guide: Phase 10 - Testing & Optimization

## Overview
Comprehensive testing checklist for all platform features before launch.

---

## 1. Authentication & User Management

### 1.1 User Registration
- [ ] Can create new account with email and password
- [ ] Password validation works (min length, strength)
- [ ] Email validation works
- [ ] Duplicate email detection works
- [ ] Redirects to homepage after signup
- [ ] User session is created correctly

### 1.2 User Login
- [ ] Can login with correct credentials
- [ ] Invalid credentials show error
- [ ] Session persists across page refreshes
- [ ] Session expires correctly
- [ ] Redirects to homepage after login

### 1.3 User Logout
- [ ] Logout button works
- [ ] Session is cleared
- [ ] Redirects to login page
- [ ] Cannot access protected routes after logout

### 1.4 Profile Management
- [ ] Can view own profile (`/profile`)
- [ ] Can edit username
- [ ] Can edit bio
- [ ] Can upload profile picture
- [ ] Profile picture displays correctly
- [ ] Stats display correctly (ELO, Wins, Losses, Total)
- [ ] Can view other users' profiles (`/profile/[id]`)
- [ ] Follow/Unfollow works on other profiles

### 1.5 Settings
- [ ] Can access settings page (`/settings`)
- [ ] Can change password
- [ ] Password change requires current password
- [ ] Email notifications toggle works
- [ ] Debate notifications toggle works

---

## 2. Debate System

### 2.1 Debate Creation
- [ ] Can open create debate modal
- [ ] Can enter topic (required, max 200 chars)
- [ ] Can enter description (optional, max 1000 chars)
- [ ] Can select category
- [ ] Can select position (FOR/AGAINST)
- [ ] Can select challenge type (OPEN/DIRECT/GROUP)
- [ ] Can search and select users for DIRECT/GROUP challenges
- [ ] Form validation works
- [ ] Creates debate successfully
- [ ] Notification sent to invited users (if applicable)
- [ ] Redirects to debate page after creation

### 2.2 Challenge Acceptance
- [ ] Can view open challenges
- [ ] Can view direct/group invitations
- [ ] Can accept challenge
- [ ] Debate status changes to ACTIVE
- [ ] Both users can see debate is active
- [ ] Round deadline is set correctly

### 2.3 Argument Submission
- [ ] Can submit Round 1 argument
- [ ] Can submit Round 2 argument
- [ ] Can submit Round 3 argument
- [ ] Character limits enforced
- [ ] Cannot submit after deadline
- [ ] Cannot submit out of order
- [ ] Opponent sees new arguments
- [ ] Live chat updates during debate

### 2.4 Debate Completion
- [ ] Debate auto-completes after all rounds
- [ ] Status changes to COMPLETED
- [ ] Verdict generation is triggered
- [ ] Users are notified when verdict is ready

---

## 3. AI Verdict System

### 3.1 Verdict Generation
- [ ] Verdict generates after debate completion
- [ ] 3 judges provide verdicts
- [ ] Each judge has unique personality
- [ ] Scores are calculated correctly
- [ ] Winner is determined correctly
- [ ] Tie handling works correctly
- [ ] Verdict status changes to VERDICT_READY

### 3.2 Verdict Display
- [ ] All 3 judge verdicts display
- [ ] Judge names and personalities show
- [ ] Scores display correctly
- [ ] Reasoning displays for each judge
- [ ] Winner badge shows correct user
- [ ] Winner profile picture displays
- [ ] "You Win!" animation shows for winner
- [ ] "You Lost" message shows for loser
- [ ] Fireworks animation works for winner

### 3.3 ELO Updates
- [ ] ELO updates after verdict
- [ ] Winner gains ELO
- [ ] Loser loses ELO
- [ ] ELO changes are reasonable
- [ ] User stats update (Wins, Losses, Total)
- [ ] Leaderboard updates

---

## 4. Appeal System

### 4.1 Appeal Submission
- [ ] Only loser can appeal
- [ ] Appeal button shows for loser
- [ ] Appeal button hidden for winner
- [ ] Can only appeal once per debate
- [ ] 48-hour window enforced
- [ ] Must select judge verdicts to appeal (2+)
- [ ] Must provide appeal reason (50+ chars)
- [ ] Appeal reason validation works
- [ ] Appeal submits successfully
- [ ] Appeal status shows as PENDING

### 4.2 Appeal Processing
- [ ] New verdict generates with different judges
- [ ] Appeal status changes to PROCESSING
- [ ] Appeal status changes to RESOLVED
- [ ] Original verdicts still visible
- [ ] Appeal verdicts display separately
- [ ] Verdict filtering works (3 original, 3 appeal)

### 4.3 Appeal Outcomes
- [ ] Verdict flip detection works
- [ ] ELO updates only if verdict flips
- [ ] Winner profile picture updates correctly
- [ ] Appeal rejection reason displays if verdict doesn't change
- [ ] Appeal approval message displays if verdict changes
- [ ] Final verdict is marked correctly

---

## 5. Social Features

### 5.1 Comments
- [ ] Can view comments on debate page
- [ ] Can add comment
- [ ] Can reply to comment
- [ ] Can delete own comment
- [ ] Comments display in chronological order
- [ ] Nested replies display correctly

### 5.2 Likes
- [ ] Can like/unlike debate
- [ ] Like count updates
- [ ] Like persists after page refresh
- [ ] Cannot like own debate (if applicable)

### 5.3 Saves
- [ ] Can save debate
- [ ] Can unsave debate
- [ ] Saved debates appear in profile
- [ ] Save persists after page refresh

### 5.4 Shares
- [ ] Can share debate
- [ ] Share modal opens
- [ ] Can copy link
- [ ] Native share works (if available)
- [ ] Share count updates

### 5.5 Follow
- [ ] Can follow user
- [ ] Can unfollow user
- [ ] Follower count updates
- [ ] Following count updates
- [ ] Follow status persists

---

## 6. Notifications

### 6.1 Notification Display
- [ ] Notification bell shows unread count
- [ ] Unread count updates automatically
- [ ] Can open notifications modal
- [ ] All notifications display
- [ ] Unread notifications highlighted

### 6.2 Notification Types
- [ ] Debate invitation notifications
- [ ] Challenge accepted notifications
- [ ] Verdict ready notifications
- [ ] Appeal submitted notifications
- [ ] Appeal resolved notifications
- [ ] Comment reply notifications

### 6.3 Notification Actions
- [ ] Can mark notification as read
- [ ] Can mark all as read
- [ ] Can click notification to navigate
- [ ] Read status persists

---

## 7. Live Chat

### 7.1 Chat Functionality
- [ ] Chat displays during active debates
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Messages persist after refresh
- [ ] Can see other users' messages
- [ ] Message timestamps display

### 7.2 Chat UI
- [ ] Chat scrolls to bottom on new message
- [ ] Chat input works
- [ ] Character limits enforced
- [ ] Chat is responsive

---

## 8. Leaderboard

### 8.1 Leaderboard Display
- [ ] Leaderboard page loads (`/leaderboard`)
- [ ] Top users display correctly
- [ ] ELO rankings are correct
- [ ] User avatars display
- [ ] Stats display correctly

### 8.2 Leaderboard Updates
- [ ] Updates after ELO changes
- [ ] Sorted correctly by ELO
- [ ] Pagination works (if applicable)

---

## 9. Admin Dashboard

### 9.1 Dashboard Overview
- [ ] Can access admin dashboard (`/admin`)
- [ ] Stats display correctly (Users, Debates, Active, Completed)
- [ ] Recent debates display
- [ ] Can click debate to view details
- [ ] Status formatting works (no underscores)
- [ ] Winner displays in recent debates

### 9.2 User Management
- [ ] Can view all users
- [ ] Can edit user
- [ ] Can ban/unban user
- [ ] Can distinguish employees from users
- [ ] Total users count is correct

### 9.3 Debate Management
- [ ] Can view all debates
- [ ] Can filter debates
- [ ] Can view debate details in modal
- [ ] Modal doesn't navigate away

### 9.4 Moderation
- [ ] Can view moderation queue
- [ ] Can review reports
- [ ] Can approve/remove content
- [ ] AI moderation works

### 9.5 API Usage
- [ ] API usage page loads
- [ ] Stats display correctly
- [ ] Records display
- [ ] Cost calculations correct

### 9.6 Features
- [ ] Feature flags page loads
- [ ] Can toggle features
- [ ] Features respect flags

### 9.7 Categories
- [ ] Categories page loads
- [ ] Can view category tabs
- [ ] Can add category
- [ ] Can edit category
- [ ] Analytics load per category
- [ ] Recent debates table displays

### 9.8 LLM Models
- [ ] LLM Models page loads
- [ ] Overview tab works
- [ ] Analytics tab works
- [ ] Training Data tab works
- [ ] Can create model version
- [ ] Can create A/B test
- [ ] Metrics display

### 9.9 Settings
- [ ] Settings page loads
- [ ] Can update API keys
- [ ] Can test API keys
- [ ] Maintenance mode toggle works
- [ ] New signups toggle works

---

## 10. Performance

### 10.1 Page Load Times
- [ ] Homepage loads < 2s
- [ ] Debate page loads < 3s
- [ ] Admin pages load < 2s
- [ ] Profile page loads < 2s

### 10.2 API Response Times
- [ ] API endpoints respond < 500ms
- [ ] Verdict generation < 30s
- [ ] Database queries optimized

### 10.3 Image Optimization
- [ ] Profile pictures load efficiently
- [ ] Images are optimized
- [ ] Lazy loading works

---

## 11. Mobile Responsiveness

### 11.1 Homepage
- [ ] Layout adapts to mobile
- [ ] Navigation works on mobile
- [ ] Panels stack vertically
- [ ] Touch interactions work

### 11.2 Debate Page
- [ ] Debate content readable on mobile
- [ ] Comments section works
- [ ] Live chat works
- [ ] Forms are usable

### 11.3 Admin Dashboard
- [ ] Admin nav works on mobile
- [ ] Tables are scrollable
- [ ] Modals work on mobile
- [ ] Forms are usable

---

## 12. Error Handling

### 12.1 API Errors
- [ ] 401 errors handled (unauthorized)
- [ ] 403 errors handled (forbidden)
- [ ] 404 errors handled (not found)
- [ ] 500 errors handled (server error)
- [ ] Error messages are user-friendly

### 12.2 Form Validation
- [ ] Required fields validated
- [ ] Character limits enforced
- [ ] Email format validated
- [ ] Password strength validated

### 12.3 Network Errors
- [ ] Offline state handled
- [ ] Timeout errors handled
- [ ] Retry logic works

---

## 13. Security

### 13.1 Authentication
- [ ] Passwords are hashed
- [ ] Sessions are secure
- [ ] JWT tokens are valid
- [ ] CSRF protection works

### 13.2 Authorization
- [ ] Users can only access own data
- [ ] Admin routes protected
- [ ] API routes protected
- [ ] Debate participants only

### 13.3 Input Validation
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] File uploads validated
- [ ] API inputs sanitized

---

## 14. SEO & Metadata

### 14.1 Page Titles
- [ ] Homepage has title
- [ ] Debate pages have titles
- [ ] Profile pages have titles
- [ ] Admin pages have titles

### 14.2 Meta Descriptions
- [ ] Pages have descriptions
- [ ] Descriptions are relevant
- [ ] Descriptions are unique

### 14.3 Open Graph
- [ ] OG tags present
- [ ] OG images set
- [ ] OG descriptions set

---

## 15. Cross-Browser Compatibility

### 15.1 Chrome
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

### 15.2 Firefox
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

### 15.3 Safari
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

### 15.4 Edge
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

---

## Testing Notes

### Issues Found
- [Document any bugs or issues found during testing]

### Performance Issues
- [Document any performance problems]

### Security Concerns
- [Document any security issues]

---

## Next Steps After Testing

1. Fix all critical bugs
2. Address performance issues
3. Implement SEO metadata
4. Complete security audit
5. Final mobile responsiveness check
6. Prepare for deployment











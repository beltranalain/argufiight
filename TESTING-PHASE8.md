# PHASE 8 TESTING GUIDE

## Overview

This guide covers testing for Phase 8 features:
- **Appeal System** - Verdict appeals with re-judging
- **ELO Leaderboard** - Top users ranking
- **Live Chat** - Real-time chat during debates

---

## PREREQUISITES

Before testing, ensure:
- ✅ At least 2 user accounts created
- ✅ At least 1 completed debate with a verdict
- ✅ Users have different ELO ratings (complete some debates)
- ✅ Database is seeded with judges

---

## 1. APPEAL SYSTEM TESTING

### Test 1.1: Submit an Appeal (Loser)

**Steps:**
1. Log in as a user who **lost** a debate
2. Navigate to a debate with status `VERDICT_READY`
3. Verify you see the "Appeal Verdict" button
4. Click "Appeal Verdict"
5. Review the confirmation modal
6. Click "Submit Appeal"

**Expected Results:**
- ✅ Appeal button shows time remaining (e.g., "47h 30m remaining")
- ✅ Modal explains appeal rules
- ✅ After submission, button disappears
- ✅ Status message shows "Appeal Submitted" or "Processing Appeal"
- ✅ Debate status changes to `APPEALED`
- ✅ Notification sent to opponent

**Check Database:**
```sql
SELECT id, status, appealStatus, appealCount, appealedBy, originalWinnerId 
FROM debates 
WHERE id = '<debate-id>';
```

### Test 1.2: Appeal Window Expiration

**Steps:**
1. Find a debate with verdict older than 48 hours
2. Try to appeal it

**Expected Results:**
- ✅ Appeal button should NOT appear
- ✅ If API is called directly, should return error: "Appeal window has expired"

### Test 1.3: Already Appealed

**Steps:**
1. Appeal a debate (Test 1.1)
2. Try to appeal the same debate again

**Expected Results:**
- ✅ Appeal button should NOT appear
- ✅ If API is called directly, should return error: "This debate has already been appealed"

### Test 1.4: Winner Cannot Appeal

**Steps:**
1. Log in as a user who **won** a debate
2. Navigate to the debate page

**Expected Results:**
- ✅ Appeal button should NOT appear
- ✅ If API is called directly, should return error: "Winners cannot appeal verdicts"

### Test 1.5: Appeal Verdict Generation

**Steps:**
1. Submit an appeal (Test 1.1)
2. Wait for verdict regeneration (may take 30-60 seconds)
3. Refresh the debate page

**Expected Results:**
- ✅ New verdicts generated with different judges
- ✅ Appeal status changes to `RESOLVED`
- ✅ Debate status changes back to `VERDICT_READY`
- ✅ New winner determined (may be same or different)
- ✅ If verdict flipped, ELO ratings updated
- ✅ Notifications sent to both participants
- ✅ VerdictDisplay shows "Appeal Verdict (Final)" banner

**Check Database:**
```sql
-- Check new verdicts
SELECT v.*, j.name as judge_name 
FROM verdicts v 
JOIN judges j ON v.judge_id = j.id 
WHERE v.debate_id = '<debate-id>' 
ORDER BY v.created_at DESC;

-- Check if ELO changed
SELECT id, username, elo_rating, debates_won, debates_lost 
FROM users 
WHERE id IN ('<challenger-id>', '<opponent-id>');
```

### Test 1.6: Appeal Status Display

**Steps:**
1. View a debate with appeal status `PENDING` or `PROCESSING`
2. View a debate with appeal status `RESOLVED`

**Expected Results:**
- ✅ PENDING/PROCESSING: Shows blue banner with status message
- ✅ RESOLVED: Shows "Appeal Verdict (Final)" in VerdictDisplay
- ✅ If verdict flipped, shows "The verdict has changed!" message

---

## 2. LEADERBOARD TESTING

### Test 2.1: View Leaderboard on Homepage

**Steps:**
1. Log in to the application
2. Navigate to homepage (`/`)
3. Scroll to the "ELO Leaderboard" panel in the right sidebar

**Expected Results:**
- ✅ Top 10 users displayed
- ✅ Ranked by ELO rating (highest first)
- ✅ Shows username, avatar, ELO, and win rate
- ✅ Medal badges for top 3 (🥇 🥈 🥉)
- ✅ Current user highlighted with blue background and "You" badge
- ✅ "View All" link present

### Test 2.2: Leaderboard API

**Steps:**
1. Open browser DevTools
2. Navigate to Network tab
3. Visit homepage
4. Find request to `/api/leaderboard`

**Expected Results:**
- ✅ Returns array of users
- ✅ Sorted by ELO descending
- ✅ Each entry has: rank, id, username, avatarUrl, eloRating, winRate, stats
- ✅ Excludes admins and banned users
- ✅ Only includes users with at least 1 completed debate

**Test API Directly:**
```bash
# Get top 10
curl http://localhost:3000/api/leaderboard?limit=10

# Get top 100
curl http://localhost:3000/api/leaderboard?limit=100
```

### Test 2.3: Leaderboard Updates

**Steps:**
1. Complete a debate that changes ELO ratings
2. Refresh homepage
3. Check leaderboard

**Expected Results:**
- ✅ Rankings update based on new ELO
- ✅ User positions may change
- ✅ Win rates recalculated

### Test 2.4: Empty Leaderboard

**Steps:**
1. Clear all debates from database (or use fresh database)
2. View homepage

**Expected Results:**
- ✅ Shows "No Rankings Yet" empty state
- ✅ Message: "Complete debates to appear on the leaderboard"

---

## 3. LIVE CHAT TESTING

### Test 3.1: Send and Receive Messages

**Prerequisites:**
- Two users logged in (use different browsers/incognito)
- One active debate where both users are participants

**Steps:**
1. User A: Navigate to debate page
2. User A: Type a message in chat
3. User A: Click "Send"
4. User B: Refresh debate page (or wait 3 seconds)
5. User B: Type a reply
6. User B: Click "Send"
7. User A: Wait 3 seconds (auto-refresh)

**Expected Results:**
- ✅ Messages appear in real-time (within 3 seconds)
- ✅ Messages show sender avatar and username
- ✅ Own messages appear on right (blue background)
- ✅ Other user's messages appear on left (grey background)
- ✅ Timestamps displayed
- ✅ Character counter shows (e.g., "150/1000 characters")
- ✅ Chat scrolls to bottom on new messages

### Test 3.2: Chat Restrictions

**Test 3.2a: Non-Participant Cannot Chat**

**Steps:**
1. Log in as user NOT in the debate
2. Navigate to debate page
3. Try to send a message

**Expected Results:**
- ✅ Chat should NOT be visible
- ✅ If API is called directly, should return 403: "You are not a participant"

**Test 3.2b: Chat Only in Active Debates**

**Steps:**
1. Navigate to a debate with status `WAITING`
2. Try to access chat

**Expected Results:**
- ✅ Chat should NOT be visible or disabled
- ✅ If API is called directly, should return 400: "Chat is only available for active or completed debates"

### Test 3.3: Message Validation

**Steps:**
1. Try to send empty message
2. Try to send message with only spaces
3. Try to send message over 1000 characters

**Expected Results:**
- ✅ Empty message: Send button disabled
- ✅ Spaces only: Send button disabled
- ✅ Over 1000 chars: Character limit enforced, error message

### Test 3.4: Chat Auto-Refresh

**Steps:**
1. User A: Open debate page
2. User B: Send a message (in different browser)
3. Wait 3-5 seconds
4. Check User A's chat

**Expected Results:**
- ✅ New message appears automatically (no manual refresh needed)
- ✅ Chat scrolls to show new message

### Test 3.5: Chat Message History

**Steps:**
1. Send several messages in a debate
2. Refresh the page
3. Check chat

**Expected Results:**
- ✅ All previous messages still visible
- ✅ Messages in chronological order
- ✅ All avatars and usernames correct

---

## 4. INTEGRATION TESTING

### Test 4.1: Complete Appeal Flow

**Full End-to-End Test:**

1. **Setup:**
   - Create debate between User A and User B
   - Complete all rounds
   - Generate verdict (User A wins)

2. **Appeal:**
   - User B logs in
   - Views debate
   - Clicks "Appeal Verdict"
   - Submits appeal

3. **Wait for Re-verdict:**
   - Wait 30-60 seconds
   - Refresh page

4. **Verify:**
   - New verdict generated
   - If User B wins appeal: ELO updated, stats updated
   - If User A still wins: ELO unchanged
   - Both users receive notifications

### Test 4.2: Chat During Active Debate

**Steps:**
1. User A creates debate
2. User B accepts challenge
3. Both users navigate to debate page
4. Both users send messages in chat
5. Continue debate (submit arguments)
6. Verify chat still works during active debate

**Expected Results:**
- ✅ Chat works throughout debate lifecycle
- ✅ Messages persist after page refresh
- ✅ Both users can see all messages

### Test 4.3: Leaderboard Updates After Appeal

**Steps:**
1. Note current leaderboard rankings
2. Complete an appeal that flips verdict
3. Check leaderboard

**Expected Results:**
- ✅ ELO changes reflected in leaderboard
- ✅ Rankings may shift
- ✅ Win rates updated

---

## 5. EDGE CASES & ERROR HANDLING

### Test 5.1: Appeal Edge Cases

**Test 5.1a: All Judges Used**
- If all 7 judges were used in original verdict
- Appeal should still work (reuse judges if needed)

**Test 5.1b: Appeal Fails to Generate Verdict**
- Simulate API failure
- Appeal status should be `DENIED`
- Error logged but doesn't crash

**Test 5.1c: Appeal Verdict Same as Original**
- If new verdict is same as original
- ELO should NOT change
- Appeal status should be `RESOLVED`

### Test 5.2: Chat Edge Cases

**Test 5.2a: Very Long Messages**
- Test with 999 characters
- Test with exactly 1000 characters
- Test with 1001 characters (should be blocked)

**Test 5.2b: Special Characters**
- Test with emojis
- Test with line breaks
- Test with HTML tags (should be escaped)

**Test 5.2c: Rapid Messages**
- Send multiple messages quickly
- Verify all appear correctly
- Verify no duplicates

### Test 5.3: Leaderboard Edge Cases

**Test 5.3a: Users with Same ELO**
- Multiple users with identical ELO
- Should rank consistently (by creation date or ID)

**Test 5.3b: Users with Zero Debates**
- Should NOT appear in leaderboard
- Only users with `totalDebates >= 1`

**Test 5.3c: Banned Users**
- Banned users should NOT appear
- Even if they have high ELO

---

## 6. PERFORMANCE TESTING

### Test 6.1: Leaderboard Performance

**Steps:**
1. Create 100+ users with debates
2. Load homepage
3. Check load time

**Expected Results:**
- ✅ Leaderboard loads in < 500ms
- ✅ Only top 10 fetched (not all users)

### Test 6.2: Chat Performance

**Steps:**
1. Send 100+ messages in a debate
2. Load debate page
3. Check load time

**Expected Results:**
- ✅ All messages load in < 1 second
- ✅ Auto-refresh doesn't cause lag
- ✅ Scrolling is smooth

---

## 7. UI/UX TESTING

### Test 7.1: Appeal Button UI

**Check:**
- ✅ Button visible only for losers
- ✅ Time remaining updates every minute
- ✅ Button disabled after submission
- ✅ Loading state during submission
- ✅ Success/error toasts appear

### Test 7.2: Leaderboard UI

**Check:**
- ✅ Responsive on mobile
- ✅ Avatars display correctly
- ✅ Current user highlighted
- ✅ Medal badges for top 3
- ✅ "View All" link works

### Test 7.3: Chat UI

**Check:**
- ✅ Chat scrollable
- ✅ Message bubbles styled correctly
- ✅ Own messages vs. other messages visually distinct
- ✅ Input field accessible
- ✅ Character counter visible
- ✅ Send button disabled when appropriate

---

## 8. DATABASE VERIFICATION

### Check Appeal Data

```sql
-- View all appealed debates
SELECT 
  d.id,
  d.topic,
  d.status,
  d.appeal_status,
  d.appeal_count,
  d.appealed_at,
  u1.username as appealed_by_username,
  u2.username as original_winner,
  u3.username as new_winner
FROM debates d
LEFT JOIN users u1 ON d.appealed_by = u1.id
LEFT JOIN users u2 ON d.original_winner_id = u2.id
LEFT JOIN users u3 ON d.winner_id = u3.id
WHERE d.appeal_count > 0
ORDER BY d.appealed_at DESC;
```

### Check Chat Messages

```sql
-- View chat messages for a debate
SELECT 
  cm.id,
  cm.content,
  cm.created_at,
  u.username as author,
  d.topic as debate_topic
FROM chat_messages cm
JOIN users u ON cm.author_id = u.id
JOIN debates d ON cm.debate_id = d.id
WHERE cm.debate_id = '<debate-id>'
ORDER BY cm.created_at ASC;
```

### Check Leaderboard Data

```sql
-- Verify leaderboard query
SELECT 
  id,
  username,
  elo_rating,
  total_debates,
  debates_won,
  debates_lost,
  ROUND((CAST(debates_won AS FLOAT) / NULLIF(total_debates, 0)) * 100, 1) as win_rate
FROM users
WHERE is_admin = 0 
  AND is_banned = 0
  AND total_debates >= 1
ORDER BY elo_rating DESC
LIMIT 10;
```

---

## 9. API TESTING (Manual)

### Test Appeal API

```bash
# Submit appeal (replace with actual IDs)
curl -X POST http://localhost:3000/api/debates/<debate-id>/appeal \
  -H "Cookie: session=<your-session-cookie>" \
  -H "Content-Type: application/json"
```

### Test Chat API

```bash
# Get messages
curl http://localhost:3000/api/debates/<debate-id>/chat \
  -H "Cookie: session=<your-session-cookie>"

# Send message
curl -X POST http://localhost:3000/api/debates/<debate-id>/chat \
  -H "Cookie: session=<your-session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message"}'
```

### Test Leaderboard API

```bash
# Get top 10
curl http://localhost:3000/api/leaderboard?limit=10

# Get top 100
curl http://localhost:3000/api/leaderboard?limit=100
```

---

## 10. QUICK TEST CHECKLIST

### Appeal System
- [ ] Loser can see appeal button
- [ ] Winner cannot see appeal button
- [ ] Appeal button shows time remaining
- [ ] Appeal submission works
- [ ] New verdict generated with different judges
- [ ] ELO updates if verdict flips
- [ ] Appeal status displays correctly
- [ ] Cannot appeal twice
- [ ] Cannot appeal after 48 hours

### Leaderboard
- [ ] Top 10 users displayed on homepage
- [ ] Ranked by ELO correctly
- [ ] Current user highlighted
- [ ] Medal badges for top 3
- [ ] Win rates calculated correctly
- [ ] Empty state shows when no users

### Live Chat
- [ ] Participants can send messages
- [ ] Messages appear in real-time
- [ ] Own messages styled differently
- [ ] Character limit enforced
- [ ] Chat scrolls to bottom
- [ ] Non-participants cannot chat
- [ ] Chat only in active/completed debates
- [ ] Message history persists

---

## TROUBLESHOOTING

### Appeal Not Working
- Check debate status is `VERDICT_READY`
- Check user is the loser
- Check appeal count is 0
- Check verdict date is within 48 hours
- Check console for API errors

### Leaderboard Empty
- Ensure users have completed at least 1 debate
- Check users are not admins or banned
- Verify ELO ratings are set (default 1200)

### Chat Not Appearing
- Verify user is a participant (challenger or opponent)
- Check debate status (must be ACTIVE, COMPLETED, or VERDICT_READY)
- Check browser console for errors
- Verify API route is accessible

### Chat Not Auto-Refreshing
- Check browser console for errors
- Verify polling interval (should be 3 seconds)
- Check network tab for failed requests

---

## NOTES

- Appeal verdict generation may take 30-60 seconds (AI API calls)
- Chat auto-refreshes every 3 seconds
- Leaderboard updates when ELO changes
- All features require authentication
- Test with multiple browser sessions for real-time features

---

**Last Updated:** December 2024  
**Phase:** 8 - Additional Features  
**Status:** Ready for Testing




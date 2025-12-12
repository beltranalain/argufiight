# PHASE 8.5 TESTING GUIDE

## Overview

This guide covers testing for Phase 8.5 features:
- **Like System** - Like/unlike debates
- **Save System** - Bookmark debates
- **Share System** - Share debates
- **Comments System** - Comment on debates with replies
- **Follow System** - Follow/unfollow users
- **Admin Feature Toggles** - Enable/disable features

---

## PREREQUISITES

Before testing, ensure:
- ✅ At least 2 user accounts created
- ✅ At least 1 debate exists (can be any status)
- ✅ Admin account created
- ✅ Development server running: `npm run dev`

---

## 1. LIKE SYSTEM TESTING

### Test 1.1: Like a Debate

**Steps:**
1. Log in as a user
2. Navigate to any debate page
3. Find the Like button (heart icon) in the debate header
4. Click the Like button

**Expected Results:**
- ✅ Button changes color (orange) when liked
- ✅ Like count increases by 1
- ✅ Button shows filled heart icon
- ✅ Toast notification (optional)

### Test 1.2: Unlike a Debate

**Steps:**
1. Like a debate (Test 1.1)
2. Click the Like button again

**Expected Results:**
- ✅ Button returns to normal state
- ✅ Like count decreases by 1
- ✅ Button shows outline heart icon

### Test 1.3: Like Count Persistence

**Steps:**
1. Like a debate
2. Refresh the page
3. Check like count

**Expected Results:**
- ✅ Like count persists after refresh
- ✅ Like status persists (button still shows as liked)

### Test 1.4: Multiple Users Liking

**Steps:**
1. User A: Like a debate
2. User B (different browser): View same debate
3. Check like count

**Expected Results:**
- ✅ Like count shows total from all users
- ✅ Each user sees their own like status

### Test 1.5: Like Without Login

**Steps:**
1. Log out
2. Navigate to debate page
3. Try to like

**Expected Results:**
- ✅ Like button is disabled or shows login prompt
- ✅ Toast: "Please log in to like debates"

---

## 2. SAVE SYSTEM TESTING

### Test 2.1: Save a Debate

**Steps:**
1. Log in as a user
2. Navigate to a debate page
3. Find the Save button (bookmark icon) in the debate header
4. Click the Save button

**Expected Results:**
- ✅ Button changes color (blue) when saved
- ✅ Button shows filled bookmark icon
- ✅ Toast: "Debate Saved - You can find this debate in your saved debates"

### Test 2.2: Unsave a Debate

**Steps:**
1. Save a debate (Test 2.1)
2. Click the Save button again

**Expected Results:**
- ✅ Button returns to normal state
- ✅ Button shows outline bookmark icon
- ✅ Toast: "Debate removed from saved"

### Test 2.3: Save Status Persistence

**Steps:**
1. Save a debate
2. Refresh the page
3. Check save button

**Expected Results:**
- ✅ Save status persists after refresh
- ✅ Button still shows as saved

### Test 2.4: Save Without Login

**Steps:**
1. Log out
2. Navigate to debate page
3. Try to save

**Expected Results:**
- ✅ Save button is disabled or shows login prompt
- ✅ Toast: "Please log in to save debates"

---

## 3. SHARE SYSTEM TESTING

### Test 3.1: Share via Native Share (Mobile)

**Steps:**
1. On mobile device or browser with native share
2. Navigate to a debate page
3. Click the Share button
4. Use native share dialog

**Expected Results:**
- ✅ Native share dialog opens
- ✅ Share URL is pre-filled
- ✅ Share is tracked in database

### Test 3.2: Share via Copy Link (Desktop)

**Steps:**
1. On desktop browser
2. Navigate to a debate page
3. Click the Share button

**Expected Results:**
- ✅ Link copied to clipboard
- ✅ Toast: "Link Copied - Debate link copied to clipboard"
- ✅ Share is tracked in database

### Test 3.3: Share URL Format

**Steps:**
1. Share a debate
2. Check the copied/shared URL

**Expected Results:**
- ✅ URL format: `http://localhost:3000/debate/[debate-id]`
- ✅ URL is correct and accessible

### Test 3.4: Share Without Login

**Steps:**
1. Log out
2. Navigate to debate page
3. Try to share

**Expected Results:**
- ✅ Share button still works (public feature)
- ✅ Share is tracked (if logged in) or anonymous

---

## 4. COMMENTS SYSTEM TESTING

### Test 4.1: Post a Comment

**Steps:**
1. Log in as a user
2. Navigate to a debate page
3. Scroll to Comments section (right sidebar)
4. Type a comment in the textarea
5. Click "Post Comment"

**Expected Results:**
- ✅ Comment appears in comments list
- ✅ Shows user avatar and username
- ✅ Shows timestamp (e.g., "Just now", "5m ago")
- ✅ Toast: "Comment Posted - Your comment has been added"
- ✅ Character counter resets
- ✅ Page scrolls to show new comment

### Test 4.2: Reply to a Comment

**Steps:**
1. Find an existing comment
2. Click "Reply" button
3. Type a reply
4. Click "Reply" button

**Expected Results:**
- ✅ Reply appears nested under parent comment
- ✅ Reply shows with indentation and border
- ✅ Reply shows user avatar and username
- ✅ Toast: "Reply Posted - Your reply has been added"

### Test 4.3: Delete Own Comment

**Steps:**
1. Post a comment (Test 4.1)
2. Find your comment
3. Click "Delete" button
4. Confirm deletion

**Expected Results:**
- ✅ Comment is removed from list
- ✅ Toast: "Comment Deleted - Your comment has been removed"
- ✅ Cannot delete other users' comments

### Test 4.4: Comment Character Limit

**Steps:**
1. Try to post comment with 1001 characters
2. Try to post comment with exactly 1000 characters

**Expected Results:**
- ✅ Character counter shows "1000/1000"
- ✅ Cannot type beyond 1000 characters
- ✅ 1000 character comment posts successfully

### Test 4.5: Empty Comment Validation

**Steps:**
1. Try to post empty comment
2. Try to post comment with only spaces

**Expected Results:**
- ✅ Submit button is disabled
- ✅ Cannot submit empty/whitespace-only comments

### Test 4.6: Comments Without Login

**Steps:**
1. Log out
2. Navigate to debate page
3. Check comments section

**Expected Results:**
- ✅ Comments are visible (read-only)
- ✅ Comment form shows: "Please log in to comment"
- ✅ Cannot post comments

### Test 4.7: Multiple Users Commenting

**Steps:**
1. User A: Post a comment
2. User B (different browser): View same debate
3. User B: Post a comment
4. User A: Refresh page

**Expected Results:**
- ✅ Both comments visible to both users
- ✅ Comments appear in chronological order (newest first)
- ✅ Each user sees all comments

### Test 4.8: Nested Replies Display

**Steps:**
1. Post a comment
2. Reply to that comment
3. Reply to the reply (if supported)

**Expected Results:**
- ✅ Replies are nested under parent
- ✅ Visual indentation shows hierarchy
- ✅ All replies visible and properly formatted

---

## 5. FOLLOW SYSTEM TESTING

### Test 5.1: Follow a User (API Test)

**Steps:**
1. Log in as User A
2. Get User B's user ID
3. Call API: `POST /api/users/[userId]/follow`

**Expected Results:**
- ✅ Returns: `{ success: true, following: true }`
- ✅ User A is now following User B
- ✅ Cannot follow yourself (error if same user)

### Test 5.2: Unfollow a User (API Test)

**Steps:**
1. Follow a user (Test 5.1)
2. Call API: `POST /api/users/[userId]/follow` again

**Expected Results:**
- ✅ Returns: `{ success: true, following: false }`
- ✅ User A is no longer following User B

### Test 5.3: Get Follow Status (API Test)

**Steps:**
1. Follow a user
2. Call API: `GET /api/users/[userId]/follow`

**Expected Results:**
- ✅ Returns: `{ isFollowing: true, followerCount: X, followingCount: Y }`
- ✅ Counts are accurate

### Test 5.4: Follow Counts

**Steps:**
1. User A follows User B
2. User C follows User B
3. Check User B's follow counts

**Expected Results:**
- ✅ `followerCount` = 2 (A and C follow B)
- ✅ `followingCount` = number of users B follows

---

## 6. ADMIN FEATURE TOGGLES TESTING

### Test 6.1: Access Admin Settings

**Steps:**
1. Log in as admin
2. Navigate to `/admin/settings`
3. Scroll to "Feature Flags" section

**Expected Results:**
- ✅ Feature Flags section visible
- ✅ 5 toggles shown:
  - Likes
  - Saves
  - Shares
  - Comments
  - Follows

### Test 6.2: Disable Likes Feature

**Steps:**
1. In admin settings, toggle "Likes" OFF
2. Click "Save Feature Settings"
3. Navigate to a debate page (as regular user)

**Expected Results:**
- ✅ Like button does NOT appear
- ✅ Save and Share buttons still visible
- ✅ Settings saved successfully

### Test 6.3: Disable Comments Feature

**Steps:**
1. In admin settings, toggle "Comments" OFF
2. Click "Save Feature Settings"
3. Navigate to a debate page

**Expected Results:**
- ✅ Comments section shows: "Comments are currently disabled"
- ✅ Comment form not visible
- ✅ Existing comments may or may not be visible (design decision)

### Test 6.4: Re-enable Features

**Steps:**
1. Disable a feature (Test 6.2 or 6.3)
2. Re-enable the feature
3. Save settings
4. Check debate page

**Expected Results:**
- ✅ Feature reappears on debate page
- ✅ Feature works normally

### Test 6.5: Feature Toggle Persistence

**Steps:**
1. Toggle a feature OFF
2. Save settings
3. Refresh admin settings page

**Expected Results:**
- ✅ Toggle state persists (shows OFF)
- ✅ Feature remains disabled on debate pages

---

## 7. INTEGRATION TESTING

### Test 7.1: All Features Together

**Steps:**
1. Ensure all features enabled in admin
2. Navigate to a debate page
3. Test all features in sequence:
   - Like the debate
   - Save the debate
   - Share the debate
   - Post a comment
   - Reply to comment

**Expected Results:**
- ✅ All features work independently
- ✅ No conflicts between features
- ✅ UI remains responsive

### Test 7.2: Feature Flags API

**Steps:**
1. Call API: `GET /api/features`
2. Check response

**Expected Results:**
- ✅ Returns JSON with all feature flags
- ✅ Values are boolean (true/false)
- ✅ All 5 features included

### Test 7.3: Multiple Debates

**Steps:**
1. Like/Save/Comment on Debate A
2. Navigate to Debate B
3. Like/Save/Comment on Debate B
4. Return to Debate A

**Expected Results:**
- ✅ Each debate maintains its own like/save state
- ✅ Comments are debate-specific
- ✅ No cross-contamination between debates

---

## 8. UI/UX TESTING

### Test 8.1: Interaction Buttons Layout

**Check:**
- ✅ Buttons aligned horizontally
- ✅ Icons are clear and recognizable
- ✅ Active states visually distinct
- ✅ Hover states work
- ✅ Buttons don't overlap

### Test 8.2: Comments Section Layout

**Check:**
- ✅ Comments section in right sidebar
- ✅ Scrollable when many comments
- ✅ Comment form at bottom
- ✅ Replies properly indented
- ✅ Avatars display correctly
- ✅ Timestamps readable

### Test 8.3: Mobile Responsiveness

**Steps:**
1. View debate page on mobile
2. Test all interactions

**Expected Results:**
- ✅ Buttons are touch-friendly
- ✅ Comments section scrollable
- ✅ Text inputs usable on mobile
- ✅ Share uses native share on mobile

### Test 8.4: Loading States

**Check:**
- ✅ Loading spinner while fetching comments
- ✅ Buttons show loading state during API calls
- ✅ No flickering or layout shifts

---

## 9. EDGE CASES & ERROR HANDLING

### Test 9.1: Network Errors

**Steps:**
1. Disconnect internet
2. Try to like/save/comment

**Expected Results:**
- ✅ Error toast shown
- ✅ UI doesn't break
- ✅ Can retry after reconnecting

### Test 9.2: Rapid Clicks

**Steps:**
1. Rapidly click Like button multiple times

**Expected Results:**
- ✅ Only one API call made
- ✅ Button disabled during request
- ✅ No duplicate likes

### Test 9.3: Very Long Comments

**Steps:**
1. Post comment with 1000 characters
2. Check display

**Expected Results:**
- ✅ Comment displays fully
- ✅ Text wraps properly
- ✅ No layout breaking

### Test 9.4: Special Characters in Comments

**Steps:**
1. Post comment with emojis, line breaks, special chars

**Expected Results:**
- ✅ All characters display correctly
- ✅ Line breaks preserved
- ✅ No XSS vulnerabilities

---

## 10. DATABASE VERIFICATION

### Check Likes

```sql
SELECT 
  dl.id,
  d.topic,
  u.username,
  dl.created_at
FROM debate_likes dl
JOIN debates d ON dl.debate_id = d.id
JOIN users u ON dl.user_id = u.id
ORDER BY dl.created_at DESC
LIMIT 10;
```

### Check Saves

```sql
SELECT 
  ds.id,
  d.topic,
  u.username,
  ds.created_at
FROM debate_saves ds
JOIN debates d ON ds.debate_id = d.id
JOIN users u ON ds.user_id = u.id
ORDER BY ds.created_at DESC
LIMIT 10;
```

### Check Comments

```sql
SELECT 
  dc.id,
  dc.content,
  dc.parent_id,
  d.topic,
  u.username,
  dc.created_at
FROM debate_comments dc
JOIN debates d ON dc.debate_id = d.id
JOIN users u ON dc.user_id = u.id
WHERE dc.deleted = 0
ORDER BY dc.created_at DESC
LIMIT 10;
```

### Check Follows

```sql
SELECT 
  f.id,
  u1.username as follower,
  u2.username as following,
  f.created_at
FROM follows f
JOIN users u1 ON f.follower_id = u1.id
JOIN users u2 ON f.following_id = u2.id
ORDER BY f.created_at DESC
LIMIT 10;
```

### Check Feature Flags

```sql
SELECT key, value, category
FROM admin_settings
WHERE key LIKE 'FEATURE_%'
ORDER BY key;
```

---

## 11. QUICK TEST CHECKLIST

### Like System
- [ ] Can like a debate
- [ ] Can unlike a debate
- [ ] Like count displays correctly
- [ ] Like status persists after refresh
- [ ] Cannot like without login

### Save System
- [ ] Can save a debate
- [ ] Can unsave a debate
- [ ] Save status persists after refresh
- [ ] Cannot save without login
- [ ] Toast notifications work

### Share System
- [ ] Share button works
- [ ] Copy link works (desktop)
- [ ] Native share works (mobile)
- [ ] Share URL is correct
- [ ] Shares are tracked

### Comments System
- [ ] Can post comments
- [ ] Can reply to comments
- [ ] Can delete own comments
- [ ] Character limit enforced
- [ ] Comments persist after refresh
- [ ] Cannot comment without login
- [ ] Nested replies display correctly

### Follow System
- [ ] Can follow users (API)
- [ ] Can unfollow users (API)
- [ ] Follow counts accurate
- [ ] Cannot follow yourself

### Admin Feature Toggles
- [ ] Can access feature toggles
- [ ] Can disable/enable features
- [ ] Disabled features don't show
- [ ] Settings persist after refresh

---

## TROUBLESHOOTING

### Like/Save Not Working
- Check if user is logged in
- Check browser console for errors
- Verify API route is accessible
- Check feature flag is enabled

### Comments Not Loading
- Check feature flag: `FEATURE_COMMENTS_ENABLED`
- Check browser console for errors
- Verify debate ID is correct
- Check network tab for failed requests

### Feature Toggles Not Saving
- Verify user is admin
- Check browser console for errors
- Verify API route: `/api/admin/settings`
- Check database for saved settings

### Share Not Working
- Check if browser supports `navigator.share`
- Check if `navigator.clipboard` is available
- Verify HTTPS (required for clipboard API)
- Check browser console for errors

---

## NOTES

- All features default to **enabled** if not set in admin
- Feature flags are cached for 5 minutes (server-side)
- Comments support nested replies (unlimited depth)
- Share tracking is optional but recommended
- Follow feature API is ready, UI can be added to profile pages later

---

**Last Updated:** December 2024  
**Phase:** 8.5 - Debate Interactions & Social Features  
**Status:** Ready for Testing






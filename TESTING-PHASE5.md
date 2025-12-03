# Phase 5: Debate System - Testing Guide

This guide will help you test all the debate system features implemented in Phase 5.

---

## Prerequisites

1. **Start the development server:**
   ```powershell
   npm run dev
   ```

2. **Ensure database is set up:**
   ```powershell
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Have at least 2 user accounts ready:**
   - Create one account at `/signup`
   - Create a second account (or use a different browser/incognito window)
   - **See `TESTING-TWO-ACCOUNTS.md` for detailed two-account testing guide**

---

## Test Scenarios

### 1. Create Debate Challenge

**Steps:**
1. Log in with your first account
2. Click the **FAB button** (floating action button) in the bottom right, OR
3. Click "Create Debate" from the Arena Panel empty state
4. Fill out the Create Debate Modal:
   - **Topic:** "Is AI Art Real Art?"
   - **Description:** (Optional) "Debating the artistic merit of AI-generated images"
   - **Category:** Select "TECH"
   - **Your Position:** Select "FOR"
   - **Number of Rounds:** Set to 5 (default)
   - **Speed Mode:** Leave unchecked (24 hours per round)
5. Click "Create Challenge"

**Expected Results:**
- ✅ Modal closes
- ✅ Success toast appears: "Debate Created! Your challenge is now waiting for an opponent"
- ✅ Challenge appears in "My Challenges" tab in the Challenges Panel
- ✅ Challenge appears in "All Challenges" tab (when viewed by other users)

**Verify:**
- Check browser console for any errors
- Verify the debate appears in the database (optional: use Prisma Studio)

---

### 2. View Challenges Panel

**Steps:**
1. While logged in, look at the right sidebar
2. Find the "Open Challenges" section
3. Click between "All Challenges" and "My Challenges" tabs

**Expected Results:**
- ✅ "All Challenges" shows debates waiting for opponents (excluding your own)
- ✅ "My Challenges" shows debates you created that are still waiting
- ✅ Each challenge card shows:
  - Category badge
  - Topic
  - Challenger username and ELO
  - "Accept Challenge" button

**Verify:**
- Challenges load without errors
- Your own challenges don't appear in "All Challenges"
- Empty states show when there are no challenges

---

### 3. Accept Challenge

**Steps:**
1. Log in with your **second account** (or use incognito window)
2. Navigate to the homepage
3. In the "Open Challenges" panel, find a challenge
4. Click "Accept Challenge" button

**Expected Results:**
- ✅ Success toast: "Challenge Accepted! The debate has started"
- ✅ Redirected to the debate page (`/debate/[id]`)
- ✅ Debate status changes to "ACTIVE"
- ✅ Round 1 starts with a deadline set
- ✅ Both participants are shown on the debate page

**Verify:**
- Debate page loads correctly
- Both challenger and opponent are displayed
- Round progress shows "Round 1 of 5"
- Time remaining is displayed

---

### 4. View Debate Page

**Steps:**
1. Navigate to a debate page (either by accepting a challenge or clicking a debate card)
2. Review all sections of the page

**Expected Results:**
- ✅ **Header:**
  - Category badge
  - Topic title
  - Description (if provided)
  - "Accept Challenge" button (if status is WAITING and you're not the challenger)
- ✅ **Participants Section:**
  - Challenger avatar, username, ELO, position badge
  - Opponent info (or "Waiting for opponent..." if none)
- ✅ **Progress Section (if ACTIVE):**
  - Current round / total rounds
  - Time remaining
  - Progress bar
- ✅ **Arguments Section:**
  - Shows all submitted arguments organized by round
  - Each argument shows author, timestamp, and content
- ✅ **Submit Form (if it's your turn):**
  - Textarea for argument
  - Character counter (50-5000)
  - Submit button

**Verify:**
- All information displays correctly
- Layout is responsive
- No console errors

---

### 5. Submit Argument

**Steps:**
1. On a debate page where it's your turn
2. Scroll to "Submit Your Argument" section
3. Type an argument (minimum 50 characters)
4. Watch the character counter
5. Click "Submit Argument"

**Expected Results:**
- ✅ Character counter updates as you type
- ✅ Warning shows if less than 50 characters
- ✅ Submit button is disabled until 50+ characters
- ✅ On submit:
  - Success toast appears
  - Form clears
  - Argument appears in the Arguments section
  - If opponent also submitted, round advances automatically
  - If not, opponent gets notified

**Verify:**
- Argument appears immediately in the round
- Round number updates if both submitted
- Time remaining resets for new round
- Form validation works correctly

---

### 6. Round Progression

**Steps:**
1. Have both participants submit arguments for Round 1
2. Watch the debate page update

**Expected Results:**
- ✅ Round automatically advances to Round 2
- ✅ New deadline is set (24 hours from now, or 1 hour if speed mode)
- ✅ Both participants can now submit for Round 2
- ✅ Progress bar updates
- ✅ Round counter shows "Round 2 of 5"

**Verify:**
- Round advances without page refresh
- Both users can see the new round
- Previous round arguments are still visible

---

### 7. Complete Debate

**Steps:**
1. Continue submitting arguments for all rounds (5 rounds total)
2. After both participants submit Round 5 arguments

**Expected Results:**
- ✅ Debate status changes to "COMPLETED"
- ✅ Message appears: "Debate completed! AI judges are generating verdicts..."
- ✅ No more submit forms appear
- ✅ All arguments are visible in chronological order

**Verify:**
- Status updates correctly
- All rounds are visible
- No errors in console

---

### 8. Live Battle Panel

**Steps:**
1. Log in with an account that has an active debate
2. Look at the "Live Battle" panel in the right sidebar

**Expected Results:**
- ✅ Shows your active debate
- ✅ Displays:
  - Category badge
  - Topic (truncated if long)
  - Round progress (e.g., "Round 2/5")
  - "Your Turn" badge (if it's your turn)
  - Progress bar
  - "Continue Debate" or "View Debate" button
3. Click the button

**Expected Results:**
- ✅ Redirects to the debate page

**Verify:**
- Panel updates when debate status changes
- Empty state shows when no active debate

---

### 9. Arena Panel - Live Debates

**Steps:**
1. Navigate to homepage
2. Look at the "Live Battles" section in Arena Panel
3. Try filtering by category (ALL, SPORTS, TECH, POLITICS)

**Expected Results:**
- ✅ Shows active debates
- ✅ Filters work correctly
- ✅ Debate cards display:
  - Category badge
  - Topic
  - Participants
  - Round progress
  - Time remaining
  - Spectator count
  - "LIVE" indicator
4. Click on a debate card

**Expected Results:**
- ✅ Redirects to debate page

**Verify:**
- Debates load from API
- Filters apply correctly
- Cards are clickable

---

### 10. Create Debate with Different Settings

**Test various configurations:**

**Test A: Speed Mode**
1. Create debate with Speed Mode checked
2. Accept challenge
3. Verify round deadline is 1 hour (not 24 hours)

**Test B: Different Round Counts**
1. Create debate with 3 rounds
2. Verify it shows "Round 1 of 3"
3. Create debate with 7 rounds
4. Verify it shows "Round 1 of 7"

**Test C: Different Categories**
1. Create debates in different categories (SPORTS, POLITICS, TECH, etc.)
2. Verify category badges display correctly
3. Verify filtering works

**Test D: Different Positions**
1. Create debate with position "FOR"
2. Verify opponent gets "AGAINST" automatically
3. Create debate with position "AGAINST"
4. Verify opponent gets "FOR" automatically

---

## Edge Cases to Test

### 1. Cannot Accept Own Challenge
- Try to accept a challenge you created
- **Expected:** Error message, button should not appear or be disabled

### 2. Cannot Submit Twice for Same Round
- Submit argument for Round 1
- Try to submit again for Round 1
- **Expected:** Error message or form doesn't appear

### 3. Cannot Submit if Not Participant
- Try to access submit form on a debate you're not part of
- **Expected:** Submit form doesn't appear

### 4. Character Limits
- Try to submit with less than 50 characters
- **Expected:** Validation error, button disabled
- Try to type more than 5000 characters
- **Expected:** Textarea prevents input beyond limit

### 5. Expired Round Deadline
- Wait for a round deadline to expire (or manually set one in database)
- **Expected:** Time shows "Time expired" or similar

---

## Database Verification (Optional)

You can use Prisma Studio to verify data:

```powershell
npx prisma studio
```

**Check:**
- `debates` table - verify debate records
- `statements` table - verify arguments are saved
- `notifications` table - verify notifications are created
- Debate status transitions (WAITING → ACTIVE → COMPLETED)

---

## Common Issues & Solutions

### Issue: "Failed to fetch debates"
**Solution:** 
- Check if API route is accessible: `http://localhost:3000/api/debates`
- Verify database connection
- Check browser console for errors

### Issue: "Unauthorized" errors
**Solution:**
- Ensure you're logged in
- Check session cookie exists
- Try logging out and back in

### Issue: Modal doesn't open
**Solution:**
- Check browser console for errors
- Verify `CreateDebateModal` component is imported
- Check if FAB button has `onClick` handler

### Issue: Arguments don't appear
**Solution:**
- Check API response in Network tab
- Verify statement was created in database
- Check if round number matches

### Issue: Round doesn't advance
**Solution:**
- Verify both participants submitted
- Check `roundStatements` count in API
- Verify debate status is ACTIVE

---

## Quick Test Checklist

- [ ] Create a debate challenge
- [ ] View challenges in Challenges Panel
- [ ] Accept a challenge (as different user)
- [ ] View debate page
- [ ] Submit argument for Round 1
- [ ] Submit argument as opponent for Round 1
- [ ] Verify round advances to Round 2
- [ ] Complete all rounds
- [ ] Verify debate status becomes COMPLETED
- [ ] Check Live Battle Panel shows active debate
- [ ] Test category filters in Arena Panel
- [ ] Test speed mode debate
- [ ] Test different round counts
- [ ] Test edge cases (own challenge, duplicate submit, etc.)

---

## Next Steps After Testing

Once Phase 5 is verified working:
1. Document any bugs found
2. Fix any issues
3. Proceed to **Phase 6: AI Integration** for verdict generation

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check terminal for server errors
3. Verify database connection
4. Check API routes are accessible
5. Review the code in the relevant component/API route


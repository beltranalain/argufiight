# Testing Phase 5 with Two Accounts

This guide will help you test the full debate flow using two accounts.

---

## Setup: Create Two Accounts

### Method 1: Incognito Window (Easiest)

1. **First Account (Main Browser):**
   - Already logged in with your first account
   - Keep this window open

2. **Second Account (Incognito/Private Window):**
   - Open an incognito/private window:
     - **Chrome/Edge:** `Ctrl + Shift + N`
     - **Firefox:** `Ctrl + Shift + P`
   - Navigate to `http://localhost:3000`
   - Click "Sign In" or go to `/signup`
   - Create a new account with different credentials:
     - Username: `testuser2` (or any unique name)
     - Email: `test2@example.com` (or any email)
     - Password: `password123` (or any password)
   - You should now be logged in with the second account

### Method 2: Different Browser

- Use your main browser for Account 1
- Use a different browser (Chrome, Firefox, Edge) for Account 2

---

## Test Flow: Complete Debate System

### Step 1: Create a Challenge (Account 1)

**In your main browser window (Account 1):**

1. Make sure you're logged in with your first account
2. Click the **FAB button** (blue circle with +) in the bottom right
3. Fill out the Create Debate form:
   - **Topic:** "Is Remote Work Better Than Office Work?"
   - **Category:** Select "TECH"
   - **Your Position:** Select "FOR"
   - **Rounds:** 5 (default)
   - **Speed Mode:** Leave unchecked (24 hours) OR check it (1 hour for faster testing)
4. Click "Create Challenge"
5. ✅ **Verify:** 
   - Success toast appears
   - Modal closes
   - Your challenge appears in "My Challenges" tab

---

### Step 2: Accept Challenge (Account 2)

**In your incognito window (Account 2):**

1. Make sure you're logged in with the second account
2. Look at the **"Open Challenges"** panel on the right sidebar
3. Click the **"All Challenges"** tab (should be the default)
4. You should see the challenge you just created:
   - Category badge (TECH)
   - Topic: "Is Remote Work Better Than Office Work?"
   - Challenger username (Account 1)
   - ELO rating
   - "Accept Challenge" button
5. Click **"Accept Challenge"** button
6. ✅ **Verify:**
   - Success toast: "Challenge Accepted! The debate has started"
   - Automatically redirected to `/debate/[id]` page
   - Debate page shows:
     - Both participants (Account 1 and Account 2)
     - Round 1 of 5
     - Time remaining (24 hours or 1 hour if speed mode)
     - Progress bar
     - "Submit Your Argument" form (if it's your turn)

---

### Step 3: Submit First Arguments (Round 1)

**Account 1 (Main Browser):**

1. Navigate to the debate page (you should see it in "Live Battle" panel, or go to `/debate/[id]`)
2. Scroll to "Submit Your Argument" section
3. Type your argument (minimum 50 characters):
   ```
   Remote work is superior because it offers flexibility, eliminates commute time, 
   allows for better work-life balance, and enables access to a global talent pool. 
   Studies show increased productivity and job satisfaction.
   ```
4. Click "Submit Argument"
5. ✅ **Verify:**
   - Success toast appears
   - Your argument appears in the "Arguments" section under "Round 1"
   - Form clears
   - Status shows "Waiting for opponent to respond..."

**Account 2 (Incognito Window):**

1. Refresh the debate page (or it should auto-update)
2. You should now see the "Submit Your Argument" form
3. Type your rebuttal (minimum 50 characters):
   ```
   Office work is better because it fosters collaboration, maintains company culture, 
   provides better structure, and enables face-to-face communication. Remote work 
   leads to isolation and decreased team cohesion.
   ```
4. Click "Submit Argument"
5. ✅ **Verify:**
   - Success toast appears
   - Your argument appears in Round 1
   - **Round automatically advances to Round 2!**
   - New deadline is set
   - Progress bar updates
   - Both arguments are visible in Round 1

---

### Step 4: Continue Through All Rounds

**Repeat for Rounds 2-5:**

For each round, both participants submit arguments:

**Round 2:**
- Account 1: Submit argument (50+ chars)
- Account 2: Submit argument (50+ chars)
- ✅ Round advances to 3

**Round 3:**
- Account 1: Submit argument
- Account 2: Submit argument
- ✅ Round advances to 4

**Round 4:**
- Account 1: Submit argument
- Account 2: Submit argument
- ✅ Round advances to 5

**Round 5 (Final Round):**
- Account 1: Submit argument
- Account 2: Submit argument
- ✅ **Debate status changes to "COMPLETED"!**
- Message appears: "Debate completed! AI judges are generating verdicts..."
- No more submit forms appear

---

### Step 5: Verify Live Battle Panel

**In Account 1 (Main Browser):**

1. Go back to the homepage (`/`)
2. Look at the **"Live Battle"** panel in the right sidebar
3. ✅ **Verify:**
   - Shows your active debate
   - Displays:
     - Category badge
     - Topic (truncated if long)
     - Round progress (e.g., "Round 3/5")
     - "Your Turn" badge (if it's your turn)
     - Progress bar
     - "Continue Debate" or "View Debate" button
4. Click the button
5. ✅ **Verify:** Redirects to the debate page

**Note:** Once the debate is COMPLETED, the Live Battle panel will show "No Active Battle" again.

---

## Quick Testing Tips

### For Faster Testing (Speed Mode)

When creating a debate, check **"Speed Mode"**:
- Rounds are 1 hour instead of 24 hours
- Faster for testing, but you still need to wait for both submissions

### Testing Edge Cases

1. **Try to accept your own challenge:**
   - Account 1 tries to accept Account 1's challenge
   - ✅ Should show error or button shouldn't appear

2. **Try to submit twice for same round:**
   - Submit argument for Round 1
   - Try to submit again for Round 1
   - ✅ Should show error: "You have already submitted for this round"

3. **Character limits:**
   - Try submitting with less than 50 characters
   - ✅ Button should be disabled, show error

4. **View debate as non-participant:**
   - Create a third account (or use a different browser)
   - Navigate to a debate URL
   - ✅ Should see debate but no submit form

---

## Troubleshooting

### Issue: Can't see challenge in "All Challenges"
- **Check:** Make sure you're logged in with Account 2
- **Check:** Make sure you're on "All Challenges" tab (not "My Challenges")
- **Check:** Challenge status is "WAITING"
- **Check:** Browser console for errors

### Issue: Round doesn't advance
- **Check:** Both participants submitted arguments
- **Check:** Both arguments are in the same round number
- **Check:** Browser console for errors
- **Check:** Network tab to see if API calls succeeded

### Issue: Can't submit argument
- **Check:** You're a participant in the debate
- **Check:** It's your turn (opponent already submitted)
- **Check:** Debate status is "ACTIVE"
- **Check:** You haven't already submitted for this round
- **Check:** Argument is 50+ characters

### Issue: Live Battle panel doesn't show debate
- **Check:** Debate status is "ACTIVE" (not WAITING or COMPLETED)
- **Check:** You're logged in with the correct account
- **Check:** Refresh the page
- **Check:** Browser console for errors

---

## Expected Database State

After completing a debate, you can verify in the database:

```powershell
npx prisma studio
```

**Check:**
- `debates` table: Status should be "COMPLETED"
- `statements` table: Should have 10 statements (5 rounds × 2 participants)
- `notifications` table: Should have notifications for turn reminders

---

## Next Steps

Once you've verified the debate flow works:
1. ✅ Debate creation
2. ✅ Challenge acceptance
3. ✅ Argument submission
4. ✅ Round progression
5. ✅ Debate completion

You're ready for **Phase 6: AI Integration** to generate verdicts!



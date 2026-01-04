# Belt Challenge Debugging Guide

## Quick Test Commands

### PowerShell Test (API Structure)
```powershell
.\test-belt-endpoint.ps1
```

This will verify:
- ✅ Endpoint exists
- ✅ Payload structure is correct
- ⚠️ Will show 401 (auth required) - this is expected

## Browser Testing Steps

### Step 1: Check Console Logs
1. Open browser console (F12)
2. Click "Challenge" button on a belt
3. Look for these logs:
   - `[BeltsPanel] handleCreateChallenge called with belt:`
   - `[BeltsPanel] Opening challenge modal for belt:`
   - `[BeltsPanel] Modal state changed:`

**If you DON'T see these logs:**
- ❌ Button click isn't firing
- Check for JavaScript errors in console
- Verify button is not disabled

**If you DO see these logs but modal doesn't open:**
- ❌ Modal component issue
- Check React errors in console
- Verify `CreateDebateModal` is rendering

### Step 2: Check Network Tab
1. Open Network tab (F12 → Network)
2. Click "Challenge" button
3. Fill in the topic field
4. Click "Create Challenge"
5. Look for `/api/belts/challenge` request

**Check the Request Payload:**
```json
{
  "beltId": "should-be-a-string-id",
  "topic": "your-topic-here",
  "description": "...",
  "category": "TECH",
  ...
}
```

**Common Issues:**
- ❌ `beltId` is an object instead of string → Frontend bug
- ❌ `topic` is missing or empty → Form state issue
- ❌ 401 Unauthorized → Not logged in
- ❌ 400 Bad Request → Check error message in response

### Step 3: Verify Modal Opens
When you click "Challenge", you should see:
1. Modal opens with title "Challenge for [Belt Name]"
2. "Belt Challenge Info" card showing opponent and belt name
3. "Debate Topic" input field is visible and editable
4. Other debate fields (description, category, etc.)

**If modal doesn't open:**
- Check browser console for React errors
- Verify `challengeModalOpen` state is being set
- Check if `selectedBeltForChallenge` is set correctly

## Common Fixes

### Issue: Modal doesn't open
**Check:**
- `components/panels/BeltsPanel.tsx` - `handleCreateChallenge` function
- State variables: `challengeModalOpen`, `selectedBeltForChallenge`
- Console for JavaScript errors

### Issue: "Debate topic is required" error
**Check:**
- Topic input field is visible in modal
- Topic state is being set when typing
- Request payload includes `topic` field
- API route receives `topic` correctly

### Issue: beltId is an object
**Fix:**
- Ensure `beltId={selectedBeltForChallenge.id}` (not the whole object)
- Check `CreateDebateModal.tsx` - `beltIdString` extraction

## Manual Test Checklist

- [ ] Can see belts in the UI
- [ ] "Challenge" button is visible and clickable
- [ ] Clicking "Challenge" opens modal
- [ ] Modal shows correct belt and opponent info
- [ ] Can type in "Debate Topic" field
- [ ] Can fill other fields (description, category, etc.)
- [ ] Clicking "Create Challenge" sends request
- [ ] Request succeeds (200) or shows clear error
- [ ] Challenge appears in challenges list after creation

## Next Steps

If the modal opens but submission fails:
1. Check Network tab for the actual request
2. Compare request payload with expected structure
3. Check server logs for error details
4. Verify all required fields are included

If the modal doesn't open:
1. Check browser console for errors
2. Verify React component is rendering
3. Check state management
4. Look for TypeScript/compilation errors

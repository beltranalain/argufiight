# Known Issues

This document tracks known bugs and issues that need to be addressed in future phases.

---

## Issue #0: Page Scrolls Up After Appeal Submission

**Status:** 🟡 Workaround Applied  
**Priority:** Medium  
**Phase:** Phase 9 (Bug Fixes)

### Description
When a user submits an appeal for a debate verdict while scrolled to the bottom of the page, the page automatically scrolls back to the top. This happens even with scroll prevention mechanisms in place.

### Current Workaround
- Appeal submission no longer triggers immediate page refresh
- User must manually refresh page to see updated appeal status
- Scroll position preservation system implemented but not fully effective

### Root Cause (Suspected)
The issue likely occurs when React re-renders after state updates or when the modal closes and focus changes.

### Proposed Solutions (Future)
- Use React's `useLayoutEffect` to restore scroll synchronously
- Implement a global scroll position manager
- Debounce/queue state updates
- Prevent browser's automatic scroll restoration

---

---

## Issue #1: Page Scrolls Up After Appeal Submission

**Status:** 🔴 Open  
**Priority:** Medium  
**Phase:** To be fixed in future phase

### Description
When a user submits an appeal for a debate verdict while scrolled to the bottom of the page, the page automatically scrolls back to the top. This happens even with scroll prevention mechanisms in place.

### Steps to Reproduce
1. Navigate to a debate page with a completed verdict
2. Scroll to the bottom of the page
3. Click "Appeal Verdict" button
4. Submit the appeal
5. Observe that the page scrolls back to the top

### Attempted Fixes
- Multiple scroll position save/restore mechanisms
- Event listener-based scroll prevention (scroll, wheel, touchmove)
- Continuous scroll locking with intervals
- Modal body scroll locking
- Delayed state updates
- Preventing immediate page refresh after appeal

### Root Cause (Suspected)
The issue likely occurs when:
- React re-renders after state update (`isLoading`, `debate` state changes)
- Modal closing triggers focus changes
- `fetchDebate()` call causes component re-mount or significant re-render
- Browser's default scroll restoration behavior

### Proposed Solutions (Future)
1. **Option A:** Don't refresh debate data immediately after appeal
   - Update UI state locally to show appeal submitted
   - Let user manually refresh or wait for natural polling update
   - **Status:** ✅ Implemented as temporary workaround

2. **Option B:** Use React's `useLayoutEffect` to restore scroll synchronously
   - Restore scroll before browser paints
   - May prevent visual scroll jump

3. **Option C:** Implement a global scroll position manager
   - Track scroll position in context/state
   - Restore on every render cycle
   - More robust but complex

4. **Option D:** Use CSS `scroll-behavior: auto` and `scroll-snap` prevention
   - Prevent browser's automatic scroll restoration
   - May interfere with other scroll behaviors

5. **Option E:** Debounce/queue state updates
   - Batch all state updates together
   - Restore scroll after all updates complete

### Current Workaround
- Appeal submission no longer triggers immediate page refresh
- User must manually refresh page to see updated appeal status
- Appeal status will update naturally when page is refreshed or navigated away and back

### Notes
- This issue affects user experience but doesn't break functionality
- The appeal is successfully submitted to the backend
- The UI just doesn't update immediately to prevent scroll jump

---

## Issue #2: (Add more issues here as they are discovered)

---

**Last Updated:** December 2024


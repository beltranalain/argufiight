# Phase 3 Testing Guide - UI Components

## Quick Test

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Navigate to the test page**:
   ```
   http://localhost:3000/test-components
   ```

3. **Test each component section**:

---

## Component Tests

### ✅ Buttons
- [ ] Primary button renders and has gradient
- [ ] Secondary button has border
- [ ] Ghost button is transparent
- [ ] Loading button shows spinner
- [ ] Disabled button is grayed out

### ✅ Cards
- [ ] Default card displays correctly
- [ ] Bordered card has thicker border
- [ ] Hover effect works (border color changes)
- [ ] Glow effect is visible
- [ ] CardHeader, CardBody, CardFooter work

### ✅ Badges
- [ ] All category variants display (sports, politics, tech, etc.)
- [ ] Success/warning/error badges show correct colors
- [ ] Size variants (sm, md, lg) work
- [ ] Badges are rounded and styled correctly

### ✅ Avatars
- [ ] Different sizes render (xs, sm, md, lg, xl)
- [ ] Gradient backgrounds generate based on username
- [ ] Initials display when no image
- [ ] Different usernames show different gradients

### ✅ Modal
- [ ] Opens when button clicked
- [ ] Backdrop appears and is clickable
- [ ] Close button (X) works
- [ ] Escape key closes modal
- [ ] Body scroll is disabled when open
- [ ] Different sizes (sm, md, lg, xl) work

### ✅ Tabs
- [ ] Tab headers display
- [ ] Clicking tabs switches content
- [ ] Active tab indicator animates
- [ ] Active tab text is electric-blue
- [ ] Tab content displays correctly

### ✅ Dropdown Menu
- [ ] Opens when trigger clicked
- [ ] Menu items display
- [ ] Clicking item executes action
- [ ] Clicking outside closes menu
- [ ] Danger variant shows red text
- [ ] Disabled items are grayed out

### ✅ Loading Components
- [ ] Spinner animates (sm, md, lg sizes)
- [ ] Loading overlay appears and blocks interaction
- [ ] Loading card shows skeleton
- [ ] All loading states are visible

### ✅ Empty State
- [ ] Icon displays (if provided)
- [ ] Title and description show
- [ ] Action button works
- [ ] Centered layout looks good

### ✅ Tooltip
- [ ] Appears on hover
- [ ] Disappears on mouse leave
- [ ] All positions work (top, bottom, left, right)
- [ ] Text is readable
- [ ] Animation is smooth

### ✅ Toast Notifications
- [ ] Success toast appears (green border)
- [ ] Error toast appears (red border)
- [ ] Warning toast appears (orange border)
- [ ] Info toast appears (blue border)
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Close button works
- [ ] Multiple toasts stack correctly

### ✅ Input
- [ ] Label displays
- [ ] Placeholder works
- [ ] Error message shows (red)
- [ ] Help text displays
- [ ] All input types work (email, password, text)

---

## Visual Checks

### Design System
- [ ] All components use cyberpunk colors
- [ ] Electric blue (#00D9FF) used for accents
- [ ] Neon orange (#FF6B35) used for gradients
- [ ] Background is pure black (#000000)
- [ ] Borders are subtle gray
- [ ] Text colors are appropriate (white, gray)

### Animations
- [ ] Hover effects are smooth
- [ ] Modal animations work
- [ ] Toast slide-in animation works
- [ ] Tab indicator animation is smooth
- [ ] Loading spinner rotates

### Responsiveness
- [ ] Components work on mobile (resize browser)
- [ ] Cards stack on small screens
- [ ] Modal is responsive
- [ ] Dropdown menu positions correctly

---

## Functional Tests

### Interactions
1. **Modal**: Open → Press Escape → Should close
2. **Modal**: Open → Click backdrop → Should close
3. **Dropdown**: Open → Click item → Should close and execute action
4. **Tabs**: Click tab → Content should change
5. **Toast**: Click button → Toast should appear → Wait 5s → Should auto-dismiss
6. **Tooltip**: Hover → Should appear → Move mouse → Should disappear

### Edge Cases
- [ ] Modal with very long content scrolls
- [ ] Dropdown with many items scrolls
- [ ] Toast with long text wraps correctly
- [ ] Empty state without action button still looks good
- [ ] Avatar with very long username handles gracefully

---

## Browser Console Check

1. Open DevTools (F12)
2. Check Console tab
3. **Expected**: No errors or warnings
4. **If errors appear**: Note them and report

---

## Quick Verification Checklist

Run through this quickly:

- [ ] Page loads without errors
- [ ] All sections visible
- [ ] Buttons are clickable
- [ ] Modal opens and closes
- [ ] Toast notifications appear
- [ ] No console errors
- [ ] Components match design system
- [ ] Animations are smooth

---

## Common Issues & Fixes

### Issue: "useToast must be used within ToastProvider"
**Fix**: Make sure `ToastProvider` is in `app/layout.tsx`

### Issue: Modal doesn't close
**Fix**: Check that `onClose` prop is passed correctly

### Issue: Toast doesn't appear
**Fix**: Verify `ToastProvider` wraps the app in layout

### Issue: Components look wrong
**Fix**: Check that Tailwind classes are working (run `npm run dev`)

### Issue: TypeScript errors
**Fix**: Run `npm run type-check` to see specific errors

---

## Success Criteria

✅ All 10 components render correctly  
✅ All interactions work (click, hover, etc.)  
✅ Animations are smooth  
✅ No console errors  
✅ Design system colors are correct  
✅ Components are responsive  
✅ Toast system works  
✅ Modal system works  

---

## Next Steps

Once all tests pass:
1. ✅ Phase 3 is complete
2. ✅ Ready for Phase 4: Horizontal Homepage
3. ✅ All components are production-ready




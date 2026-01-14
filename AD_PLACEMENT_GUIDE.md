# Ad Placement Guide

## Understanding the 3 Ad Types and Where They Display

### 1. **BANNER** Ads
- **Ad Type in Admin:** `BANNER`
- **Where They Show:**
  - ✅ Profile pages (top of profile) - `PROFILE_BANNER` placement
  - ✅ Debate sidebar (during debate) - `DEBATE_WIDGET` placement (fallback)
- **Example:** The football player image on profile pages

---

### 2. **SPONSORED_DEBATE** Ads
- **Ad Type in Admin:** `SPONSORED_DEBATE`
- **Where They Show:**
  - ✅ Debate sidebar (during active debate) - `DEBATE_WIDGET` placement
  - ✅ After debate verdict (below verdict) - `POST_DEBATE` placement
- **Example:** The "RAFA'S RISE" ad in the debate sidebar

**Important:** 
- `DEBATE_WIDGET` = Sidebar during debate (what you see in the first image)
- `POST_DEBATE` = After verdict, only visible to participants

---

### 3. **IN_FEED** Ads
- **Ad Type in Admin:** `IN_FEED`
- **Where They Show:**
  - ✅ Debates list page (`/debates`) - appears every 5th debate
  - ✅ Trending topics component - appears every 3rd topic
  - ✅ Dashboard feed (if implemented)
- **Example:** Ads that appear BETWEEN content items in lists

**Visual Example:**
```
Debate 1
Debate 2
Debate 3
Debate 4
Debate 5
[IN_FEED AD HERE] ← Your ad appears here
Debate 6
Debate 7
...
```

---

## Current Ad Mapping

| Ad Type (Admin) | Placement | Where It Shows |
|----------------|-----------|----------------|
| BANNER | PROFILE_BANNER | Profile pages (top) |
| BANNER | DEBATE_WIDGET | Debate sidebar (fallback) |
| SPONSORED_DEBATE | DEBATE_WIDGET | Debate sidebar (preferred) |
| SPONSORED_DEBATE | POST_DEBATE | After verdict (participants only) |
| IN_FEED | IN_FEED | Debates list, trending topics |

---

## How to See Each Ad Type

1. **BANNER:**
   - Visit: `/profile` or `/profile/[any-user-id]`
   - Look: Top of the profile page

2. **SPONSORED_DEBATE (Sidebar):**
   - Visit: Any debate page (e.g., `/debate/[id]`)
   - Look: Right sidebar, labeled "SPONSORED"
   - This is what you see in the first image!

3. **SPONSORED_DEBATE (After Verdict):**
   - Complete a debate as a participant
   - After verdict is shown, ad appears below
   - Only visible to debate participants

4. **IN_FEED:**
   - Visit: `/debates` (debates list page)
   - Look: Between debates (every 5th debate)
   - Or: Homepage with trending topics (every 3rd topic)

---

## Quick Test

1. **BANNER ad:** Go to `/profile` → See ad at top ✅
2. **SPONSORED_DEBATE (sidebar):** Go to `/debate/[id]` → See "SPONSORED" ad in sidebar ✅
3. **IN_FEED ad:** Go to `/debates` → Scroll down, see ad between debates ✅

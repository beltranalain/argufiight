# Google OAuth Cookie Persistence - Fix Options

## Problem
The session cookie is not persisting after Google OAuth redirect. The cookie is being set by `createSession()` but not included in the redirect response.

## Root Cause
When `createSession()` calls `cookies().set()`, the cookie is set in the response context. However, when we immediately do `NextResponse.redirect()`, the cookie might not be included in the redirect response headers.

## Fix Options

### **Option 1: Create Session Without Cookie, Set Only in Redirect** ⭐ RECOMMENDED
**Pros:** Clean, follows Next.js best practices, minimal changes
**Cons:** Requires creating a new function or modifying existing one

**Implementation:**
1. Create a new function `createSessionWithoutCookie()` that creates the session in DB but doesn't set cookie
2. Use it in OAuth callback
3. Set cookie only in redirect response

**Code Changes:**
- Add `createSessionWithoutCookie()` to `lib/auth/session.ts`
- Modify OAuth callback to use it
- Cookie is set only in redirect response

---

### **Option 2: Don't Use createSession, Manually Create Session**
**Pros:** Full control, no dependency on existing function
**Cons:** Code duplication, need to maintain session creation logic in two places

**Implementation:**
1. Manually create session in database in OAuth callback
2. Generate JWT manually
3. Set cookie only in redirect response

---

### **Option 3: Use Response Headers Directly (Set-Cookie)**
**Pros:** Direct control over cookie headers
**Cons:** More complex, need to format Set-Cookie header manually

**Implementation:**
1. Create session normally
2. Format Set-Cookie header manually
3. Set in response headers before redirect

---

### **Option 4: Two-Step Redirect (Temporary Token)**
**Pros:** Guaranteed cookie persistence
**Cons:** More complex flow, requires additional endpoint

**Implementation:**
1. Create session and generate temporary token
2. Redirect to `/auth/complete?token=...`
3. Handler sets cookie and redirects to final destination

---

### **Option 5: Check Cookie Domain/Path Issues**
**Pros:** Might be a simple configuration issue
**Cons:** Might not be the actual problem

**Implementation:**
1. Verify cookie domain is correct
2. Check if `sameSite: 'lax'` should be `'none'`
3. Verify `secure` flag is correct for production

---

## Recommended Solution: Option 1

This is the cleanest approach that follows Next.js patterns while fixing the cookie persistence issue.


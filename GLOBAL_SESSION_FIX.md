# Global Session Fix - Account Mismatch Issue

## 🔴 Root Cause

The session verification is returning the wrong user because:
1. Browser cookie has a sessionToken that points to one user
2. But the session lookup is somehow finding a different user's session
3. OR the cookie itself is corrupted/pointing to wrong session

## ✅ Global Fix Strategy

1. **Force session verification to ALWAYS use cookie's sessionToken**
2. **Add validation to ensure session.userId matches the sessionToken**
3. **Fix account switcher to properly update cookie**
4. **Fix all user data endpoints to use same verification**

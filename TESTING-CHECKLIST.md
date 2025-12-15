# Testing Checklist - Phase 1 & 2

Use this checklist to verify everything is working correctly after completing Phase 1 (Authentication) and Phase 2 (Database Schema).

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   Server should start on `http://localhost:3000` without errors.

---

## Phase 1: Authentication System Tests

### ✅ Test 1: Sign Up Flow
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test1234!` (meets requirements)
   - Confirm Password: `Test1234!`
   - Check "I agree to Terms..."
3. Click "Create Account"
4. **Expected:** Redirected to homepage (`/`), no errors

### ✅ Test 2: Login Flow
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `Test1234!`
3. Click "Sign In"
4. **Expected:** Redirected to homepage, logged in

### ✅ Test 3: Session Persistence
1. After logging in, refresh the page
2. **Expected:** Still logged in (session persists)

### ✅ Test 4: Protected Routes
1. While logged in, try to access:
   - `http://localhost:3000/admin` (should work if you're admin, or redirect if not)
   - `http://localhost:3000/profile` (should work)
2. Log out, then try accessing:
   - `http://localhost:3000/admin` (should redirect to `/login`)
   - `http://localhost:3000/profile` (should redirect to `/login`)

### ✅ Test 5: Logout
1. Click logout (if you have a logout button) or navigate to `/api/auth/logout`
2. **Expected:** Session cleared, redirected to login

### ✅ Test 6: Invalid Credentials
1. Try logging in with wrong password
2. **Expected:** Error message displayed

### ✅ Test 7: Duplicate Signup
1. Try signing up with the same email again
2. **Expected:** Error message: "Email already in use"

---

## Phase 2: Database Schema Tests

### ✅ Test 8: Database Connection
Run this in your terminal:
```bash
npx prisma studio
```
**Expected:** Prisma Studio opens in browser, showing all tables

### ✅ Test 9: Verify All Tables Created
In Prisma Studio, check that these tables exist:
- ✅ `users`
- ✅ `sessions`
- ✅ `debates`
- ✅ `statements`
- ✅ `judges`
- ✅ `verdicts`
- ✅ `notifications`
- ✅ `chat_messages`
- ✅ `reports`
- ✅ `predictions`
- ✅ `admin_settings`
- ✅ `seed_debates`

### ✅ Test 10: Verify Judges Seeded
1. In Prisma Studio, open the `judges` table
2. **Expected:** See 7 judges:
   - The Empiricist 🔬
   - The Rhetorician 🎭
   - The Logician 🧮
   - The Pragmatist 🔧
   - The Ethicist ⚖️
   - The Devil's Advocate 😈
   - The Historian 📚

### ✅ Test 11: Verify User Created
1. In Prisma Studio, open the `users` table
2. **Expected:** See the user you created during signup test
3. Check fields:
   - `email` matches what you entered
   - `username` matches what you entered
   - `password_hash` is a hashed string (not plain text)
   - `elo_rating` is 1200 (default)
   - `debates_won`, `debates_lost`, etc. are 0

### ✅ Test 12: Verify Session Created
1. In Prisma Studio, open the `sessions` table
2. **Expected:** See a session record for your logged-in user
3. Check that `expires_at` is in the future

### ✅ Test 13: Database Query Functions
Create a test file to verify queries work:

```typescript
// test-queries.ts (temporary file)
import { getAllJudges, getPlatformStats } from './lib/db/queries'

async function test() {
  const judges = await getAllJudges()
  console.log('Judges:', judges.length) // Should be 7
  
  const stats = await getPlatformStats()
  console.log('Stats:', stats) // Should show user count, etc.
}

test()
```

Run: `tsx test-queries.ts`

---

## API Endpoint Tests

### ✅ Test 14: Auth API Endpoints
Test using browser DevTools Console or Postman:

**GET /api/auth/me** (while logged in)
```javascript
fetch('/api/auth/me')
  .then(r => r.json())
  .then(console.log)
```
**Expected:** Returns user object with your info

**POST /api/auth/logout**
```javascript
fetch('/api/auth/logout', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```
**Expected:** Returns `{ success: true }`

---

## Quick Verification Script

Run this command to check database:
```bash
npx prisma db execute --stdin <<< "SELECT name FROM sqlite_master WHERE type='table';"
```

**Expected:** Lists all table names

---

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Run `npx prisma generate`

### Issue: "Database locked" error
**Solution:** Close Prisma Studio and any other database connections, then retry

### Issue: Migration errors
**Solution:** 
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate dev
npm run seed
```

### Issue: TypeScript errors
**Solution:** Run `npm run type-check` to see specific errors

---

## Success Criteria

✅ All authentication flows work (signup, login, logout)  
✅ Protected routes redirect correctly  
✅ Database has all 12 tables  
✅ 7 judges are seeded  
✅ User can be created and retrieved  
✅ Sessions are created and managed  
✅ No console errors in browser  
✅ No errors in terminal/server logs  

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Phase 1 & 2 are complete
2. ✅ Ready to move to Phase 3: UI Components Library
3. ✅ Database is ready for debate system implementation







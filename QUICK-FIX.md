# Quick Fix Guide

## Steps to Get API Working

1. **Restart Next.js server:**
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. **Test the API endpoint:**
   - Open browser: `http://localhost:3000/api/test`
   - Should see: `{"message":"API is working!","timestamp":"..."}`
   - If this works, API routes are loading correctly

3. **Test signup from mobile app:**
   - Make sure backend is running
   - Try signing up from mobile app
   - Check Next.js terminal for: `POST /api/auth/signup` (should NOT be 404)

4. **If still getting 404:**
   - Check that files exist:
     - `app/api/auth/signup/route.ts`
     - `app/api/auth/login/route.ts`
   - Make sure server was restarted after creating files
   - Check for compilation errors in Next.js terminal

## Database Setup

The database should be at: `prisma/dev.db`

If it doesn't exist, the first signup will create it automatically when Prisma tries to write.

## Common Issues

1. **"Cannot find module '@prisma/client'"**
   - Run: `npx prisma generate`

2. **Database errors**
   - Make sure `prisma/dev.db` exists or can be created
   - Check file permissions

3. **Import errors with @/**
   - Check `tsconfig.json` has path aliases configured
   - Restart Next.js server







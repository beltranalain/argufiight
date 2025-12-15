# Troubleshooting Guide

## Server Running but Getting 500 Error

If you see `GET / 500` in the terminal but the server is running:

1. **Check the browser console** - Open `http://localhost:3000` and check the browser's developer console (F12) for errors

2. **Check the terminal** - Look for detailed error messages in the terminal output

3. **Common issues:**
   - Tailwind CSS not processing correctly
   - Missing environment variables (Supabase)
   - TypeScript errors
   - Import errors

## Middleware Warnings

The middleware warnings are **harmless** and can be ignored:
- `The "middleware" file convention is deprecated` - This is just a Next.js 16 warning
- `Next.js can't recognize the exported config field` - This is also just a warning

These won't prevent the app from running.

## Workspace Root Warning

The warning about multiple lockfiles is also harmless. It's detecting a `package-lock.json` in the parent directory. You can ignore this.

## Quick Fixes

### Clear Next.js Cache
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### Check for TypeScript Errors
```powershell
npm run type-check
```

### Verify Tailwind is Working
Check if custom colors are being used. If you see the homepage with "HONORABLE AI" text, Tailwind is working.

## Still Having Issues?

1. Check the browser console (F12 → Console tab)
2. Check the terminal for full error messages
3. Try accessing different routes:
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`







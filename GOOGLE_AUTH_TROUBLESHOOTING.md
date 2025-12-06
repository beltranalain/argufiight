# Google Auth Button Not Showing - Troubleshooting Guide

## Issue
The Google "Continue with Google" button is not appearing on the login page for employees and advertisers.

## How It Should Work

1. **Employee Login:**
   - Visit `/admin` while **NOT logged in**
   - You'll be redirected to `/login?userType=employee`
   - The Google auth button should appear

2. **Advertiser Login:**
   - Visit `/advertiser/dashboard` while **NOT logged in`
   - You'll be redirected to `/login?userType=advertiser`
   - The Google auth button should appear

## Common Issues

### Issue 1: Already Logged In
**Problem:** If you're already logged in, you won't see the login page at all.

**Solution:**
1. Log out first: Click "Logout" in the user menu
2. Then try to access `/admin` or `/advertiser/dashboard`
3. You'll be redirected to the login page with the Google auth button

### Issue 2: Direct Navigation to /login
**Problem:** If you go directly to `/login` without the `userType` parameter, the button won't show.

**Solution:**
- Always access the login page through the redirect from `/admin` or `/advertiser/dashboard`
- Or manually add the parameter: `/login?userType=employee` or `/login?userType=advertiser`

### Issue 3: Environment Variables Not Set
**Problem:** Google OAuth won't work if environment variables aren't configured.

**Solution:**
Make sure these are set in Vercel:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Testing Steps

1. **Log out** (if currently logged in)
2. **Try to access admin:**
   - Go to: `https://www.argufight.com/admin`
   - You should be redirected to: `https://www.argufight.com/login?userType=employee`
   - Check if the "Continue with Google" button appears

3. **Try to access advertiser dashboard:**
   - Go to: `https://www.argufight.com/advertiser/dashboard`
   - You should be redirected to: `https://www.argufight.com/login?userType=advertiser`
   - Check if the "Continue with Google" button appears

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Look for: `Login page - userType: employee` or `Login page - userType: advertiser`

## Manual Testing

If the redirects aren't working, you can manually test:

1. **Employee:** `https://www.argufight.com/login?userType=employee`
2. **Advertiser:** `https://www.argufight.com/login?userType=advertiser`

The Google auth button should appear on both URLs.

## If Still Not Working

1. **Clear browser cache** and try again
2. **Check Vercel deployment** - make sure latest code is deployed
3. **Check environment variables** in Vercel dashboard
4. **Check browser console** for JavaScript errors


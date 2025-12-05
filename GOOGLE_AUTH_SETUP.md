# Google OAuth Setup for Admin/Employee Authentication

## What You Need from Firebase/Google Cloud Console

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **project-563658606120**
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

### Step 2: Configure OAuth Consent Screen (if not already done)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **Internal** (for employees only) or **External**
3. Fill in required fields:
   - App name: "Argu Fight Admin"
   - User support email: info@argufight.com
   - Developer contact: info@argufight.com
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue

### Step 3: Create OAuth Client ID

1. Application type: **Web application**
2. Name: **"Argu Fight Admin OAuth"**
3. Authorized JavaScript origins:
   - `http://localhost:3000` (for local development)
   - `https://your-production-domain.vercel.app` (your Vercel URL)
   - `https://argufight.com` (if you have a custom domain)
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for local)
   - `https://your-production-domain.vercel.app/api/auth/google/callback` (for production)
   - `https://argufight.com/api/auth/google/callback` (if custom domain)
5. Click **"CREATE"**

### Step 4: Copy Your Credentials

After creating, you'll see:
- **Client ID**: (looks like `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret**: (looks like `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**IMPORTANT**: Save these securely! You'll need to add them to:
1. Vercel environment variables
2. Local `.env` file for development

---

## What I Need From You

Please provide:

1. **OAuth 2.0 Client ID**: `_________________`
2. **OAuth 2.0 Client Secret**: `_________________`
3. **Production Domain**: (your Vercel URL or custom domain)
4. **List of Employee Emails**: (emails that should have Google auth enabled)
   - Example: `admin@admin.com`, `info@argufight.com`, etc.

---

## How It Will Work

1. **Admin logs in** with email/password (e.g., `admin@admin.com`)
2. **System detects** they're an admin (`isAdmin: true`)
3. **Redirects to Google OAuth** page instead of dashboard
4. **User authenticates** with Google
5. **System verifies** the Google email matches an allowed employee email
6. **Stores Google auth** in database
7. **Redirects to admin dashboard**

### Security Features

- Only employees with `isAdmin: true` need Google auth
- Google email must match a whitelist of employee emails
- Google auth is stored in database and checked on each admin page access
- Session expires if Google auth is not verified

---

## Environment Variables Needed

Add these to Vercel and `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
```

---

## Next Steps

Once you provide the credentials, I will:

1. ✅ Add Google OAuth fields to User model (Prisma schema)
2. ✅ Create Google OAuth API routes (`/api/auth/google` and `/api/auth/google/callback`)
3. ✅ Create Google auth verification page (`/admin/google-auth`)
4. ✅ Modify admin layout to require Google auth
5. ✅ Update login flow to redirect admins to Google auth
6. ✅ Add employee email whitelist configuration


# How to Find Your Vercel Blob Storage Token

## Option 1: Check Environment Variables (Easiest)

Vercel may have automatically added the token when you created the blob store. Check:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Look for: `BLOB_READ_WRITE_TOKEN`
3. If it exists, you're all set! ✅

## Option 2: Reset Credentials Section

1. Scroll down to the **"Reset Credentials"** section (at the bottom of the settings page)
2. Click on it to expand
3. You should see options to:
   - View current token
   - Reset/regenerate token
4. Copy the token (starts with `vercel_blob_rw_`)

## Option 3: Check Project Connections

1. In the blob store settings, look for a **"Projects"** or **"Connections"** tab
2. If your project is connected, the token might be automatically available
3. Check your project's environment variables to see if it was auto-added

## Option 4: Generate New Token

If you can't find it:

1. Go to **"Reset Credentials"** section
2. Click **"Reset"** or **"Generate New Token"**
3. Copy the new token immediately (you won't be able to see it again)
4. Add it to your project's environment variables

## What the Token Looks Like

- Starts with: `vercel_blob_rw_`
- Followed by a long string of characters
- Example: `vercel_blob_rw_abc123xyz...`

## After Getting the Token

1. Go to **Project Settings** → **Environment Variables**
2. Add:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Your token
   - **Environments:** Production, Preview, Development
3. **Save** and **Redeploy**











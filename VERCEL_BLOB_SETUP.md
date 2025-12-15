# Vercel Blob Storage Setup Guide

## Why You Need This

Image uploads are currently failing because Vercel Blob Storage is not configured. Without it:
- Images larger than 1MB cannot be uploaded
- Base64 fallback is limited and not ideal for production

## Setup Steps

### 1. Create Blob Store in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** or **Add Storage**
5. Select **Blob** (if available) or use **Vercel Blob** integration
6. Create a new Blob store

### 2. Get Your Token

1. In your Blob store settings, find the **Token** or **API Key**
2. Copy the token (starts with `vercel_blob_rw_`)

### 3. Add to Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Your blob token
   - **Environments:** Production, Preview, Development
3. Save

### 4. Redeploy

After adding the environment variable, Vercel will automatically redeploy, or you can trigger a manual redeploy.

## Alternative: Use External Storage

If Vercel Blob is not available, you can use:
- **Cloudinary** (free tier available)
- **AWS S3** (with CloudFront)
- **Cloudflare R2** (S3-compatible, free tier)

Would require updating the upload code in `app/api/admin/content/images/route.ts`.

## Current Status

- ✅ Base64 fallback works for images < 1MB
- ❌ Images > 1MB require Blob Storage
- ⚠️ Base64 images are stored in database (not ideal for large images)

## Next Steps

1. Set up Vercel Blob Storage (recommended)
2. Or configure alternative storage solution
3. Re-upload any broken images after setup







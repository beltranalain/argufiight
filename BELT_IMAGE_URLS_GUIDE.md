# Belt Design Image URLs - Where to Get Them

## Quick Answer

You can use **any publicly accessible image URL** for belt design images. Here are the easiest options:

## Option 1: Use Free Image Hosting Services (Recommended)

### Imgur (Free, No Account Needed)
1. Go to [imgur.com](https://imgur.com)
2. Click "New post" or drag & drop your image
3. Right-click the uploaded image → "Copy image address"
4. Paste that URL into the "Design Image URL" field

**Example:** `https://i.imgur.com/abc123.png`

### Cloudinary (Free Tier Available)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free)
2. Upload your image
3. Copy the "URL" from the media library
4. Paste into the belt form

**Example:** `https://res.cloudinary.com/your-cloud/image/upload/v123/belt-design.png`

### Vercel Blob Storage (If Configured)
If you have `BLOB_READ_WRITE_TOKEN` set up:
1. Use the image upload API: `/api/admin/content/images`
2. Or upload via Vercel dashboard → Storage → Blob
3. Copy the blob URL

## Option 2: Use Direct Image URLs

Any image that's already hosted online:
- GitHub (raw image URLs)
- Your own website/CDN
- Public image hosting services

**Example:** `https://example.com/images/belt-design.png`

## Option 3: Use Data URLs (Small Images Only)

For very small images (< 1MB), you can use base64 data URLs:
1. Convert image to base64: [base64-image.de](https://www.base64-image.de/)
2. Copy the data URL
3. Paste into the field

**Format:** `data:image/png;base64,iVBORw0KGgoAAAANS...`

⚠️ **Note:** Data URLs are stored in the database and not recommended for large images.

## Recommended Workflow

1. **Design your belt image** (use any image editor)
2. **Upload to Imgur** (easiest, no account needed)
3. **Copy the image URL**
4. **Paste into "Design Image URL" field** when creating/editing a belt

## Image Requirements

- **Format:** PNG, JPG, GIF, WebP (any web-compatible format)
- **Size:** Recommended under 2MB for faster loading
- **Dimensions:** Any size (will be scaled by the UI)
- **Access:** Must be publicly accessible (no authentication required)

## Testing Your Image URL

Before saving, you can test if the URL works by:
1. Opening the URL in a new browser tab
2. If the image displays, it will work in the belt system

---

**Quick Tip:** Imgur is the fastest option - just drag & drop, copy URL, done! 🎨

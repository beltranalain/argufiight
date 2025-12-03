# App Download Section Implementation

## Overview
Added a new "App Download" section to the homepage that displays App Store and Google Play download buttons/logos. This section is fully manageable through the Content Manager in the admin dashboard.

## Changes Made

### 1. Homepage Component (`components/homepage/PublicHomepage.tsx`)
- Added `AppDownloadSection` component that displays:
  - Section title and content (editable)
  - App Store button/logo (with link)
  - Google Play button/logo (with link)
- Section appears between main content sections and footer
- Supports both image logos and text buttons as fallback
- Responsive design with hover effects

### 2. Content Manager (`app/admin/content/page.tsx`)
- Added "App Store" and "Google Play" button variants to the dropdown
- Enhanced `SectionButtonsManager` component with:
  - Real-time button editing (saves on blur)
  - Add new button functionality
  - Delete button functionality
  - Visibility toggle
  - Full CRUD operations

### 3. API Endpoints
- **POST `/api/admin/content/buttons`** - Create new buttons
- **PATCH `/api/admin/content/buttons/[id]`** - Update existing buttons
- **DELETE `/api/admin/content/buttons/[id]`** - Delete buttons

### 4. Database Seeding (`prisma/seed-homepage.ts`)
- Added default "app-download" section with:
  - Title: "Download Our App"
  - Content: "Get the Honorable AI app on your mobile device and debate on the go!"
  - Order: 4 (appears after testimonials, before footer)
  - Visible by default

## How to Use

### For Admins (Content Manager)

1. **Navigate to Content Manager**: Go to `/admin/content` in the admin dashboard

2. **Find the App Download Section**: Look for the section with key "app-download"

3. **Edit the Section**:
   - Click "Edit" on the app-download section card
   - Update title, content, order, and visibility
   - Add images for App Store and Google Play logos (upload via Media Library)
   - Set image alt text to include "app store" or "google play" for automatic detection

4. **Manage Buttons**:
   - In the edit modal, scroll to "Section Buttons"
   - Click "+ Add Button" to create new buttons
   - For App Store button:
     - Text: "Download on the App Store" (or leave blank if using logo)
     - URL: Your App Store link (e.g., `https://apps.apple.com/app/your-app`)
     - Variant: Select "App Store"
     - Make sure it's visible
   - For Google Play button:
     - Text: "Get it on Google Play" (or leave blank if using logo)
     - URL: Your Google Play link (e.g., `https://play.google.com/store/apps/details?id=your.app`)
     - Variant: Select "Google Play"
     - Make sure it's visible
   - Buttons save automatically when you blur (click away) from input fields
   - Use the visibility checkbox to show/hide buttons
   - Click "Delete" to remove buttons

5. **Upload Logos**:
   - Click "Media Library" button in Content Manager
   - Upload your App Store and Google Play badge images
   - Go back to edit the app-download section
   - Add images to the section (order 0 for App Store, order 1 for Google Play)
   - Set alt text to help with automatic detection

### For Developers

#### Running the Seed Script
To create the default app-download section in the database:

```bash
npx tsx prisma/seed-homepage.ts
```

#### Section Structure
The app-download section uses:
- **Buttons**: Two buttons with variants `app-store` and `google-play`
- **Images**: Optional logo images (detected by alt text or order)
- **Display Logic**: Shows images if available, falls back to styled text buttons

#### Customization
- The section styling matches the homepage theme (purple gradient, glassmorphism)
- Button sizes are responsive (w-48 h-14 on mobile, w-56 h-16 on desktop)
- Hover effects include scale transform and border color changes

## Technical Details

### Button Variants
- `primary` - Standard primary button style
- `secondary` - Standard secondary button style  
- `app-store` - For App Store download buttons
- `google-play` - For Google Play download buttons

### Image Detection
The component automatically detects which image is for which store by:
1. Checking alt text for "app store" or "google play" keywords
2. Falling back to image order (0 = App Store, 1 = Google Play)

### Button Display Priority
1. If image exists for button variant → Show image
2. If no image → Show styled text button with button text

## Future Enhancements
- Add QR code generation for easy mobile scanning
- Add analytics tracking for button clicks
- Support for additional app stores (Amazon Appstore, etc.)
- Custom button styling per variant


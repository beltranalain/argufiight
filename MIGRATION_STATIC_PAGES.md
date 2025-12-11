# Static Pages Database Migration

## What Changed

1. **New Database Model**: Added `StaticPage` model to manage how-it-works, pricing, about, and FAQ pages
2. **Admin Management**: Added Static Pages manager to `/admin/content` page
3. **Dynamic Content**: Pages now pull content from database with fallback to hardcoded content
4. **OG Images**: Created placeholder SVG images for social media sharing

## Migration Steps

1. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev --name add_static_pages
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Verify Migration**:
   - Check that `static_pages` table exists in database
   - Visit `/admin/content` and verify "Static Pages" section appears

## Using the Static Pages Manager

1. Go to `/admin/content` in the admin dashboard
2. Scroll to "Static Pages" section
3. Click "Create" or "Edit" for any page (how-it-works, pricing, about, faq)
4. Edit content using the rich text editor
5. Update SEO fields (Meta Title, Meta Description, Keywords)
6. Save changes

## OG Images

Placeholder SVG images have been created:
- `/public/og-image.svg` (1200x630)
- `/public/twitter-card.svg` (1200x628)

**Note**: These are basic placeholders. For production, replace with professionally designed PNG images:
- `/public/og-image.png` (1200x630)
- `/public/twitter-card.png` (1200x628)

Update metadata references in `app/page.tsx` when replacing with PNG images.

## Page Behavior

- If database content exists and is visible: Renders database content
- If no database content: Renders fallback hardcoded content
- SEO metadata: Uses database meta fields if available, otherwise uses defaults


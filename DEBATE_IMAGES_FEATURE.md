# Debate Images Feature

## Overview
Added the ability to upload and display images in debates. Users can now add up to 6 images when creating a debate, perfect for comparison debates like "Who is the best singer?" with 4 singer photos.

## What Was Built

### 1. Database Schema
- **New Model**: `DebateImage` in `prisma/schema.prisma`
- **Fields**:
  - `id`, `debateId`, `url`, `alt`, `caption`, `order`
  - `width`, `height`, `fileSize`, `mimeType`
  - `uploadedBy`, `createdAt`, `updatedAt`
- **Table Created**: `debate_images` with proper indexes
- **Relation**: Linked to `Debate` model with cascade delete

### 2. Create Debate Modal (`components/debate/CreateDebateModal.tsx`)
- **Image Upload Section**: Added after description field
- **Features**:
  - Drag & drop or click to upload
  - Preview grid (2 columns)
  - Up to 6 images max
  - Alt text and caption for each image
  - Remove images before submission
  - File validation (images only, max 10MB each)
- **Upload Flow**: Images upload after debate creation, linked to debate ID

### 3. API Endpoints

#### `POST /api/debates/images`
- Uploads debate images
- Accepts FormData with:
  - `image`: File
  - `debateId`: Debate ID (optional, can upload before debate creation)
  - `alt`: Alt text (optional)
  - `caption`: Caption (optional)
  - `order`: Display order
- Saves files to `public/uploads/debates/`
- Creates `DebateImage` records in database

#### Updated `GET /api/debates/[id]`
- Now includes `images` array in response
- Images ordered by `order` field

### 4. Debate Detail Page (`app/(dashboard)/debate/[id]/page.tsx`)
- **Image Gallery**: Displays debate images
- **Layout**:
  - 1 image: Full width
  - 2 images: 2 columns
  - 3 images: 3 columns
  - 4+ images: 2x2 grid
- **Features**:
  - Responsive grid layout
  - Captions displayed below images
  - Square aspect ratio maintained
  - Images appear after topic/description, before participants

### 5. Database Script
- `scripts/add-debate-images-table.js`: Creates the table manually (used due to migration drift)

## How to Use

### Creating a Debate with Images

1. Click "Create Debate" button (FAB or modal)
2. Fill in topic, description, category, etc.
3. Scroll to "Images (Optional)" section
4. Click the upload area or drag & drop images
5. Add alt text and captions (optional)
6. Remove images if needed (× button)
7. Create the debate - images upload automatically

### Example Use Case
**Topic**: "Who is the best singer?"
**Images**: Upload 4 photos (one for each singer)
**Captions**: "Singer A", "Singer B", "Singer C", "Singer D"
**Result**: Debate displays all 4 images in a grid for easy comparison

## Technical Details

### File Storage
- Location: `public/uploads/debates/`
- Filename format: `{timestamp}-{random}.{extension}`
- Accessible via: `/uploads/debates/{filename}`

### Image Limits
- Maximum 6 images per debate
- Maximum 10MB per image
- Supported formats: JPG, PNG, WebP (any image/* MIME type)

### Image Ordering
- Images are ordered by the `order` field
- Order is set based on upload sequence
- Can be reordered by updating the `order` field in the database

## Future Enhancements
- Drag & drop reordering in the modal
- Image editing/cropping before upload
- Image optimization/compression
- Lightbox/modal view for full-size images
- Image annotations in arguments
- Support for more file types (GIF, etc.)

## Files Modified/Created

### Created
- `app/api/debates/images/route.ts` - Image upload endpoint
- `scripts/add-debate-images-table.js` - Database table creation script
- `DEBATE_IMAGES_FEATURE.md` - This documentation

### Modified
- `prisma/schema.prisma` - Added DebateImage model
- `components/debate/CreateDebateModal.tsx` - Added image upload UI
- `app/api/debates/[id]/route.ts` - Include images in response
- `app/(dashboard)/debate/[id]/page.tsx` - Display images

## Testing Checklist
- [ ] Upload 1 image to a debate
- [ ] Upload 6 images (max limit)
- [ ] Try uploading 7th image (should be blocked)
- [ ] Add alt text and captions
- [ ] Remove images before submission
- [ ] Verify images display on debate detail page
- [ ] Test with different image counts (1, 2, 3, 4+)
- [ ] Verify images are deleted when debate is deleted (cascade)




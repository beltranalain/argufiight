# PHASE 8.5: DEBATE INTERACTIONS & SOCIAL FEATURES

**Duration:** 6-8 hours  
**Status:** ✅ **COMPLETE**  
**Dependencies:** Phase 5, Phase 6, Phase 7  
**Completed:** December 2024

## Overview

This phase adds social interaction features to debates, allowing users to engage with debates beyond just participating. Features include likes, saves, shares, comments, and following other users. All features are configurable by admins.

## Objectives

1. Create profile page with avatar upload
2. Add comments section to debate pages
3. Implement like, save, share, and follow features
4. Add admin controls for enabling/disabling features
5. Create API routes for all interactions

## Deliverables

### 1. Profile Page ✅
- User profile page at `/profile`
- Avatar upload functionality
- Edit username and bio
- Display user stats (ELO, win rate, record)

### 2. Debate Interactions
- **Like**: Users can like debates
- **Save**: Users can bookmark debates for later
- **Share**: Users can share debates (tracking)
- **Follow**: Users can follow other users
- **Comments**: Users can comment on debates (with replies)

### 3. Admin Controls
- Toggle features on/off in admin dashboard
- Control which features are available to users
- Settings stored in `AdminSetting` table

### 4. Database Models
- `DebateLike` - Track likes
- `DebateSave` - Track saves/bookmarks
- `DebateShare` - Track shares
- `DebateComment` - Comments with reply support
- `Follow` - User following relationships

## Implementation Status

### ✅ Completed
- Profile page created (`app/(dashboard)/profile/page.tsx`)
- Profile API routes (`/api/profile`, `/api/profile/avatar`)
- Avatar upload functionality (fixed and working)
- Profile stats display (Total, Wins, Losses, ELO, Win Rate)
- Settings page (`/settings`) with password change and notifications
- Database models added to schema (DebateLike, DebateSave, DebateShare, DebateComment, Follow)
- Migration created

### ✅ Completed
- API routes for interactions (like, save, share, follow)
- UI components for interactions
- Comments section on debate page
- Admin settings for feature toggles
- Integration with debate page
- Share functionality (copy link, native share)
- Feature flag system with caching
- Components respect feature flags

## Key Files

### API Routes
- `app/api/profile/route.ts` - Profile CRUD
- `app/api/profile/avatar/route.ts` - Avatar upload
- `app/api/debates/[id]/like/route.ts` - Like/unlike debate
- `app/api/debates/[id]/save/route.ts` - Save/unsave debate
- `app/api/debates/[id]/share/route.ts` - Share debate
- `app/api/debates/[id]/comments/route.ts` - Comments CRUD
- `app/api/users/[id]/follow/route.ts` - Follow/unfollow user

### Components
- `app/(dashboard)/profile/page.tsx` - Profile page
- `components/debate/DebateInteractions.tsx` - Like/Save/Share buttons
- `components/debate/CommentsSection.tsx` - Comments sidebar
- `components/debate/CommentForm.tsx` - Comment input form
- `components/debate/CommentItem.tsx` - Individual comment display

### Admin
- `app/admin/settings/page.tsx` - Add feature toggles
- `app/api/admin/settings/route.ts` - Update feature settings

## Feature Flags (Admin Settings)

All features can be toggled via admin settings:
- `FEATURE_LIKES_ENABLED` - Enable/disable likes
- `FEATURE_SAVES_ENABLED` - Enable/disable saves
- `FEATURE_SHARES_ENABLED` - Enable/disable shares
- `FEATURE_COMMENTS_ENABLED` - Enable/disable comments
- `FEATURE_FOLLOWS_ENABLED` - Enable/disable following

## Database Schema

```prisma
model DebateLike {
  id       String  @id @default(uuid())
  debateId String
  userId   String
  createdAt DateTime @default(now())
  
  @@unique([debateId, userId])
}

model DebateSave {
  id       String  @id @default(uuid())
  debateId String
  userId   String
  createdAt DateTime @default(now())
  
  @@unique([debateId, userId])
}

model DebateShare {
  id       String  @id @default(uuid())
  debateId String
  userId   String
  method   String? // e.g., "twitter", "copy_link"
  createdAt DateTime @default(now())
}

model DebateComment {
  id       String  @id @default(uuid())
  debateId String
  userId   String
  content  String
  parentId String? // For replies
  deleted  Boolean @default(false)
  createdAt DateTime @default(now())
}

model Follow {
  id          String  @id @default(uuid())
  followerId  String
  followingId String
  createdAt DateTime @default(now())
  
  @@unique([followerId, followingId])
}
```

## UI/UX Design

### Debate Page Layout
- **Left Side**: Debate content (existing)
- **Right Side**: Comments section (new)
- **Top of Debate Card**: Interaction buttons (Like, Save, Share)

### Comments Section
- Scrollable list of comments
- Comment form at bottom
- Reply functionality (nested comments)
- User avatars and timestamps
- Delete own comments

### Profile Page
- Large avatar with upload button
- User stats grid
- Edit form for username and bio
- Recent activity (optional)

## Testing Checklist

- [x] Profile page loads and displays user data
- [x] Avatar upload works
- [x] Profile edit saves correctly
- [x] Like button toggles correctly
- [x] Save button toggles correctly
- [x] Share button copies link / native share
- [x] Comments can be posted
- [x] Comments can be replied to
- [x] Comments can be deleted
- [x] Follow API works
- [x] Admin can toggle features
- [x] Disabled features don't show in UI

## Notes

- Avatar uploads stored in `public/uploads/avatars/`
- In production, consider using cloud storage (S3, Cloudinary, Uploadthing)
- Comments support nested replies (max depth: 2-3 levels recommended)
- Share tracking is optional but useful for analytics
- Follow feature enables future "feed" functionality


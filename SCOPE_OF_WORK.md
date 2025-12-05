# Scope of Work - Argu Fight Platform Enhancements

**Date:** December 2025  
**Status:** Planning Phase  
**Priority:** High

---

## Executive Summary

This document outlines 9 major feature enhancements for the Argu Fight platform, organized by priority, complexity, and dependencies. Each feature includes implementation recommendations, technical considerations, and suggested improvements.

---

## Feature Categories

### Category 1: Content & Social Media Management
- [Feature 1: Social Media Footer](#feature-1-social-media-footer)
- [Feature 2: Social Media Post Manager](#feature-2-social-media-post-manager)

### Category 2: Admin Management Tools
- [Feature 3: Appeal System Manager](#feature-3-appeal-system-manager)
- [Feature 4: Subscription Plan Manager](#feature-4-subscription-plan-manager)
- [Feature 5: Advertisement Manager](#feature-5-advertisement-manager)

### Category 3: Debate Features
- [Feature 6: Private/Public Debates](#feature-6-privatepublic-debates)

### Category 4: User Experience & Analytics
- [Feature 7: Saved Debates Page](#feature-7-saved-debates-page)
- [Feature 8: Enhanced User Analytics](#feature-8-enhanced-user-analytics)
- [Feature 9: Individual & Overall Scores](#feature-9-individual--overall-scores)

---

## Feature 1: Social Media Footer

### Description
Add social media icons to the homepage footer with links managed through the Content Manager admin page.

### Requirements
- Add social media section to Content Manager
- Support: Facebook, Twitter/X, Instagram, LinkedIn, YouTube, TikTok
- Each platform has URL field
- Icons display in footer (only show platforms with URLs)
- Footer updates dynamically based on Content Manager settings

### Technical Approach
1. **Database Schema:**
   - Add `SocialMediaLinks` table or extend `HomepageSection`
   - Fields: `platform`, `url`, `order`, `isActive`

2. **Content Manager:**
   - New section: "Social Media Links"
   - Form with platform dropdown, URL input, order field
   - Preview of icons

3. **Footer Component:**
   - Fetch social links from API
   - Render icons using react-icons or similar
   - Open links in new tab

### Recommendations
- ✅ Use SVG icons for better performance
- ✅ Add hover effects and tooltips
- ✅ Include social sharing meta tags for SEO
- ✅ Consider adding social proof (follower counts) if API available

### Priority: **Medium**
### Estimated Effort: **4-6 hours**

---

## Feature 2: Social Media Post Manager

### Description
AI-powered social media post generator that creates platform-specific content and Sora image prompts for debates.

### Requirements
- Admin dashboard page: "Social Media Posts"
- Generate posts for: Instagram, LinkedIn, Twitter/X
- AI generates:
  - Platform-specific copy (character limits, hashtags, tone)
  - Sora image generation prompts
  - Post scheduling suggestions
- Posts tied to specific debates
- Export/share functionality

### Technical Approach
1. **Database Schema:**
   ```prisma
   model SocialMediaPost {
     id            String   @id @default(uuid())
     debateId     String
     platform      String   // INSTAGRAM, LINKEDIN, TWITTER
     content       String   @db.Text
     imagePrompt   String?  @db.Text
     hashtags      String?
     status        String   // DRAFT, APPROVED, PUBLISHED
     scheduledAt   DateTime?
     createdAt     DateTime @default(now())
   }
   ```

2. **AI Integration:**
   - Use DeepSeek API (already configured)
   - Create prompts for each platform:
     - Instagram: Visual, hashtag-rich, engaging
     - LinkedIn: Professional, thought-provoking
     - Twitter: Concise, trending topics
   - Generate Sora prompts based on debate topic/category

3. **UI Components:**
   - Post generator form (select debate, platform)
   - Generated post preview
   - Edit/regenerate options
   - Copy to clipboard
   - Export as image (optional)

### Recommendations
- ✅ **IMPROVEMENT:** Add post templates for different debate categories
- ✅ **IMPROVEMENT:** Include debate statistics in posts (views, likes)
- ✅ **IMPROVEMENT:** Add A/B testing for different post styles
- ✅ **IMPROVEMENT:** Schedule posts (integrate with Buffer/Hootsuite API later)
- ✅ **IMPROVEMENT:** Track post performance (if social APIs available)

### Priority: **High** (Marketing value)
### Estimated Effort: **12-16 hours**

---

## Feature 3: Appeal System Manager

### Description
Admin dashboard to manage appeal limits, counts, and monetization. System-wide appeal management with subscription integration.

### Requirements
- Admin page: "Appeal Management"
- Set default appeals per month (e.g., 4)
- Manually adjust appeal count per user
- Track appeal usage per user
- Monetization: Subscription packages for additional appeals
- Appeal history and analytics

### Technical Approach
1. **Database Schema:**
   ```prisma
   model AppealLimit {
     id              String   @id @default(uuid())
     userId          String
     monthlyLimit    Int      @default(4)
     currentCount    Int      @default(0)
     resetDate       DateTime
     subscriptionTier String? // FREE, PREMIUM, PRO
   }
   
   model AppealSubscription {
     id              String   @id @default(uuid())
     userId          String
     planName        String   // e.g., "Premium Appeals"
     appealsIncluded Int
     price           Decimal
     status          String   // ACTIVE, CANCELLED, EXPIRED
     startDate       DateTime
     endDate         DateTime?
   }
   ```

2. **Admin UI:**
   - User search/select
   - Current appeal count display
   - Manual adjustment (+/- buttons)
   - Set monthly limit
   - View appeal history
   - Subscription management

3. **Appeal Logic:**
   - Check appeal limit before allowing appeal
   - Reset monthly count (cron job)
   - Track appeal usage

### Recommendations
- ✅ **IMPROVEMENT:** Add appeal analytics (most appealed debates, success rate)
- ✅ **IMPROVEMENT:** Appeal tiers (e.g., 4 free, 10 premium, unlimited pro)
- ✅ **IMPROVEMENT:** Appeal cooldown period (prevent spam)
- ✅ **IMPROVEMENT:** Appeal quality score (prevent low-quality appeals)
- ✅ **IMPROVEMENT:** Auto-reset on 1st of month (cron job)

### Priority: **High** (Revenue + User Management)
### Estimated Effort: **16-20 hours**

---

## Feature 4: Subscription Plan Manager

### Description
Admin dashboard page to configure subscription plans (build but don't activate). Foundation for future monetization.

### Requirements
- Admin page: "Subscription Plans"
- Create/edit subscription tiers
- Set pricing, features, limits
- Plan comparison view
- Integration points for Stripe (already configured)

### Technical Approach
1. **Database Schema:**
   ```prisma
   model SubscriptionPlan {
     id                String   @id @default(uuid())
     name              String   // "Free", "Premium", "Pro"
     price             Decimal
     billingCycle      String   // MONTHLY, YEARLY
     features          String   @db.Text // JSON array
     appealLimit       Int?
     debateLimit       Int?
     prioritySupport   Boolean  @default(false)
     customBadge       String?
     isActive          Boolean  @default(false) // Don't activate yet
     createdAt         DateTime @default(now())
   }
   ```

2. **Admin UI:**
   - Plan CRUD operations
   - Feature checklist
   - Pricing configuration
   - Toggle active/inactive
   - Preview plan page

### Recommendations
- ✅ **IMPROVEMENT:** Plan templates (Free, Premium, Pro)
- ✅ **IMPROVEMENT:** Feature comparison table
- ✅ **IMPROVEMENT:** Stripe product/price ID mapping
- ✅ **IMPROVEMENT:** Trial period configuration
- ✅ **IMPROVEMENT:** Discount codes system

### Priority: **Medium** (Future revenue)
### Estimated Effort: **8-12 hours**

---

## Feature 5: Advertisement Manager

### Description
Admin dashboard page to manage advertisements (build but don't activate). Foundation for future ad revenue.

### Requirements
- Admin page: "Advertisement Management"
- Create/edit ad campaigns
- Upload ad creatives
- Set targeting rules
- Schedule ads
- Track performance (placeholder)

### Technical Approach
1. **Database Schema:**
   ```prisma
   model Advertisement {
     id            String   @id @default(uuid())
     title         String
     type          String   // BANNER, SPONSORED_DEBATE, IN_FEED
     creativeUrl   String
     targetUrl     String
     status        String   // DRAFT, ACTIVE, PAUSED
     startDate     DateTime?
     endDate       DateTime?
     impressions   Int      @default(0)
     clicks        Int      @default(0)
     createdAt     DateTime @default(now())
   }
   ```

2. **Admin UI:**
   - Ad CRUD operations
   - Image upload (use existing Blob Storage)
   - Targeting options (category, user segment)
   - Scheduling calendar
   - Performance dashboard (placeholder)

### Recommendations
- ✅ **IMPROVEMENT:** Ad placement zones (header, sidebar, in-feed)
- ✅ **IMPROVEMENT:** A/B testing for ad creatives
- ✅ **IMPROVEMENT:** Revenue tracking
- ✅ **IMPROVEMENT:** Ad approval workflow
- ✅ **IMPROVEMENT:** Integration with Google AdSense (future)

### Priority: **Low** (Future revenue)
### Estimated Effort: **10-14 hours**

---

## Feature 6: Private/Public Debates

### Description
Allow users to create private debates with shareable links. Public debates remain visible to all.

### Requirements
- Add "Privacy" toggle when creating debate
- Private debates: Only accessible via share link
- Share link generation (unique, secure)
- Public debates: Visible in all feeds (current behavior)
- Privacy indicator on debate cards

### Technical Approach
1. **Database Schema:**
   ```prisma
   // Add to Debate model
   isPrivate      Boolean  @default(false)
   shareToken     String?  @unique // UUID for private debates
   ```

2. **Create Debate Flow:**
   - Add privacy toggle (Public/Private)
   - Generate share token if private
   - Store in database

3. **Share Link:**
   - Format: `https://argufight.com/debate/[id]?token=[shareToken]`
   - Validate token on debate access
   - Show share button for private debates

4. **Access Control:**
   - Public: Anyone can view
   - Private: Require token or be participant
   - Participants always have access

### Recommendations
- ✅ **IMPROVEMENT:** Password-protected debates
- ✅ **IMPROVEMENT:** Expiring share links
- ✅ **IMPROVEMENT:** Share link analytics (who accessed)
- ✅ **IMPROVEMENT:** Private debate notifications (only to participants)

### Priority: **Medium**
### Estimated Effort: **6-8 hours**

---

## Feature 7: Saved Debates Page

### Description
**INVESTIGATION COMPLETE:** Saved debates functionality exists but needs a web page. Mobile app has it, web does not.

### Current Status
- ✅ `DebateSave` model exists in database schema
- ✅ Save API endpoint exists: `/api/debates/[id]/save`
- ✅ Mobile app has `SavedDebatesScreen.tsx`
- ❌ **Missing:** Web page to view saved debates (`/saved` or `/debates/saved`)

### Technical Approach
1. **Investigation:**
   - Check if `SavedDebate` model exists in schema
   - Verify API endpoint returns saved debates
   - Check if UI component exists but not linked

2. **Implementation:**
   - Create `/saved` or `/debates/saved` page
   - Fetch user's saved debates
   - Display as debate cards (reuse existing components)
   - Add unsave functionality
   - Filter/sort options

3. **Navigation:**
   - Add "Saved Debates" to user menu/profile
   - Link from debate card save button

### Recommendations
- ✅ **IMPROVEMENT:** Organize saved debates into folders/collections
- ✅ **IMPROVEMENT:** Add notes/tags to saved debates
- ✅ **IMPROVEMENT:** Share saved debates collection

### Priority: **High** (User Experience)
### Estimated Effort: **4-6 hours** (after investigation)

---

## Feature 8: Enhanced User Analytics

### Description
Deeper analytics for user profiles: word counts, average rounds, battle history, and more detailed statistics.

### Requirements
- Word count statistics (total, average per debate)
- Average debate rounds
- Battle history (who they've debated)
- Win/loss breakdown by category
- Debate frequency (debates per week/month)
- Response time analytics
- Most active debate times

### Technical Approach
1. **Database Schema:**
   ```prisma
   model UserAnalytics {
     id                    String   @id @default(uuid())
     userId                String   @unique
     totalWords            Int      @default(0)
     averageWordsPerDebate Float    @default(0)
     averageRounds          Float    @default(0)
     totalDebates          Int      @default(0)
     debatesThisMonth      Int      @default(0)
     fastestResponseTime   Int?     // milliseconds
     averageResponseTime   Int?     // milliseconds
     lastUpdated           DateTime @default(now())
   }
   ```

2. **Analytics Calculation:**
   - Cron job or real-time calculation
   - Aggregate from `Statement` and `Debate` tables
   - Update on debate completion

3. **Profile Page:**
   - New "Analytics" tab
   - Charts/graphs (use recharts or similar)
   - Battle history list
   - Category breakdown

### Recommendations
- ✅ **IMPROVEMENT:** Export analytics as PDF
- ✅ **IMPROVEMENT:** Compare with platform averages
- ✅ **IMPROVEMENT:** Achievement badges based on stats
- ✅ **IMPROVEMENT:** Weekly/monthly reports (email)
- ✅ **IMPROVEMENT:** Heatmap of debate activity

### Priority: **High** (User Engagement)
### Estimated Effort: **16-20 hours**

---

## Feature 9: Individual & Overall Scores

### Description
Display individual judge scores per debate (e.g., 65/100, 35/100, 20/100) and calculate overall score (120/300) next to ELO rating.

### Requirements
- Show individual judge scores in verdict display
- Calculate total score (sum of all judge scores)
- Calculate max possible score (judges × 100)
- Display overall user score (sum of all debate scores)
- Show next to ELO rating on profile

### Technical Approach
1. **Database Schema:**
   ```prisma
   // Add to Verdict model (if not exists)
   score           Int?     // 0-100 score from judge
   
   // Add to User model
   totalScore      Int      @default(0) // Sum of all scores
   totalMaxScore   Int      @default(0) // Max possible (judges × 100 × debates)
   ```

2. **Score Calculation:**
   - Extract scores from AI verdict responses
   - Store in `Verdict.score` field
   - Aggregate on user profile

3. **UI Updates:**
   - Verdict display: Show individual scores
   - Profile: Display "Overall Score: 1,250/2,000" next to ELO
   - Debate detail: Show score breakdown

### Recommendations
- ✅ **IMPROVEMENT:** Score trends over time (graph)
- ✅ **IMPROVEMENT:** Category-specific scores
- ✅ **IMPROVEMENT:** Score leaderboard
- ✅ **IMPROVEMENT:** Score badges (e.g., "Consistently High Scorer")

### Priority: **High** (User Motivation)
### Estimated Effort: **12-16 hours**

---

## Implementation Priority & Timeline

### Phase 1: Quick Wins (Week 1)
1. ✅ Feature 7: Saved Debates Page (4-6 hours)
2. ✅ Feature 1: Social Media Footer (4-6 hours)
3. ✅ Feature 6: Private/Public Debates (6-8 hours)

**Total: 14-20 hours**

### Phase 2: Core Features (Week 2-3)
4. ✅ Feature 9: Individual & Overall Scores (12-16 hours)
5. ✅ Feature 8: Enhanced User Analytics (16-20 hours)

**Total: 28-36 hours**

### Phase 3: Admin Tools (Week 4-5)
6. ✅ Feature 3: Appeal System Manager (16-20 hours)
7. ✅ Feature 2: Social Media Post Manager (12-16 hours)

**Total: 28-36 hours**

### Phase 4: Future Foundation (Week 6)
8. ✅ Feature 4: Subscription Plan Manager (8-12 hours)
9. ✅ Feature 5: Advertisement Manager (10-14 hours)

**Total: 18-26 hours**

---

## Technical Considerations

### Dependencies
- **Stripe Integration:** Already configured ✅
- **DeepSeek API:** Already configured ✅
- **Vercel Blob Storage:** Already configured ✅
- **Database:** PostgreSQL with Prisma ✅

### New Dependencies Needed
- **Chart Library:** `recharts` or `chart.js` (for analytics)
- **Icon Library:** `react-icons` (for social media)
- **Date Picker:** `react-datepicker` (for scheduling)

### Database Migrations
- Multiple schema changes required
- Run migrations in order
- Backup database before major changes

### Testing Strategy
- Unit tests for score calculations
- Integration tests for appeal limits
- E2E tests for private debate sharing
- Manual testing for admin dashboards

---

## Risk Assessment

### High Risk
- **Feature 9:** Score extraction from AI responses may be inconsistent
- **Feature 3:** Appeal system complexity (subscription integration)

### Medium Risk
- **Feature 2:** AI post generation quality may vary
- **Feature 8:** Analytics calculation performance on large datasets

### Low Risk
- **Feature 1, 4, 5, 6, 7:** Straightforward implementations

---

## Recommendations & Improvements

### Overall Platform Improvements

1. **User Onboarding:**
   - Tutorial for new features
   - Tooltips for complex features (appeals, scores)

2. **Performance:**
   - Cache analytics calculations
   - Lazy load saved debates
   - Optimize score aggregations

3. **Monetization Strategy:**
   - Bundle appeals with subscription
   - Premium analytics features
   - Ad-free experience for subscribers

4. **User Engagement:**
   - Gamification: Score-based achievements
   - Social sharing: Share analytics, scores
   - Leaderboards: Top scores, most appeals won

5. **Admin Efficiency:**
   - Bulk operations for appeal management
   - Export analytics reports
   - Automated post scheduling

---

## Next Steps

1. **Review & Approval:** Review this scope with stakeholders
2. **Investigation:** Verify saved debates implementation (Feature 7)
3. **Design Mockups:** Create UI mockups for admin pages
4. **Database Design:** Finalize schema changes
5. **Development:** Start with Phase 1 (Quick Wins)
6. **Testing:** Continuous testing throughout development
7. **Deployment:** Staged rollout (admin features first, then user-facing)

---

## Questions to Resolve

1. **Feature 7:** Does `SavedDebate` model exist? Where is save functionality?
2. **Feature 9:** How are scores currently stored in verdicts? Need to parse AI responses?
3. **Feature 3:** What subscription tiers are planned? Pricing?
4. **Feature 2:** Should posts auto-schedule or manual publish?
5. **Feature 6:** Should private debates be searchable by participants only?

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Author:** Development Team


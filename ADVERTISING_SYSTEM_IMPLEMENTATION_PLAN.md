# Advertising System Implementation Plan

## Executive Summary

This plan implements a comprehensive dual-revenue advertising system from scratch: **Platform Ads** (traditional admin-managed campaigns) + **Creator Marketplace** (user-to-advertiser sponsorships). Both systems will be built new with clean architecture, configurable settings, and admin toggles for easy enable/disable.

---

## Current System Analysis

### What You Have Now ✅

**Database:**
- `Advertisement` model (basic)
  - Fields: title, type, creativeUrl, targetUrl, status, dates, category, impressions, clicks
  - Status: DRAFT, ACTIVE, PAUSED
  - Types: BANNER, SPONSORED_DEBATE, IN_FEED

**Admin Features:**
- `/admin/advertisements` page exists
- CRUD operations for ads
- Image upload (Vercel Blob Storage)
- Basic scheduling (start/end dates)
- Category targeting
- **Note:** Ads are NOT displayed on site yet (as per requirements)

**API:**
- `GET /api/admin/advertisements` - List ads
- `POST /api/admin/advertisements` - Create ad
- `PUT /api/admin/advertisements/[id]` - Update ad
- `DELETE /api/admin/advertisements/[id]` - Delete ad

### What's Missing ❌

1. **Advertiser Management** - No advertiser accounts, approval workflow
2. **Ad Display System** - Ads not rendered anywhere
3. **Tracking** - Impressions/clicks tracked but not implemented
4. **Creator Marketplace** - No user-to-advertiser system
5. **Payment Integration** - No Stripe Connect, escrow, payouts
6. **Campaign System** - Current ads are too simple, need campaigns
7. **Offer/Contract System** - No creator sponsorship workflow

---

## Integration Strategy

**Decision: Build Both Systems New** ✅

**Approach:**
- Build Platform Ads system from scratch
- Build Creator Marketplace system from scratch
- Clean architecture, no legacy constraints
- Both systems controlled by admin toggles
- Can be enabled/disabled independently
- All configuration stored in `AdminSetting` table

---

## Proposed Architecture

### Two-Tier System

```
┌─────────────────────────────────────────────────────────┐
│              ADVERTISING SYSTEM                         │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │  PLATFORM ADS    │    │ CREATOR MARKET   │         │
│  │  (Traditional)   │    │ (User Sponsors)  │         │
│  └────────┬─────────┘    └────────┬─────────┘         │
│           │                        │                    │
│           ▼                        ▼                    │
│  ┌──────────────────────────────────────────┐         │
│  │      UNIFIED AD DISPLAY ENGINE            │         │
│  │  • Profile Banners                        │         │
│  │  • Post-Debate Ads                        │         │
│  │  • Sidebar Widgets                        │         │
│  │  • In-Feed Ads                            │         │
│  └──────────────────────────────────────────┘         │
│                                                         │
│  ┌──────────────────────────────────────────┐         │
│  │      UNIFIED TRACKING SYSTEM               │         │
│  │  • Impressions (deduplicated)              │         │
│  │  • Clicks                                   │         │
│  │  • Analytics                                │         │
│  └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema Evolution

### Phase 1: New Database Models

**Note:** Building both systems new, not extending existing `Advertisement` model.

**New Models (From Guide):**
```prisma
model Advertisement {
  // Existing fields (keep as-is)
  id          String    @id @default(uuid())
  title       String
  type        String    // BANNER, SPONSORED_DEBATE, IN_FEED
  creativeUrl String    @map("creative_url")
  targetUrl   String    @map("target_url")
  status      String    @default("DRAFT")
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  impressions Int       @default(0)
  clicks      Int       @default(0)
  category    String?
  
  // NEW: Link to advertiser (optional for backward compat)
  advertiserId String?  @map("advertiser_id")
  advertiser    Advertiser? @relation(fields: [advertiserId], references: [id])
  
  // NEW: Link to campaign (optional)
  campaignId    String?  @map("campaign_id")
  campaign      Campaign? @relation(fields: [campaignId], references: [id])
  
  // NEW: Link to contract (for creator marketplace ads)
  contractId    String?  @unique @map("contract_id")
  contract      AdContract? @relation(fields: [contractId], references: [id])
  
  // NEW: Placement details
  placement     PlacementType? // PROFILE_BANNER, POST_DEBATE, etc.
  priority      Int      @default(0) // Higher = shown first
  
  // NEW: Budget tracking
  budget        Decimal? @db.Decimal(10, 2)
  spent         Decimal? @default(0) @db.Decimal(10, 2)
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  @@index([advertiserId])
  @@index([campaignId])
  @@index([contractId])
  @@index([placement])
  @@map("advertisements")
}
```

### Phase 2: Add New Models (From Guide)

Add all models from the guide:
- `Advertiser`
- `Campaign`
- `Offer`
- `AdContract`
- `Impression` (detailed tracking)
- `Click` (detailed tracking)
- `CreatorTaxInfo`
- Update `User` model with creator fields

---

## Implementation Phases

### **PHASE 1: Foundation & Database (3-4 days)**

**1.1 Database Migration Strategy**
- **Approach:** Build new models from scratch
- **Steps:**
  1. Create all new models (Advertiser, Campaign, Offer, AdContract, etc.)
  2. Add creator fields to existing `User` model
  3. Create migration with all new tables
  4. Add indexes for performance
  5. Add admin settings for toggles and configuration

**1.2 Admin Settings Configuration**
- Add toggles in `AdminSetting` table:
  - `ADS_PLATFORM_ENABLED` (boolean, default: false)
  - `ADS_CREATOR_MARKETPLACE_ENABLED` (boolean, default: false)
- Add creator eligibility settings:
  - `CREATOR_MIN_ELO` (default: 1500)
  - `CREATOR_MIN_DEBATES` (default: 10)
  - `CREATOR_MIN_ACCOUNT_AGE_MONTHS` (default: 3)
- Add platform fee settings:
  - `CREATOR_FEE_BRONZE` (default: 25)
  - `CREATOR_FEE_SILVER` (default: 20)
  - `CREATOR_FEE_GOLD` (default: 15)
  - `CREATOR_FEE_PLATINUM` (default: 10)

**1.3 Stripe Connect Setup**
- Already have Stripe integration for subscriptions
- Extend `lib/stripe/stripe-client.ts` with Connect functions
- Add Connect-specific helpers in `lib/stripe/connect.ts`

**1.4 File Storage**
- Already using Vercel Blob Storage
- Can reuse existing upload utilities
- Organize by advertiser/campaign folders

**Key Files:**
- `prisma/schema.prisma` - Add all new models
- `lib/stripe/connect.ts` - Stripe Connect functions
- `lib/ads/helpers.ts` - Fee calculations, eligibility (reads from AdminSetting)
- `lib/ads/config.ts` - Read admin settings for toggles and config

**Deliverables:**
- ✅ Database migration (all new models)
- ✅ Admin settings for toggles and configuration
- ✅ Stripe Connect integration
- ✅ Helper functions (configurable)

---

### **PHASE 2: Admin Dashboard Enhancement (4-5 days)**

**2.1 Reorganize Admin Ads Page**

**Current:** Single page for all ads

**New Structure:**
```
Admin Dashboard
├── Platform Ads Tab (existing, enhanced)
│   ├── Traditional banner ads
│   ├── Admin-created campaigns
│   └── Platform-wide ads
│
└── Creator Marketplace Tab (NEW)
    ├── Advertiser Applications Queue
    ├── Campaign Review Queue
    ├── Active Contracts Monitor
    └── Marketplace Statistics
```

**2.2 Admin Settings Integration**
- Add advertising section to `/admin/settings` page
- Toggles for both ad systems
- Creator eligibility configuration
- Platform fee configuration
- All stored in `AdminSetting` table

**2.3 New Creator Marketplace Tab**
- Advertiser approval queue
- Campaign review queue
- Active contracts dashboard
- Revenue statistics

**Key Files:**
- `app/admin/advertisements/page.tsx` - Enhance existing
- `app/admin/marketplace/page.tsx` - New marketplace tab
- `components/admin/PlatformAdsTab.tsx` - Refactored
- `components/admin/CreatorMarketplaceTab.tsx` - New

**Deliverables:**
- ✅ Enhanced Platform Ads tab
- ✅ New Creator Marketplace tab
- ✅ Approval workflows
- ✅ Admin API routes

---

### **PHASE 3: Advertiser Dashboard (5-7 days)**

**3.1 Advertiser Application Flow**
- Public landing page: `/advertise`
- Application form
- Status tracking: `/advertise/pending`
- Email notifications

**3.2 Advertiser Dashboard**
- Campaign management
- Creator discovery
- Offer management
- Analytics dashboard
- Billing & payments

**3.3 Campaign Creation Wizard**
- Multi-step form
- Creative upload
- Targeting options
- Budget setting
- Review & submit

**Key Files:**
- `app/advertise/page.tsx` - Landing & application
- `app/advertiser/dashboard/page.tsx` - Main dashboard
- `app/advertiser/campaigns/create/page.tsx` - Wizard
- `app/api/advertisers/apply/route.ts` - Application API

**Deliverables:**
- ✅ Advertiser signup flow
- ✅ Advertiser dashboard
- ✅ Campaign creation wizard
- ✅ Creator discovery interface

---

### **PHASE 4: Creator Features (4-6 days)**

**4.1 Creator Onboarding**
- "Become a Creator" CTA in profile
- Eligibility checker
- Stripe Connect onboarding
- Tax form collection (W-9)
- Bank account verification

**4.2 Creator Dashboard**
- Earnings overview
- Active contracts
- Offer inbox
- Ad slot management
- Creator stats for advertisers

**4.3 Offer Management**
- Incoming offers list
- Accept/decline/counter interface
- Negotiation (max 3 rounds)
- Contract signing

**Key Files:**
- `components/profile/CreatorCTA.tsx` - Profile CTA
- `app/creator/dashboard/page.tsx` - Creator dashboard
- `app/creator/setup/page.tsx` - Stripe onboarding
- `components/creator/OfferInbox.tsx` - Offer management

**Deliverables:**
- ✅ Creator onboarding flow
- ✅ Creator dashboard
- ✅ Offer management system
- ✅ Stripe Connect integration

---

### **PHASE 5: Ad Display System (3-5 days)**

**5.1 Ad Display Components**

**Unified Ad Component:**
```typescript
<AdDisplay 
  placement="PROFILE_BANNER"
  userId={userId}
  context="profile"
/>
```

**Placements:**
1. **Profile Banner** - Top of user profile
2. **Post-Debate Ad** - After debate victory
3. **Debate Widget** - Sidebar during live debates
4. **In-Feed** - Between trending topics
5. **Leaderboard Sponsored** - Sponsored leaderboard entry

**5.2 Ad Selection Logic**
```typescript
// Check if ads are enabled (from AdminSetting)
const platformAdsEnabled = await getAdminSetting('ADS_PLATFORM_ENABLED') === 'true'
const creatorMarketplaceEnabled = await getAdminSetting('ADS_CREATOR_MARKETPLACE_ENABLED') === 'true'

// If both disabled, return null (no ads shown)
if (!platformAdsEnabled && !creatorMarketplaceEnabled) {
  return null
}

// Priority order (only if enabled):
// 1. Active creator contract ads (highest priority) - if creator marketplace enabled
// 2. Active platform ads (admin-created) - if platform ads enabled
// 3. Fallback/default ads - if platform ads enabled
```

**5.3 Integration Points**
- Profile pages: Add `<ProfileBanner userId={userId} />`
- Debate victory screen: Add `<PostDebateAd creatorId={winnerId} />`
- Dashboard sidebar: Add `<AdWidget placement="SIDEBAR" />`
- Trending topics: Add `<InFeedAd />` between items

**Key Files:**
- `components/ads/AdDisplay.tsx` - Unified component
- `components/ads/ProfileBanner.tsx` - Profile placement
- `components/ads/PostDebateAd.tsx` - Post-debate placement
- `lib/ads/ad-selector.ts` - Ad selection logic
- `app/api/ads/select/route.ts` - Ad selection API

**Deliverables:**
- ✅ Ad display components
- ✅ Integration with existing UI
- ✅ Ad selection algorithm
- ✅ "Sponsored" labels

---

### **PHASE 6: Tracking & Analytics (3-4 days)**

**6.1 Impression Tracking**
- Client-side: Track when ad enters viewport
- Server-side: Deduplicate by IP + contract + time window
- Prevent double-counting (same user, same ad, 1 hour window)

**6.2 Click Tracking**
- Track clicks with UTM parameters
- Link to contract for creator marketplace
- Link to campaign for platform ads

**6.3 Analytics Dashboard**
- Real-time stats for advertisers
- Earnings dashboard for creators
- Admin revenue overview
- Performance charts

**Key Files:**
- `app/api/ads/track/impression/route.ts` - Impression tracking
- `app/api/ads/track/click/route.ts` - Click tracking
- `lib/ads/tracking.ts` - Tracking utilities
- `components/ads/AdTracker.tsx` - Client-side tracker

**Deliverables:**
- ✅ Impression tracking (deduplicated)
- ✅ Click tracking
- ✅ Analytics dashboards
- ✅ Performance reports

---

### **PHASE 7: Payment & Escrow (3-4 days)**

**7.1 Contract Creation Flow**
1. Creator accepts offer
2. Calculate platform fee (based on creator tier)
3. Charge advertiser via Stripe
4. Hold funds in escrow
5. Create contract record
6. Send notifications

**7.2 Campaign Completion & Payout**
- Daily cron job checks completed contracts
- Verify requirements met (minimum impressions, etc.)
- Release escrow to creator (minus platform fee)
- Update creator earnings (for 1099)
- Send payout notifications

**7.3 Dispute Handling**
- Contract cancellation workflow
- Refund logic (partial/full)
- Admin dispute resolution

**Key Files:**
- `app/api/offers/[id]/accept/route.ts` - Contract creation
- `app/api/cron/check-completed-campaigns/route.ts` - Daily payout job
- `lib/stripe/connect.ts` - Escrow & payout functions
- `app/api/contracts/[id]/dispute/route.ts` - Dispute handling

**Deliverables:**
- ✅ Escrow system
- ✅ Automatic payouts
- ✅ Tax tracking (1099 data)
- ✅ Dispute handling

---

### **PHASE 8: Testing & Launch (3-5 days)**

**8.1 Testing Checklist**
- Admin workflows
- Advertiser flows
- Creator flows
- Ad display & tracking
- Payment processing
- Edge cases

**8.2 Launch Strategy**
- Soft launch (invite-only)
- Limited launch (approved users)
- Full launch (public)

---

## Improvements & Enhancements

### 1. **Clean New Architecture**

**Approach:** Build both systems new from scratch

**Structure:**
- `Campaign` model for Platform Ads (admin-created campaigns)
- `AdContract` model for Creator Marketplace (creator-advertiser contracts)
- Both link to ad display components
- Unified ad selection logic checks both sources

**Benefits:**
- Clean architecture, no legacy constraints
- Better separation of concerns
- Easier to maintain and extend

---

### 2. **Configurable Creator Tiers**

**Default Tiers (from Guide):**
- BRONZE (1500-1999 ELO) - 25% fee (configurable)
- SILVER (2000-2499 ELO) - 20% fee (configurable)
- GOLD (2500+ ELO) - 15% fee (configurable)

**Enhancement:**
- All fees stored in `AdminSetting` table
- Admin can adjust fees anytime in settings
- Add "PLATINUM" tier for top 1% (10% fee, configurable)
- Tier benefits visible to creators
- Eligibility requirements also configurable

---

### 3. **Ad Placement Priority System**

**Technical Priority (for ad selection):**
- Priority queue system when multiple ads available
  - Creator contracts: Priority 100 (highest)
  - Platform ads: Priority 50
  - Default/fallback: Priority 0
- Within same priority: Rotate evenly
- Admin can set custom priority per campaign

**Dispute Resolution:**
- All disputes/conflicts go to Support Management page
- Support tickets can be created for:
  - Contract disputes between creators and advertisers
  - Payment issues
  - Ad performance complaints
  - Any conflicts requiring admin intervention
- Use existing support ticket system

---

### 4. **Smart Ad Selection**

**Enhancement:**
- Category matching (Sports ad on Sports debate)
- User interest targeting (based on debate history)
- ELO-based targeting (high ELO users see premium ads)
- Time-based rotation (prevent ad fatigue)

---

### 5. **Performance-Based Pricing**

**Guide:** Mostly flat-rate or CPC/CPM

**Enhancement:**
- Hybrid model: Base + performance bonus
- Minimum impression guarantees
- Click-through rate bonuses
- Conversion tracking (if advertiser provides pixel)

---

### 6. **Ad Quality Control**

**Enhancement:**
- Image dimension validation
- File size limits
- Content moderation (AI + manual)
- Brand safety checks
- Ad preview before approval

---

### 7. **Analytics Improvements**

**Enhancement:**
- Real-time dashboards (WebSocket updates)
- Export to CSV/PDF
- Custom date ranges
- Cohort analysis
- A/B testing support

---

### 8. **Notification System**

**Enhancement:**
- In-app notifications (use existing system)
- Email notifications (use Resend)
- Push notifications (future)
- Notification preferences

---

### 9. **Mobile Optimization**

**Enhancement:**
- Responsive ad components
- Mobile-specific ad sizes
- Touch-optimized tracking
- Mobile creator dashboard

---

### 10. **Revenue Sharing Transparency**

**Enhancement:**
- Show platform fee breakdown to creators
- Show creator payout to advertisers
- Transparent fee calculator
- Historical fee changes log

---

## Migration Path

### Step 1: Create New Models
- Create all new tables (Advertiser, Campaign, Offer, AdContract, etc.)
- Add creator fields to `User` model
- Add admin settings for toggles and configuration
- Run migration

### Step 2: Initialize Admin Settings
- Set default values for toggles (both disabled initially)
- Set default creator eligibility requirements
- Set default platform fees
- All stored in `AdminSetting` table

### Step 3: Build Features
- Build Platform Ads system
- Build Creator Marketplace system
- Both systems check admin toggles before displaying

### Step 4: Gradual Rollout
- Enable Platform Ads toggle first (test)
- Enable Creator Marketplace toggle later (test)
- Both can be toggled independently
- Easy to disable if issues arise

---

## File Structure Plan

```
app/
├── advertise/                          # NEW: Public advertiser landing
│   ├── page.tsx
│   └── pending/page.tsx
│
├── advertiser/                        # NEW: Advertiser dashboard
│   ├── dashboard/page.tsx
│   ├── campaigns/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [id]/page.tsx
│   ├── creators/page.tsx
│   └── settings/page.tsx
│
├── creator/                            # NEW: Creator dashboard
│   ├── dashboard/page.tsx
│   ├── setup/page.tsx
│   ├── offers/page.tsx
│   ├── contracts/page.tsx
│   └── earnings/page.tsx
│
├── admin/
│   ├── advertisements/page.tsx       # ENHANCE: Add filters, columns
│   └── marketplace/page.tsx          # NEW: Creator marketplace tab
│
├── api/
│   ├── advertisers/                   # NEW: Advertiser APIs
│   ├── campaigns/                     # NEW: Campaign APIs
│   ├── creators/                      # NEW: Creator APIs
│   ├── offers/                        # NEW: Offer APIs
│   ├── contracts/                     # NEW: Contract APIs
│   ├── ads/                           # NEW: Ad display & tracking
│   │   ├── select/route.ts            # Ad selection logic
│   │   └── track/
│   │       ├── impression/route.ts
│   │       └── click/route.ts
│   └── admin/
│       ├── marketplace/               # NEW: Marketplace admin APIs
│       └── advertisements/            # ENHANCE: Add new endpoints

components/
├── ads/                                # NEW: Ad display components
│   ├── AdDisplay.tsx                  # Unified ad component
│   ├── ProfileBanner.tsx
│   ├── PostDebateAd.tsx
│   ├── DebateWidget.tsx
│   └── InFeedAd.tsx
│
├── admin/
│   ├── PlatformAdsTab.tsx             # REFACTOR: Enhanced existing
│   └── CreatorMarketplaceTab.tsx      # NEW: Marketplace tab
│
├── advertiser/                         # NEW: Advertiser components
│   ├── CampaignWizard.tsx
│   ├── CreatorDiscovery.tsx
│   └── AnalyticsDashboard.tsx
│
├── creator/                            # NEW: Creator components
│   ├── CreatorCTA.tsx
│   ├── OfferInbox.tsx
│   └── EarningsDashboard.tsx
│
└── profile/
    └── CreatorBadge.tsx               # NEW: Creator badge

lib/
├── ads/                                # NEW: Ad utilities
│   ├── ad-selector.ts                 # Ad selection algorithm
│   ├── tracking.ts                    # Tracking utilities
│   └── helpers.ts                     # Fee calculations, eligibility
│
├── stripe/
│   └── connect.ts                     # NEW: Stripe Connect functions
│
└── storage/
    └── uploads.ts                     # ENHANCE: Add campaign folders
```

---

## Integration with Current System

### 1. **Reuse Existing Infrastructure**

**Stripe:**
- ✅ Already integrated for subscriptions
- ✅ Reuse `lib/stripe/stripe-client.ts`
- ✅ Add Connect functions to same file or new `connect.ts`

**File Storage:**
- ✅ Already using Vercel Blob Storage
- ✅ Reuse existing upload utilities
- ✅ Organize by `campaigns/{campaignId}/` folders

**Email:**
- ✅ Already using Resend
- ✅ Reuse `lib/email/resend.ts`
- ✅ Add new email templates

**Admin Dashboard:**
- ✅ Existing admin structure
- ✅ Add new tabs to existing layout
- ✅ Reuse existing UI components

### 2. **New Models + User Extensions**

**New Models:**
- All advertising models built new (Campaign, Advertiser, Offer, AdContract, etc.)
- Clean architecture, no legacy constraints
- Proper relationships from the start

**User Model:**
- Add creator fields (isCreator, creatorStatus, etc.)
- Existing users unaffected
- Gradual creator onboarding

### 3. **Ad Display Integration**

**Current:** Ads not displayed (as per requirements)

**New:** Add ad components to:
- Profile pages (already exist)
- Debate pages (already exist)
- Dashboard (already exists)
- Use existing component structure

---

## Risk Mitigation

### Risk 1: System Toggle Safety
**Mitigation:**
- Both systems disabled by default
- Admin toggles control all ad display
- Easy to disable if issues arise
- No impact on existing features when disabled

### Risk 2: Performance Impact
**Mitigation:**
- Ad selection cached (Redis or in-memory)
- Tracking async (don't block page load)
- Database indexes on all foreign keys
- Pagination for large lists

### Risk 3: Payment Issues
**Mitigation:**
- Test thoroughly in Stripe test mode
- Escrow verification before payout
- Manual payout option for disputes
- Comprehensive logging

### Risk 4: Creator Fraud
**Mitigation:**
- Minimum eligibility requirements
- Impression deduplication
- Click fraud detection
- Admin review of suspicious activity

---

## Success Metrics

### Launch Goals (Month 1)
- 5 approved advertisers
- 20 active creators
- 10 active campaigns
- $5,000 platform revenue
- 100,000 ad impressions

### Growth Goals (Month 3)
- 25 advertisers
- 100 creators
- 50 campaigns
- $25,000 platform revenue
- 1M ad impressions

---

## Timeline Estimate

| Phase | Time | Complexity | Dependencies |
|-------|------|------------|--------------|
| Phase 1: Foundation | 3-4 days | Medium | None |
| Phase 2: Admin Enhancement | 4-5 days | Medium | Phase 1 |
| Phase 3: Advertiser Dashboard | 5-7 days | High | Phase 1, 2 |
| Phase 4: Creator Features | 4-6 days | Medium-High | Phase 1-3 |
| Phase 5: Ad Display | 3-5 days | Medium | Phase 1-4 |
| Phase 6: Tracking | 3-4 days | Medium | Phase 1-5 |
| Phase 7: Payments | 3-4 days | High | Phase 1-6 |
| Phase 8: Testing | 3-5 days | Medium | Phase 1-7 |
| **TOTAL** | **28-40 days** | | |

**Realistic Timeline:** 6-8 weeks (1.5-2 months)

---

## Recommended Implementation Order

### Week 1-2: Foundation
1. Database migration (additive, backward compatible)
2. Stripe Connect setup
3. Admin dashboard enhancement
4. Basic advertiser application flow

### Week 3-4: Core Features
5. Advertiser dashboard
6. Campaign creation
7. Creator onboarding
8. Offer system

### Week 5-6: Display & Tracking
9. Ad display components
10. Integration with existing UI
11. Tracking system
12. Analytics dashboards

### Week 7-8: Payments & Polish
13. Escrow & payout system
14. Testing & bug fixes
15. Documentation
16. Soft launch

---

## Key Decisions - FINALIZED ✅

1. **Ad Model Strategy:** ✅ **BUILD BOTH NEW**
   - Both Platform Ads and Creator Marketplace will be built from scratch
   - Clean architecture, no legacy constraints
   - New models: `Campaign`, `Advertiser`, `Offer`, `AdContract`, etc.

2. **Creator Eligibility:** ✅ **USE GUIDE REQUIREMENTS + CONFIGURABLE**
   - Default: 1500+ ELO, 10+ debates, 3+ months account age
   - Admin can edit/adjust requirements in settings
   - Stored in `AdminSetting` table for easy updates

3. **Platform Fee:** ✅ **FULLY CONFIGURABLE**
   - Admin can set fees for each creator tier (BRONZE, SILVER, GOLD, PLATINUM)
   - Stored in `AdminSetting` table
   - Default: BRONZE 25%, SILVER 20%, GOLD 15%, PLATINUM 10%
   - Can be adjusted anytime without code changes

4. **Ad Placement Priority:** ✅ **CLARIFIED**
   - **Technical Priority:** When multiple ads compete for same slot, use priority queue (creator contracts > platform ads > fallback)
   - **Disputes/Conflicts:** All disputes go to Support Management page (existing support ticket system)
   - Support tickets can be created for:
     - Contract disputes
     - Payment issues
     - Ad performance complaints
     - Creator/advertiser conflicts

5. **Ad System Toggles:** ✅ **ENABLE/DISABLE SEPARATELY**
   - Admin toggle: "Enable Platform Ads" (on/off)
   - Admin toggle: "Enable Creator Marketplace" (on/off)
   - Stored in `AdminSetting` table
   - When disabled, ads don't display and features are hidden
   - Allows gradual rollout and easy maintenance

---

## Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Decide on timeline** - Adjust phases if needed
3. **Set up development environment** - Stripe test mode, etc.
4. **Start Phase 1** - Database migration
5. **Iterate** - Build, test, refine

---

**Ready to proceed when you approve this plan!** 🚀


# Advertising System - Finalized Decisions

## ✅ Key Decisions Made

### 1. **Ad Model Strategy: BUILD BOTH NEW**
- Both Platform Ads and Creator Marketplace will be built from scratch
- Clean architecture, no legacy constraints
- New models: `Campaign`, `Advertiser`, `Offer`, `AdContract`, `Impression`, `Click`, `CreatorTaxInfo`
- Update `User` model with creator fields

---

### 2. **Creator Eligibility: GUIDE REQUIREMENTS + CONFIGURABLE**

**Default Requirements (from guide):**
- Minimum ELO: 1500
- Minimum Debates: 10
- Minimum Account Age: 3 months

**Configuration:**
- All requirements stored in `AdminSetting` table
- Admin can edit/adjust in `/admin/settings`
- Keys:
  - `CREATOR_MIN_ELO` (default: 1500)
  - `CREATOR_MIN_DEBATES` (default: 10)
  - `CREATOR_MIN_ACCOUNT_AGE_MONTHS` (default: 3)

---

### 3. **Platform Fee: FULLY CONFIGURABLE**

**Default Fees (from guide):**
- BRONZE (1500-1999 ELO): 25%
- SILVER (2000-2499 ELO): 20%
- GOLD (2500+ ELO): 15%
- PLATINUM (top 1%): 10% (new tier)

**Configuration:**
- All fees stored in `AdminSetting` table
- Admin can adjust anytime in `/admin/settings`
- Keys:
  - `CREATOR_FEE_BRONZE` (default: 25)
  - `CREATOR_FEE_SILVER` (default: 20)
  - `CREATOR_FEE_GOLD` (default: 15)
  - `CREATOR_FEE_PLATINUM` (default: 10)

---

### 4. **Ad Placement Priority: CLARIFIED**

**Technical Priority (for ad selection):**
- When multiple ads compete for the same placement slot:
  - Creator contracts: Priority 100 (highest)
  - Platform ads: Priority 50
  - Default/fallback: Priority 0
- Within same priority: Rotate evenly
- Admin can set custom priority per campaign

**Disputes/Conflicts:**
- All disputes go to **Support Management page** (existing support ticket system)
- Support tickets can be created for:
  - Contract disputes between creators and advertisers
  - Payment issues
  - Ad performance complaints
  - Any conflicts requiring admin intervention
- Use existing support ticket workflow

---

### 5. **Ad System Toggles: ENABLE/DISABLE SEPARATELY**

**Admin Toggles:**
- `ADS_PLATFORM_ENABLED` - Enable/disable Platform Ads
- `ADS_CREATOR_MARKETPLACE_ENABLED` - Enable/disable Creator Marketplace

**Location:**
- `/admin/settings` page
- New "Advertising" section
- Both toggles visible and independent

**Behavior:**
- When disabled:
  - Ads don't display on site
  - Related features hidden from UI
  - APIs return empty/null responses
- When enabled:
  - Full functionality available
  - Ads display based on selection logic
- Allows gradual rollout and easy maintenance

---

## 📋 Admin Settings Structure

### Toggles
```typescript
ADS_PLATFORM_ENABLED: "true" | "false" (default: "false")
ADS_CREATOR_MARKETPLACE_ENABLED: "true" | "false" (default: "false")
```

### Creator Eligibility
```typescript
CREATOR_MIN_ELO: "1500" (default)
CREATOR_MIN_DEBATES: "10" (default)
CREATOR_MIN_ACCOUNT_AGE_MONTHS: "3" (default)
```

### Platform Fees (percentages)
```typescript
CREATOR_FEE_BRONZE: "25" (default)
CREATOR_FEE_SILVER: "20" (default)
CREATOR_FEE_GOLD: "15" (default)
CREATOR_FEE_PLATINUM: "10" (default)
```

---

## 🔧 Implementation Helper Functions

```typescript
// lib/ads/config.ts

// Check if ads are enabled
export async function isPlatformAdsEnabled(): Promise<boolean>
export async function isCreatorMarketplaceEnabled(): Promise<boolean>

// Get creator eligibility requirements
export async function getCreatorEligibility(): Promise<{
  minELO: number
  minDebates: number
  minAgeMonths: number
}>

// Get platform fee for tier
export async function getPlatformFee(
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
): Promise<number>
```

---

## 🎯 Next Steps

1. ✅ **Decisions finalized** - This document
2. ⏳ **Review implementation plan** - `ADVERTISING_SYSTEM_IMPLEMENTATION_PLAN.md`
3. ⏳ **Start Phase 1** - Database migration
4. ⏳ **Build admin settings UI** - Toggles and configuration
5. ⏳ **Implement helper functions** - Config reading utilities

---

**All decisions documented and ready for implementation!** 🚀


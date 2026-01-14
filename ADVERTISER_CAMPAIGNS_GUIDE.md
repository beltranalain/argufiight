# Advertiser Campaigns System - Complete Guide

## 🎯 **How It's Supposed to Work**

The Advertiser Campaigns system allows **external advertisers** to create and manage their own advertising campaigns on your platform. This is different from Direct Ads (which are admin-created).

---

## 📋 **Complete Workflow**

### **Step 1: Advertiser Application**
1. Advertiser visits `/advertise` page
2. Fills out application form:
   - Company name
   - Industry
   - Website
   - Contact information
   - Business EIN (optional)
3. Submits application → Status: `PENDING`

### **Step 2: Admin Approval**
1. Admin goes to `/admin/advertisements` → "Advertisers" tab
2. Reviews advertiser application
3. Approves or rejects:
   - **Approve**: Creates User account (if doesn't exist), sends approval email
   - **Reject**: Sends rejection email with reason
4. Approved advertiser status: `APPROVED`

### **Step 3: Advertiser Creates Campaign**
1. Approved advertiser logs in
2. Goes to `/advertiser/dashboard`
3. Clicks "Create Campaign"
4. Multi-step wizard:
   - **Step 1**: Choose campaign type
     - `PLATFORM_ADS` - General platform advertising
     - `CREATOR_SPONSORSHIP` - Sponsor individual creators
     - `TOURNAMENT_SPONSORSHIP` - Sponsor tournaments
   - **Step 2**: Campaign details
     - Name, category, budget
     - Start/end dates
     - Destination URL, CTA text
   - **Step 3**: Creative assets
     - Upload banner image OR enter URL
   - **Step 4**: Targeting (for creator sponsorships)
     - Min ELO, categories, followers, budget per creator
   - **Step 5**: Review & submit
5. Campaign created → Status: `PENDING_REVIEW`

### **Step 4: Admin Reviews Campaign**
1. Admin goes to `/admin/advertisements` → "Advertiser Campaigns" tab
2. Sees list of campaigns with status `PENDING_REVIEW`
3. Reviews campaign details:
   - Budget, dates, creative assets
   - Advertiser information
4. Approves or rejects:
   - **Approve**: Campaign status → `APPROVED`
   - **Reject**: Campaign status → `REJECTED` (with reason)

### **Step 5: Campaign Activation**
1. When `startDate` is reached:
   - Campaign status automatically changes: `APPROVED` → `ACTIVE`
   - Campaign starts displaying on the platform
2. Campaign displays based on type:
   - `PLATFORM_ADS`: Shows in ad selection (priority: Creator > Platform > Direct)
   - `CREATOR_SPONSORSHIP`: Creates offers to creators
   - `TOURNAMENT_SPONSORSHIP`: Sponsors tournaments

### **Step 6: Campaign Completion**
1. When `endDate` passes:
   - Campaign status automatically changes: `ACTIVE` → `COMPLETED`
   - Campaign stops displaying

---

## 🔄 **Campaign Status Flow**

```
PENDING_REVIEW → APPROVED → ACTIVE → COMPLETED
                    ↓
                REJECTED
                    ↓
                CANCELLED
```

**Status Definitions:**
- `PENDING_REVIEW` - Awaiting admin approval
- `APPROVED` - Approved by admin, waiting for start date
- `ACTIVE` - Currently running (between start and end dates)
- `COMPLETED` - End date has passed
- `REJECTED` - Rejected by admin
- `PAUSED` - Manually paused
- `CANCELLED` - Cancelled by advertiser or admin

---

## 🎨 **Campaign Types**

### **1. PLATFORM_ADS**
- **Purpose**: General platform advertising
- **Display**: Shows in ad selection system (priority after Creator contracts)
- **Where**: All ad placements (profile banners, debate sidebar, in-feed, etc.)
- **Targeting**: None (shows to all users)

### **2. CREATOR_SPONSORSHIP**
- **Purpose**: Sponsor individual creators
- **Display**: Creates offers to creators matching targeting criteria
- **Where**: Creator's profile banners, post-debate, debate widgets
- **Targeting**: 
  - Min ELO rating
  - Categories
  - Min followers
  - Max budget per creator

### **3. TOURNAMENT_SPONSORSHIP**
- **Purpose**: Sponsor tournaments
- **Display**: Tournament-specific placements
- **Where**: Tournament pages, leaderboards
- **Targeting**: Tournament-specific

---

## 📊 **Admin Panel Features**

### **Advertiser Campaigns Tab** (`/admin/advertisements?tab=platform`)

**Features:**
- ✅ View all campaigns (filtered by `PLATFORM_ADS` type)
- ✅ Toggle Platform Ads on/off (global setting)
- ✅ View campaign stats (total, active, budget)
- ✅ Approve/Reject campaigns
- ✅ View campaign details

**Missing Features:**
- ❌ **Approve/Reject buttons** - Not visible in campaign list
- ❌ **Campaign detail modal** - "View" and "Edit" buttons don't work
- ❌ **Reject with reason** - No reject functionality visible
- ❌ **Auto-activation** - Logic exists but may not be running

---

## 🚨 **Current Issues & Missing Features**

### **1. Admin Campaign Approval UI**
**Problem**: The Platform Ads tab shows campaigns but:
- No approve/reject buttons visible
- "View" and "Edit" buttons don't have functionality
- Can't see campaign details (banner, budget, dates)

**Fix Needed**: Add approve/reject buttons to campaign list items

### **2. Campaign Auto-Activation**
**Problem**: Campaigns should auto-activate when `startDate` is reached, but:
- Logic exists in API routes
- May not be running on schedule
- Needs cron job or scheduled check

**Fix Needed**: 
- Add cron job to check and activate campaigns
- OR ensure API routes check on every request

### **3. Campaign Display**
**Problem**: `PLATFORM_ADS` campaigns should display but:
- Need to verify they're in ad selection priority
- Need to ensure they show when Platform Ads are enabled

**Fix Needed**: Verify ad selection logic includes Platform Ads

### **4. Campaign Rejection**
**Problem**: Admin can't reject campaigns with reason
- Reject API exists (`/api/admin/campaigns/[id]/reject`)
- But no UI button to trigger it

**Fix Needed**: Add reject button with reason modal

---

## ✅ **What's Working**

1. ✅ Advertiser application flow
2. ✅ Advertiser approval by admin
3. ✅ Campaign creation wizard
4. ✅ Campaign submission (creates with `PENDING_REVIEW`)
5. ✅ Campaign listing in admin panel
6. ✅ Platform Ads toggle (enable/disable)
7. ✅ Campaign status tracking
8. ✅ Auto-activation logic (in API, needs verification)
9. ✅ Auto-completion logic (in API, needs verification)

---

## 🔧 **What Needs to Be Fixed**

### **Priority 1: Admin Campaign Management**
1. Add approve/reject buttons to campaign list
2. Add campaign detail modal/view
3. Add reject with reason functionality
4. Show campaign banner preview
5. Show campaign stats (impressions, clicks)

### **Priority 2: Campaign Activation**
1. Verify auto-activation is working
2. Add manual activate/pause buttons
3. Add scheduled activation indicator

### **Priority 3: Campaign Display**
1. Verify Platform Ads show in ad selection
2. Test ad priority (Creator > Platform > Direct)
3. Ensure Platform Ads respect enable/disable toggle

### **Priority 4: Campaign Analytics**
1. Show impressions/clicks in admin panel
2. Show campaign performance metrics
3. Add campaign analytics page

---

## 📝 **API Routes**

### **Advertiser Routes**
- `GET /api/advertiser/campaigns` - List advertiser's campaigns
- `POST /api/advertiser/campaigns` - Create new campaign
- `GET /api/advertiser/me` - Get advertiser account

### **Admin Routes**
- `GET /api/admin/campaigns` - List all campaigns (with filters)
- `POST /api/admin/campaigns/[id]/approve` - Approve campaign
- `POST /api/admin/campaigns/[id]/reject` - Reject campaign
- `GET /api/admin/settings` - Get settings (Platform Ads enabled)
- `POST /api/admin/settings` - Update settings

---

## 🎯 **Summary**

**The system is mostly built but needs:**
1. **Admin UI improvements** - Approve/reject buttons, campaign details
2. **Verification** - Ensure auto-activation and display are working
3. **Testing** - End-to-end flow from application to campaign display

**Core functionality exists**, but the admin interface needs completion to make it fully usable.

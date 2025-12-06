# Advertiser Login and Security Documentation

## Login Process

### Where Advertisers Sign In

**Advertisers use the regular login page at `/login`** - the same login page used by all users (debaters, creators, admins).

1. **Application Flow:**
   - Advertisers apply at `/advertise`
   - After approval, they receive an email notification
   - They sign in at `/login` using the **email address they provided in their application**
   - Upon successful login, they are redirected to `/advertiser/dashboard`

2. **Authentication:**
   - Advertisers must have a regular user account (created during application or separately)
   - The system matches the logged-in user's email with the advertiser's `contactEmail`
   - Only APPROVED advertisers can access the dashboard

### Security Measures

Since the advertiser dashboard deals with financial transactions and payments, we've implemented additional security layers:

#### 1. Status Verification
- **Only APPROVED advertisers** can access the dashboard
- **SUSPENDED advertisers** receive a clear error message and are blocked
- **BANNED advertisers** are completely blocked
- **PENDING/REJECTED advertisers** cannot access the dashboard

#### 2. Session Verification
- All advertiser API routes require valid session authentication
- Sessions are verified using JWT tokens stored in secure HTTP-only cookies
- Session expiration is enforced (default: 7 days)

#### 3. Email Matching
- The system verifies that the logged-in user's email matches the advertiser's `contactEmail`
- This prevents unauthorized access even if someone knows an advertiser's ID

#### 4. API Route Protection
All advertiser API routes (`/api/advertiser/*`) include:
- Session verification
- Status checks (APPROVED only)
- User-to-advertiser email matching

### Admin Management

Admins can manage advertisers through:
- **Creator Marketplace Tab** → Sub-tabs: Pending, Approved, Rejected
- **Advertisers Tab** → Full list with suspend/unsuspend and stats viewing

### Email Notifications

When an advertiser is approved:
- ✅ Approval email is automatically sent with:
  - Dashboard access link
  - Login instructions
  - Next steps information

When an advertiser is rejected:
- ❌ Rejection email is sent with the reason (if provided)

### Future Security Enhancements (Recommended)

1. **Two-Factor Authentication (2FA)**
   - Optional 2FA for advertiser accounts
   - SMS or authenticator app support

2. **IP Whitelisting**
   - Allow advertisers to whitelist specific IP addresses
   - Require additional verification for new IPs

3. **Rate Limiting**
   - Implement rate limiting on sensitive operations (payment setup, campaign creation)
   - Prevent abuse and brute force attacks

4. **Activity Logging**
   - Log all advertiser actions (campaign creation, payment changes, etc.)
   - Admin dashboard to view activity logs

5. **Session Management**
   - Allow advertisers to view active sessions
   - Ability to revoke sessions from other devices

### Current Implementation Status

✅ **Implemented:**
- Status-based access control
- Session verification
- Email matching verification
- Admin suspend/unsuspend functionality
- Email notifications on approval/rejection

⚠️ **Recommended for Future:**
- Two-factor authentication
- IP whitelisting
- Enhanced activity logging
- Session management UI


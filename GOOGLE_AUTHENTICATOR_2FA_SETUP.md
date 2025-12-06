# Google Authenticator 2FA Implementation

## Overview

Two-Factor Authentication (2FA) using Google Authenticator has been implemented for **employees and advertisers only**. Regular users continue to use standard email/password authentication.

## How It Works

### Login Flow for Employees/Advertisers

1. **User logs in** with email/password at `/login`
2. **System checks** if user is employee (`isAdmin: true`) or approved advertiser
3. **If 2FA not set up:**
   - Redirects to `/setup-2fa`
   - User scans QR code with Google Authenticator
   - User enters 6-digit code to verify setup
   - Receives backup codes
   - Redirects to dashboard
4. **If 2FA already set up:**
   - Redirects to `/verify-2fa`
   - User enters 6-digit code from Google Authenticator
   - Code is verified
   - Session is marked as 2FA verified
   - Redirects to dashboard

### Security Features

- **Session-based verification**: Each session must be verified with 2FA
- **Backup codes**: Users receive 10 backup codes during setup
- **Time-based tokens**: Codes expire every 30 seconds
- **Window tolerance**: Accepts codes from ±2 time windows (60 seconds)

## Database Changes

### User Model
- `totpSecret`: Base32 secret key for TOTP generation
- `totpEnabled`: Boolean flag indicating if 2FA is enabled
- `totpBackupCodes`: JSON array of backup codes

### Session Model
- `twoFactorVerified`: Boolean flag indicating if 2FA has been verified for this session

## API Endpoints

### `GET /api/auth/2fa/setup`
- Generates TOTP secret and QR code
- Returns QR code data URL and backup codes
- Stores secret in database (not enabled until verified)

### `POST /api/auth/2fa/verify`
- Verifies 6-digit code from Google Authenticator
- Accepts backup codes as alternative
- Marks session as 2FA verified
- Enables 2FA if this is the first verification

## Pages

### `/setup-2fa`
- Shows QR code for scanning
- Instructions for downloading Google Authenticator
- Input field for verification code
- Displays backup codes after successful setup

### `/verify-2fa`
- Simple code input page
- Appears after login for employees/advertisers with 2FA enabled
- Redirects to appropriate dashboard after verification

## Layout Protection

### Admin Layout (`/app/admin/layout.tsx`)
- Checks if user has `totpEnabled: true`
- If enabled, verifies session has `twoFactorVerified: true`
- Redirects to `/verify-2fa` if not verified

### Advertiser Layout (`/app/advertiser/layout.tsx`)
- Same 2FA verification check
- Redirects to `/verify-2fa` if not verified

## User Experience

1. **First-time setup:**
   - Employee/Advertiser logs in
   - Redirected to setup page
   - Scans QR code
   - Enters code to verify
   - Saves backup codes
   - Access granted

2. **Subsequent logins:**
   - Employee/Advertiser logs in
   - Redirected to verification page
   - Enters 6-digit code
   - Access granted

3. **Regular users:**
   - No 2FA required
   - Standard login flow

## Backup Codes

- Generated during setup
- 10 codes, 8 digits each
- Can be used instead of authenticator code
- Single-use (removed after use)
- Should be saved securely

## Testing

To test the 2FA flow:

1. **Create an employee account:**
   ```bash
   npm run make-admin -- your-email@example.com
   ```

2. **Log in** with email/password
3. **You'll be redirected** to `/setup-2fa`
4. **Download Google Authenticator** on your phone
5. **Scan the QR code**
6. **Enter the 6-digit code** to verify
7. **Save backup codes**
8. **You'll be redirected** to admin dashboard

9. **Log out and log in again**
10. **You'll be redirected** to `/verify-2fa`
11. **Enter code** from Google Authenticator
12. **Access granted**

## Troubleshooting

### "Invalid verification code"
- Make sure your phone's time is synchronized
- Codes expire every 30 seconds - enter quickly
- Check you're using the correct account in Google Authenticator

### "2FA is not set up"
- Make sure you completed the setup process
- Check that `totpEnabled` is `true` in database

### Lost access to authenticator
- Use one of your backup codes
- Contact support if you've lost backup codes too

## Security Notes

- TOTP secrets are stored in database (consider encryption for production)
- Backup codes are hashed before storage
- Sessions expire after 7 days
- 2FA verification is required for each new session
- Codes are time-based and expire every 30 seconds


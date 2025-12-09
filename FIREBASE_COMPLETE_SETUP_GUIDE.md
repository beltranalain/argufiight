# Firebase Push Notifications - Complete Step-by-Step Setup Guide

## Overview

This guide will walk you through setting up Firebase Cloud Messaging (FCM) push notifications for Argu Fight. We'll use the **V1 API with Service Account** method, which is the modern approach and doesn't require Google Cloud Console.

---

## Part 1: Get Service Account JSON from Firebase Console

### Step 1.1: Open Firebase Console

1. Open your web browser
2. Go to: **https://console.firebase.google.com**
3. If you're not logged in, sign in with your Google account
4. You should see a list of Firebase projects

### Step 1.2: Select Your Project

1. Look for the project named **"Argu Fight"** in the list
2. Click on **"Argu Fight"** to open the project
3. You should now see the Firebase project dashboard

### Step 1.3: Navigate to Project Settings

1. Look at the **left sidebar** on the screen
2. Find the **gear icon (⚙️)** at the bottom of the sidebar (next to "Project Overview")
3. Click on the **gear icon**
4. A menu will appear - click on **"Project settings"**
5. You should now see a page with multiple tabs at the top

### Step 1.4: Go to Service Accounts Tab

1. Look at the **tabs** at the top of the page:
   - General
   - Cloud Messaging
   - Integrations
   - **Service accounts** ← Click this one
   - Data privacy
   - Users and permissions
   - Alerts

2. Click on the **"Service accounts"** tab
3. You should see a section titled "Firebase Admin SDK"

### Step 1.5: Generate New Private Key

1. In the "Firebase Admin SDK" section, you'll see:
   - A dropdown menu (probably showing "Node.js")
   - A button that says **"Generate new private key"**

2. Click the **"Generate new private key"** button
3. A popup/warning will appear saying:
   - "This will create a new private key for the service account..."
   - "Keep your service account private keys secure and never commit them to public repositories."

4. Click the **"Generate key"** button in the popup
5. A JSON file will automatically download to your computer
   - The file will be named something like: `argu-fight-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
   - It will be saved to your **Downloads folder** (usually)

### Step 1.6: Locate the Downloaded File

1. Open your **Downloads folder** (or wherever your browser saves downloads)
2. Find the JSON file that just downloaded
3. **Note the full path** to this file (you'll need it in the next step)
   - Example on Windows: `C:\Users\YourName\Downloads\argu-fight-firebase-adminsdk-xxxxx.json`
   - Example on Mac: `/Users/YourName/Downloads/argu-fight-firebase-adminsdk-xxxxx.json`

---

## Part 2: Add Service Account to Your Database

### Step 2.1: Open Terminal/Command Prompt

1. **On Windows:**
   - Press `Windows Key + R`
   - Type `cmd` or `powershell` and press Enter
   - Or search for "Command Prompt" or "PowerShell" in the Start menu

2. **On Mac/Linux:**
   - Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux)
   - Type "Terminal" and press Enter

### Step 2.2: Navigate to Your Project Directory

1. In the terminal, type:
   ```bash
   cd C:\Users\beltr\Honorable.AI
   ```
   (Replace with your actual project path if different)

2. Press Enter
3. You should now be in your project directory

### Step 2.3: Run the Script to Add Service Account

1. In the terminal, type the following command:
   ```bash
   npx tsx scripts/add-service-account.ts
   ```

2. **But wait!** You need to add the path to your downloaded JSON file. The full command should be:
   ```bash
   npx tsx scripts/add-service-account.ts "C:\Users\beltr\Downloads\argu-fight-firebase-adminsdk-xxxxx.json"
   ```
   (Replace the path with the actual path to your downloaded JSON file)

3. **Important:** 
   - If your file path has spaces, put it in quotes: `"path with spaces/file.json"`
   - On Windows, use backslashes: `C:\Users\...`
   - On Mac/Linux, use forward slashes: `/Users/...`

4. Press Enter

### Step 2.4: Verify the Script Ran Successfully

1. You should see output like:
   ```
   🔥 Adding Firebase Service Account to admin settings...
   
   ✅ FIREBASE_SERVICE_ACCOUNT: Added successfully
      Project ID: argu-fight
      Client Email: firebase-adminsdk-xxxxx@argu-fight.iam.gserviceaccount.com
   
   ✅ Service Account added successfully!
   ```

2. If you see an error, check:
   - Is the file path correct?
   - Does the file exist at that location?
   - Is the file a valid JSON file?

---

## Part 3: Apply Database Migration

### Step 3.1: Check Your Database Connection String

1. You need your database connection string (usually in `.env` file or environment variables)
2. It should look like: `postgresql://user:password@host:port/database`
3. Or if using Neon/other services: `postgresql://user:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb`

### Step 3.2: Apply the Migration

**Option A: Using psql (if you have PostgreSQL client installed)**

1. Open terminal
2. Run:
   ```bash
   psql "YOUR_DATABASE_URL" -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql
   ```
   (Replace `YOUR_DATABASE_URL` with your actual database connection string)

**Option B: Using Prisma (if migration system works)**

1. Open terminal in your project directory
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

**Option C: Manual SQL (if you have database access)**

1. Open your database management tool (pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Open the file: `prisma/migrations/20251210000000_add_fcm_tokens/migration.sql`
4. Copy all the SQL from that file
5. Paste it into your SQL editor
6. Execute the SQL

### Step 3.3: Verify Migration Applied

1. Check if the `fcm_tokens` table was created:
   ```sql
   SELECT * FROM fcm_tokens LIMIT 1;
   ```
2. If you get a result (even empty), the table exists and migration worked!

---

## Part 4: Verify Configuration

### Step 4.1: Check Admin Settings

1. Go to your website: **https://www.argufight.com** (or your domain)
2. Log in as an **admin user**
3. Navigate to: **Admin Dashboard → Settings**
4. Scroll down to the **"Firebase Push Notifications"** section
5. Verify that:
   - ✅ All Firebase config fields are filled (API Key, Auth Domain, etc.)
   - ✅ VAPID Key is filled
   - ✅ Service Account JSON is stored (you won't see it, but it's in the database)

### Step 4.2: Check Database Directly (Optional)

1. Connect to your database
2. Run this query:
   ```sql
   SELECT key, 
          CASE 
            WHEN key = 'FIREBASE_SERVICE_ACCOUNT' THEN '***HIDDEN***'
            ELSE LEFT(value, 20) || '...'
          END as value_preview
   FROM admin_settings
   WHERE key LIKE 'FIREBASE%';
   ```
3. You should see all Firebase-related settings

---

## Part 5: Test Push Notifications

### Step 5.1: Enable Notifications in Browser

1. Visit your website: **https://www.argufight.com**
2. Log in as a regular user (not admin)
3. Your browser should show a popup asking: **"Allow notifications?"**
4. Click **"Allow"** or **"Yes"**
5. The browser will now register for push notifications

### Step 5.2: Verify Token Registration

1. Check your database:
   ```sql
   SELECT * FROM fcm_tokens;
   ```
2. You should see at least one row with:
   - `user_id`: Your user's ID
   - `token`: A long string (FCM token)
   - `device`: "Desktop" or "Mobile"
   - `created_at`: Current timestamp

### Step 5.3: Test Sending a Notification

1. **Create a test debate:**
   - Have User A start a debate with User B
   - User A submits their first argument
   - User B should receive a push notification

2. **Or use the admin API:**
   - Go to Admin Dashboard
   - Use the test notification feature (if available)
   - Or manually call: `POST /api/fcm/send`

### Step 5.4: Verify Notification Received

1. **If user is on the website:**
   - They should see a browser notification popup
   - Clicking it should open the debate page

2. **If user is NOT on the website:**
   - They should see a system notification (like a text message)
   - Clicking it should open the browser and navigate to the debate

---

## Troubleshooting

### Problem: Script says "File not found"

**Solution:**
1. Check the file path is correct
2. Make sure you're using the full path (not relative)
3. On Windows, use backslashes: `C:\Users\...`
4. Put the path in quotes if it has spaces: `"C:\Users\My Name\Downloads\file.json"`

### Problem: "Failed to parse JSON"

**Solution:**
1. Make sure you downloaded the correct file from Firebase
2. Open the JSON file in a text editor
3. Verify it's valid JSON (starts with `{` and ends with `}`)
4. It should contain fields like: `type`, `project_id`, `private_key`, `client_email`

### Problem: "Database connection failed"

**Solution:**
1. Check your `.env` file has `DATABASE_URL` set
2. Verify the database is accessible
3. Check your database credentials are correct

### Problem: "Migration failed"

**Solution:**
1. Check if the `fcm_tokens` table already exists:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'fcm_tokens'
   );
   ```
2. If it exists, the migration already ran - you're good!
3. If it doesn't exist, check database permissions

### Problem: "No push notifications received"

**Solution:**
1. Check if user granted notification permission:
   - Browser settings → Site settings → Notifications
   - Make sure your site is allowed

2. Check if FCM token is registered:
   ```sql
   SELECT * FROM fcm_tokens WHERE user_id = 'USER_ID';
   ```

3. Check server logs for errors when sending notifications

4. Verify Service Account JSON is in database:
   ```sql
   SELECT key FROM admin_settings WHERE key = 'FIREBASE_SERVICE_ACCOUNT';
   ```

---

## Quick Reference: All Commands

```bash
# 1. Add Service Account JSON
npx tsx scripts/add-service-account.ts "C:\Users\beltr\Downloads\argu-fight-firebase-adminsdk-xxxxx.json"

# 2. Apply Database Migration
psql "YOUR_DATABASE_URL" -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql

# 3. Check FCM Tokens
# (Run in database)
SELECT * FROM fcm_tokens;

# 4. Check Firebase Settings
# (Run in database)
SELECT key, LEFT(value, 30) || '...' as preview 
FROM admin_settings 
WHERE key LIKE 'FIREBASE%';
```

---

## What Each Part Does

- **Part 1**: Gets the Service Account JSON from Firebase (the credentials)
- **Part 2**: Stores the Service Account in your database
- **Part 3**: Creates the `fcm_tokens` table to store user tokens
- **Part 4**: Verifies everything is configured correctly
- **Part 5**: Tests that push notifications actually work

---

## Success Indicators

✅ Service Account JSON downloaded from Firebase  
✅ Script ran successfully and added to database  
✅ Database migration applied (fcm_tokens table exists)  
✅ User granted notification permission  
✅ FCM token registered in database  
✅ Push notification received when it's user's turn  

---

## Need More Help?

If you get stuck at any step:
1. Check the error message carefully
2. Verify you're in the correct directory
3. Check file paths are correct
4. Verify database connection
5. Check browser console for errors (F12 → Console tab)


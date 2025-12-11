# Fix Google OAuth - Get Correct Client Secret

## Current Situation

You have **2 OAuth clients**:
1. **"Argue2"** - `563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p.apps.googleusercontent.com` ✅ (This is the one being used)
2. **"Web client (auto created by Google Service)"** - `563658606120-tgd19f1sku4233au4jjad6obt3k3aefm.apps.googleusercontent.com` (Not used)

## The Problem

The `invalid_client` error means the **Client Secret** in your admin settings doesn't match the **"Argue2"** Client ID.

## Solution: Get the Correct Client Secret

### Step 1: Open the "Argue2" Client

1. In Google Cloud Console → **Credentials** page
2. Find **"Argue2"** in the OAuth 2.0 Client IDs table
3. **Click the edit icon (pencil)** next to "Argue2"
4. This opens the client details page

### Step 2: Get the Client Secret

On the "Argue2" client details page:

1. Scroll to **"Client secrets"** section
2. You'll see one of two scenarios:

   **Scenario A: Secret is visible**
   - You'll see a secret that starts with `GOCSPX-...`
   - **Copy this entire secret** (it's partially masked like `****PQC3`)
   - If you can't see the full secret, you need to create a new one (see Scenario B)

   **Scenario B: "Viewing and downloading client secrets is no longer available"**
   - Click **"+ Add secret"** button
   - A new secret will be generated
   - **Copy it immediately** - you can only see it once!
   - The secret will start with `GOCSPX-...`

### Step 3: Update Admin Settings

1. Go to **Admin Dashboard** → **Settings** (`/admin/settings`)
2. Scroll to **"Google OAuth"** section
3. **Verify Client ID** is: `563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p.apps.googleusercontent.com`
4. **Paste the Client Secret** from Step 2 (starts with `GOCSPX-...`)
5. Click **"Save Settings"**

### Step 4: Verify Redirect URI

While you're in the "Argue2" client details:

1. Check **"Authorized redirect URIs"** section
2. Make sure this is listed:
   - `https://www.argufight.com/api/auth/google/callback`
3. If not, add it and click **"Save"**

### Step 5: Test

1. Go to `/login`
2. Click "Continue with Google"
3. Should work now! ✅

## Important Notes

- **Use "Argue2" client**, not the "Web client (auto created by Google Service)"
- The Client Secret can only be viewed **once** when created
- If you lost the secret, you **must create a new one**
- Make sure there are **no extra spaces** when copying

## Which Client to Use?

**Use "Argue2"** - This is the one configured in your admin settings.

The "Web client (auto created by Google Service)" is likely for Firebase or other Google services and should be left alone.

---

After updating the Client Secret, the `invalid_client` error should be resolved!


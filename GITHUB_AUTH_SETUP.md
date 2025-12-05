# GitHub Authentication Setup for Private Repository

## Step 1: Create a Personal Access Token

1. Log in to GitHub with the `argufight` account (info@argufight.com)
2. Go to: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **"Generate new token"** → **"Generate new token (classic)"**
4. Give it a name: `argufight-repo-access`
5. Set expiration: Choose your preference (90 days, 1 year, or no expiration)
6. Select scopes: Check **`repo`** (this gives full access to private repositories)
7. Click **"Generate token"**
8. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

## Step 2: Use the Token to Push

When Git prompts for credentials:
- **Username**: `argufight` (or your GitHub username)
- **Password**: Paste the Personal Access Token (NOT your GitHub password)

## Alternative: Use Git Credential Manager (Windows)

Windows has Git Credential Manager built-in. When you push, it will prompt you to authenticate through a browser window, which is easier than using tokens manually.


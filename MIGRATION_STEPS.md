# Migration Steps: Moving Project to argufight GitHub Account

## Prerequisites
- ✅ New GitHub account created: `argufight` (info@argufight.com)
- ✅ Current repository: `beltranalain/Honorable.AI`
- ✅ Latest commit: `740f597a`

## Step 1: Create New GitHub Repository

1. Log in to GitHub with the `argufight` account
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `Honorable.AI` (or your preferred name)
4. Description: (optional)
5. Visibility: **Private** (recommended) or Public
6. **DO NOT** check:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
7. Click "Create repository"

## Step 2: Add New Remote and Push

After creating the repository, GitHub will show you the repository URL. It will look like:
- `https://github.com/argufight/Honorable.AI.git` (HTTPS)
- OR `git@github.com:argufight/Honorable.AI.git` (SSH)

### Option A: Using HTTPS (Easier)

```bash
# Add the new remote (you can name it 'argufight' or 'new-origin')
git remote add argufight https://github.com/argufight/Honorable.AI.git

# Push all branches and tags to the new repository
git push argufight main

# If you have other branches, push them too:
# git push argufight --all

# Push tags if you have any:
# git push argufight --tags
```

### Option B: Replace the existing remote

```bash
# Remove the old remote
git remote remove origin

# Add the new remote as 'origin'
git remote add origin https://github.com/argufight/Honorable.AI.git

# Push to the new repository
git push -u origin main
```

## Step 3: Verify the Push

1. Go to `https://github.com/argufight/Honorable.AI`
2. Verify all files and commit history are present
3. Check that the latest commit `740f597a` is visible

## Step 4: Update Vercel Project

1. Log in to Vercel with your new account (or add the argufight GitHub account to your Vercel team)
2. Go to your project settings
3. Navigate to "Git" settings
4. Click "Disconnect" from the old repository
5. Click "Connect Git Repository"
6. Select the new repository: `argufight/Honorable.AI`
7. Vercel will automatically detect the project settings
8. Deploy to verify everything works

## Step 5: Update Environment Variables (if needed)

If you're using a new Vercel account:
1. Go to Project Settings → Environment Variables
2. Re-add all environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - Any API keys (DeepSeek, Resend, Google Analytics, etc.)

## Step 6: Update Local Git Configuration (Optional)

If you want to use the new repository as your default:

```bash
# Check current remotes
git remote -v

# If you kept both remotes, you can set the new one as default:
git remote set-url origin https://github.com/argufight/Honorable.AI.git

# Verify
git remote -v
```

## Important Notes

⚠️ **Before disconnecting from Vercel:**
- Make sure you have all environment variables documented
- Export any important project settings from Vercel dashboard

⚠️ **GitHub Authentication:**
- You may need to authenticate with the new GitHub account
- If using HTTPS, you may need a Personal Access Token
- If using SSH, add your SSH key to the new GitHub account

## Troubleshooting

### If you get authentication errors:
- For HTTPS: Create a Personal Access Token in GitHub Settings → Developer settings → Personal access tokens
- For SSH: Add your SSH key to the new GitHub account (Settings → SSH and GPG keys)

### If you want to keep both remotes:
```bash
# Keep old remote as 'old-origin'
git remote rename origin old-origin

# Add new remote as 'origin'
git remote add origin https://github.com/argufight/Honorable.AI.git
```


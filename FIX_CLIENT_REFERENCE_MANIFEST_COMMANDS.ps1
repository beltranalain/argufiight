# PowerShell Commands to Fix clientReferenceManifest Error
# Run these commands in PowerShell from your project directory

# 1. Navigate to project directory (if not already there)
cd C:\Users\beltr\Honorable.AI

# 2. Check what files were changed
git status

# 3. Add all the new/changed files
git add .

# 4. Commit the changes
git commit -m "Fix clientReferenceManifest error - add build verification"

# 5. Push to Railway (or your git remote)
git push

# After pushing, Railway should automatically:
# - Run the build command (npm run build)
# - Verify the build is complete
# - Start the server (npm start)
# - The verify-build.js script will prevent starting if build is incomplete

# To check Railway logs after deployment:
# - Go to Railway Dashboard
# - Your Service → Deployments → Latest Deployment → View Logs
# - Look for: "✅ Build verification complete!"



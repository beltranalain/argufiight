# Force push changes to GitHub
$ErrorActionPreference = "Stop"

Write-Host "=== Force Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Set remote with token
Write-Host "Setting remote URL..." -ForegroundColor Yellow
git remote set-url origin https://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@github.com/argufight/argufight.git

# Check status
Write-Host "`nChecking git status..." -ForegroundColor Yellow
git status

# Add files
Write-Host "`nStaging files..." -ForegroundColor Yellow
git add components/panels/ChallengesPanel.tsx
git add "app/(dashboard)/debates/history/page.tsx"

# Check what's staged
Write-Host "`nStaged changes:" -ForegroundColor Yellow
git diff --cached --name-only

# Commit
Write-Host "`nCommitting..." -ForegroundColor Yellow
git commit -m "Fix: My Challenges not displaying WAITING debates - handle paginated API response format" 2>&1 | Write-Host

# Show commit
Write-Host "`nLatest commit:" -ForegroundColor Yellow
git log -1 --oneline

# Push
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
$pushOutput = git push origin main 2>&1
Write-Host $pushOutput

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Check: https://github.com/argufight/argufight" -ForegroundColor Cyan



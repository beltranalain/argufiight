# Script to commit and push the debate visibility fix
Write-Host "Checking git status..." -ForegroundColor Yellow
git status

Write-Host "`nStaging changes..." -ForegroundColor Yellow
git add components/panels/ChallengesPanel.tsx
git add "app/(dashboard)/debates/history/page.tsx"

Write-Host "`nChecking what will be committed..." -ForegroundColor Yellow
git status --short

Write-Host "`nCommitting changes..." -ForegroundColor Yellow
git commit -m "Fix: My Challenges not displaying WAITING debates - handle paginated API response format"

Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`nDone! Check GitHub: https://github.com/argufight/argufight" -ForegroundColor Green

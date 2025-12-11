# Get Production Environment Variables from Vercel
# This will pull the production DATABASE_URL and DIRECT_URL

Write-Host "🔍 Getting production environment variables from Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Pull environment variables
Write-Host "Pulling environment variables from Vercel..." -ForegroundColor Yellow
Write-Host "You may need to login to Vercel if prompted." -ForegroundColor Yellow
Write-Host ""

vercel env pull .env.production --yes

if (Test-Path .env.production) {
    Write-Host ""
    Write-Host "✅ Environment variables pulled!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Loading variables and running db push..." -ForegroundColor Yellow
    
    # Load the .env.production file
    Get-Content .env.production | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    
    Write-Host ""
    Write-Host "Running prisma db push..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss
    
    Write-Host ""
    Write-Host "✅ Done! Tables should now exist in production." -ForegroundColor Green
    Write-Host ""
    Write-Host "Test it: https://www.argufight.com/admin/plans" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to pull environment variables" -ForegroundColor Red
    Write-Host "You may need to login: vercel login" -ForegroundColor Yellow
}


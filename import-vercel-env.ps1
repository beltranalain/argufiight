# Import Environment Variables to Vercel
# Run this script to add all environment variables from Import.env.txt to Vercel

Write-Host "🚀 Importing Environment Variables to Vercel" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI is not installed!" -ForegroundColor Red
    Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Reading environment variables from Import.env.txt..." -ForegroundColor Yellow

# Read the file
$envFile = Get-Content "Import.env.txt" -ErrorAction Stop

$variables = @{}
foreach ($line in $envFile) {
    $line = $line.Trim()
    if ($line -and !$line.StartsWith("#") -and $line.Contains(":")) {
        $parts = $line -split ":", 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            $variables[$key] = $value
        }
    }
}

Write-Host "✅ Found $($variables.Count) environment variables" -ForegroundColor Green
Write-Host ""

# Ask which environment to set
Write-Host "Select environment(s) to set variables for:" -ForegroundColor Cyan
Write-Host "  1. Production only"
Write-Host "  2. Preview only"
Write-Host "  3. Development only"
Write-Host "  4. All environments (Production, Preview, Development)"
Write-Host ""
$choice = Read-Host "Enter choice (1-4)"

$envs = @()
switch ($choice) {
    "1" { $envs = @("production") }
    "2" { $envs = @("preview") }
    "3" { $envs = @("development") }
    "4" { $envs = @("production", "preview", "development") }
    default {
        Write-Host "❌ Invalid choice. Using 'All environments'." -ForegroundColor Yellow
        $envs = @("production", "preview", "development")
    }
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: This will add/update environment variables in Vercel" -ForegroundColor Yellow
Write-Host "   Make sure you're logged in to Vercel CLI (run: vercel login)" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📤 Adding environment variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($key in $variables.Keys) {
    $value = $variables[$key]
    
    foreach ($env in $envs) {
        Write-Host "  Adding $key to $env..." -ForegroundColor Gray
        
        # Use echo to pipe the value to vercel env add
        $process = Start-Process -FilePath "vercel" -ArgumentList "env", "add", $key, $env -InputObject $value -NoNewWindow -Wait -PassThru -RedirectStandardError "nul"
        
        # Alternative method: use echo with pipe
        try {
            $value | vercel env add $key $env 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ $key added to $env" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "    ⚠️  $key may already exist in $env (or error occurred)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "    ❌ Failed to add $key to $env" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Import Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Success: $successCount" -ForegroundColor Green
Write-Host "   Errors:  $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })
Write-Host ""
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Go to Vercel Dashboard → Settings → Environment Variables" -ForegroundColor White
Write-Host "   2. Verify all variables are set correctly" -ForegroundColor White
Write-Host "   3. Make sure DATABASE_URL and DIRECT_URL are enabled for Production" -ForegroundColor White
Write-Host "   4. Redeploy your application:" -ForegroundColor White
Write-Host "      - Go to Deployments tab" -ForegroundColor Gray
Write-Host "      - Click '...' on latest deployment" -ForegroundColor Gray
Write-Host "      - Select 'Redeploy'" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Test database connection after redeploy:" -ForegroundColor Cyan
Write-Host "   Visit: https://your-app.vercel.app/api/test-db" -ForegroundColor White
Write-Host ""


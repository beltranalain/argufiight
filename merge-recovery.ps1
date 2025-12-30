# Merge Recovery Script
# Copies files from recovered folders to current location
# Run this script to complete the merge process

Write-Host "🔄 Starting Merge Recovery Process..." -ForegroundColor Cyan
Write-Host ""

$webSource = "C:\Users\beltr\Honorable.AI.web - Copy"
$appSource = "C:\Users\beltr\Honorable.AI.app - Copy"
$target = "C:\Users\beltr\Honorable.AI"

# Step 1: Copy web pages (excluding API routes)
Write-Host "Step 1: Copying web pages..." -ForegroundColor Yellow
$pagesToCopy = @(
    "$webSource\app\(auth)",
    "$webSource\app\(dashboard)\page.tsx",
    "$webSource\app\(dashboard)\debate",
    "$webSource\app\(dashboard)\debates",
    "$webSource\app\(dashboard)\leaderboard",
    "$webSource\app\(dashboard)\profile",
    "$webSource\app\(dashboard)\settings",
    "$webSource\app\(dashboard)\trending",
    "$webSource\app\admin",
    "$webSource\app\home",
    "$webSource\app\privacy",
    "$webSource\app\terms",
    "$webSource\app\robots.ts",
    "$webSource\app\sitemap.ts"
)

foreach ($item in $pagesToCopy) {
    if (Test-Path $item) {
        $dest = $item.Replace($webSource, $target)
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $item -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Copied: $($item.Split('\')[-1])" -ForegroundColor Green
    }
}

# Step 2: Copy mobile app
Write-Host ""
Write-Host "Step 2: Copying mobile app..." -ForegroundColor Yellow
if (Test-Path "$appSource\mobile\src") {
    if (-not (Test-Path "$target\mobile\src")) {
        New-Item -ItemType Directory -Path "$target\mobile\src" -Force | Out-Null
    }
    Copy-Item -Path "$appSource\mobile\src\*" -Destination "$target\mobile\src\" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Mobile app copied" -ForegroundColor Green
}

# Step 3: Copy config files
Write-Host ""
Write-Host "Step 3: Copying config files..." -ForegroundColor Yellow
$configs = @(
    "$webSource\tailwind.config.ts",
    "$webSource\middleware.ts",
    "$webSource\next.config.js",
    "$webSource\postcss.config.mjs"
)

foreach ($config in $configs) {
    if (Test-Path $config) {
        Copy-Item -Path $config -Destination $target -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Copied: $($config.Split('\')[-1])" -ForegroundColor Green
    }
}

# Step 4: Copy lib files (selective)
Write-Host ""
Write-Host "Step 4: Copying library files..." -ForegroundColor Yellow
$libFiles = @(
    "$webSource\lib\utils.ts",
    "$webSource\lib\animations.ts",
    "$webSource\lib\contexts"
)

foreach ($lib in $libFiles) {
    if (Test-Path $lib) {
        if ($lib -like "*contexts*") {
            Copy-Item -Path $lib -Destination "$target\lib\contexts\" -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Copy-Item -Path $lib -Destination "$target\lib\" -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  ✓ Copied: $($lib.Split('\')[-1])" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Merge script complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Merge package.json dependencies manually" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Run: cd mobile && npm install" -ForegroundColor White
Write-Host "4. Test: npm run dev" -ForegroundColor White
Write-Host ""











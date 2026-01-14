# Script to stop Next.js dev server
Write-Host "🔍 Looking for Node.js processes..." -ForegroundColor Cyan

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "`n📋 Found $($nodeProcesses.Count) Node.js process(es):" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   PID: $($_.Id) - Started: $($_.StartTime)" -ForegroundColor Gray
    }
    
    Write-Host "`n🛑 Stopping all Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    
    Write-Host "✅ All Node.js processes stopped!" -ForegroundColor Green
    Write-Host "`n💡 You can now run: npx prisma generate" -ForegroundColor Cyan
} else {
    Write-Host "✅ No Node.js processes found running." -ForegroundColor Green
    Write-Host "`n💡 You can now run: npx prisma generate" -ForegroundColor Cyan
}

Write-Host "`n⏳ Waiting 2 seconds for file locks to release..." -ForegroundColor Gray
Start-Sleep -Seconds 2

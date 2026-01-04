# Quick script to enable belt system in Vercel
# Run this to add ENABLE_BELT_SYSTEM=true to Vercel environment variables

Write-Host "`nEnabling Belt System in Vercel`n" -ForegroundColor Cyan

Write-Host "Adding ENABLE_BELT_SYSTEM=true to Vercel environment variables..." -ForegroundColor Yellow
Write-Host ""

# Add to Production
Write-Host "Production..." -ForegroundColor Cyan
echo "true" | vercel env add ENABLE_BELT_SYSTEM production

# Add to Preview
Write-Host "Preview..." -ForegroundColor Cyan
echo "true" | vercel env add ENABLE_BELT_SYSTEM preview

# Add to Development
Write-Host "Development..." -ForegroundColor Cyan
echo "true" | vercel env add ENABLE_BELT_SYSTEM development

Write-Host ""
Write-Host "ENABLE_BELT_SYSTEM has been added to all environments!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Go to Vercel Dashboard -> Deployments" -ForegroundColor White
Write-Host "   2. Click '...' on latest deployment -> 'Redeploy'" -ForegroundColor White
Write-Host "   3. Wait for deployment to complete" -ForegroundColor White
Write-Host "   4. Visit https://www.argufight.com/admin/belts to verify" -ForegroundColor White
Write-Host ""
Write-Host "Note: The belt system code is already deployed, it just needed this flag!" -ForegroundColor Cyan
Write-Host ""

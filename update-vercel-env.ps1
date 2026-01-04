# PowerShell script to update Vercel environment variables
# Run this script to update all environment variables

Write-Host "Updating Vercel environment variables..." -ForegroundColor Cyan
Write-Host "You'll be prompted to enter each value." -ForegroundColor Yellow
Write-Host ""

# Remove existing variables (they'll be re-added)
Write-Host "Removing existing variables..." -ForegroundColor Yellow
vercel env rm AUTH_SECRET production --yes
vercel env rm POSTGRES_URL production --yes
vercel env rm PRISMA_DATABASE_URL production --yes
vercel env rm DATABASE_URL production --yes
vercel env rm BLOB_READ_WRITE_TOKEN production --yes
vercel env rm DEEPSEEK_API_KEY production --yes
vercel env rm NEXT_PUBLIC_APP_URL production --yes

Write-Host ""
Write-Host "Now adding updated values..." -ForegroundColor Green
Write-Host "Copy and paste each value when prompted:" -ForegroundColor Yellow
Write-Host ""

# Add AUTH_SECRET
Write-Host "AUTH_SECRET: 344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837" -ForegroundColor Cyan
echo "344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837" | vercel env add AUTH_SECRET production

# Add POSTGRES_URL
Write-Host "POSTGRES_URL: (long connection string)" -ForegroundColor Cyan
echo "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require" | vercel env add POSTGRES_URL production

# Add PRISMA_DATABASE_URL
Write-Host "PRISMA_DATABASE_URL: (long connection string)" -ForegroundColor Cyan
echo "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19hRlB3LXdQRkd6eGVqSXBIMnFxNFQiLCJhcGlfa2V5IjoiMDFLQks0TVMxRkszVFJSU1BQRjA4NUdWWDAiLCJ0ZW5hbnRfaWQiOiJkMDY4NWNjZjU5NDQ2ZjRjZGYyYjFhY2Y2MDE2ZWQwNDVhZmUzMjUxNjUxZWYyZjY4ZDQxZmQ3YTcyZDViYzU2IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjM2NGY3NjItY2UwNC00OWFkLWFkNGItMjlhYjQ2MzRlMTBkIn0.FNY4AV-LCX_6EdS9268EQ8x_oQDxr9t0uuspm8oHYL8" | vercel env add PRISMA_DATABASE_URL production

# Add DATABASE_URL
Write-Host "DATABASE_URL: (long connection string)" -ForegroundColor Cyan
echo "postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require" | vercel env add DATABASE_URL production

# Add BLOB_READ_WRITE_TOKEN
Write-Host "BLOB_READ_WRITE_TOKEN: (token)" -ForegroundColor Cyan
echo "vercel_blob_rw_dvwKczTLQ7v3F9UK_M1OR2yN9wAy6BAAXumTPpo6S09kKxA" | vercel env add BLOB_READ_WRITE_TOKEN production

# Add DEEPSEEK_API_KEY
Write-Host "DEEPSEEK_API_KEY: (key)" -ForegroundColor Cyan
echo "sk-2b74f7dbee0e429f87a56f167de005c1" | vercel env add DEEPSEEK_API_KEY production

# Add NEXT_PUBLIC_APP_URL
Write-Host "NEXT_PUBLIC_APP_URL: https://argufight.com" -ForegroundColor Cyan
echo "https://argufight.com" | vercel env add NEXT_PUBLIC_APP_URL production

# Add ENABLE_BELT_SYSTEM
Write-Host "ENABLE_BELT_SYSTEM: true" -ForegroundColor Cyan
echo "true" | vercel env add ENABLE_BELT_SYSTEM production
echo "true" | vercel env add ENABLE_BELT_SYSTEM preview
echo "true" | vercel env add ENABLE_BELT_SYSTEM development

Write-Host ""
Write-Host "✅ All environment variables updated!" -ForegroundColor Green
Write-Host "Note: You may also want to add DIRECT_URL (same as DATABASE_URL)" -ForegroundColor Yellow
Write-Host "Note: ENABLE_BELT_SYSTEM has been added for Production, Preview, and Development" -ForegroundColor Green


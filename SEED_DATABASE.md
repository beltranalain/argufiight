# Seed Database - Populate Initial Data

## Quick Command

Run this in PowerShell to seed all data:

```powershell
cd C:\Users\beltr\Honorable.AI

# Set environment variables
$env:DATABASE_URL="postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require"
$env:AUTH_SECRET="344e11ac0b8d530be37625647772982874d10989a3d640452c9f16ac5125b837"

# Run the seed script
npm run seed:all
```

## What This Seeds

1. **Categories** (6 categories):
   - Sports, Politics, Tech, Entertainment, Science, Other

2. **AI Judges** (from `lib/ai/judges.ts`):
   - The Empiricist 🔬
   - The Rhetorician 🎭
   - The Logician 🧮
   - (and more...)

3. **Homepage Sections** (5 sections):
   - Hero section
   - Features
   - How It Works
   - Testimonials
   - App Download

4. **Legal Pages** (2 pages):
   - Terms of Service
   - Privacy Policy

## After Seeding

After running the seed script:

1. **Refresh your admin dashboard** at `https://honorable-ai.vercel.app/admin`
2. You should now see:
   - **Categories**: 6 categories listed
   - **Content Manager**: 5 homepage sections
   - **Legal Pages**: Terms and Privacy pages
   - **AI Judges**: All judge personalities

## Verify It Worked

Check the console output - you should see:
```
🌱 Starting database seeding...

📁 Seeding Categories...
  ✓ Sports
  ✓ Politics
  ...

⚖️  Seeding AI Judges...
  ✓ The Empiricist 🔬
  ...

📄 Seeding Homepage Sections...
  ✓ Welcome to Honorable AI
  ...

📜 Seeding Legal Pages...
  ✓ Terms of Service
  ✓ Privacy Policy

✅ All seeding completed successfully!
```

---

**Note**: This script uses `upsert`, so it's safe to run multiple times - it will update existing data or create new data.







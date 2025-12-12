# Quick Deployment Checklist

Use this checklist to track your deployment progress.

## GitHub Setup

- [ ] Create GitHub account (if needed)
- [ ] Create new repository on GitHub
- [ ] Check if git is initialized (`git status`)
- [ ] Initialize git if needed (`git init`)
- [ ] Verify `.gitignore` is up to date
- [ ] Stage all files (`git add .`)
- [ ] Create initial commit (`git commit -m "Initial commit"`)
- [ ] Add GitHub remote (`git remote add origin https://github.com/YOUR_USERNAME/Honorable.AI.git`)
- [ ] Push to GitHub (`git push -u origin main`)
- [ ] Verify code is on GitHub

## Vercel Setup

- [ ] Create Vercel account (use GitHub login for easiest setup)
- [ ] Install Vercel CLI (`npm install -g vercel`) - Optional
- [ ] Login to Vercel (`vercel login`) - If using CLI

## Deploy to Vercel

- [ ] Go to Vercel Dashboard → Add New Project
- [ ] Import GitHub repository
- [ ] Configure project settings (auto-detected should work)
- [ ] Add environment variables:
  - [ ] `DATABASE_URL` (will need production database)
  - [ ] `NEXTAUTH_SECRET` (generate random string)
  - [ ] `NEXTAUTH_URL` (your Vercel URL)
- [ ] Click Deploy
- [ ] Wait for build to complete
- [ ] Copy your deployment URL

## Database Setup

- [ ] Choose database provider:
  - [ ] Vercel Postgres (easiest - built into Vercel)
  - [ ] PlanetScale (MySQL)
  - [ ] Supabase (PostgreSQL)
  - [ ] Railway (PostgreSQL)
- [ ] Create production database
- [ ] Get connection string
- [ ] Update `DATABASE_URL` in Vercel environment variables
- [ ] Run migrations (`npx prisma migrate deploy`)
- [ ] Verify database connection

## Post-Deployment

- [ ] Test your live site
- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Test debate creation
- [ ] Check error logs in Vercel dashboard
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/analytics (optional)

## Important Notes

⚠️ **SQLite won't work on Vercel** - You need a cloud database (Postgres, MySQL, etc.)

⚠️ **File uploads** - The `public/uploads/` folder won't persist. Consider:
- Using Vercel Blob Storage
- Using Cloudinary
- Using AWS S3
- Using Uploadthing

⚠️ **Environment Variables** - Make sure all sensitive data is in Vercel environment variables, not in code

---

**Need help?** See `DEPLOYMENT_GUIDE.md` for detailed instructions.






# Run Database Migrations for Production

## Option 1: Run from Local Machine (Recommended)

1. **Install Vercel CLI** (if you haven't already):
   ```powershell
   npm install -g vercel
   ```

2. **Pull environment variables** from Vercel:
   ```powershell
   vercel env pull .env.local
   ```
   This will create a `.env.local` file with all your production environment variables.

3. **Run migrations**:
   ```powershell
   npx prisma migrate deploy
   ```
   This will apply all migrations to your production PostgreSQL database.

4. **Verify tables were created**:
   ```powershell
   npx prisma studio
   ```
   This opens Prisma Studio where you can see all your tables.

## Option 2: Create a Migration Script (Alternative)

If you prefer to run migrations automatically during deployment, we can set up a build script.

## Option 3: Use Prisma DB Push (Quick Setup)

If migrations don't work, you can push the schema directly:

```powershell
# First, pull env vars
vercel env pull .env.local

# Then push schema
npx prisma db push
```

**Note:** `db push` is faster but doesn't create migration history. `migrate deploy` is better for production.

---

## After Migrations Complete

1. ✅ All tables will be created in your PostgreSQL database
2. ✅ You can optionally seed initial data (homepage content, legal pages, etc.)
3. ✅ Your site will be fully functional!







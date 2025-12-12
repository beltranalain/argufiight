# Vercel Environment Variables Setup

## Step 3: Add Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add these:

### Required Variables:

1. **DATABASE_URL**
   ```
   postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```
   - Environment: Select **Production**, **Preview**, and **Development**

2. **DIRECT_URL** (for migrations)
   ```
   postgres://d0685ccf59446f4cdf2b1acf6016ed045afe3251651ef2f68d41fd7a72d5bc56:sk_aFPw-wPFGzxejIpH2qq4T@db.prisma.io:5432/postgres?sslmode=require
   ```
   - Environment: Select **Production**, **Preview**, and **Development**

3. **AUTH_SECRET**
   ```
   efcab943028189e80fd957503f27c31f48db132e9f0413ebbb0e01550a2ee822
   ```
   - Environment: Select **Production**, **Preview**, and **Development**

4. **NEXT_PUBLIC_APP_URL**
   ```
   https://your-app-name.vercel.app
   ```
   - Replace `your-app-name.vercel.app` with your actual Vercel URL
   - Environment: Select **Production**, **Preview**, and **Development**

### Optional (but recommended):

5. **PRISMA_DATABASE_URL** (for connection pooling)
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19hRlB3LXdQRkd6eGVqSXBIMnFxNFQiLCJhcGlfa2V5IjoiMDFLQks0TVMxRkszVFJSU1BQRjA4NUdWWDAiLCJ0ZW5hbnRfaWQiOiJkMDY4NWNjZjU5NDQ2ZjRjZGYyYjFhY2Y2MDE2ZWQwNDVhZmUzMjUxNjUxZWYyZjY4ZDQxZmQ3YTcyZDViYzU2IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjM2NGY3NjItY2UwNC00OWFkLWFkNGItMjlhYjQ2MzRlMTBkIn0.FNY4AV-LCX_6EdS9268EQ8x_oQDxr9t0uuspm8oHYL8
   ```
   - Environment: Select **Production**, **Preview**, and **Development**
   - This uses Prisma Accelerate for better performance

## After Adding Variables:

1. Click **Save** for each variable
2. Go to **Deployments** tab
3. Click the **three dots** (⋯) on the latest deployment
4. Click **Redeploy** to apply the new environment variables

## Next Step: Run Database Migrations

After redeploying, we'll need to run the database migrations to create all the tables.






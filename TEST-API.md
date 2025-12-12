# Testing the API Routes

## Quick Test

The API routes should be accessible at:
- `POST http://192.168.1.152:3000/api/auth/signup`
- `POST http://192.168.1.152:3000/api/auth/login`
- `GET http://192.168.1.152:3000/api/auth/me`
- `POST http://192.168.1.152:3000/api/auth/logout`

## Test from Browser Console

Open your browser's developer console and run:

```javascript
// Test signup
fetch('http://192.168.1.152:3000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    username: 'testuser'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Check Next.js Terminal

When you make a request, you should see in the Next.js terminal:
- `POST /api/auth/signup` (not 404)
- Any compilation messages

If you see 404, the routes aren't being found. Check:
1. Files exist in `app/api/auth/signup/route.ts`
2. Next.js server was restarted after creating files
3. No TypeScript compilation errors

## Common Issues

1. **Routes not found**: Restart Next.js server (`npm run dev`)
2. **Import errors**: Check that `@/lib/db/prisma` resolves correctly
3. **Prisma errors**: Run `npx prisma generate` again







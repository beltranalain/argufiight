# Local Authentication Setup

This project now uses a **local authentication system** instead of Supabase. This allows you to develop and test the application without any external dependencies.

## What's Included

### Database
- **SQLite** database stored at `prisma/dev.db`
- Managed by **Prisma ORM**
- User and session models for authentication

### Authentication System
- **JWT-based sessions** using `jose` library
- **Password hashing** using `bcryptjs`
- **Session management** via HTTP-only cookies
- **API routes** for login, signup, logout, and user info

## Setup

1. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   AUTH_SECRET="your-secret-key-change-in-production"
   ```

2. **Database Migration**
   The database has already been initialized. If you need to reset it:
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "username": "username",
    ...
  }
}
```

### POST `/api/auth/signup`
Create a new account.

**Request:**
```json
{
  "username": "username",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "username": "username",
    ...
  }
}
```

### POST `/api/auth/logout`
Logout the current user.

### GET `/api/auth/me`
Get the current authenticated user.

## Database Schema

### User Model
- `id` - UUID
- `email` - Unique email address
- `username` - Unique username
- `passwordHash` - Hashed password
- `avatarUrl` - Optional avatar URL
- `bio` - Optional bio
- `eloRating` - ELO rating (default: 1200)
- `debatesWon`, `debatesLost`, `debatesTied`, `totalDebates` - Statistics
- `isAdmin` - Admin flag
- `isBanned` - Ban flag
- `createdAt`, `updatedAt` - Timestamps

### Session Model
- `id` - UUID
- `userId` - Foreign key to User
- `token` - JWT token
- `expiresAt` - Expiration timestamp
- `createdAt` - Creation timestamp

## Protected Routes

The middleware automatically protects:
- `/admin/*` - Requires authentication and admin role
- `/profile/*` - Requires authentication

## Usage in Components

### Check Authentication
```typescript
import { useAuth } from '@/lib/hooks/useAuth'

function MyComponent() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>

  return (
    <div>
      <p>Welcome, {user?.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Server-Side Authentication
```typescript
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export default async function ServerComponent() {
  const session = await verifySession()
  
  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  return <div>Hello, {user?.username}</div>
}
```

## Migration from Supabase

All Supabase dependencies have been removed from:
- Login page (`app/(auth)/login/page.tsx`)
- Signup page (`app/(auth)/signup/page.tsx`)
- Middleware (`middleware.ts`)

The application now works entirely with local authentication.

## Production Considerations

For production deployment:
1. Change `AUTH_SECRET` to a strong random string
2. Consider using PostgreSQL instead of SQLite
3. Set up proper environment variables
4. Implement rate limiting on auth endpoints
5. Add email verification if needed
6. Consider adding OAuth providers (Google, etc.)


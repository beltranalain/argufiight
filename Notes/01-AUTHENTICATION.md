# PART 2: AUTHENTICATION SYSTEM

Complete Supabase authentication setup with login/signup pages.

---

## OVERVIEW

This part covers:
- Supabase project setup
- Authentication configuration
- Login page (with HTML template)
- Signup page (with HTML template)
- Protected routes
- Session management

---

## SUPABASE SETUP

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization
4. Project name: "honorable-ai"
5. Database password: (save this securely)
6. Region: (closest to you)
7. Click "Create new project"

### 2. Get Credentials

Once project is created:

1. Go to Settings > API
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (keep secret!)
```

3. Go to Settings > Database
4. Copy connection string:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 3. Update .env.local

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## SUPABASE AUTH CONFIGURATION

### Enable Email/Password Auth

1. Go to Authentication > Providers
2. Enable "Email" provider
3. Disable "Confirm email" (for development)
4. Save

### Configure Email Templates (Optional for now)

Later you can customize:
- Authentication > Email Templates
- Customize confirmation, reset password emails

---

## DATABASE SCHEMA (Auth Tables)

Supabase automatically creates auth tables. We'll extend with our custom tables.

### Create profiles table

In Supabase SQL Editor, run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  elo_rating INTEGER DEFAULT 1200,
  debates_won INTEGER DEFAULT 0,
  debates_lost INTEGER DEFAULT 0,
  debates_tied INTEGER DEFAULT 0,
  total_debates INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## INSTALL DEPENDENCIES

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install framer-motion
```

---

## FILE STRUCTURE

Create these files:

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── layout.tsx
└── globals.css

components/
├── auth/
│   ├── AuthLayout.tsx
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
└── ui/
    ├── Button.tsx
    └── Input.tsx

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
└── utils/
    └── validation.ts

public/
└── html-templates/
    ├── auth-login.html
    └── auth-signup.html
```

---

## IMPLEMENTATION

### Step 1: Supabase Clients

**lib/supabase/client.ts**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()
```

**lib/supabase/server.ts**
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}
```

**lib/supabase/middleware.ts**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check if user is admin for /admin routes
  if (req.nextUrl.pathname.startsWith('/admin') && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
}
```

### Step 2: Validation Utilities

**lib/utils/validation.ts**
```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateUsername(username: string): {
  isValid: boolean
  error?: string
} {
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' }
  }
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    }
  }
  return { isValid: true }
}
```

### Step 3: Global Styles

**app/globals.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --color-bg-primary: #000000;
  --color-bg-secondary: #0a0a0a;
  --color-bg-tertiary: #1a1a1a;
  --color-electric-blue: #00d9ff;
  --color-neon-orange: #ff6b35;
  --color-hot-pink: #ff006e;
  --color-cyber-green: #00ff94;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #666666;
  --color-border: #1a1a1a;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-electric-blue);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-neon-orange);
}

/* Utility Classes */
.glow-blue {
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
}

.glow-orange {
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
}

.glow-pink {
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
}

.glow-green {
  box-shadow: 0 0 20px rgba(0, 255, 148, 0.3);
}

@keyframes gradient-rotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animated-gradient {
  background: linear-gradient(
    135deg,
    var(--color-electric-blue),
    var(--color-neon-orange),
    var(--color-hot-pink),
    var(--color-cyber-green)
  );
  background-size: 300% 300%;
  animation: gradient-rotate 8s ease infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Step 4: Tailwind Configuration

**tailwind.config.ts**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'electric-blue': '#00d9ff',
        'neon-orange': '#ff6b35',
        'hot-pink': '#ff006e',
        'cyber-green': '#00ff94',
        'bg-primary': '#000000',
        'bg-secondary': '#0a0a0a',
        'bg-tertiary': '#1a1a1a',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        'text-muted': '#666666',
      },
      animation: {
        'gradient-rotate': 'gradient-rotate 8s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-rotate': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
export default config
```

### Step 5: Root Layout

**app/layout.tsx**
```typescript
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Honorable AI - AI-Judged Debates',
  description: 'Where debates are settled by AI judges',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

---

## NEXT: HTML TEMPLATES

In the next message, I'll provide the complete HTML templates for:
1. Login page
2. Signup page

These will be pixel-perfect reference designs that Cursor.ai will use to generate the React components.

**Ready for the HTML templates?**

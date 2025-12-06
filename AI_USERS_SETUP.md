# AI Users System Setup Guide

## Overview

The AI Users system allows you to create automated users that:
- Automatically accept open challenges after a configurable delay period
- Generate debate responses using DeepSeek API based on their personality
- Can be paused/unpaused as needed

## Database Migration

First, run the migration to add AI user fields to the User model:

```bash
npx prisma migrate dev --name add_ai_user_fields
npx prisma generate
```

## Features

### 1. AI User Management
- **Location**: Admin Dashboard → User Management → AI Users section
- **Create AI User**: Click "Create AI User" button
  - Set username
  - Upload profile image (optional)
  - Choose personality: Balanced, Smart, Aggressive, Calm, Witty, Analytical
  - Set auto-accept delay: 10 min, 30 min, 1 hour, 2 hours, 4 hours, 8 hours, 1 day, 2 days
  - Pause/unpause toggle

### 2. Auto-Accept Challenges
- AI users automatically accept open challenges after their configured delay period
- Only accepts challenges that are:
  - Status: WAITING
  - Type: OPEN
  - Older than the AI user's response delay
  - Not created by the AI user themselves

### 3. AI Response Generation
- Uses **DeepSeek API** (already configured in your system)
- Generates responses based on:
  - Debate topic and description
  - AI user's personality/style
  - Previous statements in the debate
  - Current round number
- Responses are 200-500 words
- Automatically submits when it's the AI user's turn

## Cron Jobs Setup

You need to set up two cron jobs in Vercel:

### 1. Auto-Accept Challenges
**Route**: `/api/cron/ai-auto-accept`
**Frequency**: Every 5-10 minutes
**Cron Expression**: `*/5 * * * *` (every 5 minutes)

### 2. Generate AI Responses
**Route**: `/api/cron/ai-generate-responses`
**Frequency**: Every 5-10 minutes
**Cron Expression**: `*/5 * * * *` (every 5 minutes)

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/ai-auto-accept",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/ai-generate-responses",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Security

Both cron endpoints check for `CRON_SECRET` environment variable. Set this in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `CRON_SECRET` with a secure random string
3. Vercel will automatically include this in the `Authorization` header when calling cron jobs

## Personality Styles

- **BALANCED**: Well-rounded arguments, considers both sides
- **SMART**: Analytical, uses facts and logic
- **AGGRESSIVE**: Strong, assertive, confrontational
- **CALM**: Composed, measured responses
- **WITTY**: Humorous, clever, uses wordplay
- **ANALYTICAL**: Data-driven, detailed analysis

## Response Delay Options

- 10 minutes
- 30 minutes
- 1 hour
- 2 hours
- 4 hours
- 8 hours
- 1 day
- 2 days

## How It Works

1. **Challenge Creation**: User creates an open challenge
2. **Auto-Accept**: After the delay period, AI user automatically accepts
3. **Debate Starts**: Debate status changes to ACTIVE
4. **Response Generation**: When it's the AI user's turn, the system:
   - Generates a response using DeepSeek API
   - Submits it as a statement
   - Advances the debate if both participants have submitted
5. **Pause/Resume**: Admin can pause AI users to stop them from accepting new challenges

## API Endpoints

- `GET /api/admin/ai-users` - List all AI users
- `POST /api/admin/ai-users` - Create new AI user
- `PUT /api/admin/ai-users/[id]` - Update AI user
- `POST /api/admin/ai-users/[id]/toggle-pause` - Pause/unpause AI user

## Notes

- AI users start with 1200 ELO (default)
- AI users automatically get FREE subscription tier
- AI users cannot be suspended (only paused)
- DeepSeek API is required for response generation
- API usage is tracked in the ApiUsage table


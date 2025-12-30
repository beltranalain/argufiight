# AI-Powered Moderation System

## Overview

The AI Moderation System automatically reviews user reports and flagged content using DeepSeek AI, handling the majority of moderation tasks automatically and only escalating ambiguous cases to human admins.

## How It Works

### 1. **Automatic Review on Submission**
- When a user submits a report, it's automatically sent to AI for review
- When a statement is flagged, it's automatically reviewed by AI
- AI analyzes the content and provides:
  - **Action**: `APPROVE`, `REMOVE`, or `ESCALATE`
  - **Confidence**: 0-100% (how certain the AI is)
  - **Reasoning**: Explanation for the decision
  - **Severity**: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` (for violations)

### 2. **Auto-Resolution (High Confidence ≥80%)**
- **APPROVE** (dismiss): Report is automatically dismissed, statement unflagged
- **REMOVE** (take action): Content is automatically removed, report moved to `REVIEWING` for admin confirmation
- **ESCALATE** (low confidence): Sent to admin queue for human review

### 3. **Admin Review Queue**
- Only ambiguous cases reach admins
- Admins see:
  - AI's recommendation and confidence level
  - AI's reasoning
  - Original content
  - Ability to override AI decision

### 4. **Batch Processing**
- Cron job can run periodically to review pending items
- Processes up to 10 reports and 10 statements per batch
- Can be triggered manually via API

## API Endpoints

### `POST /api/moderation/auto-review`
Automatically reviews pending reports and flagged statements.

**Request Body:**
```json
{
  "reportId": "optional-specific-report-id",
  "statementId": "optional-specific-statement-id"
}
```

**Response:**
```json
{
  "success": true,
  "reportsReviewed": 5,
  "statementsReviewed": 3,
  "autoResolved": 6,
  "escalated": 2
}
```

### `POST /api/reports`
Create a new report (automatically triggers AI review).

## Database Schema

### Report Model (New Fields)
- `aiModerated`: Boolean - Has AI reviewed this?
- `aiAction`: String - AI's recommendation (APPROVE/REMOVE/ESCALATE)
- `aiConfidence`: Int - AI's confidence (0-100)
- `aiReasoning`: String - AI's explanation
- `aiSeverity`: String - Severity level (LOW/MEDIUM/HIGH/CRITICAL)
- `aiModeratedAt`: DateTime - When AI reviewed

### Statement Model (New Fields)
- Same AI moderation fields as Report

## Workflow

```
User Reports Content
    ↓
Report Created (status: PENDING)
    ↓
AI Auto-Review Triggered
    ↓
AI Analyzes Content
    ↓
Confidence ≥ 80%?
    ├─ YES → Auto-Resolve
    │   ├─ APPROVE → Status: DISMISSED
    │   └─ REMOVE → Status: REVIEWING (admin confirms)
    └─ NO → Status: PENDING (admin reviews)
```

## Admin Interface

The Moderation Queue shows:
- **Pending Reports**: Reports needing review
- **Flagged Statements**: Statements needing review
- **AI Badges**: Shows AI recommendation and confidence
- **AI Reasoning**: Explanation for transparency
- **Override Options**: Admins can approve/remove regardless of AI decision

## Benefits

1. **Scalability**: Handles thousands of reports automatically
2. **Speed**: Instant review vs. hours/days for human review
3. **Consistency**: AI applies rules uniformly
4. **Efficiency**: Admins only review edge cases
5. **Transparency**: AI reasoning visible to admins
6. **Cost-Effective**: DeepSeek pricing is very affordable (~$0.14/1M input tokens)

## Configuration

### Confidence Threshold
Currently set to **80%** - can be adjusted in `/api/moderation/auto-review/route.ts`

### Auto-Resolution Rules
- **≥80% confidence + APPROVE**: Auto-dismiss
- **≥80% confidence + REMOVE**: Auto-remove (admin can still review)
- **<80% confidence**: Always escalate to admin

## Monitoring

- All AI moderation calls are logged in `ApiUsage` table
- Track costs, success rates, and response times
- View in Admin Dashboard → API Usage

## Future Enhancements

1. **Learning from Admin Decisions**: Train AI on admin overrides
2. **Custom Rules**: Allow admins to set custom moderation rules
3. **Multi-Model Voting**: Use multiple AI models for consensus
4. **User Reputation**: Factor reporter's history into decisions
5. **Appeal System**: Allow users to appeal AI decisions











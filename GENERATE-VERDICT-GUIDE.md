# How to Generate Verdicts for Existing Debates

## Quick Method (Browser Console)

1. **Find your debate ID:**
   - Go to your debate page: `http://localhost:3000/debate/[debate-id]`
   - Copy the debate ID from the URL

2. **Open browser console (F12)**

3. **Run this command:**
   ```javascript
   fetch('/api/verdicts/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ debateId: 'YOUR_DEBATE_ID_HERE' })
   }).then(r => r.json()).then(console.log)
   ```

4. **Check the response** - You should see:
   ```json
   {
     "success": true,
     "verdicts": 3,
     "debate": { ... }
   }
   ```

5. **Refresh the debate page** to see the verdicts!

## Requirements

- ✅ Debate must have status `COMPLETED`
- ✅ Debate must have an opponent
- ✅ Debate must have statements (arguments) submitted
- ✅ No verdicts already generated for this debate
- ✅ Dev server must be running (`npm run dev`)

## Troubleshooting

**Error: "Debate is not completed"**
- The debate needs to finish all rounds first
- Complete all argument submissions

**Error: "Verdicts already generated"**
- Verdicts already exist for this debate
- Check the debate page - verdicts should be visible

**Error: "No judges available"**
- Run `npm run seed` to seed the judges











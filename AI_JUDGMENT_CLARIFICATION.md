# AI Judgment Clarification

## Current State

The AI prompt has a slight contradiction:

**Line 87 says:**
- "If a debater missed a round due to time expiration, consider that as a negative factor in your evaluation"
- But also: "Judge the arguments that were submitted and provide your verdict based on argument quality only"

**Line 108 (reasoning field) says:**
- "Judge based solely on the arguments that were presented"

## What This Means

Currently, the AI is being told to:
1. ✅ Consider missed deadlines as a negative factor in scoring
2. ✅ NOT mention deadlines in the reasoning text
3. ⚠️ There's a contradiction: "consider as negative factor" vs "judge based on argument quality only"

## Two Possible Approaches

### Option 1: Judge ONLY on Argument Quality (Pure Judgment)
- Ignore deadlines completely
- Only judge the arguments that were submitted
- Score based purely on argument quality, evidence, logic
- No penalty for missing rounds

### Option 2: Consider Deadlines in Scoring, Don't Mention in Reasoning (Current)
- Factor missed deadlines into scores (penalty)
- Don't mention deadlines in reasoning text
- Reasoning focuses on argument quality only

## Question for User

Which approach do you want?

1. **Pure judgment** - Only judge arguments, ignore deadlines completely?
2. **Current approach** - Consider deadlines in scoring, but don't mention in reasoning?


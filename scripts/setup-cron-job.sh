#!/bin/bash

# Script to set up AI Auto-Accept cron job on cron-job.org
# Usage: bash scripts/setup-cron-job.sh

# Get API key from environment or set it here
CRON_JOB_API_KEY="${CRON_JOB_API_KEY:-ufLOHF72Txp9HKJPYnMZ9e9fdtgCSmtLSNuTaYI5h1E=}"
CRON_SECRET="${CRON_SECRET:-}" # Get from environment or set manually
ENDPOINT="https://www.argufight.com/api/cron/ai-auto-accept"

# If CRON_SECRET is not set, prompt for it
if [ -z "$CRON_SECRET" ]; then
  echo "CRON_SECRET not set. Please set it:"
  echo "export CRON_SECRET='your-secret-here'"
  exit 1
fi

echo "Setting up AI Auto-Accept cron job on cron-job.org..."
echo "Endpoint: $ENDPOINT"
echo ""

# Create cron job that runs every 10 minutes
curl -X PUT \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $CRON_JOB_API_KEY" \
  -d "{
    \"job\": {
      \"url\": \"$ENDPOINT\",
      \"enabled\": true,
      \"title\": \"AI Auto-Accept Challenges\",
      \"requestMethod\": 0,
      \"requestTimeout\": 300,
      \"schedule\": {
        \"timezone\": \"UTC\",
        \"minutes\": [0, 10, 20, 30, 40, 50],
        \"hours\": [-1],
        \"mdays\": [-1],
        \"months\": [-1],
        \"wdays\": [-1]
      },
      \"extendedData\": {
        \"headers\": {
          \"Authorization\": \"Bearer $CRON_SECRET\"
        }
      }
    }
  }" \
  https://api.cron-job.org/jobs

echo ""
echo "Done! Check cron-job.org console to verify the job was created."


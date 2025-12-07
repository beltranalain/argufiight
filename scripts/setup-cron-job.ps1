# PowerShell script to set up AI Auto-Accept cron job on cron-job.org
# Usage: .\scripts\setup-cron-job.ps1

# Get API key from environment or set it here
$CRON_JOB_API_KEY = if ($env:CRON_JOB_API_KEY) { $env:CRON_JOB_API_KEY } else { "ufLOHF72Txp9HKJPYnMZ9e9fdtgCSmtLSNuTaYI5h1E=" }
$CRON_SECRET = $env:CRON_SECRET
$ENDPOINT = "https://www.argufight.com/api/cron/ai-auto-accept"

# If CRON_SECRET is not set, prompt for it
if ([string]::IsNullOrEmpty($CRON_SECRET)) {
    Write-Host "CRON_SECRET not set. Please set it:" -ForegroundColor Yellow
    Write-Host "`$env:CRON_SECRET = 'your-secret-here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting up AI Auto-Accept cron job on cron-job.org..." -ForegroundColor Green
Write-Host "Endpoint: $ENDPOINT" -ForegroundColor Cyan
Write-Host ""

# Create cron job that runs every 10 minutes
$body = @{
    job = @{
        url = $ENDPOINT
        enabled = $true
        title = "AI Auto-Accept Challenges"
        requestMethod = 0
        requestTimeout = 300
        schedule = @{
            timezone = "UTC"
            minutes = @(0, 10, 20, 30, 40, 50)
            hours = @(-1)
            mdays = @(-1)
            months = @(-1)
            wdays = @(-1)
        }
        extendedData = @{
            headers = @{
                Authorization = "Bearer $CRON_SECRET"
            }
        }
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $CRON_JOB_API_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.cron-job.org/jobs" -Method Put -Headers $headers -Body $body
    Write-Host "Success! Cron job created with ID: $($response.jobId)" -ForegroundColor Green
    Write-Host "Check cron-job.org console to verify: https://cron-job.org" -ForegroundColor Cyan
} catch {
    Write-Host "Error creating cron job:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}


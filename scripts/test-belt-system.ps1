# Belt System Testing Script
# Run this script to test the belt system functionality

Write-Host "`n🔧 Belt System Testing Script`n" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Function to check if belt system is enabled
function Test-BeltSystemEnabled {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "ENABLE_BELT_SYSTEM=true") {
        return $true
    }
    return $false
}

# Function to enable belt system
function Enable-BeltSystem {
    Write-Host "`n📝 Enabling belt system in .env...`n" -ForegroundColor Yellow
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "ENABLE_BELT_SYSTEM=") {
        $envContent = $envContent -replace "ENABLE_BELT_SYSTEM=.*", "ENABLE_BELT_SYSTEM=true"
    } else {
        $envContent += "`nENABLE_BELT_SYSTEM=true`n"
    }
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ Belt system enabled!" -ForegroundColor Green
}

# Function to test API endpoint
function Test-BeltAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "`n🧪 Testing: $Method $Endpoint" -ForegroundColor Cyan
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        # Get session cookie (you'll need to be logged in)
        $sessionCookie = $null
        if ($env:COOKIE) {
            $headers["Cookie"] = $env:COOKIE
        }
        
        $params = @{
            Uri = "http://localhost:3000$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 3)
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Yellow
        }
        return $null
    }
}

# Function to check database tables
function Test-BeltTables {
    Write-Host "`n📊 Checking belt tables in database...`n" -ForegroundColor Cyan
    
    try {
        npx tsx scripts/check-belt-tables.ts
    }
    catch {
        Write-Host "❌ Error checking tables: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to create test belt (via Prisma)
function Create-TestBelt {
    Write-Host "`n🏗️  Creating test belt...`n" -ForegroundColor Cyan
    
    $script = @'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const belt = await prisma.belt.create({
      data: {
        name: 'Test Championship Belt',
        type: 'CHAMPIONSHIP',
        status: 'VACANT',
        coinValue: 1000,
        creationCost: 500,
      },
    })
    console.log('✅ Test belt created:', belt.id)
    console.log(JSON.stringify(belt, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
'@
    
    $script | Out-File -FilePath "scripts/create-test-belt.ts" -Encoding UTF8
    
    try {
        npx tsx scripts/create-test-belt.ts
    }
    catch {
        Write-Host "❌ Error creating test belt: $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        if (Test-Path "scripts/create-test-belt.ts") {
            Remove-Item "scripts/create-test-belt.ts"
        }
    }
}

# Main menu
Write-Host "`nSelect an option:`n" -ForegroundColor Yellow
Write-Host "1. Check if belt system is enabled"
Write-Host "2. Enable belt system"
Write-Host "3. Check database tables"
Write-Host "4. Create test belt"
Write-Host "5. Test API endpoints (requires server running)"
Write-Host "6. Run all checks"
Write-Host "0. Exit`n"

$choice = Read-Host "Enter choice"

switch ($choice) {
    "1" {
        if (Test-BeltSystemEnabled) {
            Write-Host "`n✅ Belt system is ENABLED`n" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Belt system is DISABLED`n" -ForegroundColor Red
        }
    }
    "2" {
        Enable-BeltSystem
    }
    "3" {
        Test-BeltTables
    }
    "4" {
        Create-TestBelt
    }
    "5" {
        Write-Host "`n⚠️  Make sure your dev server is running (npm run dev)`n" -ForegroundColor Yellow
        Write-Host "Testing API endpoints...`n" -ForegroundColor Cyan
        
        # Test list belts
        Test-BeltAPI -Endpoint "/api/belts"
        
        # Test belt room (requires auth)
        Test-BeltAPI -Endpoint "/api/belts/room"
    }
    "6" {
        Write-Host "`n🔍 Running all checks...`n" -ForegroundColor Cyan
        
        # Check if enabled
        if (Test-BeltSystemEnabled) {
            Write-Host "✅ Belt system is enabled" -ForegroundColor Green
        } else {
            Write-Host "❌ Belt system is disabled" -ForegroundColor Red
            $enable = Read-Host "Enable it now? (y/n)"
            if ($enable -eq "y") {
                Enable-BeltSystem
            }
        }
        
        # Check tables
        Test-BeltTables
        
        Write-Host "`n✅ All checks complete!`n" -ForegroundColor Green
    }
    "0" {
        Write-Host "`n👋 Goodbye!`n" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "`n❌ Invalid choice`n" -ForegroundColor Red
    }
}

Write-Host "`n✨ Done!`n" -ForegroundColor Green

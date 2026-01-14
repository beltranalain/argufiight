# PowerShell Script to Test Creator Network Flow
# Run this script to test the entire creator network flow end-to-end

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$CreatorEmail = "",
    [string]$CreatorPassword = "",
    [string]$AdvertiserEmail = "",
    [string]$AdvertiserPassword = "",
    [string]$AdminEmail = "",
    [string]$AdminPassword = ""
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

# Global variables
$script:CreatorSessionCookie = $null
$script:CreatorSession = $null
$script:AdvertiserSessionCookie = $null
$script:AdvertiserSession = $null
$script:AdminSessionCookie = $null
$script:AdminSession = $null
$script:CreatorUserId = $null
$script:AdvertiserId = $null
$script:OfferId = $null
$script:ContractId = $null

# Helper function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [string]$SessionCookie = $null,
        $WebSession = $null,
        [switch]$SkipAuth
    )
    
    $url = "$BaseUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    # Use provided session or create new one
    if (-not $WebSession) {
        $WebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            WebSession = $WebSession
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        # Extract cookies from session (PowerShell automatically stores cookies in WebSession)
        $cookies = ""
        if ($WebSession -and $WebSession.Cookies) {
            $cookieStrings = @()
            try {
                $uri = [Uri]$url
                foreach ($cookie in $WebSession.Cookies.GetCookies($uri)) {
                    $cookieStrings += "$($cookie.Name)=$($cookie.Value)"
                }
                $cookies = $cookieStrings -join "; "
            } catch {
                # If cookie extraction fails, try to get from headers
                try {
                    $setCookieHeaders = $response.Headers['Set-Cookie']
                    if ($setCookieHeaders) {
                        if ($setCookieHeaders -is [array]) {
                            $cookies = $setCookieHeaders -join "; "
                        } else {
                            $cookies = $setCookieHeaders.ToString()
                        }
                    }
                } catch {
                    # Ignore header extraction errors
                }
            }
        }
        
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            return @{
                StatusCode = $statusCode
                Success = ($statusCode -ge 200 -and $statusCode -lt 300)
                Data = $jsonResponse
                Raw = $response.Content
                Cookies = $cookies
                Session = $WebSession
            }
        } catch {
            return @{
                StatusCode = $statusCode
                Success = ($statusCode -ge 200 -and $statusCode -lt 300)
                Data = $null
                Raw = $response.Content
                Cookies = $cookies
                Session = $WebSession
            }
        }
    } catch {
        $statusCode = 500
        $errorBody = $_.Exception.Message
        $errorResponseBody = ""
        $errorJson = $null
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            
            # Try to read the response body for more details
            try {
                $responseStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($responseStream)
                $errorResponseBody = $reader.ReadToEnd()
                $reader.Close()
                $responseStream.Close()
                
                # Try to parse as JSON
                try {
                    $errorJson = $errorResponseBody | ConvertFrom-Json
                    if ($errorJson.error) {
                        $errorBody = $errorJson.error
                    }
                } catch {
                    # Not JSON, use raw body
                }
            } catch {
                # Couldn't read response body
            }
            
            if ($_.ErrorDetails.Message) {
                $errorBody = $_.ErrorDetails.Message
            }
        }
        
        return @{
            StatusCode = $statusCode
            Success = $false
            Data = if ($errorJson) { $errorJson } else { $null }
            Error = $errorBody
            Raw = if ($errorResponseBody) { $errorResponseBody } else { $errorBody }
            Cookies = ""
            Session = $null
        }
    }
}

# Step 1: Login as Creator
function Test-CreatorLogin {
    Write-Info "`n=== Step 1: Creator Login ==="
    
    if (-not $CreatorEmail -or -not $CreatorPassword -or $CreatorEmail -eq "your-email@example.com") {
        Write-Warning "Skipping creator login - please provide real credentials"
        Write-Info "Usage: .\test-creator-network-flow.ps1 -CreatorEmail 'real@email.com' -CreatorPassword 'realpassword'"
        return $false
    }
    
    # Create new session for login
    $loginSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/auth/login" -Body @{
        email = $CreatorEmail
        password = $CreatorPassword
    } -WebSession $loginSession -SkipAuth
    
    if ($response.Success) {
        # Store session for future requests
        if ($response.Session) {
            $script:CreatorSession = $response.Session
        } else {
            $script:CreatorSession = $loginSession
        }
        
        # Extract session cookie from cookies string
        if ($response.Cookies -match 'sessionToken=([^;]+)') {
            $script:CreatorSessionCookie = "sessionToken=$($matches[1])"
        } elseif ($response.Cookies) {
            $script:CreatorSessionCookie = $response.Cookies
        } else {
            # If no cookies in string, check if session has cookies
            if ($script:CreatorSession -and $script:CreatorSession.Cookies) {
                Write-Info "  Session cookies stored successfully"
            } else {
                Write-Warning "  Could not extract session cookie, but login succeeded"
                $script:CreatorSessionCookie = ""
            }
        }
        Write-Success "[OK] Creator logged in successfully"
        Write-Info "  Email: $CreatorEmail"
        if ($response.Data) {
            Write-Info "  User ID: $($response.Data.user.id)"
            Write-Info "  Username: $($response.Data.user.username)"
        }
        return $true
    } else {
        Write-Error "[FAIL] Creator login failed"
        Write-Info "  Status Code: $($response.StatusCode)"
        Write-Info "  Error: $($response.Error)"
        
        # Try to parse error response as JSON
        if ($response.Raw) {
            try {
                $errorJson = $response.Raw | ConvertFrom-Json
                if ($errorJson.error) {
                    Write-Info "  API Error: $($errorJson.error)"
                }
            } catch {
                Write-Info "  Response: $($response.Raw)"
            }
        }
        
        if ($response.StatusCode -eq 401) {
            Write-Info ""
            Write-Warning "Possible reasons for 401:"
            Write-Info "  1. Email or password is incorrect"
            Write-Info "  2. User doesn't exist in database"
            Write-Info "  3. User has Google-only auth (no password)"
            Write-Info "  4. User account is banned"
            Write-Info "  5. Password hash doesn't match"
            Write-Info ""
            Write-Info "To debug:"
            Write-Info "  - Check server logs for detailed error messages"
            Write-Info "  - Verify user exists: SELECT * FROM users WHERE email = 'beltranalain@yahoo.com'"
            Write-Info "  - Check if user has password: SELECT password_hash FROM users WHERE email = 'beltranalain@yahoo.com'"
        }
        return $false
    }
}

# Step 2: Get Creator Profile
function Test-GetCreatorProfile {
    Write-Info "`n=== Step 2: Get Creator Profile ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/profile" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        $user = $response.Data.user
        $script:CreatorUserId = $user.id
        Write-Success "[OK] Creator profile retrieved"
        Write-Info "  User ID: $($user.id)"
        Write-Info "  Username: $($user.username)"
        Write-Info "  ELO: $($user.eloRating)"
        Write-Info "  Is Creator: $($user.isCreator)"
        Write-Info "  Creator Status: $($user.creatorStatus)"
        return $true
    } else {
        Write-Error "[FAIL] Failed to get creator profile: $($response.Error)"
        return $false
    }
}

# Step 3: Enable Creator Mode (if not already enabled)
function Test-EnableCreatorMode {
    Write-Info "`n=== Step 3: Enable Creator Mode ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/profile" -WebSession $script:CreatorSession
    
    if (-not $response.Success) {
        Write-Error "[FAIL] Failed to get profile: $($response.Error)"
        return $false
    }
    
    if ($response.Success -and $response.Data.user.isCreator) {
        Write-Success "[OK] Creator mode already enabled"
        return $true
    }
    
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/creators/enable" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        Write-Success "[OK] Creator mode enabled"
        Write-Info "  Creator Status: $($response.Data.user.creatorStatus)"
        return $true
    } else {
        if ($response.StatusCode -eq 403) {
            Write-Warning "[SKIP] Not eligible to become creator"
            Write-Info "  Eligibility Requirements:"
            $eligibility = $response.Data.eligibility
            Write-Info "    Min ELO: $($eligibility.minELO)"
            Write-Info "    Min Debates: $($eligibility.minDebates)"
            Write-Info "    Min Age: $($eligibility.minAgeMonths) months"
            return $false
        } else {
            Write-Error "[FAIL] Failed to enable creator mode: $($response.Error)"
            return $false
        }
    }
}

# Step 4: Update Creator Settings
function Test-UpdateCreatorSettings {
    Write-Info "`n=== Step 4: Update Creator Settings ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "PUT" -Endpoint "/api/creator/settings" -Body @{
        profileBannerPrice = 500
        postDebatePrice = 250
        debateWidgetPrice = 300
        profileBannerAvailable = $true
        postDebateAvailable = $true
        debateWidgetAvailable = $true
    } -WebSession $script:CreatorSession
    
    if ($response.Success) {
        Write-Success "[OK] Creator settings updated"
        Write-Info "  Profile Banner: `$$($response.Data.user.profileBannerPrice)"
        Write-Info "  Post Debate: `$$($response.Data.user.postDebatePrice)"
        Write-Info "  Debate Widget: `$$($response.Data.user.debateWidgetPrice)"
        return $true
    } else {
        Write-Error "[FAIL] Failed to update settings: $($response.Error)"
        return $false
    }
}

# Step 5: Get Offers
function Test-GetOffers {
    Write-Info "`n=== Step 5: Get Creator Offers ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/offers?status=PENDING" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        $offers = $response.Data.offers
        Write-Success "[OK] Retrieved $($offers.Count) pending offers"
        
        if ($offers.Count -gt 0) {
            $script:OfferId = $offers[0].id
            Write-Info "  First Offer ID: $($offers[0].id)"
            Write-Info "  Amount: `$$($offers[0].amount)"
            Write-Info "  Duration: $($offers[0].duration) days"
            Write-Info "  Advertiser: $($offers[0].advertiser.companyName)"
            return $true
        } else {
            Write-Warning "  No pending offers found - skipping offer acceptance test"
            return $false
        }
    } else {
        Write-Error "[FAIL] Failed to get offers: $($response.Error)"
        return $false
    }
}

# Step 6: Accept Offer
function Test-AcceptOffer {
    Write-Info "`n=== Step 6: Accept Offer ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    if (-not $script:OfferId) {
        Write-Warning "Skipping - no offer ID available"
        return $false
    }
    
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/creator/offers/$script:OfferId/accept" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        $contract = $response.Data.contract
        $script:ContractId = $contract.id
        Write-Success "[OK] Offer accepted, contract created"
        Write-Info "  Contract ID: $($contract.id)"
        Write-Info "  Total Amount: `$$($contract.totalAmount)"
        Write-Info "  Platform Fee: `$$($contract.platformFee)"
        Write-Info "  Creator Payout: `$$($contract.creatorPayout)"
        Write-Info "  Status: $($contract.status)"
        return $true
    } else {
        if ($response.StatusCode -eq 402) {
            Write-Warning "[SKIP] Payment Required - Advertiser payment not ready"
        } else {
            Write-Error "[FAIL] Failed to accept offer: $($response.Error)"
        }
        return $false
    }
}

# Step 7: Get Contracts
function Test-GetContracts {
    Write-Info "`n=== Step 7: Get Creator Contracts ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/contracts?status=ACTIVE" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        $contracts = $response.Data.contracts
        Write-Success "[OK] Retrieved $($contracts.Count) active contracts"
        
        if ($contracts.Count -gt 0 -and -not $script:ContractId) {
            $script:ContractId = $contracts[0].id
            Write-Info "  First Contract ID: $($contracts[0].id)"
        }
        return $true
    } else {
        Write-Error "[FAIL] Failed to get contracts: $($response.Error)"
        return $false
    }
}

# Step 8: Get Contract Details
function Test-GetContractDetails {
    Write-Info "`n=== Step 8: Get Contract Details ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    if (-not $script:ContractId) {
        Write-Warning "Skipping - no contract ID available"
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/contracts/$script:ContractId" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        $contract = $response.Data.contract
        Write-Success "[OK] Contract details retrieved"
        Write-Info "  Advertiser: $($contract.advertiser.companyName)"
        Write-Info "  Campaign: $($contract.campaign.name)"
        Write-Info "  Status: $($contract.status)"
        Write-Info "  Impressions: $($contract.impressionsDelivered)"
        Write-Info "  Clicks: $($contract.clicksDelivered)"
        return $true
    } else {
        Write-Error "[FAIL] Failed to get contract details: $($response.Error)"
        return $false
    }
}

# Step 9: Get Earnings
function Test-GetEarnings {
    Write-Info "`n=== Step 9: Get Creator Earnings ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/earnings" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        Write-Success "[OK] Earnings retrieved"
        Write-Info "  Total Earned: `$$($response.Data.totalEarned)"
        Write-Info "  Pending Payout: `$$($response.Data.pendingPayout)"
        Write-Info "  This Month: `$$($response.Data.thisMonth)"
        return $true
    } else {
        Write-Error "[FAIL] Failed to get earnings: $($response.Error)"
        return $false
    }
}

# Step 10: Get Detailed Earnings
function Test-GetDetailedEarnings {
    Write-Info "`n=== Step 10: Get Detailed Earnings ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/earnings/detailed" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        Write-Success "[OK] Detailed earnings retrieved"
        Write-Info "  Total Earned: `$$($response.Data.totalEarned)"
        Write-Info "  Pending Payout: `$$($response.Data.pendingPayout)"
        Write-Info "  This Month: `$$($response.Data.thisMonth)"
        Write-Info "  This Year: `$$($response.Data.thisYear)"
        Write-Info "  Contracts: $($response.Data.contracts.Count)"
        Write-Info "  Monthly Breakdown: $($response.Data.monthlyBreakdown.Count) months"
        return $true
    } else {
        Write-Error "[FAIL] Failed to get detailed earnings: $($response.Error)"
        return $false
    }
}

# Step 11: Get Tax Info
function Test-GetTaxInfo {
    Write-Info "`n=== Step 11: Get Tax Information ==="
    
    if (-not $script:CreatorSession) {
        Write-Warning "Skipping - no active session. Login first."
        return $false
    }
    
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/api/creator/tax-info" -WebSession $script:CreatorSession
    
    if ($response.Success) {
        Write-Success "[OK] Tax information retrieved"
        Write-Info "  W-9 Submitted: $($response.Data.w9Submitted)"
        Write-Info "  Yearly Earnings: $($response.Data.yearlyEarnings | ConvertTo-Json)"
        Write-Info "  1099 Forms: $($response.Data.taxForms1099.Count)"
        return $true
    } else {
        Write-Error "[FAIL] Failed to get tax info: $($response.Error)"
        return $false
    }
}

# Main Test Flow
function Test-CompleteFlow {
    Write-Info "`n=========================================="
    Write-Info "CREATOR NETWORK FLOW TEST"
    Write-Info "=========================================="
    Write-Info "Base URL: $BaseUrl"
    Write-Info ""
    
    if (-not $CreatorEmail -or $CreatorEmail -eq "your-email@example.com") {
        Write-Warning "WARNING: Using placeholder credentials!"
        Write-Info "Please provide real credentials:"
        Write-Info "  .\test-creator-network-flow.ps1 -CreatorEmail 'real@email.com' -CreatorPassword 'password'"
        Write-Info ""
    }
    
    $results = @()
    
    # Creator Flow
    $results += @{ Step = "Creator Login"; Result = (Test-CreatorLogin) }
    $results += @{ Step = "Get Creator Profile"; Result = (Test-GetCreatorProfile) }
    $results += @{ Step = "Enable Creator Mode"; Result = (Test-EnableCreatorMode) }
    $results += @{ Step = "Update Creator Settings"; Result = (Test-UpdateCreatorSettings) }
    $results += @{ Step = "Get Offers"; Result = (Test-GetOffers) }
    $results += @{ Step = "Accept Offer"; Result = (Test-AcceptOffer) }
    $results += @{ Step = "Get Contracts"; Result = (Test-GetContracts) }
    $results += @{ Step = "Get Contract Details"; Result = (Test-GetContractDetails) }
    $results += @{ Step = "Get Earnings"; Result = (Test-GetEarnings) }
    $results += @{ Step = "Get Detailed Earnings"; Result = (Test-GetDetailedEarnings) }
    $results += @{ Step = "Get Tax Info"; Result = (Test-GetTaxInfo) }
    
    # Summary
    Write-Info "`n=========================================="
    Write-Info "TEST SUMMARY"
    Write-Info "=========================================="
    
    $passed = ($results | Where-Object { $_.Result }).Count
    $failed = ($results | Where-Object { -not $_.Result }).Count
    $total = $results.Count
    
    foreach ($result in $results) {
        if ($result.Result) {
            Write-Success "[PASS] $($result.Step)"
        } else {
            Write-Error "[FAIL] $($result.Step)"
        }
    }
    
    Write-Info "`nPassed: $passed / $total"
    Write-Info "Failed: $failed / $total"
    
    if ($failed -eq 0) {
        Write-Success "`nAll tests passed!"
    } else {
        Write-Warning "`nSome tests failed. Check the output above for details."
    }
}

# Run the tests
Test-CompleteFlow

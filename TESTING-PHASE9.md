# Testing Guide: Phase 9 - LLM Model Management

## Prerequisites

1. **Admin Access**: You must be logged in as an admin user
2. **Appeal Data**: For full testing, you should have at least one completed debate with an appeal
3. **Database**: Ensure the database is migrated with the new LLM model tables

## Quick Start

1. Start the development server:
   ```powershell
   npm run dev
   ```

2. Log in as an admin user (e.g., `admin@admin.com`)

3. Navigate to: `http://localhost:3000/admin/llm-models`

---

## Test 1: Overview Dashboard

### Steps:
1. Go to `/admin/llm-models`
2. You should see the **Overview** tab by default
3. Check the statistics cards:
   - **Total Appeals**: Should show count of all appeals
   - **Successful**: Appeals that resulted in verdict flip
   - **Failed**: Appeals that didn't change the verdict
   - **Success Rate**: Percentage of successful appeals

### Expected Results:
- ✅ All stat cards display numbers (may be 0 if no appeals yet)
- ✅ Cards are properly styled and readable
- ✅ Top Appeal Keywords section shows common words (if appeals exist)
- ✅ Appeals by Category section shows breakdown by debate category

### Test with Data:
If you have no appeals yet, create a test appeal:
1. Complete a debate (get a verdict)
2. As the loser, submit an appeal with a reason (50+ characters)
3. Wait for the appeal to be processed
4. Return to the LLM Models page and refresh

---

## Test 2: Analytics Tab

### Steps:
1. Click on the **Analytics** tab
2. Review the analytics data displayed

### Expected Results:
- ✅ Analytics tab loads without errors
- ✅ Shows average appeal length
- ✅ Displays relevant metrics

---

## Test 3: Training Data Tab

### Steps:
1. Click on the **Training Data** tab
2. Review the recent appeals list
3. Check each appeal entry shows:
   - Debate topic
   - Category badge
   - Success/Failure status
   - Appeal reason
   - Number of appealed statements
   - Original and new winner (if applicable)

### Expected Results:
- ✅ Recent appeals are displayed
- ✅ Each appeal shows complete information
- ✅ Success/Failure badges are color-coded correctly
- ✅ Empty state shows if no appeals exist

---

## Test 4: Export Functionality

### Steps:
1. On the main page, click **Export CSV** button
2. Check if a CSV file downloads
3. Open the CSV file and verify:
   - Headers are present
   - Data rows are included
   - Appeal reasons are included
   - Statement data is included
4. Repeat with **Export JSON** button
5. Open the JSON file and verify structure

### Expected Results:
- ✅ CSV export downloads successfully
- ✅ CSV contains all appeal data
- ✅ JSON export downloads successfully
- ✅ JSON is properly formatted
- ✅ Both formats include all relevant fields

### Test Data Structure:
The exported data should include:
- `debate_id`
- `topic`
- `category`
- `appeal_reason`
- `appealed_statements` (array)
- `original_winner`
- `new_winner`
- `verdict_flipped`
- `challenger_elo`
- `opponent_elo`
- `total_statements`
- `appeal_date`
- `created_at`

---

## Test 5: Model Versions Management

### Steps:
1. Click on the **Model Versions** tab
2. Click **Create Model Version** button
3. Fill in the form:
   - **Name**: "Appeal Predictor v1.0"
   - **Version**: "1.0.0"
   - **Description**: "Initial model for predicting appeal success"
   - **Model Type**: "appeal_predictor"
   - **Config** (optional): `{"learning_rate": 0.001, "epochs": 100}`
   - **Active**: Check if you want it active
   - **Default**: Check if you want it as default
4. Submit the form
5. Verify the new version appears in the list
6. Click **Edit** on a version
7. Update some fields and save
8. Verify changes are reflected

### Expected Results:
- ✅ Create button opens modal/form
- ✅ Form validation works (required fields)
- ✅ New model version is created
- ✅ Version appears in the list with correct info
- ✅ Edit functionality works
- ✅ Updates are saved correctly
- ✅ Active/Default badges display correctly
- ✅ Only one default per model type allowed

### API Testing:
You can also test the API directly:

```powershell
# Get all versions
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/llm-models/versions" -Headers @{"Cookie"="your-session-cookie"}

# Create a version
$body = @{
    name = "Test Model"
    version = "1.0.0"
    modelType = "appeal_predictor"
    description = "Test description"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/llm-models/versions" -Method POST -Body $body -ContentType "application/json" -Headers @{"Cookie"="your-session-cookie"}
```

---

## Test 6: Performance Metrics

### Steps:
1. Click on the **Metrics** tab
2. Review the metrics list (if any exist)
3. To add a metric, use the API or create one programmatically

### API Testing - Add a Metric:

```powershell
# First, get a model version ID from the versions tab
$modelVersionId = "your-model-version-id"

$body = @{
    modelVersionId = $modelVersionId
    metricType = "accuracy"
    metricValue = 0.85
    dataset = "validation"
    period = "daily"
    notes = "Test metric"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/llm-models/metrics" -Method POST -Body $body -ContentType "application/json" -Headers @{"Cookie"="your-session-cookie"}
```

4. Refresh the Metrics tab
5. Verify the new metric appears

### Expected Results:
- ✅ Metrics tab loads
- ✅ Metrics are displayed with model version info
- ✅ Metric values are formatted correctly
- ✅ Dates are displayed properly
- ✅ Empty state shows if no metrics exist

---

## Test 7: A/B Testing

### Steps:
1. Click on the **A/B Tests** tab
2. Click **Create A/B Test** button
3. Fill in the form:
   - **Name**: "Model Comparison Test"
   - **Description**: "Comparing v1.0 vs v1.1"
   - **Model A**: Select a model version
   - **Model B**: Select a different model version
   - **Traffic Split**: 50 (50% to each)
   - **Start Date**: Today's date
   - **End Date**: (optional) Future date
   - **Status**: "draft" or "active"
4. Submit the form
5. Verify the test appears in the list
6. Click to edit a test
7. Update status to "active" or "completed"
8. Add scores and winner if completed

### Expected Results:
- ✅ Create A/B Test button works
- ✅ Form validation prevents same model for A and B
- ✅ Traffic split must be 0-100
- ✅ Test is created successfully
- ✅ Test appears in list with both models
- ✅ Status badges display correctly
- ✅ Edit functionality works
- ✅ Only one active test at a time
- ✅ Winner is displayed when test is completed

### API Testing:

```powershell
# Get model version IDs first
$modelAId = "model-version-a-id"
$modelBId = "model-version-b-id"

$body = @{
    name = "Test A/B"
    description = "Testing two models"
    modelVersionAId = $modelAId
    modelVersionBId = $modelBId
    trafficSplit = 50
    startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    status = "draft"
    isActive = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/admin/llm-models/ab-tests" -Method POST -Body $body -ContentType "application/json" -Headers @{"Cookie"="your-session-cookie"}
```

---

## Test 8: Appeal Prediction Tracking

### Steps:
This feature tracks predictions made by models. To test:

1. Create a model version (if you haven't)
2. When an appeal is submitted, the system can create an `AppealPrediction` record
3. View predictions in the Model Versions detail page

### API Testing - Create Prediction:

```powershell
# Get a debate ID with an appeal
$debateId = "debate-id-with-appeal"
$modelVersionId = "your-model-version-id"

$body = @{
    debateId = $debateId
    modelVersionId = $modelVersionId
    predictedSuccess = $true
    confidence = 0.75
    reasoning = "Model predicts appeal will succeed based on reason quality"
} | ConvertTo-Json

# Note: This would typically be done automatically by the system
# But you can test the API directly
```

---

## Test 9: Full Workflow Test

### Complete End-to-End Test:

1. **Create Appeal Data**:
   - Complete a debate
   - Submit an appeal with a detailed reason
   - Wait for appeal to be processed

2. **View Analytics**:
   - Go to `/admin/llm-models`
   - Check Overview tab shows the appeal
   - Review analytics

3. **Export Data**:
   - Export CSV and JSON
   - Verify data is complete

4. **Create Model Version**:
   - Create a new model version
   - Mark it as active/default

5. **Record Metrics**:
   - Add performance metrics for the model
   - View metrics in the Metrics tab

6. **Create A/B Test**:
   - Create two model versions
   - Create an A/B test comparing them
   - Activate the test
   - Update with results

7. **Verify Everything**:
   - All tabs work correctly
   - Data persists after refresh
   - No console errors

---

## Common Issues & Solutions

### Issue: "No appeals found"
**Solution**: Create a test appeal by completing a debate and submitting an appeal.

### Issue: "Unauthorized" errors
**Solution**: Make sure you're logged in as an admin user. Check your session cookie.

### Issue: Export files are empty
**Solution**: Ensure you have appeal data in the database. Check the database directly if needed.

### Issue: Model version creation fails
**Solution**: 
- Check all required fields are filled
- Ensure name + version combination is unique
- Verify you're an admin

### Issue: A/B test can't use same model twice
**Solution**: This is by design. Select two different model versions.

---

## Database Verification

You can verify data directly in the database:

```powershell
# Open Prisma Studio
npx prisma studio
```

Check these tables:
- `model_versions` - Your model versions
- `model_metrics` - Performance metrics
- `ab_tests` - A/B test configurations
- `appeal_predictions` - Model predictions

---

## Performance Testing

1. **Load Test**: Create 50+ appeals and verify the dashboard loads quickly
2. **Export Test**: Export large datasets (100+ appeals) and verify performance
3. **Metrics Test**: Add 100+ metrics and verify the Metrics tab performs well

---

## Security Testing

1. **Non-Admin Access**: Try accessing `/admin/llm-models` as a regular user
   - Should redirect or show 403 Forbidden

2. **API Security**: Try API calls without authentication
   - Should return 401 Unauthorized

3. **Data Validation**: Submit invalid data (empty fields, wrong types)
   - Should return 400 Bad Request with error messages

---

## Checklist

- [ ] Overview dashboard displays correctly
- [ ] Analytics tab works
- [ ] Training Data tab shows appeals
- [ ] CSV export works and contains data
- [ ] JSON export works and is valid
- [ ] Can create model versions
- [ ] Can edit model versions
- [ ] Can delete model versions
- [ ] Metrics can be recorded
- [ ] Metrics display correctly
- [ ] Can create A/B tests
- [ ] Can edit A/B tests
- [ ] Can delete A/B tests
- [ ] Only one active A/B test at a time
- [ ] All API routes work correctly
- [ ] No console errors
- [ ] Data persists after refresh
- [ ] Admin-only access enforced
- [ ] Mobile responsive (if applicable)

---

## Next Steps

After testing Phase 9, you can:
1. Move to Phase 10: Testing & Optimization
2. Use the exported data to train your LLM models
3. Set up automated metrics collection
4. Run A/B tests to compare model performance

---

**Need Help?** Check the console for errors, verify database migrations are applied, and ensure you're logged in as an admin.







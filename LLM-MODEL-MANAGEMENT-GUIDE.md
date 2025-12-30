# LLM Model Management System - User Guide

## Overview

The LLM Model Management system allows you to:
- **Track different versions** of your AI models
- **Compare models** using A/B testing
- **Monitor performance** with metrics
- **Export training data** for model improvement

---

## 1. Model Versions

### What are Model Versions?

Model Versions are different iterations of your AI models. For example:
- **Appeal Predictor v1.0** - Initial model
- **Appeal Predictor v1.1** - Improved version with better accuracy
- **Verdict Judge v2.0** - New model architecture

### How to Create a Model Version

1. Go to `/admin/llm-models`
2. Click the **"Model Versions"** tab
3. Click **"Create Model Version"** button
4. Fill in the form:
   - **Name**: e.g., "Appeal Predictor"
   - **Version**: e.g., "1.0.0" (follow semantic versioning)
   - **Description**: What this model does
   - **Model Type**: 
     - `appeal_predictor` - Predicts if appeals will succeed
     - `verdict_judge` - Judges debates
     - `content_moderator` - Moderates content
     - Or any custom type
   - **Config** (optional): JSON configuration
     ```json
     {
       "learning_rate": 0.001,
       "epochs": 100,
       "batch_size": 32
     }
     ```
   - **Active**: Check to make this version active
   - **Default**: Check to make this the default for its type

### Model Version States

- **Active**: This version is currently being used
- **Default**: This is the default version for its model type
- **Inactive**: Version exists but isn't being used

### Use Cases

- **Track model improvements**: Create new versions as you improve your models
- **Rollback capability**: Keep old versions to rollback if needed
- **Documentation**: Each version can have notes about what changed
- **A/B Testing**: Use different versions in A/B tests

---

## 2. A/B Tests

### What are A/B Tests?

A/B Tests let you compare two model versions side-by-side to see which performs better.

### How A/B Testing Works

1. **Select Two Models**: Choose Model A and Model B to compare
2. **Set Traffic Split**: Decide what percentage of traffic goes to each model
   - 50/50 split: Equal traffic to both
   - 80/20 split: 80% to Model A, 20% to Model B
3. **Run the Test**: The system routes requests to models based on the split
4. **Collect Results**: Track performance metrics for both models
5. **Determine Winner**: Compare scores and declare a winner

### How to Create an A/B Test

1. Go to `/admin/llm-models`
2. Click the **"A/B Tests"** tab
3. Click **"Create A/B Test"** button
4. Fill in the form:
   - **Name**: e.g., "Appeal Predictor v1.0 vs v1.1"
   - **Description**: What you're testing
   - **Model A**: Select first model version
   - **Model B**: Select second model version (must be different)
   - **Traffic Split**: Percentage for Model A (0-100)
   - **Start Date**: When the test begins
   - **End Date**: (Optional) When the test should end
   - **Status**: 
     - `draft` - Not started yet
     - `active` - Currently running
     - `completed` - Test finished
     - `cancelled` - Test cancelled
   - **Is Active**: Check to activate the test

### A/B Test Statuses

- **Draft**: Test created but not running
- **Active**: Test is currently running
- **Completed**: Test finished, results available
- **Cancelled**: Test was cancelled

### Important Rules

1. **Only one active test at a time**: Activating a new test deactivates others
2. **Models must be different**: Model A and Model B must be different versions
3. **Traffic split**: Must be between 0 and 100

### Reading A/B Test Results

After a test completes, you'll see:
- **Model A Score**: Performance score for Model A
- **Model B Score**: Performance score for Model B
- **Winner**: Which model performed better ("A", "B", or "tie")

### Example A/B Test Scenario

**Scenario**: Testing if a new appeal predictor model is better

1. **Create Model Versions**:
   - Model A: "Appeal Predictor v1.0" (current)
   - Model B: "Appeal Predictor v1.1" (new)

2. **Create A/B Test**:
   - Name: "Appeal Predictor Comparison"
   - Traffic Split: 50/50
   - Duration: 1 week

3. **Run Test**: System routes 50% of appeals to each model

4. **Collect Metrics**: Track accuracy, precision, recall for both

5. **Compare Results**: 
   - Model A: 75% accuracy
   - Model B: 82% accuracy
   - **Winner: Model B**

6. **Action**: Make Model B the default version

---

## 3. Performance Metrics

### What are Performance Metrics?

Performance Metrics track how well your models are performing over time. Common metrics include:
- **Accuracy**: How often the model is correct
- **Precision**: How many positive predictions were correct
- **Recall**: How many actual positives were found
- **F1 Score**: Balance between precision and recall

### How to Record Metrics

#### Method 1: Via API (Recommended for Automation)

```typescript
POST /api/admin/llm-models/metrics

{
  "modelVersionId": "model-version-id",
  "metricType": "accuracy",
  "metricValue": 0.85,
  "dataset": "validation",
  "period": "daily",
  "notes": "Validation set performance"
}
```

#### Method 2: Manual Entry (Future Feature)

Currently, metrics are recorded programmatically. A manual entry UI can be added if needed.

### Metric Types

- **accuracy**: Overall correctness
- **precision**: Positive prediction accuracy
- **recall**: Positive case detection rate
- **f1_score**: Harmonic mean of precision and recall
- **custom**: Any custom metric you define

### Datasets

- **training**: Metrics on training data
- **validation**: Metrics on validation data
- **test**: Metrics on test data
- **production**: Metrics from live usage

### Periods

- **daily**: Daily metrics
- **weekly**: Weekly aggregates
- **monthly**: Monthly aggregates
- **one-time**: Single measurement

### Viewing Metrics

1. Go to `/admin/llm-models`
2. Click the **"Metrics"** tab
3. View all recorded metrics
4. Filter by:
   - Model version
   - Metric type
   - Period

### Example Metric Tracking

**Daily Accuracy Tracking**:
```
Day 1: accuracy = 0.82 (validation)
Day 2: accuracy = 0.83 (validation)
Day 3: accuracy = 0.85 (validation)
```

**A/B Test Comparison**:
```
Model A: accuracy = 0.75 (test)
Model B: accuracy = 0.82 (test)
```

---

## 4. Complete Workflow Example

### Scenario: Improving Appeal Prediction Model

**Step 1: Create New Model Version**
```
Name: Appeal Predictor
Version: 1.1.0
Description: Improved model with better feature engineering
Model Type: appeal_predictor
Config: { "features": ["elo_diff", "appeal_length", "category"] }
```

**Step 2: Record Baseline Metrics**
```json
{
  "modelVersionId": "v1.0-id",
  "metricType": "accuracy",
  "metricValue": 0.75,
  "dataset": "validation"
}
```

**Step 3: Record New Model Metrics**
```json
{
  "modelVersionId": "v1.1-id",
  "metricType": "accuracy",
  "metricValue": 0.82,
  "dataset": "validation"
}
```

**Step 4: Create A/B Test**
```
Name: Appeal Predictor v1.0 vs v1.1
Model A: v1.0
Model B: v1.1
Traffic Split: 50/50
Duration: 1 week
```

**Step 5: Monitor During Test**
- Check metrics tab daily
- Compare performance
- Watch for errors

**Step 6: Complete Test**
```
Model A Score: 0.75
Model B Score: 0.82
Winner: Model B
```

**Step 7: Deploy Winner**
- Set Model B as default
- Set Model B as active
- Deactivate Model A

---

## 5. Integration with Appeal System

### Appeal Predictions

When users submit appeals, the system can:
1. **Use active model** to predict if appeal will succeed
2. **Record prediction** in `AppealPrediction` table
3. **Track actual result** when appeal is resolved
4. **Calculate accuracy** by comparing predictions vs actuals

### Automatic Metric Calculation

The system can automatically calculate:
- **Prediction Accuracy**: How often predictions were correct
- **False Positive Rate**: Appeals predicted to succeed but didn't
- **False Negative Rate**: Appeals predicted to fail but succeeded

---

## 6. Best Practices

### Model Versioning
- ✅ Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
- ✅ Document changes in description
- ✅ Keep old versions for rollback
- ✅ Mark one version as default per type

### A/B Testing
- ✅ Test one change at a time
- ✅ Run tests for sufficient duration (at least 1 week)
- ✅ Use equal traffic split (50/50) for fair comparison
- ✅ Monitor metrics during test
- ✅ Document test results

### Metrics
- ✅ Record metrics consistently
- ✅ Use same dataset for fair comparison
- ✅ Track metrics over time
- ✅ Compare metrics across versions

---

## 7. API Reference

### Model Versions

**Create Version**:
```typescript
POST /api/admin/llm-models/versions
{
  "name": "Appeal Predictor",
  "version": "1.0.0",
  "modelType": "appeal_predictor",
  "description": "Initial model",
  "config": { ... },
  "isActive": true,
  "isDefault": true
}
```

**Get All Versions**:
```typescript
GET /api/admin/llm-models/versions
```

**Update Version**:
```typescript
PUT /api/admin/llm-models/versions/[id]
{
  "isActive": false
}
```

### A/B Tests

**Create Test**:
```typescript
POST /api/admin/llm-models/ab-tests
{
  "name": "Model Comparison",
  "modelVersionAId": "id-a",
  "modelVersionBId": "id-b",
  "trafficSplit": 50,
  "startDate": "2024-12-01T00:00:00Z",
  "status": "active"
}
```

**Update Test**:
```typescript
PUT /api/admin/llm-models/ab-tests/[id]
{
  "modelAScore": 0.75,
  "modelBScore": 0.82,
  "winner": "B",
  "status": "completed"
}
```

### Metrics

**Record Metric**:
```typescript
POST /api/admin/llm-models/metrics
{
  "modelVersionId": "id",
  "metricType": "accuracy",
  "metricValue": 0.85,
  "dataset": "validation",
  "period": "daily"
}
```

**Get Metrics**:
```typescript
GET /api/admin/llm-models/metrics?modelVersionId=id&metricType=accuracy
```

---

## 8. Troubleshooting

### Issue: Can't create A/B test with same model
**Solution**: Model A and Model B must be different versions.

### Issue: Multiple active tests
**Solution**: Only one test can be active at a time. Activating a new test deactivates others.

### Issue: Metrics not showing
**Solution**: 
- Check that metrics are being recorded via API
- Verify model version ID is correct
- Check filters in Metrics tab

### Issue: Can't set multiple defaults
**Solution**: Only one version per model type can be default. Setting a new default unsets the old one.

---

## 9. Future Enhancements

Potential future features:
- **Automatic metric collection** from appeal predictions
- **Model performance dashboards** with charts
- **Alert system** for performance degradation
- **Model training pipeline integration**
- **Automated A/B test winner selection**
- **Model version comparison charts**

---

**Need Help?** Check the API routes in `/api/admin/llm-models/` or review the code in `app/admin/llm-models/page.tsx`.











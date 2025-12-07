# Testing Guide

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for API endpoints
├── e2e/            # End-to-end tests for complete flows
└── setup.ts        # Test setup and configuration
```

## Running Tests

### Install Dependencies
```bash
npm install --save-dev jest ts-jest @types/jest
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- unit
npm test -- integration
npm test -- e2e
```

### Run with Coverage
```bash
npm test -- --coverage
```

## Test Files

### Unit Tests
- `tests/unit/debates.test.ts` - Debate logic tests

### Integration Tests
- `tests/integration/core-features.test.ts` - Core features API tests

### E2E Tests
- `tests/e2e/debate-flow.test.ts` - Complete debate flow tests

## Writing Tests

### Example Unit Test
```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Example Integration Test
```typescript
it('should create a debate', async () => {
  const response = await fetch(`${API_URL}/debates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ topic: 'Test' }),
  });
  expect(response.status).toBe(200);
});
```

## Test Environment

Tests use:
- `NODE_ENV=test`
- Separate test database (if configured)
- Mocked external services

## Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: All critical endpoints
- E2E tests: All major user flows



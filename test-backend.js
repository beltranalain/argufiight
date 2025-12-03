/**
 * Backend API Testing Script
 * Run with: node test-backend.js
 * 
 * This script tests all critical backend endpoints
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken = null;
let testUserId = null;
let testDebateId = null;

// Test utilities
const test = async (name, fn) => {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
};

const request = async (method, endpoint, data = null, token = null) => {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    const error = new Error(responseData.error || `HTTP ${response.status}`);
    error.response = { status: response.status, data: responseData };
    throw error;
  }

  return responseData;
};

// Test suite
const runTests = async () => {
  console.log('🚀 Starting Backend API Tests\n');
  console.log(`API URL: ${API_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // 1. Auth Tests
  console.log('📋 AUTHENTICATION TESTS');
  console.log('='.repeat(50));

  await test('Signup - Create test user', async () => {
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const email = `test${timestamp}@test.com`;
    const username = `test${timestamp}`; // Shorter username
    const password = 'Test123!@#';

    const data = await request('POST', '/auth/signup', {
      email,
      username,
      password,
    });

    if (!data.token || !data.user) {
      throw new Error('Signup failed - no token or user returned');
    }

    authToken = data.token;
    testUserId = data.user.id;
    console.log(`   Created user: ${username} (${testUserId})`);
  });

  await test('Login - Authenticate user', async () => {
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const email = `test${timestamp}@test.com`;
    const username = `test${timestamp}`; // Shorter username
    const password = 'Test123!@#';

    // Create user first
    await request('POST', '/auth/signup', { email, username, password });

    // Then login
    const data = await request('POST', '/auth/login', { email, password });

    if (!data.token || !data.user) {
      throw new Error('Login failed - no token or user returned');
    }

    authToken = data.token;
    testUserId = data.user.id;
  });

  await test('Get Me - Get current user', async () => {
    if (!authToken) throw new Error('No auth token');

    const data = await request('GET', '/auth/me', null, authToken);

    if (!data.id || !data.email) {
      throw new Error('Get me failed - invalid user data');
    }
  });

  // 2. Debate Tests
  console.log('\n📋 DEBATE TESTS');
  console.log('='.repeat(50));

  await test('Create Debate', async () => {
    if (!authToken) throw new Error('No auth token');

    const data = await request(
      'POST',
      '/debates',
      {
        topic: 'Test Debate Topic',
        description: 'This is a test debate',
        category: 'TECH',
        challengerPosition: 'FOR',
        totalRounds: 3,
      },
      authToken
    );

    if (!data.id || !data.topic) {
      throw new Error('Create debate failed - invalid debate data');
    }

    testDebateId = data.id;
    console.log(`   Created debate: ${testDebateId}`);
  });

  await test('Get Debate', async () => {
    if (!testDebateId) throw new Error('No test debate ID');

    const data = await request('GET', `/debates/${testDebateId}`);

    if (!data.id || data.id !== testDebateId) {
      throw new Error('Get debate failed - invalid debate data');
    }
  });

  await test('List Debates', async () => {
    const data = await request('GET', '/debates');

    if (!Array.isArray(data)) {
      throw new Error('List debates failed - not an array');
    }
  });

  await test('Get Statements', async () => {
    if (!testDebateId) throw new Error('No test debate ID');

    const data = await request('GET', `/debates/${testDebateId}/statements`);

    if (!Array.isArray(data)) {
      throw new Error('Get statements failed - not an array');
    }
  });

  // 3. Comments Tests
  console.log('\n📋 COMMENTS TESTS');
  console.log('='.repeat(50));

  await test('Create Comment', async () => {
    if (!authToken || !testDebateId) {
      throw new Error('Missing auth token or debate ID');
    }

    const data = await request(
      'POST',
      `/debates/${testDebateId}/comments`,
      {
        content: 'This is a test comment',
      },
      authToken
    );

    if (!data.id || !data.content) {
      throw new Error('Create comment failed - invalid comment data');
    }
  });

  await test('Get Comments', async () => {
    if (!testDebateId) throw new Error('No test debate ID');

    const data = await request('GET', `/debates/${testDebateId}/comments`);

    if (!Array.isArray(data)) {
      throw new Error('Get comments failed - not an array');
    }
  });

  // 4. Notifications Tests
  console.log('\n📋 NOTIFICATIONS TESTS');
  console.log('='.repeat(50));

  await test('Get Notifications', async () => {
    if (!authToken) throw new Error('No auth token');

    const data = await request('GET', '/notifications', null, authToken);

    if (!data.notifications || !Array.isArray(data.notifications)) {
      throw new Error('Get notifications failed - invalid data structure');
    }
  });

  // 5. User Tests
  console.log('\n📋 USER TESTS');
  console.log('='.repeat(50));

  await test('Get User Profile', async () => {
    if (!testUserId) throw new Error('No test user ID');

    const data = await request('GET', `/users/${testUserId}/profile`);

    if (!data.id || !data.username) {
      throw new Error('Get user profile failed - invalid user data');
    }
  });

  // Count results
  let passed = 0;
  let failed = 0;
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Note: Individual test results shown above`);
  console.log('\n✅ Backend testing complete!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  // Check if fetch is available (Node 18+)
  if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
    process.exit(1);
  }

  runTests().catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { test, request, runTests };


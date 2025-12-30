/**
 * Test script for core features
 * Tests: Debate editing, deletion, Comment editing/deletion, User blocking, User search
 */

const API_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function apiCall(method, endpoint, token = null, data = null) {
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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const responseData = await response.json();
    return { status: response.status, data: responseData };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testDebateEdit() {
  console.log('\n🧪 Testing: Debate Editing');
  console.log('==================================================\n');

  // 1. Signup/Login
  const signupResult = await apiCall('POST', '/auth/signup', null, {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@test.com`,
    password: 'testpass123',
  });

  if (signupResult.status !== 200 && signupResult.status !== 201) {
    console.log('⚠️  Signup failed, trying login...');
    const loginResult = await apiCall('POST', '/auth/login', null, {
      email: 'test@test.com',
      password: 'testpass123',
    });
    if (loginResult.status !== 200) {
      console.log('❌ FAIL: Could not authenticate');
      return false;
    }
    var token = loginResult.data.token;
    var userId = loginResult.data.user.id;
  } else {
    var token = signupResult.data.token;
    var userId = signupResult.data.user.id;
  }

  // 2. Create a debate
  const createResult = await apiCall('POST', '/debates', token, {
    topic: 'Test Debate for Editing',
    description: 'This is a test debate',
    category: 'TECH',
    challengerPosition: 'FOR',
    totalRounds: 5,
  });

  if (createResult.status !== 200 && createResult.status !== 201) {
    console.log('❌ FAIL: Could not create debate');
    console.log('   Error:', createResult.data);
    return false;
  }

  const debateId = createResult.data.id;
  console.log('✅ Created debate:', debateId);

  // 3. Edit the debate
  const editResult = await apiCall('PUT', `/debates/${debateId}`, token, {
    topic: 'Updated Test Debate',
    description: 'This is an updated test debate',
  });

  if (editResult.status !== 200) {
    console.log('❌ FAIL: Could not edit debate');
    console.log('   Error:', editResult.data);
    return false;
  }

  console.log('✅ Successfully edited debate');
  console.log('   New topic:', editResult.data.topic);

  // 4. Try to edit as different user (should fail)
  const signup2Result = await apiCall('POST', '/auth/signup', null, {
    username: `testuser2_${Date.now()}`,
    email: `test2_${Date.now()}@test.com`,
    password: 'testpass123',
  });
  const token2 = signup2Result.data?.token;

  if (token2) {
    const editFailResult = await apiCall('PUT', `/debates/${debateId}`, token2, {
      topic: 'Should not work',
    });

    if (editFailResult.status === 403 || editFailResult.status === 401) {
      console.log('✅ Correctly prevented unauthorized edit');
    } else {
      console.log('⚠️  WARN: Unauthorized edit was not prevented');
    }
  }

  return true;
}

async function testDebateDelete() {
  console.log('\n🧪 Testing: Debate Deletion');
  console.log('==================================================\n');

  // 1. Login
  const loginResult = await apiCall('POST', '/auth/login', null, {
    email: 'test@test.com',
    password: 'testpass123',
  });

  if (loginResult.status !== 200) {
    console.log('⚠️  Could not login, skipping test');
    return false;
  }

  const token = loginResult.data.token;

  // 2. Create a debate
  const createResult = await apiCall('POST', '/debates', token, {
    topic: 'Test Debate for Deletion',
    description: 'This debate will be deleted',
    category: 'TECH',
    challengerPosition: 'FOR',
  });

  if (createResult.status !== 200 && createResult.status !== 201) {
    console.log('❌ FAIL: Could not create debate');
    return false;
  }

  const debateId = createResult.data.id;
  console.log('✅ Created debate:', debateId);

  // 3. Delete the debate
  const deleteResult = await apiCall('DELETE', `/debates/${debateId}`, token);

  if (deleteResult.status !== 200) {
    console.log('❌ FAIL: Could not delete debate');
    console.log('   Error:', deleteResult.data);
    return false;
  }

  console.log('✅ Successfully deleted debate');

  // 4. Verify it's deleted
  const getResult = await apiCall('GET', `/debates/${debateId}`, token);
  if (getResult.status === 404) {
    console.log('✅ Debate correctly deleted (404 on fetch)');
  }

  return true;
}

async function testCommentEdit() {
  console.log('\n🧪 Testing: Comment Editing');
  console.log('==================================================\n');

  // 1. Login
  const loginResult = await apiCall('POST', '/auth/login', null, {
    email: 'test@test.com',
    password: 'testpass123',
  });

  if (loginResult.status !== 200) {
    console.log('⚠️  Could not login, skipping test');
    return false;
  }

  const token = loginResult.data.token;

  // 2. Create a debate
  const createResult = await apiCall('POST', '/debates', token, {
    topic: 'Test Debate for Comments',
    category: 'TECH',
    challengerPosition: 'FOR',
  });

  if (createResult.status !== 200 && createResult.status !== 201) {
    console.log('❌ FAIL: Could not create debate');
    return false;
  }

  const debateId = createResult.data.id;

  // 3. Create a comment
  const commentResult = await apiCall('POST', `/debates/${debateId}/comments`, token, {
    content: 'Original comment text',
  });

  if (commentResult.status !== 200 && commentResult.status !== 201) {
    console.log('❌ FAIL: Could not create comment');
    return false;
  }

  const commentId = commentResult.data.id;
  console.log('✅ Created comment:', commentId);

  // 4. Edit the comment
  const editResult = await apiCall('PUT', `/debates/${debateId}/comments/${commentId}`, token, {
    content: 'Updated comment text',
  });

  if (editResult.status !== 200) {
    console.log('❌ FAIL: Could not edit comment');
    console.log('   Error:', editResult.data);
    return false;
  }

  console.log('✅ Successfully edited comment');
  console.log('   New content:', editResult.data.content);

  return true;
}

async function testCommentDelete() {
  console.log('\n🧪 Testing: Comment Deletion');
  console.log('==================================================\n');

  // 1. Login
  const loginResult = await apiCall('POST', '/auth/login', null, {
    email: 'test@test.com',
    password: 'testpass123',
  });

  if (loginResult.status !== 200) {
    console.log('⚠️  Could not login, skipping test');
    return false;
  }

  const token = loginResult.data.token;

  // 2. Create a debate
  const createResult = await apiCall('POST', '/debates', token, {
    topic: 'Test Debate for Comment Deletion',
    category: 'TECH',
    challengerPosition: 'FOR',
  });

  if (createResult.status !== 200 && createResult.status !== 201) {
    console.log('❌ FAIL: Could not create debate');
    return false;
  }

  const debateId = createResult.data.id;

  // 3. Create a comment
  const commentResult = await apiCall('POST', `/debates/${debateId}/comments`, token, {
    content: 'Comment to be deleted',
  });

  if (commentResult.status !== 200 && commentResult.status !== 201) {
    console.log('❌ FAIL: Could not create comment');
    return false;
  }

  const commentId = commentResult.data.id;
  console.log('✅ Created comment:', commentId);

  // 4. Delete the comment
  const deleteResult = await apiCall('DELETE', `/debates/${debateId}/comments/${commentId}`, token);

  if (deleteResult.status !== 200) {
    console.log('❌ FAIL: Could not delete comment');
    console.log('   Error:', deleteResult.data);
    return false;
  }

  console.log('✅ Successfully deleted comment');

  return true;
}

async function testUserBlock() {
  console.log('\n🧪 Testing: User Blocking');
  console.log('==================================================\n');

  // 1. Create two users
  const user1Result = await apiCall('POST', '/auth/signup', null, {
    username: `blocker_${Date.now()}`,
    email: `blocker_${Date.now()}@test.com`,
    password: 'testpass123',
  });

  const user2Result = await apiCall('POST', '/auth/signup', null, {
    username: `blocked_${Date.now()}`,
    email: `blocked_${Date.now()}@test.com`,
    password: 'testpass123',
  });

  if (user1Result.status !== 200 && user1Result.status !== 201 ||
      user2Result.status !== 200 && user2Result.status !== 201) {
    console.log('⚠️  Could not create test users, skipping test');
    return false;
  }

  const token1 = user1Result.data.token;
  const userId2 = user2Result.data.user.id;

  console.log('✅ Created two test users');

  // 2. Block user 2
  const blockResult = await apiCall('POST', `/users/${userId2}/block`, token1);

  if (blockResult.status !== 200 && blockResult.status !== 201) {
    console.log('❌ FAIL: Could not block user');
    console.log('   Error:', blockResult.data);
    return false;
  }

  console.log('✅ Successfully blocked user');

  // 3. Check block status
  const statusResult = await apiCall('GET', `/users/${userId2}/block`, token1);

  if (statusResult.status === 200 && statusResult.data.isBlocked) {
    console.log('✅ Block status correctly reported');
  } else {
    console.log('⚠️  WARN: Block status may not be correct');
  }

  // 4. Unblock user
  const unblockResult = await apiCall('DELETE', `/users/${userId2}/block`, token1);

  if (unblockResult.status === 200) {
    console.log('✅ Successfully unblocked user');
  } else {
    console.log('⚠️  WARN: Unblock may have failed');
  }

  return true;
}

async function testUserSearch() {
  console.log('\n🧪 Testing: User Search');
  console.log('==================================================\n');

  // 1. Search for users
  const searchResult = await apiCall('GET', '/users/search?q=test&limit=10');

  if (searchResult.status !== 200) {
    console.log('❌ FAIL: User search failed');
    console.log('   Error:', searchResult.data);
    return false;
  }

  console.log('✅ User search successful');
  console.log('   Found', searchResult.data.length, 'users');

  return true;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Core Features Tests');
  console.log('==================================================');
  console.log('API URL:', API_URL);
  console.log('==================================================\n');

  const results = {
    debateEdit: await testDebateEdit(),
    debateDelete: await testDebateDelete(),
    commentEdit: await testCommentEdit(),
    commentDelete: await testCommentDelete(),
    userBlock: await testUserBlock(),
    userSearch: await testUserSearch(),
  };

  console.log('\n📊 Test Results Summary');
  console.log('==================================================');
  console.log('Debate Edit:', results.debateEdit ? '✅ PASS' : '❌ FAIL');
  console.log('Debate Delete:', results.debateDelete ? '✅ PASS' : '❌ FAIL');
  console.log('Comment Edit:', results.commentEdit ? '✅ PASS' : '❌ FAIL');
  console.log('Comment Delete:', results.commentDelete ? '✅ PASS' : '❌ FAIL');
  console.log('User Block:', results.userBlock ? '✅ PASS' : '❌ FAIL');
  console.log('User Search:', results.userSearch ? '✅ PASS' : '❌ FAIL');
  console.log('==================================================\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`✅ Passed: ${passed}/${total}`);
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };











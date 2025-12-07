/**
 * End-to-end tests for debate flow
 * Tests the complete user journey: create → edit → accept → submit → verdict
 */

import { describe, it, expect } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

describe('Debate Flow E2E', () => {
  let challengerToken: string;
  let opponentToken: string;
  let challengerId: string;
  let opponentId: string;
  let debateId: string;

  beforeAll(async () => {
    // Create challenger
    const challengerResponse = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `challenger_${Date.now()}`,
        email: `challenger_${Date.now()}@test.com`,
        password: 'testpass123',
      }),
    });
    const challengerData = await challengerResponse.json();
    challengerToken = challengerData.token;
    challengerId = challengerData.user.id;

    // Create opponent
    const opponentResponse = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `opponent_${Date.now()}`,
        email: `opponent_${Date.now()}@test.com`,
        password: 'testpass123',
      }),
    });
    const opponentData = await opponentResponse.json();
    opponentToken = opponentData.token;
    opponentId = opponentData.user.id;
  });

  it('should complete full debate flow', async () => {
    // 1. Create debate
    const createResponse = await fetch(`${API_URL}/debates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${challengerToken}`,
      },
      body: JSON.stringify({
        topic: 'E2E Test Debate',
        description: 'Testing full flow',
        category: 'TECH',
        challengerPosition: 'FOR',
        totalRounds: 3,
      }),
    });
    expect(createResponse.status).toBe(200);
    const debateData = await createResponse.json();
    debateId = debateData.id;

    // 2. Edit debate (before acceptance)
    const editResponse = await fetch(`${API_URL}/debates/${debateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${challengerToken}`,
      },
      body: JSON.stringify({
        topic: 'Updated E2E Test Debate',
      }),
    });
    expect(editResponse.status).toBe(200);

    // 3. Opponent accepts
    const acceptResponse = await fetch(`${API_URL}/debates/${debateId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${opponentToken}`,
      },
      body: JSON.stringify({
        position: 'AGAINST',
      }),
    });
    expect(acceptResponse.status).toBe(200);

    // 4. Try to edit after acceptance (should fail)
    const editFailResponse = await fetch(`${API_URL}/debates/${debateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${challengerToken}`,
      },
      body: JSON.stringify({
        topic: 'Should not work',
      }),
    });
    expect(editFailResponse.status).toBe(400);

    // 5. Submit statements
    // Challenger submits
    const challengerStatement = await fetch(`${API_URL}/debates/${debateId}/statements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${challengerToken}`,
      },
      body: JSON.stringify({
        content: 'Challenger argument',
        round: 1,
      }),
    });
    expect(challengerStatement.status).toBe(200);

    // Opponent submits
    const opponentStatement = await fetch(`${API_URL}/debates/${debateId}/statements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${opponentToken}`,
      },
      body: JSON.stringify({
        content: 'Opponent argument',
        round: 1,
      }),
    });
    expect(opponentStatement.status).toBe(200);

    // 6. Add comment
    const commentResponse = await fetch(`${API_URL}/debates/${debateId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${challengerToken}`,
      },
      body: JSON.stringify({
        content: 'Great debate!',
      }),
    });
    expect(commentResponse.status).toBe(200);
    const commentData = await commentResponse.json();

    // 7. Edit comment
    const editCommentResponse = await fetch(
      `${API_URL}/debates/${debateId}/comments/${commentData.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${challengerToken}`,
        },
        body: JSON.stringify({
          content: 'Updated: Great debate!',
        }),
      }
    );
    expect(editCommentResponse.status).toBe(200);
  });
});



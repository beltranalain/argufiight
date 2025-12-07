/**
 * Integration tests for core features
 * Tests the full flow of debate editing, deletion, comment management, and user blocking
 */

import { describe, it, expect } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

describe('Core Features Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let debateId: string;
  let commentId: string;

  describe('Authentication', () => {
    it('should create a test user and get auth token', async () => {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `test_${Date.now()}`,
          email: `test_${Date.now()}@test.com`,
          password: 'testpass123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      authToken = data.token;
      userId = data.user.id;
    });
  });

  describe('Debate Management', () => {
    it('should create a debate', async () => {
      const response = await fetch(`${API_URL}/debates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: 'Test Debate for Editing',
          description: 'Test Description',
          category: 'TECH',
          challengerPosition: 'FOR',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      debateId = data.id;
    });

    it('should edit the debate', async () => {
      const response = await fetch(`${API_URL}/debates/${debateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: 'Updated Test Debate',
          description: 'Updated Description',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.topic).toBe('Updated Test Debate');
    });

    it('should delete the debate', async () => {
      const response = await fetch(`${API_URL}/debates/${debateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Comment Management', () => {
    it('should create a debate and comment', async () => {
      // Create debate
      const debateResponse = await fetch(`${API_URL}/debates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: 'Test Debate for Comments',
          category: 'TECH',
          challengerPosition: 'FOR',
        }),
      });

      const debateData = await debateResponse.json();
      debateId = debateData.id;

      // Create comment
      const commentResponse = await fetch(`${API_URL}/debates/${debateId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: 'Test comment',
        }),
      });

      expect(commentResponse.status).toBe(200);
      const commentData = await commentResponse.json();
      commentId = commentData.id;
    });

    it('should edit the comment', async () => {
      const response = await fetch(`${API_URL}/debates/${debateId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: 'Updated comment',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.content).toBe('Updated comment');
    });

    it('should delete the comment', async () => {
      const response = await fetch(`${API_URL}/debates/${debateId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('User Blocking', () => {
    it('should block a user', async () => {
      // Create second user
      const user2Response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `blocked_${Date.now()}`,
          email: `blocked_${Date.now()}@test.com`,
          password: 'testpass123',
        }),
      });

      const user2Data = await user2Response.json();
      const blockedUserId = user2Data.user.id;

      // Block user
      const blockResponse = await fetch(`${API_URL}/users/${blockedUserId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(blockResponse.status).toBe(200);
    });
  });
});




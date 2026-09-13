import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';

let serverInstance;
let BASE_URL = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

// Helper to make API requests with cookie capture
const apiRequest = async (path, options = {}, cookie = '') => {
  const headers = {
    'Content-Type': 'application/json',
    'Origin': ORIGIN,
    ...(cookie ? { 'Cookie': cookie } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const setCookie = response.headers.get('set-cookie');
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, headers: response.headers, cookie: setCookie };
};

describe('TaskBuddy Backend API Test Suite', () => {
  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        BASE_URL = `http://localhost:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
  });
  const testUser1 = {
    name: 'Alice Tester',
    email: `alice_${Date.now()}@taskbuddy.local`,
    password: 'password123',
  };

  const testUser2 = {
    name: 'Bob Tester',
    email: `bob_${Date.now()}@taskbuddy.local`,
    password: 'password123',
  };

  let user1Cookie = '';
  let user2Cookie = '';
  let user1TaskId = '';
  let user2TaskId = '';

  // 1. Health Check
  test('GET /api/health should return ok', async () => {
    const res = await apiRequest('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // 2. Registration Validation & Success
  test('POST /api/auth/register with invalid data returns 400', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: 'invalid', password: '123' }),
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/auth/register creates user and issues JWT cookie', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser1),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.user);
    assert.strictEqual(res.data.user.email, testUser1.email);
    assert.ok(res.cookie, 'Expected Set-Cookie header on register');
    assert.match(res.cookie, /token=/);
    user1Cookie = res.cookie.split(';')[0];
  });

  // 3. Login
  test('POST /api/auth/login with wrong password returns 401', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser1.email, password: 'wrongpassword' }),
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  test('POST /api/auth/login with valid credentials returns 200 and cookie', async () => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser1.email, password: testUser1.password }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.cookie);
    user1Cookie = res.cookie.split(';')[0];
  });

  // 4. Current User Profile
  test('GET /api/auth/me without cookie returns 401 Unauthorized', async () => {
    const res = await apiRequest('/auth/me');
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/auth/me with valid cookie returns 200 and user profile', async () => {
    const res = await apiRequest('/auth/me', {}, user1Cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.user.id);
  });

  // 5. Create Task
  test('POST /api/tasks creates task for authenticated user', async () => {
    const res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Alice Task 1',
          priority: 'High',
          category: 'Work',
        }),
      },
      user1Cookie
    );
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.task.title, 'Alice Task 1');
    assert.strictEqual(res.data.task.priority, 'High');
    assert.strictEqual(res.data.task.category, 'Work');
    assert.strictEqual(res.data.task.completed, false);
    user1TaskId = res.data.task._id || res.data.task.id;
    assert.ok(user1TaskId);
  });

  // 6. Fetch Tasks
  test('GET /api/tasks returns only authenticated user tasks', async () => {
    const res = await apiRequest('/tasks', {}, user1Cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.tasks));
    assert.ok(res.data.tasks.some((t) => (t._id || t.id) === user1TaskId));
  });

  // 7. Update Task
  test('PUT /api/tasks/:id updates task details', async () => {
    const res = await apiRequest(
      `/tasks/${user1TaskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Alice Task 1 Updated',
          priority: 'Medium',
          category: 'Personal',
        }),
      },
      user1Cookie
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.task.title, 'Alice Task 1 Updated');
    assert.strictEqual(res.data.task.priority, 'Medium');
    assert.strictEqual(res.data.task.category, 'Personal');
  });

  // 8. Complete Task
  test('PATCH /api/tasks/:id/complete marks task as completed', async () => {
    const res = await apiRequest(`/tasks/${user1TaskId}/complete`, { method: 'PATCH' }, user1Cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.task.completed, true);
  });

  // 9. Undo Task
  test('PATCH /api/tasks/:id/undo marks task as incomplete', async () => {
    const res = await apiRequest(`/tasks/${user1TaskId}/undo`, { method: 'PATCH' }, user1Cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.task.completed, false);
  });

  // 10. User Isolation / Authorization
  test('User Isolation: User B cannot modify or delete User A task', async () => {
    // Register User 2 (Bob)
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser2),
    });
    assert.strictEqual(regRes.status, 201);
    user2Cookie = regRes.cookie.split(';')[0];

    // User 2 creates their own task
    const t2Res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'Bob Task 1', priority: 'Low', category: 'General' }),
      },
      user2Cookie
    );
    assert.strictEqual(t2Res.status, 201);
    user2TaskId = t2Res.data.task._id || t2Res.data.task.id;

    // User 2 tries to update User 1's task -> should be rejected with 403 or 404
    const forbiddenUpdate = await apiRequest(
      `/tasks/${user1TaskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ title: 'Hacked by Bob' }),
      },
      user2Cookie
    );
    assert.ok(forbiddenUpdate.status === 403 || forbiddenUpdate.status === 404);

    // User 2 tries to delete User 1's task -> should be rejected with 403 or 404
    const forbiddenDelete = await apiRequest(
      `/tasks/${user1TaskId}`,
      { method: 'DELETE' },
      user2Cookie
    );
    assert.ok(forbiddenDelete.status === 403 || forbiddenDelete.status === 404);

    // User 2 fetches tasks -> must only see Bob's task, NEVER Alice's task
    const bobTasksRes = await apiRequest('/tasks', {}, user2Cookie);
    assert.strictEqual(bobTasksRes.status, 200);
    const bobTaskIds = bobTasksRes.data.tasks.map((t) => t._id || t.id);
    assert.ok(bobTaskIds.includes(user2TaskId));
    assert.ok(!bobTaskIds.includes(user1TaskId), 'User 2 must NOT see User 1 task');
  });

  // 11. Delete Single Task
  test('DELETE /api/tasks/:id deletes single task for owner', async () => {
    const res = await apiRequest(`/tasks/${user1TaskId}`, { method: 'DELETE' }, user1Cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    // Confirm task no longer exists
    const listRes = await apiRequest('/tasks', {}, user1Cookie);
    const remainingIds = listRes.data.tasks.map((t) => t._id || t.id);
    assert.ok(!remainingIds.includes(user1TaskId));
  });

  // 12. Clear All Tasks (Scoped to User)
  test('DELETE /api/tasks clears all tasks only for the logged-in user', async () => {
    // User 1 creates 2 new tasks
    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({ title: 'Alice Task A' }) }, user1Cookie);
    await apiRequest('/tasks', { method: 'POST', body: JSON.stringify({ title: 'Alice Task B' }) }, user1Cookie);

    // User 1 calls clear all
    const clearRes = await apiRequest('/tasks', { method: 'DELETE' }, user1Cookie);
    assert.strictEqual(clearRes.status, 200);
    assert.strictEqual(clearRes.data.success, true);

    // Confirm User 1 has 0 tasks
    const aliceTasks = await apiRequest('/tasks', {}, user1Cookie);
    assert.strictEqual(aliceTasks.data.tasks.length, 0);

    // Confirm User 2 STILL has their task intact (isolation preserved)
    const bobTasks = await apiRequest('/tasks', {}, user2Cookie);
    assert.ok(bobTasks.data.tasks.length >= 1, 'Bob tasks must remain untouched');
  });

  // 13. Logout
  test('POST /api/auth/logout clears auth cookie and logs out', async () => {
    const res = await apiRequest('/auth/logout', { method: 'POST' }, user1Cookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.cookie, 'Expected Set-Cookie header on logout');
  });
});

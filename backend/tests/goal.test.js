import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { CompletionHistory } from '../models/CompletionHistory.js';

let serverInstance;
let BASE_URL = 'http://localhost:5000/api';
const ORIGIN = 'http://localhost:5173';

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

describe('Today\'s Goal & Daily Goal API Test Suite', () => {
  let userCookie = '';
  let userId = '';

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        BASE_URL = `http://localhost:${port}/api`;
        resolve();
      });
    });

    const timestamp = Date.now();
    const testUser = {
      name: 'Goal Tester',
      email: `goal_${timestamp}@example.com`,
      password: 'GoalPassword123!',
    };

    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    assert.strictEqual(regRes.status, 201);
    userId = regRes.data.user.id;
    userCookie = regRes.cookie ? regRes.cookie.split(';')[0] : '';
  });

  after(async () => {
    if (userId) {
      await CompletionHistory.deleteMany({ userId });
      await Task.deleteMany({ userId });
      await User.findByIdAndDelete(userId);
    }
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('GET /api/goals requires authentication', async () => {
    const res = await apiRequest('/goals');
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/goals returns default dailyGoal (5) and tasksCompletedToday (0)', async () => {
    const res = await apiRequest('/goals', { method: 'GET' }, userCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.dailyGoal, 5);
    assert.strictEqual(res.data.tasksCompletedToday, 0);
  });

  test('PUT /api/goals validates dailyGoal input', async () => {
    // Zero or negative
    const resZero = await apiRequest('/goals', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoal: 0 }),
    }, userCookie);
    assert.strictEqual(resZero.status, 400);

    const resNeg = await apiRequest('/goals', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoal: -3 }),
    }, userCookie);
    assert.strictEqual(resNeg.status, 400);

    // Non-integer
    const resFloat = await apiRequest('/goals', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoal: 3.5 }),
    }, userCookie);
    assert.strictEqual(resFloat.status, 400);
  });

  test('PUT /api/goals updates dailyGoal to a valid number', async () => {
    const res = await apiRequest('/goals', {
      method: 'PUT',
      body: JSON.stringify({ dailyGoal: 3 }),
    }, userCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.dailyGoal, 3);

    // Verify GET reflects the new dailyGoal
    const getRes = await apiRequest('/goals', { method: 'GET' }, userCookie);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.data.dailyGoal, 3);
  });

  test('tasksCompletedToday updates when completing and undoing tasks', async () => {
    // 1. Create 2 tasks
    const t1 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Goal Task 1', priority: 'Medium' }),
    }, userCookie);
    const t2 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Goal Task 2', priority: 'High' }),
    }, userCookie);

    // 2. Complete Task 1
    await apiRequest(`/tasks/${t1.data.task.id}/complete`, { method: 'PATCH' }, userCookie);
    const goalAfterOne = await apiRequest('/goals', { method: 'GET' }, userCookie);
    assert.strictEqual(goalAfterOne.data.tasksCompletedToday, 1);

    // 3. Complete Task 2
    await apiRequest(`/tasks/${t2.data.task.id}/complete`, { method: 'PATCH' }, userCookie);
    const goalAfterTwo = await apiRequest('/goals', { method: 'GET' }, userCookie);
    assert.strictEqual(goalAfterTwo.data.tasksCompletedToday, 2);

    // 4. Undo Task 1
    await apiRequest(`/tasks/${t1.data.task.id}/undo`, { method: 'PATCH' }, userCookie);
    const goalAfterUndo = await apiRequest('/goals', { method: 'GET' }, userCookie);
    assert.strictEqual(goalAfterUndo.data.tasksCompletedToday, 1);

    // 5. Undo Task 2
    await apiRequest(`/tasks/${t2.data.task.id}/undo`, { method: 'PATCH' }, userCookie);
    const goalAfterUndoAll = await apiRequest('/goals', { method: 'GET' }, userCookie);
    assert.strictEqual(goalAfterUndoAll.data.tasksCompletedToday, 0);
  });
});

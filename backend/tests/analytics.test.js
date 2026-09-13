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
import { FocusSession } from '../models/FocusSession.js';

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

describe('Analytics API Test Suite', () => {
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
      name: 'Analytics Tester',
      email: `analytics_${timestamp}@example.com`,
      password: 'AnalyticsPassword123!',
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
      await FocusSession.deleteMany({ userId });
      await CompletionHistory.deleteMany({ userId });
      await Task.deleteMany({ userId });
      await User.findByIdAndDelete(userId);
    }
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('GET /api/analytics requires authentication', async () => {
    const res = await apiRequest('/analytics');
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/analytics returns zeroed baseline metrics for fresh user', async () => {
    const res = await apiRequest('/analytics', { method: 'GET' }, userCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.totalTasks, 0);
    assert.strictEqual(res.data.completedTasks, 0);
    assert.strictEqual(res.data.pendingTasks, 0);
    assert.strictEqual(res.data.completionRate, 0);
    assert.strictEqual(res.data.currentStreak, 0);
    assert.strictEqual(res.data.bestStreak, 0);
    assert.strictEqual(res.data.totalFocusSessions, 0);
    assert.strictEqual(res.data.mostUsedCategory, 'None');
    assert.strictEqual(res.data.mostCommonPriority, 'None');
    assert.strictEqual(res.data.tasksCompletedToday, 0);
    assert.strictEqual(res.data.tasksCompletedThisWeek, 0);
    assert.strictEqual(Array.isArray(res.data.weeklyBreakdown), true);
    assert.strictEqual(res.data.weeklyBreakdown.length, 7);
  });

  test('GET /api/analytics calculates metrics, habits, and weekly breakdown correctly', async () => {
    // 1. Create 3 tasks with categories and priorities
    const t1 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Work task 1', priority: 'High', category: 'Work' }),
    }, userCookie);
    const t2 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Work task 2', priority: 'High', category: 'Work' }),
    }, userCookie);
    const t3 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Personal task 1', priority: 'Low', category: 'Personal' }),
    }, userCookie);

    // 2. Complete Task 1
    await apiRequest(`/tasks/${t1.data.task.id}/complete`, { method: 'PATCH' }, userCookie);

    // 3. Record a focus session
    await apiRequest('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify({ taskId: t1.data.task.id, duration: 25 }),
    }, userCookie);

    // 4. Fetch analytics
    const res = await apiRequest('/analytics', { method: 'GET' }, userCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.totalTasks, 3);
    assert.strictEqual(res.data.completedTasks, 1);
    assert.strictEqual(res.data.pendingTasks, 2);
    // 1 / 3 = 33%
    assert.strictEqual(res.data.completionRate, 33);
    assert.strictEqual(res.data.mostUsedCategory, 'Work');
    assert.strictEqual(res.data.mostCommonPriority, 'High');
    assert.strictEqual(res.data.totalFocusSessions, 1);
    assert.strictEqual(res.data.currentStreak, 1);
    assert.strictEqual(res.data.tasksCompletedToday, 1);
    assert.strictEqual(res.data.tasksCompletedThisWeek >= 1, true);

    // Check weeklyBreakdown structure (Mon - Sun)
    assert.strictEqual(res.data.weeklyBreakdown.length, 7);
    const days = res.data.weeklyBreakdown.map((d) => d.day);
    assert.deepStrictEqual(days, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});

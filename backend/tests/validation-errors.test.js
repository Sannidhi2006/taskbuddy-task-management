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
import { FocusSession } from '../models/FocusSession.js';
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

describe('Validation & Error-Handling Test Suite', () => {
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
      name: 'Validation Tester',
      email: `valtester_${timestamp}@example.com`,
      password: 'Password123!',
    };

    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });

    userCookie = res.cookie ? res.cookie.split(';')[0] : '';
    userId = res.data.user.id;
  });

  after(async () => {
    if (userId) {
      await Task.deleteMany({ userId });
      await FocusSession.deleteMany({ userId });
      await CompletionHistory.deleteMany({ userId });
      await User.findByIdAndDelete(userId);
    }
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('POST /api/tasks rejects invalid dueDate format with 400', async () => {
    const res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task with bad date',
          dueDate: 'not-a-valid-date-string-12345',
        }),
      },
      userCookie
    );

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /Invalid dueDate format/i);
  });

  test('POST /api/tasks rejects invalid priority with 400', async () => {
    const res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task with bad priority',
          priority: 'SuperUrgent',
        }),
      },
      userCookie
    );

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /Invalid priority/i);
  });

  test('POST /api/tasks rejects invalid category with 400', async () => {
    const res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task with bad category',
          category: 'FitnessExtreme',
        }),
      },
      userCookie
    );

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /Invalid category/i);
  });

  test('POST /api/tasks accepts case-insensitive priority and category', async () => {
    const res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task with lowercase attributes',
          priority: 'high',
          category: 'work',
        }),
      },
      userCookie
    );

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.task.priority, 'High');
    assert.equal(res.data.task.category, 'Work');
  });

  test('PUT /api/tasks/:id rejects invalid dueDate with 400', async () => {
    // Create a valid task first
    const createRes = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'Task to update date' }),
      },
      userCookie
    );
    const taskId = createRes.data.task._id;

    const updateRes = await apiRequest(
      `/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ dueDate: 'completely-invalid-date' }),
      },
      userCookie
    );

    assert.equal(updateRes.status, 400);
    assert.equal(updateRes.data.success, false);
    assert.match(updateRes.data.message, /Invalid dueDate format/i);
  });

  test('PUT /api/tasks/:id rejects invalid priority/category with 400', async () => {
    const createRes = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'Task to update prio' }),
      },
      userCookie
    );
    const taskId = createRes.data.task._id;

    const badPrioRes = await apiRequest(
      `/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ priority: 'MegaCritical' }),
      },
      userCookie
    );
    assert.equal(badPrioRes.status, 400);
    assert.match(badPrioRes.data.message, /Invalid priority/i);

    const badCatRes = await apiRequest(
      `/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ category: 'SecretCategory' }),
      },
      userCookie
    );
    assert.equal(badCatRes.status, 400);
    assert.match(badCatRes.data.message, /Invalid category/i);
  });

  test('POST /api/focus-sessions rejects invalid taskId format with 400', async () => {
    const res = await apiRequest(
      '/focus-sessions',
      {
        method: 'POST',
        body: JSON.stringify({
          taskId: 'invalid-non-object-id',
          duration: 25,
        }),
      },
      userCookie
    );

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.message, /Invalid taskId format/i);
  });

  test('Endpoints called with no tasks return zeros and do not crash', async () => {
    // Clear all tasks for this user
    await Task.deleteMany({ userId });
    await CompletionHistory.deleteMany({ userId });
    await FocusSession.deleteMany({ userId });

    // 1. GET /api/tasks/stats
    const statsRes = await apiRequest('/tasks/stats', { method: 'GET' }, userCookie);
    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.data.total, 0);
    assert.equal(statsRes.data.completed, 0);
    assert.equal(statsRes.data.pending, 0);

    // 2. GET /api/streak
    const streakRes = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.equal(streakRes.status, 200);
    assert.equal(streakRes.data.currentStreak, 0);
    assert.equal(streakRes.data.bestStreak, 0);

    // 3. GET /api/analytics
    const analyticsRes = await apiRequest('/analytics', { method: 'GET' }, userCookie);
    assert.equal(analyticsRes.status, 200);
    assert.equal(analyticsRes.data.totalTasks, 0);
    assert.equal(analyticsRes.data.completedTasks, 0);
    assert.equal(analyticsRes.data.pendingTasks, 0);
    assert.equal(analyticsRes.data.completionRate, 0);
    assert.equal(analyticsRes.data.currentStreak, 0);
    assert.equal(analyticsRes.data.bestStreak, 0);
    assert.equal(analyticsRes.data.mostUsedCategory, 'None');
    assert.equal(analyticsRes.data.mostCommonPriority, 'None');
    assert.equal(analyticsRes.data.tasksCompletedToday, 0);
    assert.equal(analyticsRes.data.tasksCompletedThisWeek, 0);
    assert.equal(analyticsRes.data.weeklyBreakdown.length, 7);
  });
});

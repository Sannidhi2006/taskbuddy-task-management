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

describe('Focus Mode & FocusSession API Test Suite', () => {
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
      name: 'Focus Tester',
      email: `focus_${timestamp}@example.com`,
      password: 'FocusPassword123!',
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
      await Task.deleteMany({ userId });
      await User.findByIdAndDelete(userId);
    }
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
  });

  test('POST /api/focus-sessions requires authentication', async () => {
    const res = await apiRequest('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify({ duration: 25 }),
    });
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/focus-sessions/today returns 0 sessions for new user', async () => {
    const res = await apiRequest('/focus-sessions/today', { method: 'GET' }, userCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.count, 0);
  });

  test('POST /api/focus-sessions saves a session linked to user and task', async () => {
    // 1. Create a task to focus on
    const taskRes = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Focus on writing report', priority: 'High', category: 'Work' }),
    }, userCookie);
    assert.strictEqual(taskRes.status, 201);
    const taskId = taskRes.data.task.id;

    // 2. Save a 25-minute focus session
    const sessionRes = await apiRequest('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        duration: 25,
      }),
    }, userCookie);

    assert.strictEqual(sessionRes.status, 201);
    assert.strictEqual(sessionRes.data.success, true);
    assert.strictEqual(sessionRes.data.session.duration, 25);
    assert.strictEqual(String(sessionRes.data.session.taskId), taskId);

    // 3. Verify GET /api/focus-sessions/today returns count = 1
    const todayRes = await apiRequest('/focus-sessions/today', { method: 'GET' }, userCookie);
    assert.strictEqual(todayRes.status, 200);
    assert.strictEqual(todayRes.data.count, 1);
    assert.strictEqual(todayRes.data.sessions.length, 1);
  });

  test('Multiple focus sessions today are counted accurately', async () => {
    // Record another 25-minute session
    const res2 = await apiRequest('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify({
        duration: 25,
      }),
    }, userCookie);
    assert.strictEqual(res2.status, 201);

    const todayRes = await apiRequest('/focus-sessions/today', { method: 'GET' }, userCookie);
    assert.strictEqual(todayRes.status, 200);
    assert.strictEqual(todayRes.data.count, 2);
  });
});

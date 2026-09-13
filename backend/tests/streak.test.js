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

describe('Streak Calculation & CompletionHistory Test Suite', () => {
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
      name: 'Streak Tester',
      email: `streak_${timestamp}@example.com`,
      password: 'StreakPassword123!',
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

  test('GET /api/streak requires authentication', async () => {
    const res = await apiRequest('/streak');
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/streak returns 0 streak for a new user with no completed tasks', async () => {
    const res = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.currentStreak, 0);
    assert.strictEqual(res.data.bestStreak, 0);
  });

  test('Completing a task today increases streak to at least 1', async () => {
    // 1. Create a task
    const createRes = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Streak task 1', priority: 'High', category: 'Work' }),
    }, userCookie);
    assert.strictEqual(createRes.status, 201);
    const taskId1 = createRes.data.task.id;

    // 2. Complete the task today
    const completeRes = await apiRequest(`/tasks/${taskId1}/complete`, {
      method: 'PATCH',
    }, userCookie);
    assert.strictEqual(completeRes.status, 200);

    // Verify CompletionHistory record exists
    const historyCount = await CompletionHistory.countDocuments({ userId, taskId: taskId1 });
    assert.strictEqual(historyCount, 1);

    // 3. Check streak
    const streakRes = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakRes.status, 200);
    assert.strictEqual(streakRes.data.currentStreak >= 1, true, 'Streak should be at least 1');
    assert.strictEqual(streakRes.data.bestStreak >= 1, true, 'Best streak should be at least 1');
  });

  test('Undoing the task today removes that day from streak (drops back to 0)', async () => {
    // Retrieve the user's task
    const tasksRes = await apiRequest('/tasks', { method: 'GET' }, userCookie);
    const completedTask = tasksRes.data.tasks.find((t) => t.completed);
    assert.ok(completedTask, 'Should have a completed task');

    // Undo the task
    const undoRes = await apiRequest(`/tasks/${completedTask._id}/undo`, {
      method: 'PATCH',
    }, userCookie);
    assert.strictEqual(undoRes.status, 200);

    // Verify CompletionHistory record is removed
    const historyCount = await CompletionHistory.countDocuments({ userId, taskId: completedTask._id });
    assert.strictEqual(historyCount, 0, 'CompletionHistory record must be deleted on undo');

    // Check streak dropped back to 0
    const streakRes = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakRes.status, 200);
    assert.strictEqual(streakRes.data.currentStreak, 0, 'Streak must drop back to 0 when only completion today is undone');
  });

  test('Multiple tasks completed on the same day count as ONE day streak', async () => {
    // Create two tasks
    const t1 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task A today', priority: 'Medium' }),
    }, userCookie);
    const t2 = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task B today', priority: 'Low' }),
    }, userCookie);

    // Complete both today
    await apiRequest(`/tasks/${t1.data.task.id}/complete`, { method: 'PATCH' }, userCookie);
    await apiRequest(`/tasks/${t2.data.task.id}/complete`, { method: 'PATCH' }, userCookie);

    const streakRes = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakRes.status, 200);
    // Completing 2 tasks on the same calendar day still results in currentStreak = 1
    assert.strictEqual(streakRes.data.currentStreak, 1);
    assert.strictEqual(streakRes.data.bestStreak, 1);

    // Undo only task A: task B is still completed today, so streak remains 1
    await apiRequest(`/tasks/${t1.data.task.id}/undo`, { method: 'PATCH' }, userCookie);
    const streakAfterUndoOne = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakAfterUndoOne.data.currentStreak, 1);

    // Undo task B: now 0 tasks completed today, streak drops to 0
    await apiRequest(`/tasks/${t2.data.task.id}/undo`, { method: 'PATCH' }, userCookie);
    const streakAfterUndoBoth = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakAfterUndoBoth.data.currentStreak, 0);
  });

  test('Multi-day historical streak calculation and yesterday continuity', async () => {
    // Create a dummy task for historical completion records
    const dummyTask = await Task.create({
      userId,
      title: 'Historical Task',
      priority: 'Medium',
      category: 'General',
      completed: true,
      completedAt: new Date(),
    });

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Simulate completion yesterday (1 day ago) and day before yesterday (2 days ago)
    const yesterdayDate = new Date(now.getTime() - oneDayMs);
    const twoDaysAgoDate = new Date(now.getTime() - 2 * oneDayMs);

    await CompletionHistory.create([
      { userId, taskId: dummyTask._id, completedAt: twoDaysAgoDate },
      { userId, taskId: dummyTask._id, completedAt: yesterdayDate },
    ]);

    // Current streak should be 2 even without completion today (continuity through yesterday)
    const streakWithYesterday = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakWithYesterday.status, 200);
    assert.strictEqual(streakWithYesterday.data.currentStreak, 2);
    assert.strictEqual(streakWithYesterday.data.bestStreak, 2);

    // Now complete dummy task today as well -> streak becomes 3
    await CompletionHistory.create({
      userId,
      taskId: dummyTask._id,
      completedAt: now,
    });

    const streakWithToday = await apiRequest('/streak', { method: 'GET' }, userCookie);
    assert.strictEqual(streakWithToday.data.currentStreak, 3);
    assert.strictEqual(streakWithToday.data.bestStreak, 3);

    // Clean up dummy records
    await CompletionHistory.deleteMany({ userId });
    await Task.findByIdAndDelete(dummyTask._id);
  });
});

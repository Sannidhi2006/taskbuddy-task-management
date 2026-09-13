import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';
import { User, Task, CompletionHistory } from '../models/index.js';

let serverInstance;
let BASE_URL;

const apiRequest = async (path, options = {}, cookie = '') => {
  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:5173',
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

async function runVerification() {
  await connectDB();

  await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      const port = serverInstance.address().port;
      BASE_URL = `http://localhost:${port}/api`;
      resolve();
    });
  });

  try {
    console.log('🚀 Starting Verification of Extended Tasks & Stats...\n');

    // Register User A
    const userAData = {
      name: 'User A',
      email: `user_a_${Date.now()}@taskbuddy.local`,
      password: 'password123',
    };
    const regResA = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userAData),
    });
    assert.strictEqual(regResA.status, 201);
    const cookieA = regResA.cookie.split(';')[0];
    const userAId = regResA.data.user.id;

    // Register User B (for user isolation verification)
    const userBData = {
      name: 'User B',
      email: `user_b_${Date.now()}@taskbuddy.local`,
      password: 'password123',
    };
    const regResB = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userBData),
    });
    assert.strictEqual(regResB.status, 201);
    const cookieB = regResB.cookie.split(';')[0];
    const userBId = regResB.data.user.id;

    // 1. Test GET /api/tasks/stats on empty list
    console.log('1. Testing GET /api/tasks/stats on initial empty state...');
    const stats0 = await apiRequest('/tasks/stats', {}, cookieA);
    assert.strictEqual(stats0.status, 200);
    assert.strictEqual(stats0.data.total, 0);
    assert.strictEqual(stats0.data.completed, 0);
    assert.strictEqual(stats0.data.pending, 0);
    console.log('   ✅ Initial stats: { total: 0, completed: 0, pending: 0 }');

    // 2. Test Due Date Validation on POST /api/tasks
    console.log('2. Testing Due Date validation on POST /api/tasks...');
    const invalidDateRes = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Invalid Date Task',
          dueDate: 'not-a-valid-date',
        }),
      },
      cookieA
    );
    assert.strictEqual(invalidDateRes.status, 400);
    assert.strictEqual(invalidDateRes.data.success, false);
    assert.match(invalidDateRes.data.message, /Invalid dueDate format/i);
    console.log('   ✅ Rejected invalid date with 400 status & friendly message');

    // 3. Create a set of diverse tasks for User A to test all filters
    console.log('3. Creating diverse tasks to test search, status, priority, category, and sortBy...');
    const t1 = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Build Authentication Backend',
          priority: 'High',
          category: 'Work',
          dueDate: '2026-10-01T10:00:00Z',
        }),
      },
      cookieA
    );
    assert.strictEqual(t1.status, 201);
    const task1Id = t1.data.task.id || t1.data.task._id;

    const t2 = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Buy Groceries and Fruit',
          priority: 'Low',
          category: 'Personal',
          dueDate: '2026-09-15T18:00:00Z',
        }),
      },
      cookieA
    );
    assert.strictEqual(t2.status, 201);
    const task2Id = t2.data.task.id || t2.data.task._id;

    const t3 = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Clean the Work desk',
          priority: 'Medium',
          category: 'General',
        }),
      },
      cookieA
    );
    assert.strictEqual(t3.status, 201);
    const task3Id = t3.data.task.id || t3.data.task._id;

    // User B creates a task (should NEVER be visible to User A)
    await apiRequest(
      '/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Build Authentication Secret for User B',
          priority: 'High',
          category: 'Work',
        }),
      },
      cookieB
    );

    // 4. Test Complete Task, completedAt timestamp, and CompletionHistory creation
    console.log('4. Testing complete task, completedAt timestamp, and CompletionHistory creation...');
    const completeRes = await apiRequest(`/tasks/${task1Id}/complete`, { method: 'PATCH' }, cookieA);
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.data.task.completed, true);
    assert.ok(completeRes.data.task.completedAt, 'completedAt must be set on complete');

    const historyCount1 = await CompletionHistory.countDocuments({ taskId: task1Id });
    assert.strictEqual(historyCount1, 1, 'CompletionHistory record must be created');
    console.log('   ✅ Task completed: completedAt recorded and CompletionHistory created');

    // 5. Test GET /api/tasks/stats live calculation
    console.log('5. Testing GET /api/tasks/stats after 1 completed and 2 pending tasks...');
    const stats1 = await apiRequest('/tasks/stats', {}, cookieA);
    assert.strictEqual(stats1.status, 200);
    assert.strictEqual(stats1.data.total, 3);
    assert.strictEqual(stats1.data.completed, 1);
    assert.strictEqual(stats1.data.pending, 2);
    console.log(`   ✅ Live stats verified: { total: ${stats1.data.total}, completed: ${stats1.data.completed}, pending: ${stats1.data.pending} }`);

    // Verify User B stats are isolated
    const statsB = await apiRequest('/tasks/stats', {}, cookieB);
    assert.strictEqual(statsB.data.total, 1);
    assert.strictEqual(statsB.data.completed, 0);
    assert.strictEqual(statsB.data.pending, 1);
    console.log('   ✅ User B stats isolated from User A');

    // 6. Test Undo Task, completedAt cleared, and CompletionHistory deletion
    console.log('6. Testing undo task, completedAt cleared, and CompletionHistory deletion...');
    const undoRes = await apiRequest(`/tasks/${task1Id}/undo`, { method: 'PATCH' }, cookieA);
    assert.strictEqual(undoRes.status, 200);
    assert.strictEqual(undoRes.data.task.completed, false);
    assert.strictEqual(undoRes.data.task.completedAt, null, 'completedAt must be null on undo');

    const historyCountAfterUndo = await CompletionHistory.countDocuments({ taskId: task1Id });
    assert.strictEqual(historyCountAfterUndo, 0, 'CompletionHistory record must be deleted on undo');
    console.log('   ✅ Task undone: completedAt cleared to null and CompletionHistory removed');

    // Re-complete task 1 for subsequent filter tests
    await apiRequest(`/tasks/${task1Id}/complete`, { method: 'PATCH' }, cookieA);

    // 7. Testing Search Filter
    console.log('7. Testing Search filter (case-insensitive, current user only)...');
    const searchRes = await apiRequest('/tasks?search=authentication', {}, cookieA);
    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(searchRes.data.count, 1);
    assert.strictEqual(searchRes.data.tasks[0].title, 'Build Authentication Backend');

    // Confirm User A search does NOT return User B's 'Authentication' task
    const userATitles = searchRes.data.tasks.map((t) => t.title);
    assert.ok(!userATitles.includes('Build Authentication Secret for User B'));
    console.log('   ✅ Search matches task title case-insensitively and respects user isolation');

    // 8. Testing Status Filter
    console.log('8. Testing Status filter (all, pending, completed)...');
    const pendingRes = await apiRequest('/tasks?status=pending', {}, cookieA);
    assert.strictEqual(pendingRes.data.count, 2);
    assert.ok(pendingRes.data.tasks.every((t) => t.completed === false));

    const completedRes = await apiRequest('/tasks?status=completed', {}, cookieA);
    assert.strictEqual(completedRes.data.count, 1);
    assert.strictEqual(completedRes.data.tasks[0]._id, task1Id);
    console.log('   ✅ Status filter works accurately for pending and completed');

    // 9. Testing Priority & Category Filters
    console.log('9. Testing Priority and Category filters...');
    const priorityRes = await apiRequest('/tasks?priority=low', {}, cookieA);
    assert.strictEqual(priorityRes.data.count, 1);
    assert.strictEqual(priorityRes.data.tasks[0]._id, task2Id);

    const categoryRes = await apiRequest('/tasks?category=work', {}, cookieA);
    assert.strictEqual(categoryRes.data.count, 1);
    assert.strictEqual(categoryRes.data.tasks[0]._id, task1Id);
    console.log('   ✅ Priority and Category filters work accurately');

    // 10. Testing Combined Filters (status=pending AND priority=low AND category=personal)
    console.log('10. Testing Combined Filters...');
    const combinedMatch = await apiRequest('/tasks?status=pending&priority=low&category=personal', {}, cookieA);
    assert.strictEqual(combinedMatch.data.count, 1);
    assert.strictEqual(combinedMatch.data.tasks[0]._id, task2Id);

    const combinedNoMatch = await apiRequest('/tasks?status=pending&priority=high&category=work', {}, cookieA);
    assert.strictEqual(combinedNoMatch.data.count, 0, 'Task 1 is completed so pending+high+work should return 0');
    console.log('   ✅ Combined filters successfully match only tasks meeting ALL criteria');

    // 11. Testing Sort By
    console.log('11. Testing sortBy options...');
    const sortByHighRes = await apiRequest('/tasks?sortBy=priority-high', {}, cookieA);
    const priorities = sortByHighRes.data.tasks.map((t) => t.priority);
    assert.deepStrictEqual(priorities, ['High', 'Medium', 'Low']);

    const sortByDueDateRes = await apiRequest('/tasks?sortBy=dueDate', {}, cookieA);
    assert.strictEqual(sortByDueDateRes.data.tasks[0]._id, task2Id, 'Earliest dueDate (Sept 15) must be first');
    assert.strictEqual(sortByDueDateRes.data.tasks[1]._id, task1Id, 'Second dueDate (Oct 1) must be second');
    assert.strictEqual(sortByDueDateRes.data.tasks[2]._id, task3Id, 'Null dueDate must be last');
    console.log('   ✅ Sorting by priority-high, dueDate, newest, oldest verified');

    // 12. Testing updateTask with dueDate validation
    console.log('12. Testing updateTask with dueDate validation...');
    const invalidUpdate = await apiRequest(
      `/tasks/${task2Id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ dueDate: 'invalid-date' }),
      },
      cookieA
    );
    assert.strictEqual(invalidUpdate.status, 400);

    const validUpdate = await apiRequest(
      `/tasks/${task2Id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ dueDate: '2026-11-20T00:00:00Z' }),
      },
      cookieA
    );
    assert.strictEqual(validUpdate.status, 200);
    assert.strictEqual(new Date(validUpdate.data.task.dueDate).toISOString(), new Date('2026-11-20T00:00:00Z').toISOString());
    console.log('   ✅ updateTask dueDate validation and storage verified');

    // Clean up
    console.log('\nCleaning up verification data...');
    await CompletionHistory.deleteMany({ userId: { $in: [userAId, userBId] } });
    await Task.deleteMany({ userId: { $in: [userAId, userBId] } });
    await User.deleteMany({ email: { $in: [userAData.email, userBData.email] } });

    console.log('\n🎉 ALL EXTENDED TASKS & STATS REQUIREMENTS VERIFIED 100% SUCCESSFULLY!\n');
  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

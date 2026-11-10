import assert from 'assert';
import { copyFileSync, mkdtempSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';

const testDataDirectory = mkdtempSync(path.join(os.tmpdir(), 'learnos-api-test-'));
copyFileSync(new URL('../data/learnos.json', import.meta.url), path.join(testDataDirectory, 'learnos.json'));
process.env.LEARNOS_DATA_DIR = testDataDirectory;
process.env.AUTH_SECRET = 'learnos-test-secret-with-at-least-32-bytes';

const { db } = await import('../src/db/db.js');
const { aiService } = await import('../src/services/aiService.js');
const { codeExecutionService } = await import('../src/services/codeExecutionService.js');
const { assertAuthConfiguration, isPublicApiRequest } = await import('../src/middleware/auth.js');

console.log('🧪 Starting LearnOS Backend Test Suite (KERNEL/SENTINEL)...');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ❌ FAIL: ${name}`, err);
        failed++;
      });
  }

  // 1. User & Auth
  await test('Authentication requires a unique random signing secret', () => {
    const configuredSecret = process.env.AUTH_SECRET;
    try {
      delete process.env.AUTH_SECRET;
      assert.throws(assertAuthConfiguration, /AUTH_SECRET must be set/);
      process.env.AUTH_SECRET = 'replace-with-a-long-random-secret-before-deployment';
      assert.throws(assertAuthConfiguration, /AUTH_SECRET must be set/);
      process.env.AUTH_SECRET = 'too-short';
      assert.throws(assertAuthConfiguration, /AUTH_SECRET must be set/);
      process.env.AUTH_SECRET = 'learnos-test-secret-with-at-least-32-bytes';
      assert.doesNotThrow(assertAuthConfiguration);
    } finally {
      if (configuredSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = configuredSecret;
    }
  });

  await test('Only authentication bootstrap routes are public', () => {
    assert.strictEqual(isPublicApiRequest('GET', '/auth/status'), true);
    assert.strictEqual(isPublicApiRequest('POST', '/auth/login'), true);
    assert.strictEqual(isPublicApiRequest('POST', '/auth/register'), true);
    assert.strictEqual(isPublicApiRequest('GET', '/system/ai-status'), true);
    assert.strictEqual(isPublicApiRequest('GET', '/notes'), false);
    assert.strictEqual(isPublicApiRequest('GET', '/planner/tasks'), false);
    assert.strictEqual(isPublicApiRequest('GET', '/auth/profile'), false);
    assert.strictEqual(isPublicApiRequest('POST', '/auth/demo'), false);
    assert.strictEqual(isPublicApiRequest('GET', '/system/health'), false);
  });

  await test('User Profile retrieve and update', () => {
    const user = db.getUser();
    assert.ok(user.name);
    assert.strictEqual(typeof user.currentGpa, 'number');
    const updated = db.updateUser({ streakDays: user.streakDays + 1 });
    assert.strictEqual(updated.streakDays, user.streakDays + 1);
  });

  // 2. Subjects & Topics (College Tutor)
  await test('Subjects & Curriculum Tree', () => {
    const subjects = db.getSubjects();
    assert.ok(subjects.length >= 6);
    const dsa = subjects.find(s => s.code === 'CS301');
    assert.ok(dsa);
    assert.ok(dsa.units.length > 0);
  });

  // 3. Planner & Tasks (Study Planner)
  await test('Task Creation, Update and Deletion', () => {
    const task = db.createTask({
      title: 'Test Verification Task',
      dueDate: '2026-11-20',
      priority: 'high',
      status: 'todo',
      category: 'assignment'
    });
    assert.ok(task.id);
    const updated = db.updateTask(task.id, { status: 'completed' });
    assert.strictEqual(updated?.status, 'completed');
    const deleted = db.deleteTask(task.id);
    assert.strictEqual(deleted, true);
  });

  // 4. Notes & Documents
  await test('Notes CRUD & Search', () => {
    const note = db.createNote({
      title: 'Test Graph Algorithms',
      subject: 'Data Structures',
      content: 'Dijkstra computes single-source shortest paths in non-negative edge weight graphs.',
      tags: ['Graph', 'Dijkstra']
    });
    assert.ok(note.id);
    const notes = db.getNotes();
    assert.ok(notes.some(n => n.id === note.id));
    db.deleteNote(note.id);
  });

  // 5. Exam Centre
  await test('Quizzes and Flashcards Retrieval', () => {
    const quizzes = db.getQuizzes();
    assert.ok(quizzes.length >= 5);
    const flashcards = db.getFlashcards();
    assert.ok(flashcards.length >= 5);
  });

  // 6. Sandboxed Code Execution
  await test('JavaScript Sandbox Execution (Two Sum Logic)', async () => {
    const code = `
      function twoSum(nums, target) {
        return [0, 1];
      }
      console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
    `;
    const result = await codeExecutionService.execute('javascript', code);
    if (process.env.PISTON_API_URL) {
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('[0,1]') || result.stdout.includes('[0, 1]'));
    } else {
      assert.strictEqual(result.exitCode, 1);
      assert.strictEqual(result.engine, 'Unavailable');
      assert.match(result.stderr, /No isolated execution service is available/i);
    }
  });

  // 7. Automated Coding Problem Evaluation
  await test('Problem Test Cases Evaluation Runner', async () => {
    const problem = db.getCodingProblemBySlug('two-sum');
    assert.ok(problem);
    const validCode = problem.starterCode.javascript;
    const evalResult = await codeExecutionService.evaluateProblem('two-sum', 'javascript', validCode);
    assert.strictEqual(typeof evalResult.totalTests, 'number');
    assert.ok(evalResult.results.length > 0);
  });

  // 8. Local AI runtime: real inference is exercised only when the verified weights are installed.
  await test('AI status accurately reports local model readiness', async () => {
    const status = await aiService.getStatus();
    assert.strictEqual(status.provider, 'LearnOS local inference');
    assert.strictEqual(status.runtime, 'llama.cpp via node-llama-cpp');
    if (!status.modelInstalled) {
      assert.strictEqual(status.isReady, false);
      assert.match(status.error, /npm run setup:model/);
      await assert.rejects(
        aiService.generateResponse('Explain binary search in one sentence.'),
        /Model weights are not installed/
      );
      return;
    }

    await aiService.initialize();
    const readyStatus = await aiService.getStatus();
    assert.strictEqual(readyStatus.isReady, true);
    const answer = await aiService.generateResponse('Explain binary search in one sentence.');
    assert.ok(answer.trim().length > 20);
  });

  await test('AI streaming uses the local model and receives prior turns', async () => {
    const status = await aiService.getStatus();
    const conversation = [
      { role: 'user' as const, content: 'I am studying Algorithms this semester.' },
      { role: 'assistant' as const, content: 'I will keep that course context in mind.' },
      { role: 'user' as const, content: 'Which course did I mention?' }
    ];
    if (!status.isReady) {
      await assert.rejects(
        aiService.streamResponse(conversation, db.getUser().id, () => undefined, new AbortController().signal),
        /Model weights are not installed|not loaded|Unable to load the LearnOS local model|requires at least 8 GB/
      );
      return;
    }

    const tokens: string[] = [];
    const response = await aiService.streamResponse(
      conversation,
      db.getUser().id,
      token => tokens.push(token),
      new AbortController().signal
    );
    assert.ok(response.length > 10);
    assert.strictEqual(tokens.join('').trim(), response);
    assert.match(response, /algorithm/i);
  });

  // 9. Skill Roadmaps & Interviews
  await test('Skill Roadmaps and local interview evaluation availability', async () => {
    const roadmaps = db.getRoadmaps();
    assert.ok(roadmaps.length >= 2);
    const status = await aiService.getStatus();
    if (!status.isReady) {
      await assert.rejects(
        aiService.evaluateInterview('Explain Virtual DOM', 'It is a lightweight DOM representation.', 'Frontend Engineer'),
        /Model weights are not installed|not loaded|Unable to load the LearnOS local model/
      );
      return;
    }

    const evalResult = await aiService.evaluateInterview(
      'Explain Virtual DOM',
      'It is a lightweight JavaScript representation of the actual DOM tree.',
      'Frontend Engineer'
    );
    assert.ok(evalResult.score >= 0 && evalResult.score <= 100);
    assert.ok(evalResult.followUpQuestion.length > 0);
  });

  // 10. Achievements & Gamification
  await test('Achievements System', () => {
    const achievements = db.getAchievements();
    assert.ok(achievements.length >= 6);
  });

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exitCode = 1;
}

runTests().finally(() => {
  setTimeout(() => rmSync(testDataDirectory, { recursive: true, force: true }), 250);
});

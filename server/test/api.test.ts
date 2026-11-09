import assert from 'assert';
import { db } from '../src/db/db.js';
import { aiService } from '../src/services/aiService.js';
import { codeExecutionService } from '../src/services/codeExecutionService.js';

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

  // 8. AI Academic Service
  await test('AI Pedagogical Response Generator', async () => {
    const originalFetch = globalThis.fetch;
    let requestBody: any;
    globalThis.fetch = (async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ message: { content: 'AVL rotations rebalance a tree after insertion. A right rotation moves a heavy left child upward and restores balance.' } }));
    }) as typeof fetch;
    try {
      const response = await aiService.generateResponse('Explain AVL tree rotations simply');
      assert.match(response, /right rotation/);
      assert.strictEqual(requestBody.model, process.env.OLLAMA_MODEL || 'qwen2.5:3b');
      assert.strictEqual(requestBody.messages[0].role, 'system');
      assert.match(requestBody.messages[0].content, /Hinglish/);
      assert.match(requestBody.messages[0].content, /Do not assume intended behavior/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('AI streaming preserves recent conversation context', async () => {
    const originalFetch = globalThis.fetch;
    let requestBody: any;
    globalThis.fetch = (async (_input, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        '{"message":{"content":"Binary search halves the range."},"done":false}\n' +
        '{"message":{"content":" Its time complexity is O(log n)."},"done":true}\n'
      );
    }) as typeof fetch;
    try {
      const received: string[] = [];
      const answer = await aiService.streamResponse([
        { role: 'user', content: 'Explain binary search.' },
        { role: 'assistant', content: 'It repeatedly halves the search interval.' },
        { role: 'user', content: 'What is its time complexity?' }
      ], db.getUser().id, token => received.push(token), new AbortController().signal);
      assert.strictEqual(answer, 'Binary search halves the range. Its time complexity is O(log n).');
      assert.strictEqual(received.length, 2);
      assert.strictEqual(requestBody.stream, true);
      assert.ok(requestBody.messages.some((item: any) => item.content === 'It repeatedly halves the search interval.'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 9. Skill Roadmaps & Interviews
  await test('Skill Roadmaps & Interview Evaluator', async () => {
    const roadmaps = db.getRoadmaps();
    assert.ok(roadmaps.length >= 2);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({
      message: {
        content: JSON.stringify({
          technicalAccuracy: 84,
          communication: 82,
          problemSolving: 78,
          score: 81,
          summary: 'Accurate explanation with a clear account of reconciliation.',
          strengths: ['Defines the virtual DOM correctly', 'Explains diffing'],
          improvements: ['Mention keys and list identity'],
          followUpQuestion: 'How does React use keys when reconciling a list?'
        })
      }
    }))) as typeof fetch;
    try {
      const evalResult = await aiService.evaluateInterview(
        'Explain Virtual DOM',
        'The virtual DOM is a lightweight JavaScript representation of the actual DOM tree.',
        'Frontend Engineer'
      );
      assert.strictEqual(evalResult.score, 81);
      assert.match(evalResult.followUpQuestion, /keys/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // 10. Achievements & Gamification
  await test('Achievements System', () => {
    const achievements = db.getAchievements();
    assert.ok(achievements.length >= 6);
  });

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

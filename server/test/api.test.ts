import assert from 'assert';
import { copyFileSync, mkdtempSync, rmSync } from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

const testDataDirectory = mkdtempSync(path.join(os.tmpdir(), 'learnos-api-test-'));
copyFileSync(new URL('../data/learnos.json', import.meta.url), path.join(testDataDirectory, 'learnos.json'));
process.env.NODE_ENV = 'test';
process.env.LEARNOS_DATA_DIR = testDataDirectory;
process.env.AUTH_SECRET = 'learnos-test-secret-with-at-least-32-bytes';

const { db } = await import('../src/db/db.js');
const { aiService } = await import('../src/services/aiService.js');
const { codeExecutionService } = await import('../src/services/codeExecutionService.js');
const { assertAuthConfiguration, isPublicApiRequest } = await import('../src/middleware/auth.js');
const { app } = await import('../src/index.js');

console.log('🧪 Starting LearnOS Backend & E2E Integration Test Suite...');

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

  // 1. User & Auth Configuration
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

  await test('Public health and auth bootstrap routes vs protected routes', () => {
    assert.strictEqual(isPublicApiRequest('GET', '/auth/status'), true);
    assert.strictEqual(isPublicApiRequest('POST', '/auth/login'), true);
    assert.strictEqual(isPublicApiRequest('POST', '/auth/register'), true);
    assert.strictEqual(isPublicApiRequest('GET', '/system/ai-status'), true);
    assert.strictEqual(isPublicApiRequest('GET', '/system/health'), true);
    assert.strictEqual(isPublicApiRequest('GET', '/system/diagnostics'), false);
    assert.strictEqual(isPublicApiRequest('GET', '/notes'), false);
    assert.strictEqual(isPublicApiRequest('GET', '/planner/tasks'), false);
    assert.strictEqual(isPublicApiRequest('GET', '/auth/profile'), false);
  });

  await test('User Profile retrieve and update', () => {
    const user = db.getUser();
    assert.ok(user.name);
    assert.strictEqual(typeof user.currentGpa, 'number');
    const updated = db.updateUser({ streakDays: user.streakDays + 1 });
    assert.strictEqual(updated.streakDays, user.streakDays + 1);
  });

  // 2. Subjects & Topics (College Tutor)
  await test('Subjects & Curriculum Tree has 6 complete CS subjects with enriched topics', () => {
    const subjects = db.getSubjects();
    assert.strictEqual(subjects.length, 6);
    const codes = subjects.map(s => s.code);
    assert.ok(codes.includes('CS301'));
    assert.ok(codes.includes('CS302'));
    assert.ok(codes.includes('CS303'));
    assert.ok(codes.includes('CS304'));
    assert.ok(codes.includes('MA301'));
    assert.ok(codes.includes('CS305'));
    const dsa = subjects.find(s => s.code === 'CS301')!;
    assert.ok(dsa.units.length >= 2);
    const firstTopic = dsa.units[0].topics[0];
    assert.ok(Array.isArray(firstTopic.subtopics) && firstTopic.subtopics.length > 0);
    assert.ok(Array.isArray(firstTopic.learningObjectives) && firstTopic.learningObjectives.length > 0);
    assert.ok(Array.isArray(firstTopic.practiceQuestions) && firstTopic.practiceQuestions.length > 0);
    assert.ok(Array.isArray(firstTopic.revisionResources) && firstTopic.revisionResources.length > 0);
  });

  // 3. Planner & Tasks
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
  await test('Quizzes, Mock Exams, and Flashcards Retrieval', () => {
    const quizzes = db.getQuizzes();
    assert.ok(quizzes.length >= 7);
    const flashcards = db.getFlashcards();
    assert.ok(flashcards.length >= 5);
    const mockExams = db.getMockExams();
    assert.ok(mockExams.length >= 2);
  });

  // 6. Sandboxed Code Execution & Runtimes
  await test('Available Runtimes Catalog & Safe Execution Behavior', async () => {
    const runtimes = await codeExecutionService.getAvailableRuntimes();
    assert.ok(runtimes.length >= 3);
    assert.ok(runtimes.some(r => r.language === 'javascript'));
    assert.ok(runtimes.some(r => r.language === 'python'));
    assert.ok(runtimes.some(r => r.language === 'c'));

    const code = `console.log(JSON.stringify([0, 1]));`;
    const result = await codeExecutionService.execute('javascript', code);
    if (process.env.PISTON_API_URL) {
      assert.strictEqual(result.exitCode, 0);
    } else {
      assert.strictEqual(result.exitCode, 1);
      assert.strictEqual(result.engine, 'Unavailable');
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

  // 8. Centralized AI Architecture & Academic Fallback
  await test('AI Service Status and Academic Fallback Methods', async () => {
    const status = await aiService.getStatus();
    assert.ok(status.provider);
    assert.ok(status.mode);

    const tutorReply = aiService.buildAcademicFallbackResponse('Explain time complexity', {
      subject: 'Data Structures & Algorithms',
      topic: 'Asymptotic Analysis',
      mode: 'feynman'
    });
    assert.ok(tutorReply.length > 30);

    const summary = aiService.summarizeNotesFallback('Page replacement algorithms like LRU and Optimal minimize page faults in virtual memory.');
    assert.ok(summary.summary.length > 20);
    assert.ok(summary.keyConcepts.length > 0);

    const generated = aiService.generateFlashcardsFallback(
      'TCP Congestion Control',
      'Computer Networks',
      'TCP uses a 3-way handshake (SYN, SYN-ACK, ACK) and congestion control.'
    );
    assert.ok(generated.flashcards.length >= 2);
    assert.ok(generated.quiz.length >= 2);

    const interviewEval = aiService.evaluateInterviewFallback(
      'Explain Virtual DOM',
      'Virtual DOM is an in-memory tree representation of DOM elements reconciled with O(n) diffing heuristics.',
      'Frontend Engineer'
    );
    assert.ok(interviewEval.score >= 55 && interviewEval.score <= 100);
    assert.ok(interviewEval.followUpQuestion.length > 10);
  });

  // 9. Full End-to-End HTTP Integration Journey (19 User Journey Steps + Multi-User Isolation)
  await test('Full 19-Step End-to-End HTTP API Journey & Multi-User Isolation', async () => {
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address() as { port: number };
    const baseUrl = `http://127.0.0.1:${address.port}/api`;

    const request = async (method: string, route: string, body?: any, token?: string) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}${route}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        const raw = await res.text();
        const doneLine = raw
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.startsWith('data:'))
          .pop();
        const data = doneLine ? JSON.parse(doneLine.replace(/^data:\s*/, '')) : {};
        return { status: res.status, data };
      }
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    try {
      // Public Health Check vs Protected Diagnostics
      const healthRes = await request('GET', '/system/health');
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthRes.data.status, 'operational');

      const unauthDiag = await request('GET', '/system/diagnostics');
      assert.strictEqual(unauthDiag.status, 401);

      // Step 1: Register Student A
      const regA = await request('POST', '/auth/register', {
        email: 'student.a@university.edu',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Aarav Sharma',
        university: 'IIT Bombay'
      });
      assert.ok(regA.status === 200 || regA.status === 201);
      assert.ok(regA.data.token);
      let tokenA = regA.data.token as string;

      // Step 2: Logout and Login back in
      const logoutRes = await request('POST', '/auth/logout', {}, tokenA);
      assert.strictEqual(logoutRes.status, 200);
      const afterLogout = await request('GET', '/auth/me', undefined, tokenA);
      assert.strictEqual(afterLogout.status, 401);

      const loginA = await request('POST', '/auth/login', {
        email: 'student.a@university.edu',
        password: 'password123'
      });
      assert.strictEqual(loginA.status, 200);
      tokenA = loginA.data.token;

      // Step 3: Complete academic profile onboarding
      const profileUpdate = await request('PUT', '/auth/profile', {
        university: 'IIT Bombay',
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        semester: 5,
        subjects: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management Systems'],
        learningInterests: ['Algorithms', 'Distributed Systems'],
        careerInterests: ['Backend Engineer', 'AI Engineer'],
        targetGpa: 9.4,
        onboardingComplete: true
      }, tokenA);
      assert.strictEqual(profileUpdate.status, 200);
      assert.strictEqual(profileUpdate.data.user.degree, 'B.Tech');
      assert.strictEqual(profileUpdate.data.user.onboardingComplete, true);

      // Step 4 & 5: Verify College Tutor subjects (6 subjects)
      const subjectsRes = await request('GET', '/tutor/subjects', undefined, tokenA);
      assert.strictEqual(subjectsRes.status, 200);
      assert.strictEqual(subjectsRes.data.subjects.length, 6);

      // Step 6: Add custom university topic & Step 7: Mark topic complete
      const customTopicRes = await request('POST', '/tutor/subjects/sub_dsa/custom-topic', {
        unitNumber: 1,
        title: 'Skip Lists & Randomized Search Trees',
        content: 'Probabilistic alternative to balanced trees with O(log n) search.',
        keyPoints: ['Multi-level linked list', 'O(log n) expected search']
      }, tokenA);
      assert.strictEqual(customTopicRes.status, 201);

      const toggleRes = await request('POST', '/tutor/topics/top_dsa_1_1/toggle', {}, tokenA);
      assert.strictEqual(toggleRes.status, 200);
      assert.strictEqual(toggleRes.data.completed, true);

      // Step 8: Ask College Tutor & AI Assistant conversation
      const tutorAsk = await request('POST', '/tutor/explain', {
        topicTitle: 'Asymptotic Analysis',
        question: 'Explain Big-O notation with an example',
        mode: 'feynman'
      }, tokenA);
      assert.strictEqual(tutorAsk.status, 200);
      assert.ok(tutorAsk.data.explanation.length > 20);

      const convCreate = await request('POST', '/ai/conversations', { title: 'Exam Revision' }, tokenA);
      assert.strictEqual(convCreate.status, 201);
      const convMsg = await request('POST', `/ai/conversations/${convCreate.data.conversation.id}/messages`, {
        message: 'Give me a 3-step revision tip for Operating Systems.'
      }, tokenA);
      assert.strictEqual(convMsg.status, 200);
      assert.ok(convMsg.data.message.text.length > 15);

      // Step 9 & 10: Study Planner Tasks, Timetable Schedule & Pomodoro Session
      const taskCreate = await request('POST', '/planner/tasks', {
        title: 'Revise B+ Trees in DBMS',
        subjectName: 'Database Management Systems',
        dueDate: '2026-11-25',
        priority: 'high',
        category: 'exam_prep'
      }, tokenA);
      assert.strictEqual(taskCreate.status, 201);
      const taskId = taskCreate.data.task.id;

      const taskUpdate = await request('PUT', `/planner/tasks/${taskId}`, { status: 'completed' }, tokenA);
      assert.strictEqual(taskUpdate.status, 200);
      assert.strictEqual(taskUpdate.data.task.status, 'completed');

      const schedCreate = await request('POST', '/planner/schedules', {
        title: 'CS303 Lab',
        subject: 'DBMS',
        dayOfWeek: 2,
        startTime: '14:00',
        endTime: '16:00',
        type: 'lab',
        location: 'Lab 204'
      }, tokenA);
      assert.strictEqual(schedCreate.status, 201);

      const pomoRes = await request('POST', '/planner/pomodoro/complete', { minutes: 25 }, tokenA);
      assert.strictEqual(pomoRes.status, 200);
      assert.ok(pomoRes.data.totalStudyHours > 0);

      // Step 11, 12, 13: Notes CRUD, Summarize & Generate MCQs
      const noteCreate = await request('POST', '/notes', {
        title: 'Deadlock Prevention & Banker Algorithm',
        subject: 'Operating Systems',
        folder: 'Exam Prep',
        content: 'Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait.',
        tags: ['OS', 'Deadlock']
      }, tokenA);
      assert.strictEqual(noteCreate.status, 201);
      const noteId = noteCreate.data.note.id;

      const sumRes = await request('POST', `/notes/${noteId}/summarize`, {}, tokenA);
      assert.strictEqual(sumRes.status, 200);
      assert.ok(sumRes.data.summary.length > 15);

      const qGenRes = await request('POST', `/notes/${noteId}/generate-questions`, {}, tokenA);
      assert.strictEqual(qGenRes.status, 200);
      assert.ok(qGenRes.data.questions.length > 15);

      // Step 14: Exam Centre Quiz Submission & History
      const quizzesRes = await request('GET', '/exams/quizzes', undefined, tokenA);
      assert.strictEqual(quizzesRes.status, 200);
      const firstQuiz = quizzesRes.data.quizzes[0];
      const quizSubmit = await request('POST', '/exams/submit', {
        answers: { [firstQuiz.id]: firstQuiz.correctOption },
        subject: firstQuiz.subject
      }, tokenA);
      assert.strictEqual(quizSubmit.status, 200);
      assert.strictEqual(quizSubmit.data.score, 1);

      const quizHist = await request('GET', '/exams/history', undefined, tokenA);
      assert.strictEqual(quizHist.status, 200);
      assert.strictEqual(quizHist.data.history.length, 1);

      // Step 15: Coding Lab Save Code & Retrieve
      const saveCodeRes = await request('POST', '/coding/saved', {
        problemId: 'two-sum',
        language: 'javascript',
        code: 'function twoSum(nums, target) { return [0, 1]; }',
        solved: true
      }, tokenA);
      assert.strictEqual(saveCodeRes.status, 200);

      const getSavedRes = await request('GET', '/coding/saved', undefined, tokenA);
      assert.strictEqual(getSavedRes.status, 200);
      assert.ok(getSavedRes.data.savedCode['two-sum:javascript']);

      // Step 16: Skill Development Prerequisite Check & Mock Interview
      const lockedAttempt = await request('POST', '/skills/roadmaps/rd_fullstack/nodes/node_5/status', {
        status: 'in_progress'
      }, tokenA);
      assert.strictEqual(lockedAttempt.status, 400);

      const validNodeUpdate = await request('POST', '/skills/roadmaps/rd_fullstack/nodes/node_1/status', {
        status: 'mastered'
      }, tokenA);
      assert.strictEqual(validNodeUpdate.status, 200);

      const startInt = await request('POST', '/skills/interview/start', { role: 'Full-Stack AI Engineer' }, tokenA);
      assert.strictEqual(startInt.status, 201);
      const intReply = await request('POST', `/skills/interview/${startInt.data.session.id}/respond`, {
        answer: 'I would use Redis caching, database read replicas, and cursor-based pagination to reduce p99 latency.'
      }, tokenA);
      assert.strictEqual(intReply.status, 200);
      assert.ok(intReply.data.evaluation.score >= 60);

      // Step 17: Analytics Summary & Authenticated Diagnostics
      const analyticsRes = await request('GET', '/analytics/summary', undefined, tokenA);
      assert.strictEqual(analyticsRes.status, 200);
      assert.strictEqual(analyticsRes.data.subjectMasteries.length, 6);
      assert.ok(analyticsRes.data.quizStats.attemptsCount >= 1);

      const authDiag = await request('GET', '/system/diagnostics', undefined, tokenA);
      assert.strictEqual(authDiag.status, 200);
      assert.strictEqual(authDiag.data.status, 'operational');

      // Test Student B (No completed academic profile + Per-User Isolation)
      const regB = await request('POST', '/auth/register', {
        email: 'student.b@university.edu',
        password: 'password456',
        confirmPassword: 'password456'
      });
      assert.ok(regB.status === 200 || regB.status === 201);
      const tokenB = regB.data.token as string;

      // Skip onboarding for Student B
      const skipRes = await request('POST', '/auth/onboarding-skip', {}, tokenB);
      assert.strictEqual(skipRes.status, 200);
      assert.strictEqual(skipRes.data.onboardingComplete, true);

      // Verify Student B does NOT see Student A's custom note or quiz history
      const notesB = await request('GET', '/notes', undefined, tokenB);
      assert.strictEqual(notesB.status, 200);
      assert.ok(!notesB.data.notes.some((n: any) => n.id === noteId));

      const histB = await request('GET', '/exams/history', undefined, tokenB);
      assert.strictEqual(histB.status, 200);
      assert.strictEqual(histB.data.history.length, 0);
    } finally {
      server.closeAllConnections?.();
      await new Promise<void>(resolve => server.close(() => resolve()));
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

  if (failed > 0) process.exitCode = 1;
}

runTests().finally(() => {
  setTimeout(() => {
    rmSync(testDataDirectory, { recursive: true, force: true });
    process.exit(typeof process.exitCode === 'number' ? process.exitCode : 0);
  }, 100);
});

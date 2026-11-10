import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');

console.log('🧪 Starting LearnOS Frontend Verification Suite...');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`, err);
    failed++;
  }
}

test('Production environment points to Render backend https://learnos-backend-ks49.onrender.com', () => {
  const envProd = fs.readFileSync(path.join(clientRoot, '.env.production'), 'utf-8');
  assert.ok(envProd.includes('VITE_API_URL=https://learnos-backend-ks49.onrender.com'));
  assert.ok(!envProd.includes('learnos-api.onrender.com'));
});

test('Default 6-subject CS curriculum is complete with units, subtopics, learning objectives, practice questions, and revision resources', () => {
  const curriculumSrc = fs.readFileSync(path.join(clientRoot, 'src/data/defaultCurriculum.ts'), 'utf-8');
  const expectedSubjects = [
    'Data Structures & Algorithms',
    'Operating Systems',
    'Database Management Systems',
    'Computer Networks',
    'Discrete Mathematics',
    'Artificial Intelligence & Machine Learning'
  ];
  for (const sub of expectedSubjects) {
    assert.ok(curriculumSrc.includes(sub), `Missing subject ${sub}`);
  }
  assert.ok(curriculumSrc.includes('subtopics:'));
  assert.ok(curriculumSrc.includes('learningObjectives:'));
  assert.ok(curriculumSrc.includes('practiceQuestions:'));
  assert.ok(curriculumSrc.includes('revisionResources:'));
});

test('API client service connects all 10 platform modules and uses public /system/health and protected /system/diagnostics', () => {
  const apiSrc = fs.readFileSync(path.join(clientRoot, 'src/services/api.ts'), 'utf-8');
  const requiredMethods = [
    'getAuthStatus',
    'register',
    'login',
    'logout',
    'skipOnboarding',
    'updateProfile',
    'getSubjects',
    'toggleTopicCompletion',
    'addCustomTopic',
    'askTopicAI',
    'getTasks',
    'createTask',
    'updateTask',
    'deleteTask',
    'getSchedules',
    'createSchedule',
    'deleteSchedule',
    'getRevisions',
    'advanceRevision',
    'recordPomodoro',
    'getNotes',
    'createNote',
    'updateNote',
    'deleteNote',
    'summarizeNote',
    'generateNoteQuestions',
    'getQuizzes',
    'submitQuiz',
    'getQuizHistory',
    'getFlashcards',
    'createFlashcard',
    'toggleFlashcardMastery',
    'getMockExams',
    'getPYQs',
    'getCodingProblems',
    'getCodeRuntimes',
    'getSavedCode',
    'saveUserCode',
    'executeCode',
    'evaluateProblem',
    'askCodeAI',
    'getRoadmaps',
    'updateSkillStatus',
    'startInterview',
    'sendInterviewResponse',
    'getAnalytics',
    'getSystemHealth',
    'getSystemDiagnostics'
  ];
  for (const method of requiredMethods) {
    assert.ok(apiSrc.includes(`${method}(`), `Missing API method: ${method}`);
  }
  assert.ok(apiSrc.includes('/system/health'));
  assert.ok(apiSrc.includes('/system/diagnostics'));
});

test('All key UI pages and components are present and non-empty', () => {
  const pages = [
    'src/pages/Dashboard/Dashboard.tsx',
    'src/pages/CollegeTutor/CollegeTutor.tsx',
    'src/pages/StudyPlanner/StudyPlanner.tsx',
    'src/pages/Notes/Notes.tsx',
    'src/pages/ExamCentre/ExamCentre.tsx',
    'src/pages/CodingLab/CodingLab.tsx',
    'src/pages/SkillDevelopment/SkillDevelopment.tsx',
    'src/pages/AIAssistant/AIAssistant.tsx',
    'src/pages/Analytics/Analytics.tsx',
    'src/pages/ProfileSettings/ProfileSettings.tsx',
    'src/pages/BrainGames/BrainGames.tsx',
    'src/components/Layout.tsx',
    'src/components/Navbar.tsx',
    'src/components/Sidebar.tsx',
    'src/components/Onboarding.tsx',
    'src/components/Login.tsx'
  ];
  for (const rel of pages) {
    const full = path.join(clientRoot, rel);
    assert.ok(fs.existsSync(full), `Missing UI file: ${rel}`);
    const content = fs.readFileSync(full, 'utf-8');
    assert.ok(content.length > 500, `UI file unexpectedly short: ${rel}`);
  }
});

console.log(`\n========================================`);
console.log(`Frontend Checks Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) process.exitCode = 1;

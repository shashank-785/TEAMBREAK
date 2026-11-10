import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User, Subject, PlannerTask, ScheduleItem, RevisionItem,
  Note, QuizQuestion, Flashcard, MockExam, PreviousYearQuestion,
  CodingProblem, SkillRoadmap, MockInterviewSession, Achievement,
  Topic, QuizAttempt, StudySession, SavedCodeRecord
} from '../types/index.js';
import {
  initialUser, initialSubjects, initialTasks, initialSchedules,
  initialRevisionItems as initialRevisions, initialNotes, initialQuizzes, initialFlashcards,
  initialMockExams, initialPYQs, initialCodingProblems, initialRoadmaps,
  initialAchievements
} from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_SEED_FILE_PATH = path.resolve(__dirname, '../../data/learnos.json');

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export interface AuthCredentials {
  userId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomTopicEntry {
  subjectId: string;
  unitNumber: number;
  unitTitle?: string;
  topic: Topic;
}

export interface AiConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiConversationMessage[];
}

export interface UserAccountRecord {
  auth: AuthCredentials;
  user: User;
  tasks: PlannerTask[];
  schedules: ScheduleItem[];
  revisions: RevisionItem[];
  notes: Note[];
  flashcards: Flashcard[];
  roadmaps: SkillRoadmap[];
  interviews: Record<string, MockInterviewSession>;
  achievements: Achievement[];
  completedTopicIds: string[];
  customTopics: CustomTopicEntry[];
  quizHistory: QuizAttempt[];
  studySessions: StudySession[];
  savedCode: Record<string, SavedCodeRecord>;
  solvedProblemIds: string[];
  aiConversations?: AiConversation[];
}

interface PersistedState {
  version: number;
  updatedAt: string;
  auth: AuthCredentials | null;
  user: User;
  subjects: Subject[];
  tasks: PlannerTask[];
  schedules: ScheduleItem[];
  revisions: RevisionItem[];
  notes: Note[];
  quizzes: QuizQuestion[];
  flashcards: Flashcard[];
  mockExams: MockExam[];
  pyqs: PreviousYearQuestion[];
  codingProblems: CodingProblem[];
  roadmaps: SkillRoadmap[];
  interviews: Record<string, MockInterviewSession>;
  achievements: Achievement[];
  quizHistory?: QuizAttempt[];
  studySessions?: StudySession[];
  savedCode?: Record<string, SavedCodeRecord>;
  solvedProblemIds?: string[];
  aiConversations?: Record<string, AiConversation[]>;
  accounts?: Record<string, UserAccountRecord>;
}

function mergeSubjectsWithCurriculum(persistedSubjects: Subject[] | undefined): Subject[] {
  const baseSubjects = clone(initialSubjects);
  if (!Array.isArray(persistedSubjects) || persistedSubjects.length === 0) {
    return baseSubjects;
  }

  const completedTopicMap = new Map<string, boolean>();
  for (const sub of persistedSubjects) {
    for (const unit of sub.units || []) {
      for (const top of unit.topics || []) {
        if (typeof top.isCompleted === 'boolean') {
          completedTopicMap.set(top.id, top.isCompleted);
        }
      }
    }
  }

  // Apply completion states to enriched base curriculum
  for (const sub of baseSubjects) {
    for (const unit of sub.units) {
      for (const top of unit.topics) {
        if (completedTopicMap.has(top.id)) {
          top.isCompleted = completedTopicMap.get(top.id);
        }
      }
    }
    // Preserve any custom units or custom topics added in persistedSubjects
    const persistedSub = persistedSubjects.find((s) => s.id === sub.id);
    if (persistedSub) {
      for (const pUnit of persistedSub.units || []) {
        let targetUnit = sub.units.find((u) => u.id === pUnit.id || u.unitNumber === pUnit.unitNumber);
        if (!targetUnit) {
          sub.units.push(clone(pUnit));
        } else {
          for (const pTopic of pUnit.topics || []) {
            const exists = targetUnit.topics.some((t) => t.id === pTopic.id);
            if (!exists) {
              targetUnit.topics.push(clone(pTopic));
            }
          }
        }
      }
    }
  }

  // Also include any completely custom subjects
  for (const pSub of persistedSubjects) {
    if (!baseSubjects.some((s) => s.id === pSub.id)) {
      baseSubjects.push(clone(pSub));
    }
  }

  return baseSubjects;
}

function createFreshStudentAchievements(): Achievement[] {
  return clone(initialAchievements).map((ach) => ({
    ...ach,
    progress: 0,
    unlocked: false,
    unlockedAt: undefined
  }));
}

function createFreshStudentRoadmaps(): SkillRoadmap[] {
  return clone(initialRoadmaps).map((rm) => ({
    ...rm,
    nodes: rm.nodes.map((node, idx) => ({
      ...node,
      status: idx === 0 || node.prerequisites.length === 0 ? 'available' : 'locked'
    }))
  }));
}

class DatabaseService {
  private state: PersistedState;
  private readonly dataFilePath: string;

  constructor() {
    const customDataDir = process.env.LEARNOS_DATA_DIR?.trim();
    // Never write directly to server/data/learnos.json so the repository seed file remains untouched.
    this.dataFilePath = customDataDir
      ? path.join(path.resolve(customDataDir), 'learnos.json')
      : path.join(os.homedir(), '.learnos', 'data', 'learnos.json');
    this.state = this.loadState();
  }

  private getDefaultState(): PersistedState {
    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      auth: null,
      user: clone(initialUser),
      subjects: clone(initialSubjects),
      tasks: clone(initialTasks),
      schedules: clone(initialSchedules),
      revisions: clone(initialRevisions),
      notes: clone(initialNotes),
      quizzes: clone(initialQuizzes),
      flashcards: clone(initialFlashcards),
      mockExams: clone(initialMockExams),
      pyqs: clone(initialPYQs),
      codingProblems: clone(initialCodingProblems),
      roadmaps: clone(initialRoadmaps),
      interviews: {},
      achievements: clone(initialAchievements),
      quizHistory: [],
      studySessions: [],
      savedCode: {},
      solvedProblemIds: [],
      aiConversations: {},
      accounts: {}
    };
  }

  private loadState(): PersistedState {
    const defaults = this.getDefaultState();
    const sourcePath = fs.existsSync(this.dataFilePath)
      ? this.dataFilePath
      : fs.existsSync(REPO_SEED_FILE_PATH)
        ? REPO_SEED_FILE_PATH
        : null;

    try {
      if (!sourcePath) {
        this.persistState(defaults);
        return defaults;
      }

      const raw = fs.readFileSync(sourcePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      const mergedSubjects = mergeSubjectsWithCurriculum(parsed.subjects);
      const mergedQuizzes =
        Array.isArray(parsed.quizzes) && parsed.quizzes.length >= initialQuizzes.length
          ? parsed.quizzes
          : clone(initialQuizzes);
      const mergedMockExams =
        Array.isArray(parsed.mockExams) && parsed.mockExams.length >= initialMockExams.length
          ? parsed.mockExams
          : clone(initialMockExams);

      const state: PersistedState = {
        version: 2,
        updatedAt: parsed.updatedAt || defaults.updatedAt,
        auth: parsed.auth ?? defaults.auth,
        user: { ...defaults.user, ...(parsed.user || {}) },
        subjects: mergedSubjects,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaults.tasks,
        schedules: Array.isArray(parsed.schedules) ? parsed.schedules : defaults.schedules,
        revisions: Array.isArray(parsed.revisions) ? parsed.revisions : defaults.revisions,
        notes: Array.isArray(parsed.notes) ? parsed.notes : defaults.notes,
        quizzes: mergedQuizzes,
        flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : defaults.flashcards,
        mockExams: mergedMockExams,
        pyqs: Array.isArray(parsed.pyqs) ? parsed.pyqs : defaults.pyqs,
        codingProblems: Array.isArray(parsed.codingProblems) ? parsed.codingProblems : defaults.codingProblems,
        roadmaps: Array.isArray(parsed.roadmaps) ? parsed.roadmaps : defaults.roadmaps,
        interviews: parsed.interviews && typeof parsed.interviews === 'object' ? parsed.interviews : {},
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : defaults.achievements,
        quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
        studySessions: Array.isArray(parsed.studySessions) ? parsed.studySessions : [],
        savedCode: parsed.savedCode && typeof parsed.savedCode === 'object' ? parsed.savedCode : {},
        solvedProblemIds: Array.isArray(parsed.solvedProblemIds) ? parsed.solvedProblemIds : [],
        aiConversations:
          parsed.aiConversations && typeof parsed.aiConversations === 'object' ? parsed.aiConversations : {},
        accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {}
      };

      // Ensure primary auth user is also indexed in state.accounts if present
      if (state.auth && !state.accounts![state.auth.userId]) {
        const completedIds: string[] = [];
        for (const sub of state.subjects) {
          for (const unit of sub.units) {
            for (const top of unit.topics) {
              if (top.isCompleted) completedIds.push(top.id);
            }
          }
        }
        state.accounts![state.auth.userId] = {
          auth: clone(state.auth),
          user: clone(state.user),
          tasks: clone(state.tasks),
          schedules: clone(state.schedules),
          revisions: clone(state.revisions),
          notes: clone(state.notes),
          flashcards: clone(state.flashcards),
          roadmaps: clone(state.roadmaps),
          interviews: clone(state.interviews),
          achievements: clone(state.achievements),
          completedTopicIds: completedIds,
          customTopics: [],
          quizHistory: clone(state.quizHistory || []),
          studySessions: clone(state.studySessions || []),
          savedCode: clone(state.savedCode || {}),
          solvedProblemIds: clone(state.solvedProblemIds || [])
        };
      }

      if (!fs.existsSync(this.dataFilePath)) {
        this.persistState(state);
      }
      return state;
    } catch (error) {
      console.error('[DB] Failed to load persisted state, falling back to seed state:', error);
      return defaults;
    }
  }

  private persistState(state: PersistedState = this.state): void {
    // Safety guard: never overwrite the repository's server/data/learnos.json
    const targetFile =
      path.resolve(this.dataFilePath) === REPO_SEED_FILE_PATH
        ? path.join(os.homedir(), '.learnos', 'data', 'learnos.json')
        : this.dataFilePath;

    const dir = path.dirname(targetFile);
    fs.mkdirSync(dir, { recursive: true });
    state.updatedAt = new Date().toISOString();
    const tempPath = `${targetFile}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
    try {
      fs.renameSync(tempPath, targetFile);
    } catch {
      fs.copyFileSync(tempPath, targetFile);
      fs.unlinkSync(tempPath);
    }
  }

  private isSecondaryAccount(userId?: string): userId is string {
    if (!userId) return false;
    return Boolean(this.state.accounts && this.state.accounts[userId]);
  }

  private getAccount(userId?: string): UserAccountRecord | null {
    if (!userId || !this.state.accounts) return null;
    return this.state.accounts[userId] || null;
  }

  private syncPrimaryToAccount(): void {
    // Only sync top-level state if the primary auth user does not yet have an isolated account record
    if (!this.state.auth || !this.state.accounts) return;
    const primaryId = this.state.auth.userId;
    if (this.state.accounts[primaryId]) return;
    const completedIds: string[] = [];
    for (const sub of this.state.subjects) {
      for (const unit of sub.units) {
        for (const top of unit.topics) {
          if (top.isCompleted) completedIds.push(top.id);
        }
      }
    }
    this.state.accounts[primaryId] = {
      auth: clone(this.state.auth),
      user: clone(this.state.user),
      tasks: clone(this.state.tasks),
      schedules: clone(this.state.schedules),
      revisions: clone(this.state.revisions),
      notes: clone(this.state.notes),
      flashcards: clone(this.state.flashcards),
      roadmaps: clone(this.state.roadmaps),
      interviews: clone(this.state.interviews),
      achievements: clone(this.state.achievements),
      completedTopicIds: completedIds,
      customTopics: [],
      quizHistory: clone(this.state.quizHistory || []),
      studySessions: clone(this.state.studySessions || []),
      savedCode: clone(this.state.savedCode || {}),
      solvedProblemIds: clone(this.state.solvedProblemIds || [])
    };
  }

  getStorageInfo() {
    return {
      driver: 'json-file',
      path: this.dataFilePath,
      updatedAt: this.state.updatedAt
    };
  }

  // Auth & Multi-User Accounts
  getAuth(userId?: string): AuthCredentials | null {
    if (userId && this.state.accounts?.[userId]) {
      return clone(this.state.accounts[userId].auth);
    }
    return this.state.auth ? clone(this.state.auth) : null;
  }

  getAuthByEmail(email: string): AuthCredentials | null {
    const normalized = email.trim().toLowerCase();
    if (this.state.auth && this.state.auth.email.toLowerCase() === normalized) {
      return clone(this.state.auth);
    }
    if (this.state.accounts) {
      for (const record of Object.values(this.state.accounts)) {
        if (record.auth.email.toLowerCase() === normalized) {
          return clone(record.auth);
        }
      }
    }
    return null;
  }

  setAuth(auth: AuthCredentials): AuthCredentials {
    this.state.auth = clone(auth);
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(this.state.auth);
  }

  registerAccount(auth: AuthCredentials, profileData: Partial<User>): User {
    if (!this.state.accounts) {
      this.state.accounts = {};
    }

    const hasExistingPrimary = Boolean(this.state.auth);
    const newUser: User = {
      ...clone(initialUser),
      id: auth.userId,
      name: profileData.name || 'Student',
      email: auth.email,
      university: profileData.university ?? '',
      degree: profileData.degree ?? 'B.Tech',
      branch: profileData.branch ?? (profileData.major || 'Computer Science & Engineering'),
      major: profileData.major || profileData.branch || 'Computer Science & Engineering',
      semester: typeof profileData.semester === 'number' ? profileData.semester : 5,
      subjects: profileData.subjects || [
        'Data Structures & Algorithms',
        'Operating Systems',
        'Database Management Systems',
        'Computer Networks',
        'Discrete Mathematics',
        'Artificial Intelligence & Machine Learning'
      ],
      learningInterests: profileData.learningInterests || ['Algorithms', 'System Design'],
      careerInterests: profileData.careerInterests || [profileData.dreamRole || 'Software Engineer'],
      onboardingComplete: Boolean(profileData.onboardingComplete),
      targetGpa: typeof profileData.targetGpa === 'number' ? profileData.targetGpa : 9.0,
      currentGpa: typeof profileData.currentGpa === 'number' ? profileData.currentGpa : 0,
      streakDays: 1,
      totalStudyHours: 0,
      quizzesCompleted: 0,
      problemsSolved: 0,
      dreamRole: profileData.dreamRole || 'Software Engineer',
      avatarUrl: profileData.avatarUrl || '',
      createdAt: auth.createdAt
    };

    const starterTask: PlannerTask = {
      id: `tsk_${Date.now()}`,
      title: 'Explore College Tutor & complete your first CS topic',
      subjectId: 'sub_dsa',
      subjectName: 'Data Structures & Algorithms',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      priority: 'high',
      status: 'todo',
      category: 'reading'
    };

    const accountRecord: UserAccountRecord = {
      auth: clone(auth),
      user: clone(newUser),
      tasks: [starterTask],
      schedules: clone(initialSchedules),
      revisions: [],
      notes: clone(initialNotes),
      flashcards: clone(initialFlashcards).map((fc) => ({ ...fc, mastered: false, timesReviewed: 0 })),
      roadmaps: createFreshStudentRoadmaps(),
      interviews: {},
      achievements: createFreshStudentAchievements(),
      completedTopicIds: [],
      customTopics: [],
      quizHistory: [],
      studySessions: [],
      savedCode: {},
      solvedProblemIds: []
    };

    this.state.accounts[auth.userId] = accountRecord;

    if (!hasExistingPrimary) {
      this.state.auth = clone(auth);
      this.state.user = clone(newUser);
    }

    this.persistState();
    return clone(newUser);
  }

  // User
  getUser(userId?: string): User {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].user);
    }
    return clone(this.state.user);
  }

  updateUser(updates: Partial<User>, userId?: string): User {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as Partial<User>;

    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      acc.user = { ...acc.user, ...cleanUpdates };
      this.recomputeAchievements(userId);
      this.persistState();
      return clone(acc.user);
    }

    this.state.user = { ...this.state.user, ...cleanUpdates };
    this.recomputeAchievements();
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(this.state.user);
  }

  // Subjects & Topics
  getSubjects(userId?: string): Subject[] {
    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      const subjects = clone(initialSubjects);
      const completedSet = new Set(acc.completedTopicIds || []);
      for (const sub of subjects) {
        for (const unit of sub.units) {
          for (const top of unit.topics) {
            top.isCompleted = completedSet.has(top.id);
          }
        }
      }
      for (const custom of acc.customTopics || []) {
        const sub = subjects.find((s) => s.id === custom.subjectId);
        if (sub) {
          let unit = sub.units.find((u) => u.unitNumber === custom.unitNumber);
          if (!unit) {
            unit = {
              id: `unit_${custom.subjectId}_${custom.unitNumber}`,
              unitNumber: custom.unitNumber,
              title: custom.unitTitle || `Unit ${custom.unitNumber}`,
              description: 'Custom University Syllabus Unit',
              topics: []
            };
            sub.units.push(unit);
          }
          if (!unit.topics.some((t) => t.id === custom.topic.id)) {
            unit.topics.push({
              ...clone(custom.topic),
              isCompleted: completedSet.has(custom.topic.id)
            });
          }
        }
      }
      return subjects;
    }
    return clone(this.state.subjects);
  }

  getSubjectById(id: string, userId?: string): Subject | undefined {
    return this.getSubjects(userId).find((s) => s.id === id);
  }

  toggleTopicCompletion(subjectId: string, topicId: string, userId?: string): Topic | undefined {
    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      const subjects = this.getSubjects(userId);
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) return undefined;
      for (const unit of subject.units) {
        const topic = unit.topics.find((t) => t.id === topicId);
        if (topic) {
          const isNowCompleted = !topic.isCompleted;
          topic.isCompleted = isNowCompleted;
          const set = new Set(acc.completedTopicIds || []);
          if (isNowCompleted) {
            set.add(topicId);
            // Also schedule spaced repetition review if not present
            if (!acc.revisions.some((r) => r.topicId === topicId)) {
              acc.revisions.push({
                id: `rev_${Date.now()}`,
                topicId,
                topicTitle: topic.title,
                subjectName: subject.name,
                stage: 1,
                lastReviewed: new Date().toISOString().split('T')[0],
                nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                dueToday: true
              });
            }
          } else {
            set.delete(topicId);
          }
          acc.completedTopicIds = Array.from(set);
          this.recomputeAchievements(userId);
          this.persistState();
          return clone(topic);
        }
      }
      return undefined;
    }

    const subject = this.state.subjects.find((s) => s.id === subjectId);
    if (!subject) return undefined;
    for (const unit of subject.units) {
      const topic = unit.topics.find((t) => t.id === topicId);
      if (topic) {
        topic.isCompleted = !topic.isCompleted;
        if (topic.isCompleted && !this.state.revisions.some((r) => r.topicId === topicId)) {
          this.state.revisions.push({
            id: `rev_${Date.now()}`,
            topicId,
            topicTitle: topic.title,
            subjectName: subject.name,
            stage: 1,
            lastReviewed: new Date().toISOString().split('T')[0],
            nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            dueToday: true
          });
        }
        this.recomputeAchievements();
        this.syncPrimaryToAccount();
        this.persistState();
        return clone(topic);
      }
    }
    return undefined;
  }

  addCustomTopic(
    subjectId: string,
    payload: {
      unitNumber?: number;
      unitTitle?: string;
      title: string;
      estimatedMinutes?: number;
      content: string;
      keyPoints?: string[];
      subtopics?: string[];
      learningObjectives?: string[];
    },
    userId?: string
  ): Topic | undefined {
    const unitNumber = payload.unitNumber && payload.unitNumber > 0 ? payload.unitNumber : 1;
    const newTopic: Topic = {
      id: `top_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: payload.title.trim(),
      estimatedMinutes: payload.estimatedMinutes || 35,
      content: payload.content.trim(),
      keyPoints: payload.keyPoints?.length ? payload.keyPoints : ['Custom university syllabus topic'],
      subtopics: payload.subtopics || [],
      learningObjectives: payload.learningObjectives || [],
      isCompleted: false
    };

    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      acc.customTopics = acc.customTopics || [];
      acc.customTopics.push({
        subjectId,
        unitNumber,
        unitTitle: payload.unitTitle,
        topic: newTopic
      });
      this.persistState();
      return clone(newTopic);
    }

    const subject = this.state.subjects.find((s) => s.id === subjectId);
    if (!subject) return undefined;
    let unit = subject.units.find((u) => u.unitNumber === unitNumber);
    if (!unit) {
      unit = {
        id: `unit_${subjectId}_${unitNumber}_${Date.now()}`,
        unitNumber,
        title: payload.unitTitle?.trim() || `Unit ${unitNumber}: University Custom Module`,
        description: 'Custom university curriculum unit',
        topics: []
      };
      subject.units.push(unit);
    }
    unit.topics.push(newTopic);
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(newTopic);
  }

  // Planner Tasks
  getTasks(userId?: string): PlannerTask[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].tasks);
    }
    return clone(this.state.tasks);
  }

  createTask(task: Omit<PlannerTask, 'id'>, userId?: string): PlannerTask {
    const newTask: PlannerTask = { ...task, id: `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    if (this.isSecondaryAccount(userId)) {
      this.state.accounts![userId].tasks.unshift(newTask);
      this.persistState();
      return clone(newTask);
    }
    this.state.tasks.unshift(newTask);
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(newTask);
  }

  updateTask(id: string, updates: Partial<PlannerTask>, userId?: string): PlannerTask | undefined {
    const list = this.isSecondaryAccount(userId) ? this.state.accounts![userId].tasks : this.state.tasks;
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates, id };
    if (!this.isSecondaryAccount(userId)) this.syncPrimaryToAccount();
    this.persistState();
    return clone(list[idx]);
  }

  deleteTask(id: string, userId?: string): boolean {
    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      const len = acc.tasks.length;
      acc.tasks = acc.tasks.filter((t) => t.id !== id);
      if (acc.tasks.length !== len) {
        this.persistState();
        return true;
      }
      return false;
    }
    const len = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    if (this.state.tasks.length !== len) {
      this.syncPrimaryToAccount();
      this.persistState();
      return true;
    }
    return false;
  }

  // Schedule & Revisions
  getSchedules(userId?: string): ScheduleItem[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].schedules);
    }
    return clone(this.state.schedules);
  }

  createSchedule(item: Omit<ScheduleItem, 'id'>, userId?: string): ScheduleItem {
    const newItem: ScheduleItem = { ...item, id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    if (this.isSecondaryAccount(userId)) {
      this.state.accounts![userId].schedules.push(newItem);
      this.persistState();
      return clone(newItem);
    }
    this.state.schedules.push(newItem);
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(newItem);
  }

  deleteSchedule(id: string, userId?: string): boolean {
    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      const len = acc.schedules.length;
      acc.schedules = acc.schedules.filter((s) => s.id !== id);
      if (acc.schedules.length !== len) {
        this.persistState();
        return true;
      }
      return false;
    }
    const len = this.state.schedules.length;
    this.state.schedules = this.state.schedules.filter((s) => s.id !== id);
    if (this.state.schedules.length !== len) {
      this.syncPrimaryToAccount();
      this.persistState();
      return true;
    }
    return false;
  }

  getRevisions(userId?: string): RevisionItem[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].revisions);
    }
    return clone(this.state.revisions);
  }

  completeRevision(id: string, userId?: string): RevisionItem | undefined {
    const list = this.isSecondaryAccount(userId) ? this.state.accounts![userId].revisions : this.state.revisions;
    const rev = list.find((r) => r.id === id);
    if (!rev) return undefined;
    rev.stage = Math.min(5, rev.stage + 1);
    rev.lastReviewed = new Date().toISOString().split('T')[0];
    const intervals = [1, 3, 7, 14, 30];
    const daysToAdd = intervals[rev.stage - 1] || 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    rev.nextReviewDate = nextDate.toISOString().split('T')[0];
    rev.dueToday = false;
    if (!this.isSecondaryAccount(userId)) this.syncPrimaryToAccount();
    this.persistState();
    return clone(rev);
  }

  // Study Sessions
  getStudySessions(userId?: string): StudySession[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].studySessions || []);
    }
    return clone(this.state.studySessions || []);
  }

  logStudySession(minutes: number, mode: StudySession['mode'] = 'focus', subject?: string, userId?: string): { user: User; session: StudySession } {
    const session: StudySession = {
      id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      minutes,
      mode,
      subject,
      createdAt: new Date().toISOString()
    };

    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      acc.studySessions = acc.studySessions || [];
      acc.studySessions.unshift(session);
      acc.user.totalStudyHours = Number((acc.user.totalStudyHours + minutes / 60).toFixed(2));
      this.recomputeAchievements(userId);
      this.persistState();
      return { user: clone(acc.user), session: clone(session) };
    }

    this.state.studySessions = this.state.studySessions || [];
    this.state.studySessions.unshift(session);
    this.state.user.totalStudyHours = Number((this.state.user.totalStudyHours + minutes / 60).toFixed(2));
    this.recomputeAchievements();
    this.syncPrimaryToAccount();
    this.persistState();
    return { user: clone(this.state.user), session: clone(session) };
  }

  // Notes
  getNotes(userId?: string): Note[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].notes);
    }
    return clone(this.state.notes);
  }

  createNote(note: Omit<Note, 'id' | 'updatedAt'>, userId?: string): Note {
    const newNote: Note = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      updatedAt: new Date().toISOString()
    };
    if (this.isSecondaryAccount(userId)) {
      this.state.accounts![userId].notes.unshift(newNote);
      this.recomputeAchievements(userId);
      this.persistState();
      return clone(newNote);
    }
    this.state.notes.unshift(newNote);
    this.recomputeAchievements();
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(newNote);
  }

  updateNote(id: string, updates: Partial<Note>, userId?: string): Note | undefined {
    const list = this.isSecondaryAccount(userId) ? this.state.accounts![userId].notes : this.state.notes;
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates, id, updatedAt: new Date().toISOString() };
    if (!this.isSecondaryAccount(userId)) this.syncPrimaryToAccount();
    this.persistState();
    return clone(list[idx]);
  }

  deleteNote(id: string, userId?: string): boolean {
    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      const len = acc.notes.length;
      acc.notes = acc.notes.filter((n) => n.id !== id);
      if (acc.notes.length !== len) {
        this.persistState();
        return true;
      }
      return false;
    }
    const len = this.state.notes.length;
    this.state.notes = this.state.notes.filter((n) => n.id !== id);
    if (this.state.notes.length !== len) {
      this.syncPrimaryToAccount();
      this.persistState();
      return true;
    }
    return false;
  }

  // Exams & Quizzes
  getQuizzes(): QuizQuestion[] {
    return clone(this.state.quizzes);
  }

  getFlashcards(userId?: string): Flashcard[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].flashcards);
    }
    return clone(this.state.flashcards);
  }

  createFlashcard(card: Omit<Flashcard, 'id' | 'mastered' | 'timesReviewed'>, userId?: string): Flashcard {
    const newCard: Flashcard = {
      ...card,
      id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mastered: false,
      timesReviewed: 0
    };
    if (this.isSecondaryAccount(userId)) {
      this.state.accounts![userId].flashcards.unshift(newCard);
      this.persistState();
      return clone(newCard);
    }
    this.state.flashcards.unshift(newCard);
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(newCard);
  }

  toggleFlashcardMastery(id: string, userId?: string): Flashcard | undefined {
    const list = this.isSecondaryAccount(userId) ? this.state.accounts![userId].flashcards : this.state.flashcards;
    const card = list.find((c) => c.id === id);
    if (!card) return undefined;
    card.mastered = !card.mastered;
    card.timesReviewed += 1;
    if (this.isSecondaryAccount(userId)) {
      this.recomputeAchievements(userId);
    } else {
      this.recomputeAchievements();
      this.syncPrimaryToAccount();
    }
    this.persistState();
    return clone(card);
  }

  getMockExams(): MockExam[] {
    return clone(this.state.mockExams);
  }

  getPYQs(): PreviousYearQuestion[] {
    return clone(this.state.pyqs);
  }

  getQuizHistory(userId?: string): QuizAttempt[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].quizHistory || []);
    }
    return clone(this.state.quizHistory || []);
  }

  recordQuizAttempt(
    attempt: Omit<QuizAttempt, 'id' | 'createdAt'>,
    userId?: string
  ): { attempt: QuizAttempt; user: User } {
    const entry: QuizAttempt = {
      ...attempt,
      id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      acc.quizHistory = acc.quizHistory || [];
      acc.quizHistory.unshift(entry);
      acc.user.quizzesCompleted += 1;
      this.recomputeAchievements(userId);
      this.persistState();
      return { attempt: clone(entry), user: clone(acc.user) };
    }

    this.state.quizHistory = this.state.quizHistory || [];
    this.state.quizHistory.unshift(entry);
    this.state.user.quizzesCompleted += 1;
    this.recomputeAchievements();
    this.syncPrimaryToAccount();
    this.persistState();
    return { attempt: clone(entry), user: clone(this.state.user) };
  }

  // Coding Lab
  getCodingProblems(): CodingProblem[] {
    return clone(this.state.codingProblems);
  }

  getCodingProblemBySlug(slug: string): CodingProblem | undefined {
    return clone(this.state.codingProblems.find((p) => p.slug === slug || p.id === slug));
  }

  getSavedCode(userId?: string): Record<string, SavedCodeRecord> {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].savedCode || {});
    }
    return clone(this.state.savedCode || {});
  }

  saveUserCode(problemId: string, language: string, code: string, solved = false, userId?: string): SavedCodeRecord {
    const key = `${problemId}:${language}`;
    const record: SavedCodeRecord = {
      problemId,
      language,
      code,
      solved,
      updatedAt: new Date().toISOString()
    };

    if (this.isSecondaryAccount(userId)) {
      const acc = this.state.accounts![userId];
      acc.savedCode = acc.savedCode || {};
      const wasSolved = acc.savedCode[key]?.solved;
      acc.savedCode[key] = record;
      if (solved) {
        acc.solvedProblemIds = acc.solvedProblemIds || [];
        if (!acc.solvedProblemIds.includes(problemId)) {
          acc.solvedProblemIds.push(problemId);
          acc.user.problemsSolved += 1;
        } else if (!wasSolved && acc.user.problemsSolved === 0) {
          acc.user.problemsSolved = acc.solvedProblemIds.length;
        }
      }
      this.recomputeAchievements(userId);
      this.persistState();
      return clone(record);
    }

    this.state.savedCode = this.state.savedCode || {};
    this.state.savedCode[key] = record;
    if (solved) {
      this.state.solvedProblemIds = this.state.solvedProblemIds || [];
      if (!this.state.solvedProblemIds.includes(problemId)) {
        this.state.solvedProblemIds.push(problemId);
        this.state.user.problemsSolved += 1;
      }
    }
    this.recomputeAchievements();
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(record);
  }

  getSolvedProblemIds(userId?: string): string[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].solvedProblemIds || []);
    }
    return clone(this.state.solvedProblemIds || []);
  }

  // Skills & Career
  getRoadmaps(userId?: string): SkillRoadmap[] {
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].roadmaps);
    }
    return clone(this.state.roadmaps);
  }

  updateSkillNodeStatus(roadmapId: string, nodeId: string, status: SkillRoadmap['nodes'][0]['status'], userId?: string): SkillRoadmap | undefined {
    const list = this.isSecondaryAccount(userId) ? this.state.accounts![userId].roadmaps : this.state.roadmaps;
    const roadmap = list.find((r) => r.id === roadmapId);
    if (!roadmap) return undefined;
    const node = roadmap.nodes.find((n) => n.id === nodeId);
    if (!node) return undefined;
    node.status = status;

    // Automatically unlock dependent nodes whose prerequisites are now mastered
    const masteredIds = new Set(roadmap.nodes.filter((n) => n.status === 'mastered').map((n) => n.id));
    for (const candidate of roadmap.nodes) {
      if (candidate.status === 'locked' && candidate.prerequisites.every((pre) => masteredIds.has(pre))) {
        candidate.status = 'available';
      }
    }

    if (this.isSecondaryAccount(userId)) {
      this.recomputeAchievements(userId);
    } else {
      this.recomputeAchievements();
      this.syncPrimaryToAccount();
    }
    this.persistState();
    return clone(roadmap);
  }

  createInterviewSession(role: string, level: string, firstQuestion: string, userId?: string): MockInterviewSession {
    const id = `int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const session: MockInterviewSession = {
      id,
      role,
      level,
      messages: [
        {
          sender: 'ai',
          text: firstQuestion,
          timestamp: new Date().toISOString()
        }
      ]
    };
    if (this.isSecondaryAccount(userId)) {
      this.state.accounts![userId].interviews[id] = session;
      this.persistState();
      return clone(session);
    }
    this.state.interviews[id] = session;
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(session);
  }

  getInterviewSession(id: string, userId?: string): MockInterviewSession | undefined {
    if (this.isSecondaryAccount(userId)) {
      const s = this.state.accounts![userId].interviews[id];
      return s ? clone(s) : undefined;
    }
    const session = this.state.interviews[id];
    return session ? clone(session) : undefined;
  }

  saveInterviewSession(session: MockInterviewSession, userId?: string): MockInterviewSession {
    if (this.isSecondaryAccount(userId)) {
      this.state.accounts![userId].interviews[session.id] = clone(session);
      this.persistState();
      return clone(session);
    }
    this.state.interviews[session.id] = clone(session);
    this.syncPrimaryToAccount();
    this.persistState();
    return clone(session);
  }

  // Achievements
  private recomputeAchievements(userId?: string): void {
    const user = this.isSecondaryAccount(userId) ? this.state.accounts![userId].user : this.state.user;
    const subjects = this.getSubjects(userId);
    const flashcards = this.isSecondaryAccount(userId) ? this.state.accounts![userId].flashcards : this.state.flashcards;
    const notes = this.isSecondaryAccount(userId) ? this.state.accounts![userId].notes : this.state.notes;
    const achievements = this.isSecondaryAccount(userId)
      ? this.state.accounts![userId].achievements
      : this.state.achievements;

    let completedTopics = 0;
    for (const sub of subjects) {
      for (const u of sub.units) {
        for (const t of u.topics) {
          if (t.isCompleted) completedTopics++;
        }
      }
    }
    const masteredCards = flashcards.filter((c) => c.mastered).length;

    for (const ach of achievements) {
      if (ach.id === 'ach_1') {
        ach.progress = Math.min(ach.maxProgress, user.streakDays);
      } else if (ach.id === 'ach_2') {
        ach.progress = Math.min(ach.maxProgress, user.problemsSolved);
      } else if (ach.id === 'ach_3') {
        ach.progress = Math.min(ach.maxProgress, completedTopics);
      } else if (ach.id === 'ach_4') {
        ach.progress = Math.min(ach.maxProgress, user.quizzesCompleted);
      } else if (ach.id === 'ach_5') {
        ach.progress = Math.min(ach.maxProgress, Math.round(user.totalStudyHours));
      } else if (ach.id === 'ach_6') {
        ach.progress = Math.min(ach.maxProgress, masteredCards + notes.length);
      }

      if (ach.progress >= ach.maxProgress && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString().split('T')[0];
      }
    }
  }

  getAchievements(userId?: string): Achievement[] {
    this.recomputeAchievements(userId);
    if (this.isSecondaryAccount(userId)) {
      return clone(this.state.accounts![userId].achievements);
    }
    return clone(this.state.achievements);
  }

  // AI Conversations
  private getUserConversationList(userId = 'default'): AiConversation[] {
    this.state.aiConversations = this.state.aiConversations || {};
    if (!Array.isArray(this.state.aiConversations[userId])) {
      this.state.aiConversations[userId] = [];
    }
    return this.state.aiConversations[userId];
  }

  getAiConversations(userId = 'default'): Omit<AiConversation, 'messages'>[] {
    const list = this.getUserConversationList(userId);
    return list.map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }));
  }

  createAiConversation(userId = 'default', title = 'New chat'): AiConversation {
    const list = this.getUserConversationList(userId);
    const now = new Date().toISOString();
    const conv: AiConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim() || 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    list.unshift(conv);
    this.persistState();
    return clone(conv);
  }

  getAiConversation(userId = 'default', id: string): AiConversation | undefined {
    const list = this.getUserConversationList(userId);
    const found = list.find((c) => c.id === id);
    return found ? clone(found) : undefined;
  }

  addAiConversationMessage(
    userId = 'default',
    conversationId: string,
    message: AiConversationMessage
  ): AiConversation | undefined {
    const list = this.getUserConversationList(userId);
    const conv = list.find((c) => c.id === conversationId);
    if (!conv) return undefined;
    conv.messages.push(message);
    if (conv.messages.length === 1 && message.role === 'user') {
      conv.title = message.text.slice(0, 48);
    }
    conv.updatedAt = new Date().toISOString();
    this.persistState();
    return clone(conv);
  }
}

export const db = new DatabaseService();

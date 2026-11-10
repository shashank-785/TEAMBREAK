import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  User, Subject, PlannerTask, ScheduleItem, RevisionItem, 
  Note, QuizQuestion, Flashcard, MockExam, PreviousYearQuestion, 
  CodingProblem, SkillRoadmap, MockInterviewSession, Achievement 
} from '../types/index.js';
interface DatabaseSchema {
  user: User;
  auth?: {
    email: string;
    passwordHash: string;
    onboardingComplete: boolean;
  };
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
  interviews: MockInterviewSession[];
  achievements: Achievement[];
  aiHistory: { id: string; role: 'user' | 'assistant'; text: string; timestamp: string }[];
  aiConversations?: {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: { id: string; role: 'user' | 'assistant'; text: string; timestamp: string }[];
  }[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(process.env.LEARNOS_DATA_DIR || path.resolve(__dirname, '../../data'));
const DB_FILE = path.join(DATA_DIR, 'learnos.json');

class DatabaseService {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw) as DatabaseSchema;
        if (!Array.isArray(data.aiConversations)) {
          const legacyMessages = Array.isArray(data.aiHistory) ? data.aiHistory : [];
          data.aiConversations = legacyMessages.length
            ? [{
                id: 'conv_legacy_' + data.user.id,
                userId: data.user.id,
                title: legacyMessages.find(message => message.role === 'user')?.text.slice(0, 60) || 'Previous chat',
                createdAt: legacyMessages[0].timestamp,
                updatedAt: legacyMessages[legacyMessages.length - 1].timestamp,
                messages: legacyMessages
              }]
            : [];
          this.persist(data);
        }
        return data;
      }
    } catch (err) {
      console.warn('[DB] Failed reading db file, falling back to seed data:', err);
    }

    const defaultData: DatabaseSchema = {
      user: {
        id: 'usr_default_student',
        name: '',
        email: '',
        university: '',
        major: '',
        semester: 1,
        targetGpa: 10,
        currentGpa: 0,
        streakDays: 0,
        totalStudyHours: 0,
        quizzesCompleted: 0,
        problemsSolved: 0,
        dreamRole: '',
        avatarUrl: '',
        createdAt: new Date().toISOString()
      },
      subjects: [],
      tasks: [],
      schedules: [],
      revisions: [],
      notes: [],
      quizzes: [],
      flashcards: [],
      mockExams: [],
      pyqs: [],
      codingProblems: [],
      roadmaps: [],
      interviews: [],
      achievements: [],
      aiHistory: [],
      aiConversations: []
    };

    this.persist(defaultData);
    return defaultData;
  }

  private persist(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Persist error:', e);
    }
  }

  public save() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persist(this.data);
    }, 200);
  }

  getAuth() { return this.data.auth; }
  setAuth(auth: { email: string; passwordHash: string; onboardingComplete?: boolean }) {
    this.data.auth = { ...auth, onboardingComplete: auth.onboardingComplete ?? true };
    this.save();
  }

  // User
  getUser(): User { return this.data.user; }
  updateUser(updates: Partial<User>): User {
    this.data.user = { ...this.data.user, ...updates };
    this.save();
    return this.data.user;
  }

  // Subjects & Topics
  getSubjects(): Subject[] { return this.data.subjects; }
  getSubjectById(id: string): Subject | undefined {
    return this.data.subjects.find(s => s.id === id);
  }
  toggleTopicCompletion(topicId: string): boolean {
    for (const sub of this.data.subjects) {
      for (const unit of sub.units) {
        for (const topic of unit.topics) {
          if (topic.id === topicId) {
            topic.isCompleted = !topic.isCompleted;
            this.save();
            return !!topic.isCompleted;
          }
        }
      }
    }
    return false;
  }

  // Tasks
  getTasks(): PlannerTask[] { return this.data.tasks; }
  createTask(task: Omit<PlannerTask, 'id'>): PlannerTask {
    const newTask: PlannerTask = {
      ...task,
      id: 'tsk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
    };
    this.data.tasks.unshift(newTask);
    this.save();
    return newTask;
  }
  updateTask(id: string, updates: Partial<PlannerTask>): PlannerTask | null {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.tasks[idx] = { ...this.data.tasks[idx], ...updates };
    this.save();
    return this.data.tasks[idx];
  }
  deleteTask(id: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    if (this.data.tasks.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Schedules
  getSchedules(): ScheduleItem[] { return this.data.schedules; }
  createSchedule(sch: Omit<ScheduleItem, 'id'>): ScheduleItem {
    const newSch: ScheduleItem = {
      ...sch,
      id: 'sch_' + Date.now().toString(36)
    };
    this.data.schedules.push(newSch);
    this.save();
    return newSch;
  }
  deleteSchedule(id: string): boolean {
    this.data.schedules = this.data.schedules.filter(s => s.id !== id);
    this.save();
    return true;
  }

  // Revisions
  getRevisions(): RevisionItem[] { return this.data.revisions; }
  advanceRevision(id: string): RevisionItem | null {
    const item = this.data.revisions.find(r => r.id === id);
    if (!item) return null;
    item.stage = Math.min(5, item.stage + 1);
    item.lastReviewed = new Date().toISOString().split('T')[0];
    const intervals = [1, 3, 7, 14, 30];
    const daysToAdd = intervals[item.stage - 1] || 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    item.nextReviewDate = nextDate.toISOString().split('T')[0];
    item.dueToday = false;
    this.save();
    return item;
  }

  // Notes
  getNotes(): Note[] { return this.data.notes; }
  createNote(note: Omit<Note, 'id' | 'updatedAt'>): Note {
    const newNote: Note = {
      ...note,
      id: 'not_' + Date.now().toString(36),
      updatedAt: new Date().toISOString()
    };
    this.data.notes.unshift(newNote);
    this.save();
    return newNote;
  }
  updateNote(id: string, updates: Partial<Note>): Note | null {
    const idx = this.data.notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    this.data.notes[idx] = { 
      ...this.data.notes[idx], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.save();
    return this.data.notes[idx];
  }
  deleteNote(id: string): boolean {
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    this.save();
    return true;
  }

  // Exam Centre (Quizzes, Flashcards, Mock Exams, PYQs)
  getQuizzes(subject?: string): QuizQuestion[] {
    if (!subject || subject === 'All') return this.data.quizzes;
    return this.data.quizzes.filter(q => q.subject.toLowerCase().includes(subject.toLowerCase()));
  }
  getFlashcards(subject?: string): Flashcard[] {
    if (!subject || subject === 'All') return this.data.flashcards;
    return this.data.flashcards.filter(f => f.subject.toLowerCase().includes(subject.toLowerCase()));
  }
  toggleFlashcardMastery(id: string): Flashcard | null {
    const card = this.data.flashcards.find(f => f.id === id);
    if (!card) return null;
    card.mastered = !card.mastered;
    card.timesReviewed += 1;
    this.save();
    return card;
  }
  getMockExams(): MockExam[] { return this.data.mockExams; }
  getPYQs(subject?: string, year?: number): PreviousYearQuestion[] {
    return this.data.pyqs.filter(p => {
      const matchSub = !subject || subject === 'All' || p.subject.toLowerCase().includes(subject.toLowerCase());
      const matchYr = !year || p.year === year;
      return matchSub && matchYr;
    });
  }

  // Coding Problems
  getCodingProblems(): CodingProblem[] { return this.data.codingProblems; }
  getCodingProblemBySlug(slug: string): CodingProblem | undefined {
    return this.data.codingProblems.find(p => p.slug === slug || p.id === slug);
  }

  // Skill Roadmaps & Interviews
  getRoadmaps(): SkillRoadmap[] { return this.data.roadmaps; }
  updateSkillNode(roadmapId: string, nodeId: string, status: 'locked' | 'available' | 'in_progress' | 'mastered'): boolean {
    const map = this.data.roadmaps.find(r => r.id === roadmapId);
    if (!map) return false;
    const node = map.nodes.find(n => n.id === nodeId);
    if (!node) return false;
    node.status = status;
    this.save();
    return true;
  }
  getInterviews(): MockInterviewSession[] { return this.data.interviews; }
  saveInterview(interview: MockInterviewSession) {
    const idx = this.data.interviews.findIndex(i => i.id === interview.id);
    if (idx >= 0) {
      this.data.interviews[idx] = interview;
    } else {
      this.data.interviews.unshift(interview);
    }
    this.save();
  }

  // Achievements
  getAchievements(): Achievement[] { return this.data.achievements; }

  // AI Chat History
  getAiHistory() { return this.data.aiHistory; }
  addAiMessage(msg: { id: string; role: 'user' | 'assistant'; text: string; timestamp: string }) {
    this.data.aiHistory.push(msg);
    if (this.data.aiHistory.length > 50) this.data.aiHistory.shift();
    this.save();
  }

  getAiConversations(userId: string) {
    return (this.data.aiConversations || [])
      .filter(conversation => conversation.userId === userId)
      .map(({ messages: _messages, ...conversation }) => conversation)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  createAiConversation(userId: string, title = 'New chat') {
    const now = new Date().toISOString();
    const conversation = {
      id: 'conv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      userId,
      title: title.trim().slice(0, 80) || 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: [] as { id: string; role: 'user' | 'assistant'; text: string; timestamp: string }[]
    };
    this.data.aiConversations ||= [];
    this.data.aiConversations.unshift(conversation);
    this.save();
    return conversation;
  }

  getAiConversation(userId: string, conversationId: string) {
    return (this.data.aiConversations || []).find(
      conversation => conversation.userId === userId && conversation.id === conversationId
    ) || null;
  }

  addAiConversationMessage(
    userId: string,
    conversationId: string,
    message: { id: string; role: 'user' | 'assistant'; text: string; timestamp: string }
  ) {
    const conversation = this.getAiConversation(userId, conversationId);
    if (!conversation) return false;
    conversation.messages.push(message);
    if (conversation.messages.length > 100) conversation.messages.splice(0, conversation.messages.length - 100);
    if (message.role === 'user' && conversation.title === 'New chat') {
      conversation.title = message.text.trim().slice(0, 60) || 'New chat';
    }
    conversation.updatedAt = message.timestamp;
    this.save();
    return true;
  }

  deleteAiConversation(userId: string, conversationId: string) {
    const conversations = this.data.aiConversations || [];
    const remaining = conversations.filter(
      conversation => conversation.userId !== userId || conversation.id !== conversationId
    );
    if (remaining.length === conversations.length) return false;
    this.data.aiConversations = remaining;
    this.save();
    return true;
  }
}

export const db = new DatabaseService();

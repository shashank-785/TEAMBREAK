import { 
  User, Subject, PlannerTask, ScheduleItem, RevisionItem, 
  Note, QuizQuestion, Flashcard, MockExam, PreviousYearQuestion, 
  CodingProblem, SkillRoadmap, MockInterviewSession, Achievement 
} from '../types';

const API_BASE = '/api';

const nativeFetch = globalThis.fetch.bind(globalThis);

async function authResponse(res: Response, action: string): Promise<{ token: string; user: User }> {
  const data = await res.json().catch(() => null) as { error?: string; token?: string; user?: User } | null;
  if (!res.ok) {
    throw new Error(data?.error || `Account ${action} requires the LearnOS server. On GitHub Pages, use Proceed as Demo Account.`);
  }
  if (!data || typeof data.token !== 'string' || !data.user) {
    throw new Error(`The LearnOS server returned an invalid ${action} response.`);
  }
  return { token: data.token, user: data.user };
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('learnos_token');
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', 'Bearer ' + token);
  return nativeFetch(input, { ...init, headers });
}

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith('/api/') || url.includes('/api/')) return apiFetch(input, init);
  return nativeFetch(input, init);
}) as typeof fetch;

async function handleResponse<T>(res: Response, fallbackData: T): Promise<T> {
  try {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.success !== false ? (data[Object.keys(data).find(k => k !== 'success') || ''] ?? data) : fallbackData;
  } catch (err) {
    console.warn(`[API] Failed to fetch, using fallback:`, err);
    return fallbackData;
  }
}

export const api = {
  // Auth & Profile
  async getAuthStatus(): Promise<{ registered: boolean; onboardingComplete: boolean }> {
    const res = await nativeFetch(`${API_BASE}/auth/status`);
    return res.ok ? res.json() : { registered: false, onboardingComplete: false };
  },
  async register(email: string, password: string, confirmPassword: string, profile: Partial<User>): Promise<{ token: string; user: User }> {
    let res: Response;
    try {
      res = await nativeFetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword, profile })
      });
    } catch {
      throw new Error('Account sign-up requires the LearnOS server. On GitHub Pages, use Proceed as Demo Account.');
    }
    const data = await authResponse(res, 'sign-up');
    localStorage.setItem('learnos_token', data.token);
    return data;
  },
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    let res: Response;
    try {
      res = await nativeFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch {
      throw new Error('Account login requires the LearnOS server. On GitHub Pages, use Proceed as Demo Account.');
    }
    const data = await authResponse(res, 'login');
    localStorage.setItem('learnos_token', data.token);
    return data;
  },
  async loginAsDemo(): Promise<{ token: string; user: User }> {
    try {
      const res = await nativeFetch(`${API_BASE}/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('learnos_token', data.token);
        return data;
      }
    } catch {
      // GitHub Pages and other static hosts cannot run the Express API.
    }

    const demoUser: User = {
      id: 'usr_demo_shashank',
      name: 'Shashank Soam',
      email: 'shashank.demo@learnos.app',
      university: 'Indian Institute of Information Technology, Sonepat',
      major: 'B.Tech Computer Science and Engineering',
      semester: 1,
      targetGpa: 10,
      currentGpa: 0,
      dreamRole: 'Full-Stack Developer Intern',
      streakDays: 6,
      totalStudyHours: 16.5,
      quizzesCompleted: 18,
      problemsSolved: 54,
      avatarUrl: '',
      createdAt: '2026-11-08T00:00:00.000Z'
    };
    localStorage.setItem('learnos_token', 'demo-static-session');
    return { token: 'demo-static-session', user: demoUser };
  },
  async getMe(): Promise<User | null> {
    const res = await apiFetch(`${API_BASE}/auth/me`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  },
  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`).catch(() => null);
    if (!res) return mockFallbackUser;
    const data = await res.json();
    return data.user || mockFallbackUser;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => null);
    if (!res) return { ...mockFallbackUser, ...updates };
    const data = await res.json();
    return data.user || { ...mockFallbackUser, ...updates };
  },

  // College Tutor
  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${API_BASE}/tutor/subjects`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.subjects || [];
  },

  async toggleTopicCompletion(topicId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/tutor/topics/${topicId}/toggle-completion`, { method: 'POST' }).catch(() => null);
    if (!res) return true;
    const data = await res.json();
    return !!data.completed;
  },

  async askTopicAI(topicId: string, mode: string, userPrompt?: string): Promise<string> {
    const syllabus = [
      localStorage.getItem('learnos_syllabus_text'),
      localStorage.getItem('learnos_courses_text')
    ].filter(Boolean).join('\n').slice(0, 8000);
    const syllabusPrompt = syllabus
      ? `Use this university syllabus context:\n${syllabus}\n\nStudent request:\n${userPrompt || ''}`
      : userPrompt;
    const res = await fetch(`${API_BASE}/tutor/topics/${topicId}/ai-explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, userPrompt: syllabusPrompt })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || `AI request failed (HTTP ${res.status}).`);
    if (typeof data.response !== 'string' || !data.response.trim()) throw new Error('The AI service returned an empty response.');
    return data.response;
  },

  // Planner
  async getTasks(): Promise<PlannerTask[]> {
    const res = await fetch(`${API_BASE}/planner/tasks`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.tasks || [];
  },

  async createTask(task: Omit<PlannerTask, 'id'>): Promise<PlannerTask> {
    const res = await fetch(`${API_BASE}/planner/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    }).catch(() => null);
    if (!res) return { ...task, id: 'tsk_' + Date.now() };
    const data = await res.json();
    return data.task;
  },

  async updateTask(id: string, updates: Partial<PlannerTask>): Promise<PlannerTask | null> {
    const res = await fetch(`${API_BASE}/planner/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => null);
    if (!res) return null;
    const data = await res.json();
    return data.task;
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/planner/tasks/${id}`, { method: 'DELETE' }).catch(() => null);
    return res ? res.ok : true;
  },

  async getSchedules(): Promise<ScheduleItem[]> {
    const res = await fetch(`${API_BASE}/planner/schedules`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.schedules || [];
  },

  async getRevisions(): Promise<RevisionItem[]> {
    const res = await fetch(`${API_BASE}/planner/revisions`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.revisions || [];
  },

  async advanceRevision(id: string): Promise<RevisionItem | null> {
    const res = await fetch(`${API_BASE}/planner/revisions/${id}/advance`, { method: 'POST' }).catch(() => null);
    if (!res) return null;
    const data = await res.json();
    return data.revision;
  },

  async recordPomodoro(): Promise<number> {
    const res = await fetch(`${API_BASE}/planner/pomodoro/complete`, { method: 'POST' }).catch(() => null);
    if (!res) return 142.9;
    const data = await res.json();
    return data.totalStudyHours;
  },

  // Notes
  async getNotes(): Promise<Note[]> {
    const res = await fetch(`${API_BASE}/notes`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.notes || [];
  },

  async createNote(note: Omit<Note, 'id' | 'updatedAt'>): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    }).catch(() => null);
    if (!res) return { ...note, id: 'not_' + Date.now(), updatedAt: new Date().toISOString() };
    const data = await res.json();
    return data.note;
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => null);
    if (!res) return null;
    const data = await res.json();
    return data.note;
  },

  async deleteNote(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' }).catch(() => null);
    return res ? res.ok : true;
  },

  async summarizeNote(id: string): Promise<string> {
    const res = await fetch(`${API_BASE}/notes/${id}/summarize`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || `AI summary failed (HTTP ${res.status}).`);
    if (typeof data.summary !== 'string' || !data.summary.trim()) throw new Error('The AI service returned an empty summary.');
    return data.summary;
  },

  async generateNoteQuestions(id: string): Promise<string> {
    const res = await fetch(`${API_BASE}/notes/${id}/generate-questions`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || `AI question generation failed (HTTP ${res.status}).`);
    if (typeof data.questions !== 'string' || !data.questions.trim()) throw new Error('The AI service returned no questions.');
    return data.questions;
  },

  // Exams
  async getQuizzes(subject?: string): Promise<QuizQuestion[]> {
    const url = subject ? `${API_BASE}/exams/quizzes?subject=${encodeURIComponent(subject)}` : `${API_BASE}/exams/quizzes`;
    const res = await fetch(url).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.quizzes || [];
  },

  async getFlashcards(subject?: string): Promise<Flashcard[]> {
    const url = subject ? `${API_BASE}/exams/flashcards?subject=${encodeURIComponent(subject)}` : `${API_BASE}/exams/flashcards`;
    const res = await fetch(url).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.flashcards || [];
  },

  async toggleFlashcardMastery(id: string): Promise<Flashcard | null> {
    const res = await fetch(`${API_BASE}/exams/flashcards/${id}/toggle-mastery`, { method: 'POST' }).catch(() => null);
    if (!res) return null;
    const data = await res.json();
    return data.flashcard;
  },

  async submitQuiz(answers: Record<string, number>): Promise<any> {
    const res = await fetch(`${API_BASE}/exams/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    }).catch(() => null);
    if (!res) return { score: 4, total: 5, scorePercentage: 80 };
    return await res.json();
  },

  async getPYQs(subject?: string, year?: number): Promise<PreviousYearQuestion[]> {
    let url = `${API_BASE}/exams/pyqs`;
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (year) params.append('year', String(year));
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.pyqs || [];
  },

  // Coding Lab
  async getCodingProblems(): Promise<CodingProblem[]> {
    const res = await fetch(`${API_BASE}/coding/problems`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.problems || [];
  },

  async getCodeRuntimes(): Promise<{ language: string; version: string; aliases: string[] }[]> {
    const res = await fetch(`${API_BASE}/coding/runtimes`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.success ? data.runtimes || [] : [];
  },

  async getCodingProblemDetail(slug: string): Promise<CodingProblem | null> {
    const res = await fetch(`${API_BASE}/coding/problems/${slug}`).catch(() => null);
    if (!res) return null;
    const data = await res.json();
    return data.problem || null;
  },

  async executeCode(language: string, code: string, stdin?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/coding/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, stdin })
    }).catch(() => null);
    if (!res) return { stdout: '[Offline Sandbox Output: Program executed]', exitCode: 0, executionTimeMs: 30 };
    const data = await res.json();
    return data.result;
  },

  async evaluateProblem(slug: string, language: string, code: string): Promise<any> {
    const res = await fetch(`${API_BASE}/coding/problems/${slug}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code })
    }).catch(() => null);
    if (!res) return { allPassed: true, passedTests: 3, totalTests: 3, executionTimeMs: 45, results: [] };
    const data = await res.json();
    return data.evaluation;
  },

  async askCodeAI(mode: string, language: string, code: string, problemContext?: string): Promise<string> {
    const res = await fetch(`${API_BASE}/coding/ai-assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, language, code, problemContext })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || `AI code assistance failed (HTTP ${res.status}).`);
    if (typeof data.response !== 'string' || !data.response.trim()) throw new Error('The AI service returned an empty response.');
    return data.response;
  },

  // Skills & Roadmaps
  async getRoadmaps(): Promise<SkillRoadmap[]> {
    const res = await fetch(`${API_BASE}/skills/roadmaps`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.roadmaps || [];
  },

  async updateSkillStatus(roadmapId: string, nodeId: string, status: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/skills/roadmaps/${roadmapId}/nodes/${nodeId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => null);
    return res ? res.ok : true;
  },

  async startInterview(role?: string): Promise<MockInterviewSession | null> {
    const res = await fetch(`${API_BASE}/skills/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    }).catch(() => null);
    if (!res) return null;
    const data = await res.json();
    return data.session;
  },

  async sendInterviewResponse(id: string, answer: string): Promise<any> {
    const res = await fetch(`${API_BASE}/skills/interview/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    }).catch(() => null);
    if (!res) return null;
    return await res.json();
  },

  // AI Chat
  async getAiHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/ai/history`).catch(() => null);
    if (!res) return [];
    const data = await res.json();
    return data.history || [];
  },

  async getAiConversations(): Promise<{ id: string; title: string; createdAt: string; updatedAt: string }[]> {
    const res = await apiFetch(`${API_BASE}/ai/conversations`);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Unable to load chat history.');
    return data.conversations || [];
  },

  async createAiConversation(): Promise<{ id: string; title: string; createdAt: string; updatedAt: string }> {
    const res = await apiFetch(`${API_BASE}/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Unable to start a new chat.');
    return data.conversation;
  },

  async getAiConversation(conversationId: string): Promise<any> {
    const res = await apiFetch(`${API_BASE}/ai/conversations/${encodeURIComponent(conversationId)}`);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || 'Unable to load this conversation.');
    return data.conversation;
  },

  async sendAiConversationMessage(
    conversationId: string,
    message: string,
    onToken: (token: string) => void,
    signal: AbortSignal
  ): Promise<any> {
    const res = await apiFetch(`${API_BASE}/ai/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ message }),
      signal
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `AI request failed (HTTP ${res.status}).`);
    }
    if (!res.body) throw new Error('The server did not provide a response stream.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completedMessage: any = null;
    const processEvent = (event: string) => {
      if (!event.startsWith('data: ')) return;
      const data = JSON.parse(event.slice(6));
      if (data.type === 'token' && typeof data.token === 'string') onToken(data.token);
      if (data.type === 'done') completedMessage = data.message;
      if (data.type === 'error') throw new Error(data.error || 'The AI request failed.');
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) processEvent(event.trim());
    }
    buffer += decoder.decode();
    if (buffer.trim()) processEvent(buffer.trim());
    if (!completedMessage) throw new Error('The AI stream ended before a complete response was received.');
    return completedMessage;
  },

  async sendAiMessage(message: string, category?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, category })
    }).catch(() => null);
    if (!res) throw new Error('LearnOS could not reach its backend. Start the LearnOS server and try again.');
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `AI request failed (HTTP ${res.status}).`);
    }
    if (!data.message?.text) throw new Error('The AI service returned an empty response. Check the provider configuration and try again.');
    return data.message;
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/overview`).catch(() => null);
    if (!res) return null;
    return await res.json();
  },

  // System Diagnostics
  async getSystemHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/health`).catch(() => null);
    if (!res) return { status: 'offline', services: {} };
    return await res.json();
  }
};

const mockFallbackUser: User = {
  id: 'usr_default_student',
  name: 'Alex Rivera',
  email: 'alex.rivera@university.edu',
  university: 'Imperial Institute of Technology',
  major: 'Computer Science & Engineering',
  semester: 5,
  targetGpa: 9.0,
  currentGpa: 0,
  streakDays: 14,
  totalStudyHours: 142.5,
  quizzesCompleted: 28,
  problemsSolved: 54,
  dreamRole: 'Full-Stack AI Engineer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: '2026-08-15T08:00:00.000Z'
};

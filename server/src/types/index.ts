export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  degree?: string;
  branch?: string;
  major: string;
  semester: number;
  subjects?: string[];
  learningInterests?: string[];
  careerInterests?: string[];
  codingExperience?: string;
  syllabusCustomText?: string;
  onboardingComplete?: boolean;
  targetGpa: number;
  currentGpa: number;
  streakDays: number;
  totalStudyHours: number;
  quizzesCompleted: number;
  problemsSolved: number;
  dreamRole: string;
  avatarUrl: string;
  createdAt: string;
  preferences?: {
    dailyGoalHours?: number;
    preferredTutorStyle?: 'feynman' | 'socratic' | 'code' | 'analogy';
    examAlertDays?: number;
    universityBoard?: string;
  };
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  description: string;
  icon: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  topics: Topic[];
}

export interface PracticeQuestionItem {
  question: string;
  hint?: string;
  answer: string;
}

export interface RevisionResourceItem {
  title: string;
  type: 'formula' | 'summary' | 'cheatsheet' | 'reference';
  summary: string;
}

export interface Topic {
  id: string;
  title: string;
  estimatedMinutes: number;
  content: string;
  keyPoints: string[];
  subtopics?: string[];
  learningObjectives?: string[];
  codeExamples?: { language: string; code: string }[];
  practiceQuestions?: PracticeQuestionItem[];
  revisionResources?: RevisionResourceItem[];
  isCompleted?: boolean;
}

export interface PlannerTask {
  id: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed';
  category: 'assignment' | 'exam_prep' | 'reading' | 'coding';
}

export interface ScheduleItem {
  id: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  title: string;
  subject: string;
  location: string;
  type: 'lecture' | 'lab' | 'self_study' | 'revision';
}

export interface RevisionItem {
  id: string;
  topicId: string;
  topicTitle: string;
  subjectName: string;
  stage: number; // 1 to 5 (Spaced repetition intervals)
  lastReviewed: string;
  nextReviewDate: string;
  dueToday: boolean;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  folder?: string;
  content: string;
  tags: string[];
  summary?: string;
  keyConcepts?: string[];
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  subject: string;
  front: string;
  back: string;
  mastered: boolean;
  timesReviewed: number;
}

export interface MockExam {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  questions: QuizQuestion[];
}

export interface PreviousYearQuestion {
  id: string;
  subject: string;
  year: number;
  semester: string;
  questionNumber: string;
  marks: number;
  question: string;
  modelAnswer: string;
  keySteps: string[];
}

export interface CodingProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  sampleInput: string;
  sampleOutput: string;
  starterCode: {
    javascript: string;
    python: string;
    c: string;
  };
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
}

export interface SkillNode {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  prerequisites: string[];
  resources: string[];
  category: string;
}

export interface SkillRoadmap {
  id: string;
  title: string;
  role: string;
  description: string;
  nodes: SkillNode[];
}

export interface MockInterviewMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface MockInterviewSession {
  id: string;
  role: string;
  level: string;
  messages: MockInterviewMessage[];
  score?: number;
  feedback?: {
    technicalAccuracy: number;
    communication: number;
    problemSolving: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface QuizAttempt {
  id: string;
  subject: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  durationSeconds?: number;
  examTitle?: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  minutes: number;
  subject?: string;
  mode: 'focus' | 'revision' | 'coding' | 'exam';
  createdAt: string;
}

export interface SavedCodeRecord {
  problemId: string;
  language: string;
  code: string;
  updatedAt: string;
  solved?: boolean;
}

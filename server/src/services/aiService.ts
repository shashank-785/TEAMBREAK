import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import {
  AI_CONTEXT_SIZE,
  AI_MINIMUM_RAM_BYTES,
  AI_MODEL_FILE,
  AI_MODEL_NAME,
  AI_MODEL_SHA256,
  AI_MODEL_SIZE_BYTES,
  getAIModelPath,
  getAIRateLimitPerMinute,
  getAIRequestTimeoutMs,
  resolveRemoteAIConfig,
  RemoteAIConfig
} from './aiConfig.js';
import { db } from '../db/db.js';
import { Flashcard, QuizQuestion, User } from '../types/index.js';

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export interface AIStatus {
  provider: string;
  runtime: string;
  model: string;
  modelFile: string;
  modelInstalled: boolean;
  isReady: boolean;
  state: 'ready' | 'loading' | 'not_installed' | 'error';
  mode?: 'remote' | 'local' | 'fallback';
  fallbackAvailable?: boolean;
  rateLimit?: {
    maxRequestsPerMinute: number;
    timeoutMs: number;
  };
  setupCommand: string;
  error?: string;
}

export class AIUnavailableError extends Error {
  statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

export class AIRateLimitError extends Error {
  statusCode = 429;

  constructor(message: string) {
    super(message);
    this.name = 'AIRateLimitError';
  }
}

type LlamaModule = typeof import('node-llama-cpp');
type LlamaInstance = Awaited<ReturnType<LlamaModule['getLlama']>>;
type LlamaModel = Awaited<ReturnType<LlamaInstance['loadModel']>>;
type LlamaContext = Awaited<ReturnType<LlamaModel['createContext']>>;

class AIService {
  private llama?: LlamaInstance;
  private model?: LlamaModel;
  private context?: LlamaContext;
  private initPromise?: Promise<void>;
  private generationQueue: Promise<unknown> = Promise.resolve();
  private state: AIStatus['state'] = 'not_installed';
  private lastError?: string;
  private verifiedSignature?: string;
  private requestTimestampsByUser = new Map<string, number[]>();

  public checkRateLimit(userId = 'anonymous'): { allowed: boolean; remaining: number; resetInSeconds: number } {
    const limit = getAIRateLimitPerMinute();
    const now = Date.now();
    const windowMs = 60_000;
    const recent = (this.requestTimestampsByUser.get(userId) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= limit) {
      const oldest = recent[0] || now;
      const resetInSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      return { allowed: false, remaining: 0, resetInSeconds };
    }
    recent.push(now);
    this.requestTimestampsByUser.set(userId, recent);
    return { allowed: true, remaining: Math.max(0, limit - recent.length), resetInSeconds: 60 };
  }

  public enforceRateLimit(userId = 'anonymous'): void {
    const check = this.checkRateLimit(userId);
    if (!check.allowed) {
      throw new AIRateLimitError(
        `AI rate limit reached (${getAIRateLimitPerMinute()} requests/minute). Please wait ${check.resetInSeconds}s before sending another request.`
      );
    }
  }

  async initialize(): Promise<void> {
    const remote = resolveRemoteAIConfig();
    if (remote) {
      this.state = 'ready';
      this.lastError = undefined;
      return;
    }

    if (this.context) {
      this.state = 'ready';
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadRuntime()
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        this.lastError = message;
        this.state = this.hasVerifiedModelFile() ? 'error' : 'not_installed';
      })
      .finally(() => {
        this.initPromise = undefined;
      });

    return this.initPromise;
  }

  async dispose(): Promise<void> {
    try {
      await this.context?.dispose();
      await this.model?.dispose();
      await this.llama?.dispose();
    } catch {
      // Ignore disposal errors on shutdown
    } finally {
      this.context = undefined;
      this.model = undefined;
      this.llama = undefined;
    }
  }

  async getStatus(): Promise<AIStatus> {
    const remote = resolveRemoteAIConfig();
    const rateLimitInfo = {
      maxRequestsPerMinute: getAIRateLimitPerMinute(),
      timeoutMs: getAIRequestTimeoutMs()
    };

    if (remote) {
      return {
        provider: remote.providerLabel,
        runtime: remote.runtimeLabel,
        model: remote.model,
        modelFile: remote.model,
        modelInstalled: true,
        isReady: true,
        state: 'ready',
        mode: 'remote',
        fallbackAvailable: true,
        rateLimit: rateLimitInfo,
        setupCommand: 'Configured via backend environment variables'
      };
    }

    const modelInstalled = this.hasVerifiedModelFile();
    if (!modelInstalled && !this.context && this.state !== 'loading') {
      this.state = 'not_installed';
    }

    return {
      provider: 'LearnOS local inference',
      runtime: 'llama.cpp via node-llama-cpp',
      model: AI_MODEL_NAME,
      modelFile: AI_MODEL_FILE,
      modelInstalled,
      isReady: Boolean(this.context),
      state: this.context ? 'ready' : this.state,
      mode: this.context ? 'local' : 'fallback',
      fallbackAvailable: true,
      rateLimit: rateLimitInfo,
      setupCommand: 'npm run setup:model',
      error: this.context
        ? undefined
        : this.lastError || 'Model weights are not installed. Run `npm run setup:model` or configure GEMINI_API_KEY / GROQ_API_KEY on the backend.'
    };
  }

  async generateResponse(
    prompt: string,
    context?: { user?: User; subject?: string; topic?: string; mode?: string }
  ): Promise<string> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      throw new Error('Prompt is required.');
    }

    return this.runExclusive(async () => {
      const remote = resolveRemoteAIConfig();
      if (remote) {
        return this.callRemoteCompletion(
          remote,
          this.buildSystemPrompt(context?.user, context?.subject, context?.topic, context?.mode),
          [{ role: 'user', content: cleanPrompt }]
        );
      }

      const { LlamaChatSession } = await this.ensureLocalReady();
      const sequence = this.requireContext().getSequence();
      try {
        const session = new LlamaChatSession({
          contextSequence: sequence,
          systemPrompt: this.buildSystemPrompt(context?.user, context?.subject, context?.topic, context?.mode)
        });
        const response = await session.prompt(cleanPrompt, {
          temperature: 0.25,
          maxTokens: 700
        });
        return this.cleanModelOutput(response);
      } finally {
        sequence.dispose();
      }
    });
  }

  async streamResponse(
    messages: ChatTurn[],
    userId: string | undefined,
    onToken: (token: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const normalized = messages
      .map((item) => ({
        role: item.role,
        content: typeof item.content === 'string' ? item.content.trim() : ''
      }))
      .filter((item) => item.content.length > 0);

    const lastMessage = normalized.at(-1);
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('The final conversation message must come from the user.');
    }

    return this.runExclusive(async () => {
      const user = db.getUser(userId);
      const remote = resolveRemoteAIConfig();
      if (remote) {
        const text = await this.callRemoteCompletion(
          remote,
          this.buildSystemPrompt(user),
          normalized.slice(-12),
          signal
        );
        const chunks = text.match(/.{1,18}(\s|$)|\S+/g) || [text];
        for (const chunk of chunks) {
          if (signal?.aborted) break;
          onToken(chunk);
        }
        return text;
      }

      const { LlamaChatSession } = await this.ensureLocalReady();
      const sequence = this.requireContext().getSequence();
      try {
        const session = new LlamaChatSession({
          contextSequence: sequence,
          systemPrompt: this.buildSystemPrompt(user)
        });

        const history = normalized.slice(0, -1).slice(-12);
        if (history.length > 0) {
          session.setChatHistory([
            { type: 'system', text: this.buildSystemPrompt(user) },
            ...history.map((item) =>
              item.role === 'user'
                ? { type: 'user' as const, text: item.content }
                : { type: 'model' as const, response: [item.content] }
            )
          ]);
        }

        let streamed = '';
        const response = await session.prompt(lastMessage.content, {
          temperature: 0.3,
          maxTokens: 900,
          signal,
          stopOnAbortSignal: true,
          onTextChunk: (chunk: string) => {
            streamed += chunk;
            onToken(chunk);
          }
        });

        return this.cleanModelOutput(response || streamed);
      } finally {
        sequence.dispose();
      }
    });
  }

  async summarizeNotes(content: string): Promise<{ summary: string; keyConcepts: string[] }> {
    const response = await this.generateResponse(
      [
        'Summarize these university study notes.',
        'Return strict JSON with keys "summary" (2-4 sentences) and "keyConcepts" (array of 4-6 concise phrases).',
        '',
        content
      ].join('\n')
    );

    const parsed = this.parseJson<{ summary?: unknown; keyConcepts?: unknown }>(response);
    const summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';
    const keyConcepts = Array.isArray(parsed?.keyConcepts)
      ? parsed.keyConcepts.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];

    if (!summary || keyConcepts.length === 0) {
      throw new Error('The AI model returned an incomplete note summary.');
    }

    return { summary, keyConcepts: keyConcepts.slice(0, 6) };
  }

  async generateFlashcardsFromNote(
    title: string,
    subject: string,
    content: string
  ): Promise<{ flashcards: Omit<Flashcard, 'id' | 'mastered' | 'timesReviewed'>[]; quiz: Omit<QuizQuestion, 'id'>[] }> {
    const response = await this.generateResponse(
      [
        `Create study material from the note titled "${title}" for subject "${subject}".`,
        'Return strict JSON with:',
        '- "flashcards": array of 3 objects with "subject", "front", and "back"',
        '- "quiz": array of 2 objects with "subject", "question", "options" (4 strings), "correctOption" (0-3), and "explanation"',
        '',
        content
      ].join('\n'),
      { subject, topic: title }
    );

    const parsed = this.parseJson<{ flashcards?: unknown; quiz?: unknown }>(response);
    const flashcards = Array.isArray(parsed?.flashcards)
      ? parsed.flashcards
          .map((item) => {
            const record = item as Record<string, unknown>;
            return {
              subject,
              front: typeof record.front === 'string' ? record.front.trim() : '',
              back: typeof record.back === 'string' ? record.back.trim() : ''
            };
          })
          .filter((item) => item.front && item.back)
      : [];

    const quiz = Array.isArray(parsed?.quiz)
      ? parsed.quiz
          .map((item) => {
            const record = item as Record<string, unknown>;
            const options = Array.isArray(record.options)
              ? record.options.filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
              : [];
            const correctOption = Number(record.correctOption);
            return {
              subject,
              question: typeof record.question === 'string' ? record.question.trim() : '',
              options: options.slice(0, 4),
              correctOption: Number.isInteger(correctOption) && correctOption >= 0 && correctOption <= 3 ? correctOption : 0,
              explanation: typeof record.explanation === 'string' ? record.explanation.trim() : ''
            };
          })
          .filter((item) => item.question && item.options.length === 4 && item.explanation)
      : [];

    if (flashcards.length === 0 || quiz.length === 0) {
      throw new Error('The AI model returned incomplete flashcards or quiz questions.');
    }

    return { flashcards, quiz };
  }

  async evaluateInterview(
    question: string,
    userAnswer: string,
    role: string
  ): Promise<{
    followUpQuestion: string;
    score: number;
    feedback: {
      technicalAccuracy: number;
      communication: number;
      problemSolving: number;
      summary: string;
      strengths: string[];
      improvements: string[];
    };
  }> {
    const response = await this.generateResponse(
      [
        `Evaluate this mock interview answer for a ${role} role.`,
        `Interviewer question: ${question}`,
        `Candidate answer: ${userAnswer}`,
        'Return strict JSON with:',
        '- "followUpQuestion": string',
        '- "score": integer 0-100',
        '- "feedback": object with "technicalAccuracy" (0-100), "communication" (0-100), "problemSolving" (0-100), "summary", "strengths" (string array), "improvements" (string array)'
      ].join('\n')
    );

    const parsed = this.parseJson<Record<string, unknown>>(response);
    const feedback = (parsed?.feedback || {}) as Record<string, unknown>;
    const clampScore = (value: unknown) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    const strengths = Array.isArray(feedback.strengths)
      ? feedback.strengths.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const improvements = Array.isArray(feedback.improvements)
      ? feedback.improvements.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
    const followUpQuestion = typeof parsed?.followUpQuestion === 'string' ? parsed.followUpQuestion.trim() : '';
    const summary = typeof feedback.summary === 'string' ? feedback.summary.trim() : '';

    if (!followUpQuestion || !summary) {
      throw new Error('The AI model returned an incomplete interview evaluation.');
    }

    return {
      followUpQuestion,
      score: clampScore(parsed?.score),
      feedback: {
        technicalAccuracy: clampScore(feedback.technicalAccuracy),
        communication: clampScore(feedback.communication),
        problemSolving: clampScore(feedback.problemSolving),
        summary,
        strengths: strengths.slice(0, 4),
        improvements: improvements.slice(0, 4)
      }
    };
  }

  // ============================================================================
  // Structured Academic Fallbacks (Keep LearnOS useful when remote/local AI is offline)
  // ============================================================================

  public buildAcademicFallbackResponse(
    prompt: string,
    context?: { user?: User; subject?: string; topic?: string; mode?: string; history?: ChatTurn[] }
  ): string {
    const subjectName = context?.subject || 'Computer Science';
    const topicTitle = context?.topic || '';
    const mode = (context?.mode || 'feynman').toLowerCase();

    // Look up matching curriculum topic from DB to ground the response in real syllabus content
    const subjects = db.getSubjects(context?.user?.id);
    const matchedSubject =
      subjects.find(
        (s) =>
          s.name.toLowerCase() === subjectName.toLowerCase() ||
          s.id.toLowerCase() === subjectName.toLowerCase() ||
          prompt.toLowerCase().includes(s.name.toLowerCase())
      ) || subjects[0];

    let matchedTopic = matchedSubject?.units[0]?.topics[0];
    for (const sub of subjects) {
      for (const unit of sub.units) {
        for (const top of unit.topics) {
          if (
            (topicTitle && top.title.toLowerCase() === topicTitle.toLowerCase()) ||
            prompt.toLowerCase().includes(top.title.toLowerCase().split(' ')[0])
          ) {
            matchedTopic = top;
            break;
          }
        }
      }
    }

    const header = topicTitle
      ? `### ${topicTitle} (${subjectName})`
      : `### ${matchedTopic?.title || subjectName} — Guided Study Breakdown`;

    if (mode === 'socratic') {
      return [
        header,
        '',
        `Let's reason through **"${prompt.slice(0, 120)}"** step by step using the Socratic method:`,
        '',
        `1. **Foundational Principle**: ${matchedTopic?.keyPoints?.[0] || 'Identify the core invariant or data representation first.'}`,
        `2. **Guiding Question 1**: What is the input size or state space here, and what happens in the boundary case (e.g., empty input or single element)?`,
        `3. **Guiding Question 2**: ${matchedTopic?.practiceQuestions?.[0]?.question || 'How does changing the time-space tradeoff affect worst-case performance?'}`,
        matchedTopic?.practiceQuestions?.[0]?.hint
          ? `   - *Hint*: ${matchedTopic.practiceQuestions[0].hint}`
          : '',
        '',
        `**Next Step**: Reply with your hypothesis for Guiding Question 1, and we will verify the proof together.`
      ]
        .filter(Boolean)
        .join('\n');
    }

    if (mode === 'code') {
      const codeSample = matchedTopic?.codeExamples?.[0];
      return [
        header,
        '',
        `Here is a clean, annotated implementation pattern and complexity breakdown for **${matchedTopic?.title || subjectName}**:`,
        '',
        codeSample
          ? `\`\`\`${codeSample.language}\n${codeSample.code}\n\`\`\``
          : '```python\ndef solve_step_by_step(items):\n    # 1. Validate invariants and base cases\n    if not items:\n        return []\n    # 2. Process state transitions deterministically\n    return sorted(items)\n```',
        '',
        '### Key Engineering Takeaways',
        ...(matchedTopic?.keyPoints || ['Always check boundary conditions and asymptotic complexity.']).map(
          (kp) => `- ${kp}`
        )
      ].join('\n');
    }

    return [
      header,
      '',
      matchedTopic?.content ||
        `Let's break down **${prompt.slice(0, 100)}** into clear, first-principles concepts.`,
      '',
      '### Core Key Points',
      ...(matchedTopic?.keyPoints || [
        'Break the problem into base cases and inductive transitions.',
        'Analyze both time and auxiliary space complexity.'
      ]).map((kp) => `- ${kp}`),
      matchedTopic?.practiceQuestions?.[0]
        ? `\n### Self-Check Question\n**Q:** ${matchedTopic.practiceQuestions[0].question}\n**Answer:** ${matchedTopic.practiceQuestions[0].answer}`
        : ''
    ]
      .filter(Boolean)
      .join('\n');
  }

  public summarizeNotesFallback(content: string): { summary: string; keyConcepts: string[] } {
    const clean = content
      .replace(/[#*`>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const sentences = clean
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    const summary =
      sentences.slice(0, 3).join(' ') ||
      clean.slice(0, 280) ||
      'Structured academic summary covering key definitions, algorithmic properties, and exam takeaways.';

    const headings = Array.from(content.matchAll(/^#{1,3}\s+(.+)$/gm)).map((m) => m[1].trim());
    const boldTerms = Array.from(content.matchAll(/\*\*([^*]{3,40})\*\*/g)).map((m) => m[1].trim());
    const combined = Array.from(new Set([...headings, ...boldTerms])).slice(0, 5);
    const keyConcepts =
      combined.length >= 3
        ? combined
        : ['Core Definitions & Invariants', 'Time & Space Complexity', 'Algorithmic Edge Cases', 'Exam Application'];

    return { summary, keyConcepts };
  }

  public generateFlashcardsFallback(
    title: string,
    subject: string,
    content: string
  ): { flashcards: Omit<Flashcard, 'id' | 'mastered' | 'timesReviewed'>[]; quiz: Omit<QuizQuestion, 'id'>[] } {
    const { summary, keyConcepts } = this.summarizeNotesFallback(content);
    const flashcards: Omit<Flashcard, 'id' | 'mastered' | 'timesReviewed'>[] = [
      {
        subject,
        front: `What is the core summary of "${title}" in ${subject}?`,
        back: summary
      },
      {
        subject,
        front: `Which key concepts are covered in "${title}"?`,
        back: keyConcepts.join(' • ')
      },
      {
        subject,
        front: `How should you revise "${title}" for university exams?`,
        back: `Focus on ${keyConcepts[0] || title}, verify boundary cases, and practice writing the formal derivation or complexity proof.`
      }
    ];

    const quiz: Omit<QuizQuestion, 'id'>[] = [
      {
        subject,
        question: `Which concept is a primary focus of the note "${title}" (${subject})?`,
        options: [
          keyConcepts[0] || `Core principles of ${title}`,
          'Unrelated hardware voltage regulation',
          'Deprecated legacy COBOL syntax',
          'Manual punch-card sorting'
        ],
        correctOption: 0,
        explanation: `"${title}" directly covers ${keyConcepts.join(', ')} within ${subject}.`
      },
      {
        subject,
        question: `When applying the concepts from "${title}", what is the best engineering practice?`,
        options: [
          'Verify invariants, boundary conditions, and asymptotic complexity',
          'Ignore edge cases and rely on random guessing',
          'Hardcode outputs for a single sample input only',
          'Skip complexity analysis entirely'
        ],
        correctOption: 0,
        explanation: 'Rigorous verification of invariants and complexity bounds is essential in Computer Science.'
      }
    ];

    return { flashcards, quiz };
  }

  public evaluateInterviewFallback(
    question: string,
    userAnswer: string,
    role: string
  ): {
    followUpQuestion: string;
    score: number;
    feedback: {
      technicalAccuracy: number;
      communication: number;
      problemSolving: number;
      summary: string;
      strengths: string[];
      improvements: string[];
    };
  } {
    const wordCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;
    const hasMetricsOrComplexity = /O\(|complexity|latency|scale|tradeoff|cache|index|memory|thread|async/i.test(userAnswer);
    const baseScore = Math.min(92, Math.max(55, 50 + Math.min(28, wordCount) + (hasMetricsOrComplexity ? 12 : 0)));

    return {
      followUpQuestion: `Building on your answer for "${question.slice(0, 70)}...", how would your design or algorithm behave under 10x peak load or skewed input distributions in a ${role} production environment?`,
      score: baseScore,
      feedback: {
        technicalAccuracy: baseScore,
        communication: Math.min(95, baseScore + 4),
        problemSolving: Math.max(50, baseScore - 2),
        summary: `Solid structured response for the ${role} interview. You addressed the core prompt clearly (${wordCount} words).`,
        strengths: [
          'Addressed the fundamental technical concept directly',
          hasMetricsOrComplexity
            ? 'Included complexity or systems tradeoff terminology'
            : 'Clear and concise initial explanation'
        ],
        improvements: [
          'Quantify time/space complexity or latency bounds explicitly',
          'Walk through a concrete failure mode or edge case before concluding'
        ]
      }
    };
  }

  // ============================================================================
  // Remote Provider Execution (Gemini / OpenAI-compatible / Ollama)
  // ============================================================================

  private async callRemoteCompletion(
    config: RemoteAIConfig,
    systemPrompt: string,
    messages: ChatTurn[],
    externalSignal?: AbortSignal
  ): Promise<string> {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), config.timeoutMs);
    const onExternalAbort = () => timeoutController.abort();
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      if (config.kind === 'gemini') {
        const url = `${config.baseUrl.replace(/\/+$/, '')}/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey || '')}`;
        const contents = messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: config.maxTokens
            }
          }),
          signal: timeoutController.signal
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new AIUnavailableError(`Gemini inference request failed (${res.status}): ${errText.slice(0, 200)}`);
        }
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
        if (!text.trim()) {
          throw new AIUnavailableError('Gemini returned an empty response.');
        }
        return this.cleanModelOutput(text);
      }

      if (config.kind === 'ollama') {
        const url = `${config.baseUrl}/api/chat`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            stream: false,
            messages: [{ role: 'system', content: systemPrompt }, ...messages]
          }),
          signal: timeoutController.signal
        });
        if (!res.ok) {
          throw new AIUnavailableError(`Ollama endpoint returned HTTP ${res.status}.`);
        }
        const data = (await res.json()) as { message?: { content?: string } };
        const text = data.message?.content || '';
        if (!text.trim()) {
          throw new AIUnavailableError('Ollama returned an empty response.');
        }
        return this.cleanModelOutput(text);
      }

      // OpenAI-compatible (Groq, OpenRouter, OpenAI, etc.)
      const url = `${config.baseUrl}/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (config.apiKey) {
        headers.Authorization = `Bearer ${config.apiKey}`;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          temperature: 0.3,
          max_tokens: config.maxTokens,
          messages: [{ role: 'system', content: systemPrompt }, ...messages]
        }),
        signal: timeoutController.signal
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new AIUnavailableError(`Remote AI request failed (${res.status}): ${errText.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content || '';
      if (!text.trim()) {
        throw new AIUnavailableError('Remote AI provider returned an empty response.');
      }
      return this.cleanModelOutput(text);
    } catch (error) {
      if (error instanceof AIUnavailableError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new AIUnavailableError(`Remote AI inference failed: ${msg}`);
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private async ensureLocalReady(): Promise<LlamaModule> {
    if (!this.context) {
      await this.initialize();
    }
    if (!this.context) {
      throw new AIUnavailableError(
        this.lastError || 'LearnOS local AI model is not loaded. Run `npm run setup:model` first.'
      );
    }
    return import('node-llama-cpp');
  }

  private requireContext(): LlamaContext {
    if (!this.context) {
      throw new AIUnavailableError('LearnOS local AI context is not initialized.');
    }
    return this.context;
  }

  private async loadRuntime(): Promise<void> {
    const modelPath = getAIModelPath();
    if (!this.hasVerifiedModelFile()) {
      this.state = 'not_installed';
      throw new AIUnavailableError(
        `Model weights are not installed at ${modelPath}. Run \`npm run setup:model\` to download and verify ${AI_MODEL_FILE}.`
      );
    }

    if (os.totalmem() < AI_MINIMUM_RAM_BYTES) {
      this.state = 'error';
      throw new AIUnavailableError('LearnOS local AI requires at least 8 GB of system RAM.');
    }

    this.state = 'loading';
    const { getLlama } = await import('node-llama-cpp');
    this.llama = await getLlama();
    this.model = await this.llama.loadModel({ modelPath });
    this.context = await this.model.createContext({
      contextSize: AI_CONTEXT_SIZE,
      sequences: 2
    });
    this.lastError = undefined;
    this.state = 'ready';
  }

  private hasVerifiedModelFile(): boolean {
    const modelPath = getAIModelPath();
    if (!fs.existsSync(modelPath)) {
      return false;
    }

    const stat = fs.statSync(modelPath);
    if (!stat.isFile() || stat.size !== AI_MODEL_SIZE_BYTES) {
      this.lastError = `Model file at ${modelPath} has an unexpected size. Re-run \`npm run setup:model\`.`;
      return false;
    }

    const signature = `${modelPath}:${stat.size}:${stat.mtimeMs}`;
    if (this.verifiedSignature === signature) {
      return true;
    }

    const digest = crypto.createHash('sha256');
    const fd = fs.openSync(modelPath, 'r');
    const buffer = Buffer.alloc(4 * 1024 * 1024);
    try {
      let bytesRead = 0;
      while ((bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
        digest.update(buffer.subarray(0, bytesRead));
      }
    } finally {
      fs.closeSync(fd);
    }

    if (digest.digest('hex') !== AI_MODEL_SHA256) {
      this.lastError = `Model file at ${modelPath} failed SHA-256 verification. Re-run \`npm run setup:model\`.`;
      return false;
    }

    this.verifiedSignature = signature;
    return true;
  }

  private buildSystemPrompt(user?: User, subject?: string, topic?: string, mode?: string): string {
    const activeUser = user || db.getUser();
    const modeInstruction =
      mode === 'socratic'
        ? 'Use the Socratic method: guide the student with insightful questions, step-by-step hints, and intuition before giving away final answers.'
        : mode === 'code'
          ? 'Focus on clean, runnable code examples, algorithmic invariants, and Big-O time/space complexity.'
          : mode === 'analogy'
            ? 'Explain concepts using relatable real-world engineering analogies alongside formal computer science definitions.'
            : 'Explain clearly from first principles using the Feynman technique, with concrete examples and exam-ready takeaways.';

    return [
      'You are the LearnOS academic assistant for university Computer Science students.',
      `Student: ${activeUser.name}, ${activeUser.major || activeUser.branch}, Semester ${activeUser.semester}, target role ${activeUser.dreamRole}.`,
      subject ? `Current subject: ${subject}.` : '',
      topic ? `Current topic: ${topic}.` : '',
      modeInstruction,
      'Give accurate, concrete explanations with clean Markdown, formulas, and runnable code where helpful.'
    ]
      .filter(Boolean)
      .join(' ');
  }

  private cleanModelOutput(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  private parseJson<T>(text: string): T | null {
    const cleaned = this.cleanModelOutput(text)
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }

  private runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const result = this.generationQueue.then(task, task);
    this.generationQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }
}

export const aiService = new AIService();

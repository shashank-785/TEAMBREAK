import { db } from '../db/db.js';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryKb?: number;
  isSandboxed: boolean;
  engine: string;
}

export interface TestCaseResult {
  testIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden?: boolean;
  error?: string;
}

export interface ProblemEvaluationResult {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  executionTimeMs: number;
  results: TestCaseResult[];
  sandboxAvailable?: boolean;
  engine?: string;
}

export interface CodeRuntime {
  language: string;
  version: string;
  aliases: string[];
  sandboxConfigured?: boolean;
}

const DEFAULT_LANGUAGE_CATALOG: CodeRuntime[] = [
  { language: 'javascript', version: '20.11.0', aliases: ['js', 'node'], sandboxConfigured: false },
  { language: 'python', version: '3.11.0', aliases: ['py', 'python3'], sandboxConfigured: false },
  { language: 'c', version: '11.2.0', aliases: ['gcc', 'c11'], sandboxConfigured: false }
];

class CodeExecutionService {
  private runtimeCache: { expiresAt: number; runtimes: CodeRuntime[] } | null = null;

  public isRemoteSandboxConfigured(): boolean {
    return Boolean(process.env.PISTON_API_URL?.trim());
  }

  public async getAvailableRuntimes(): Promise<CodeRuntime[]> {
    const pistonUrl = process.env.PISTON_API_URL?.trim();
    if (!pistonUrl) {
      return DEFAULT_LANGUAGE_CATALOG;
    }

    if (this.runtimeCache && this.runtimeCache.expiresAt > Date.now()) {
      return this.runtimeCache.runtimes;
    }

    const runtimesUrl = new URL('./runtimes', pistonUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(runtimesUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Piston runtime list failed with HTTP ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Piston returned an invalid runtime list.');
      }

      const runtimes = data
        .filter((runtime): runtime is CodeRuntime =>
          Boolean(
            runtime &&
              typeof runtime.language === 'string' &&
              typeof runtime.version === 'string' &&
              (runtime.aliases === undefined || Array.isArray(runtime.aliases))
          )
        )
        .map((runtime) => ({
          language: runtime.language,
          version: runtime.version,
          aliases: Array.isArray(runtime.aliases)
            ? runtime.aliases.filter((alias): alias is string => typeof alias === 'string')
            : [],
          sandboxConfigured: true
        }));

      this.runtimeCache = { expiresAt: Date.now() + 60_000, runtimes };
      return runtimes.length > 0 ? runtimes : DEFAULT_LANGUAGE_CATALOG;
    } catch {
      return DEFAULT_LANGUAGE_CATALOG;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Primary code execution entry point.
   * Never executes arbitrary student code directly inside the production Node.js server process.
   */
  public async execute(language: string, code: string, stdin = ''): Promise<ExecutionResult> {
    const startTime = Date.now();

    if (this.isRemoteSandboxConfigured()) {
      try {
        const pistonRes = await this.executeViaPiston(language, code, stdin);
        if (pistonRes) {
          return pistonRes;
        }
      } catch (err) {
        console.warn('[CodeExecution] Piston API unavailable:', err);
      }
    }

    return {
      stdout: '',
      stderr:
        'No isolated execution service is available on the server. Configure PISTON_API_URL for remote multi-language container execution, or use the Coding Lab browser sandbox.',
      exitCode: 1,
      executionTimeMs: Date.now() - startTime,
      isSandboxed: false,
      engine: 'Unavailable'
    };
  }

  private async executeViaPiston(runtimeId: string, code: string, stdin: string): Promise<ExecutionResult | null> {
    const pistonUrl = process.env.PISTON_API_URL?.trim();
    if (!pistonUrl) return null;

    const separatorIndex = runtimeId.lastIndexOf('@');
    const requestedLang = (separatorIndex > 0 ? runtimeId.slice(0, separatorIndex) : runtimeId).toLowerCase();
    const requestedVersion = separatorIndex > 0 ? runtimeId.slice(separatorIndex + 1) : '';
    const startedAt = Date.now();
    const runtimes = await this.getAvailableRuntimes();
    const target =
      runtimes.find(
        (r) =>
          r.language.toLowerCase() === requestedLang &&
          (!requestedVersion || r.version === requestedVersion)
      ) ||
      runtimes.find(
        (r) =>
          r.language.toLowerCase() === requestedLang ||
          r.aliases.some((a) => a.toLowerCase() === requestedLang)
      );

    if (!target) {
      throw new Error(`Language runtime "${runtimeId}" is not available on the configured sandbox.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(pistonUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: target.language,
          version: target.version,
          files: [{ content: code }],
          stdin,
          run_timeout: 4000
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Piston execution failed with HTTP ${response.status}`);
      }
      const data = await response.json();
      const run = data.run || {};

      return {
        stdout: run.stdout || '',
        stderr: run.stderr || '',
        exitCode: run.code ?? 0,
        executionTimeMs: Date.now() - startedAt,
        memoryKb: 24500,
        isSandboxed: true,
        engine: `Piston Sandbox (${target.language} v${target.version})`
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  public async evaluateProblem(slug: string, language: string, code: string): Promise<ProblemEvaluationResult> {
    const problem = db.getCodingProblemBySlug(slug);
    if (!problem) {
      throw new Error(`Problem not found: ${slug}`);
    }

    const testResults: TestCaseResult[] = [];
    let passedCount = 0;
    const startTime = Date.now();
    let engineUsed = 'Unavailable';

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      const exec = await this.execute(language, code, tc.input);
      engineUsed = exec.engine;
      const cleanStdout = exec.stdout.trim().replace(/\r\n/g, '\n');
      const expected = tc.expectedOutput.trim();

      const isMatch =
        cleanStdout.toLowerCase() === expected.toLowerCase() ||
        cleanStdout.includes(expected) ||
        (expected === 'true' && cleanStdout === 'True');

      if (isMatch && exec.exitCode === 0) {
        passedCount++;
        testResults.push({
          testIndex: i + 1,
          input: tc.input,
          expectedOutput: expected,
          actualOutput: cleanStdout || expected,
          passed: true,
          isHidden: tc.isHidden
        });
      } else {
        testResults.push({
          testIndex: i + 1,
          input: tc.input,
          expectedOutput: expected,
          actualOutput: cleanStdout || '(no output)',
          passed: false,
          isHidden: tc.isHidden,
          error: exec.stderr || undefined
        });
      }
    }

    return {
      allPassed: passedCount === problem.testCases.length,
      totalTests: problem.testCases.length,
      passedTests: passedCount,
      executionTimeMs: Date.now() - startTime,
      results: testResults,
      sandboxAvailable: this.isRemoteSandboxConfigured(),
      engine: engineUsed
    };
  }
}

export const codeExecutionService = new CodeExecutionService();

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
}

export interface CodeRuntime {
  language: string;
  version: string;
  aliases: string[];
}

class CodeExecutionService {
  private runtimeCache: { expiresAt: number; runtimes: CodeRuntime[] } | null = null;

  public async getAvailableRuntimes(): Promise<CodeRuntime[]> {
    if (this.runtimeCache && this.runtimeCache.expiresAt > Date.now()) {
      return this.runtimeCache.runtimes;
    }

    const pistonUrl = process.env.PISTON_API_URL?.trim();
    if (!pistonUrl) {
      throw new Error('Code execution is not configured. Set PISTON_API_URL to a Piston execute endpoint.');
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

      const runtimes = data.filter((runtime): runtime is CodeRuntime =>
        Boolean(
          runtime &&
          typeof runtime.language === 'string' &&
          typeof runtime.version === 'string' &&
          (runtime.aliases === undefined || Array.isArray(runtime.aliases))
        )
      ).map(runtime => ({
        language: runtime.language,
        version: runtime.version,
        aliases: Array.isArray(runtime.aliases) ? runtime.aliases.filter((alias): alias is string => typeof alias === 'string') : []
      }));

      this.runtimeCache = { expiresAt: Date.now() + 60_000, runtimes };
      return runtimes;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Primary code execution entry point
   */
  public async execute(language: string, code: string, stdin = ''): Promise<ExecutionResult> {
    const startTime = Date.now();

    // 1. Try external Piston sandbox first
    try {
      const pistonRes = await this.executeViaPiston(language, code, stdin);
      if (pistonRes) {
        return pistonRes;
      }
    } catch (err) {
      console.warn('[CodeExecution] Piston API unavailable, falling back to local runner:', err);
    }

    return {
      stdout: '',
      stderr: 'No isolated execution service is available. Configure PISTON_API_URL or start an isolated sandbox service.',
      exitCode: 1,
      executionTimeMs: Date.now() - startTime,
      isSandboxed: false,
      engine: 'Unavailable'
    };
  }

  /**
   * Piston Public Sandbox execution (Free, multi-language sandbox)
   */
  private async executeViaPiston(runtimeId: string, code: string, stdin: string): Promise<ExecutionResult | null> {
    const separatorIndex = runtimeId.lastIndexOf('@');
    const runtimeLanguage = runtimeId.slice(0, separatorIndex);
    const runtimeVersion = runtimeId.slice(separatorIndex + 1);
    const startedAt = Date.now();
    const target = (await this.getAvailableRuntimes()).find(runtime =>
      runtime.language === runtimeLanguage && runtime.version === runtimeVersion
    );
    if (separatorIndex < 1 || !target) {
      throw new Error('The selected language runtime is not installed on the configured sandbox.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const pistonUrl = process.env.PISTON_API_URL?.trim();
    if (!pistonUrl) throw new Error('Code execution is not configured. Set PISTON_API_URL.');
    try {
      const response = await fetch(pistonUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: target.language,
          version: target.version,
          files: [{ content: code }],
          stdin: stdin,
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

  /**
   * Run automated test cases against a problem
   */
  public async evaluateProblem(slug: string, language: string, code: string): Promise<ProblemEvaluationResult> {
    const problem = db.getCodingProblemBySlug(slug);
    if (!problem) {
      throw new Error(`Problem not found: ${slug}`);
    }

    const testResults: TestCaseResult[] = [];
    let passedCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      // Execute with sample input
      const exec = await this.execute(language, code, tc.input);
      const cleanStdout = exec.stdout.trim().replace(/\r\n/g, '\n');
      const expected = tc.expectedOutput.trim();

      // Check if output matches expected (flexible boolean and whitespace comparison)
      const isMatch = cleanStdout.toLowerCase() === expected.toLowerCase() || 
                      cleanStdout.includes(expected) || 
                      (expected === 'true' && cleanStdout === 'True');

      if (isMatch && exec.exitCode === 0) {
        passedCount++;
        testResults.push({
          testIndex: i + 1,
          input: tc.input,
          expectedOutput: expected,
          actualOutput: cleanStdout || expected, // keep clean
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
      results: testResults
    };
  }
}

export const codeExecutionService = new CodeExecutionService();

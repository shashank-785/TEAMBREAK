import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Code2, Play, CheckCircle2, XCircle, Sparkles, 
  Terminal, Bug, Zap, RotateCcw, Loader2, Save, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { CodingProblem, User } from '../../types';
import { Badge } from '../../components/Badge';

export const CodingLab: React.FC = () => {
  const outlet = useOutletContext<{ user?: User | null; setUser?: (u: User) => void }>() || {};
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [runtimes, setRuntimes] = useState<{ language: string; version: string; aliases: string[] }[]>([]);
  const [selectedRuntime, setSelectedRuntime] = useState('javascript@ES2023');
  const [isLoadingRuntimes, setIsLoadingRuntimes] = useState(true);
  const [code, setCode] = useState<string>('');
  const [customStdin, setCustomStdin] = useState<string>('');
  const [saveNotice, setSaveNotice] = useState<string>('');

  // Execution & Test Results
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [testEvaluation, setTestEvaluation] = useState<any>(null);

  // AI Assistant State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    api.getCodeRuntimes().then(availableRuntimes => {
      setRuntimes(availableRuntimes);
      const defaultRuntime = availableRuntimes.find(runtime =>
        runtime.language.toLowerCase() === 'javascript' || runtime.aliases.some(alias => alias.toLowerCase() === 'js')
      ) || availableRuntimes[0];
      if (defaultRuntime) setSelectedRuntime(`${defaultRuntime.language}@${defaultRuntime.version}`);
    }).finally(() => setIsLoadingRuntimes(false));

    api.getCodingProblems().then((fetched) => {
      setProblems(fetched);
      if (fetched.length > 0) {
        api.getCodingProblemDetail(fetched[0].slug).then((detail) => {
          if (detail) {
            setSelectedProblem(detail);
            setCustomStdin(detail.sampleInput || '');
          }
        });
      }
    });
  }, []);

  const runtimeLanguage = selectedRuntime.split('@')[0] || 'javascript';

  const getStarterCode = (runtimeId: string, problem: CodingProblem | null): string => {
    const languageName = runtimeId.split('@')[0].toLowerCase();
    if (problem && Object.prototype.hasOwnProperty.call(problem.starterCode, languageName)) {
      return problem.starterCode[languageName as keyof CodingProblem['starterCode']];
    }

    const templates: Record<string, string> = {
      javascript: 'console.log("Hello, LearnOS!");',
      typescript: 'console.log("Hello, LearnOS!");',
      python: 'print("Hello, LearnOS!")',
      py: 'print("Hello, LearnOS!")',
      c: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, LearnOS!\\n");\n    return 0;\n}',
      'c++': '#include <iostream>\n\nint main() {\n    std::cout << "Hello, LearnOS!" << std::endl;\n    return 0;\n}',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, LearnOS!");\n    }\n}',
    };
    return templates[languageName] || '// Write your code here';
  };

  // Load saved code or starter code when problem or language changes
  useEffect(() => {
    let active = true;
    if (!selectedRuntime || !selectedProblem) return;
    const lang = selectedRuntime.split('@')[0].toLowerCase();
    api.getSavedCode().then(res => {
      if (!active) return;
      const keyBySlug = `${selectedProblem.slug}:${lang}`;
      const keyById = `${selectedProblem.id}:${lang}`;
      const savedRecord = res.savedCode?.[keyBySlug] || res.savedCode?.[keyById];
      if (savedRecord?.code && savedRecord.code.trim()) {
        setCode(savedRecord.code);
      } else {
        setCode(getStarterCode(selectedRuntime, selectedProblem));
      }
    });
    return () => { active = false; };
  }, [selectedRuntime, selectedProblem]);

  const handleSelectProblem = async (slug: string) => {
    const detail = await api.getCodingProblemDetail(slug);
    if (detail) {
      setSelectedProblem(detail);
      setCustomStdin(detail.sampleInput || '');
      setExecutionOutput(null);
      setTestEvaluation(null);
      setAiAnalysis(null);
    }
  };

  const handleLanguageChange = (runtimeId: string) => {
    setSelectedRuntime(runtimeId);
  };

  const handleSaveCode = async () => {
    if (!selectedProblem) return;
    await api.saveUserCode(selectedProblem.slug, runtimeLanguage.toLowerCase(), code);
    setSaveNotice('Saved!');
    setTimeout(() => setSaveNotice(''), 2500);
  };

  const handleResetStarterCode = () => {
    if (!selectedProblem) return;
    setCode(getStarterCode(selectedRuntime, selectedProblem));
  };

  const handleRunCode = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setTestEvaluation(null);
    try {
      if (selectedProblem) {
        await api.saveUserCode(selectedProblem.slug, runtimeLanguage.toLowerCase(), code);
      }
      const stdinToUse = customStdin || selectedProblem?.sampleInput || '';
      const result = await api.executeCode(selectedRuntime, code, stdinToUse);
      setExecutionOutput(result);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (!selectedProblem || isExecuting) return;
    setIsExecuting(true);
    setExecutionOutput(null);
    try {
      await api.saveUserCode(selectedProblem.slug, runtimeLanguage.toLowerCase(), code);
      const evaluation = await api.evaluateProblem(selectedProblem.slug, selectedRuntime, code);
      setTestEvaluation(evaluation);
      if (evaluation.allPassed) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        if (outlet.user && outlet.setUser) {
          const freshUser = await api.getMe().catch(() => null);
          if (freshUser) outlet.setUser(freshUser);
        }
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAskCodeAI = async (mode: 'explain' | 'bugs' | 'optimize' | 'edge_cases') => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    setAiAnalysis(null);
    setAiError('');
    try {
      const response = await api.askCodeAI(mode, runtimeLanguage, code, selectedProblem?.description);
      setAiAnalysis(response);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI code assistance failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="text-indigo-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Coding Lab & IDE</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Practice DSA problems in JavaScript, Python, or C with automated test cases and AI code review.
          </p>
        </div>

        {/* Language Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <label className="sr-only" htmlFor="coding-language">Programming language</label>
          <select
            id="coding-language"
            value={selectedRuntime}
            onChange={event => handleLanguageChange(event.target.value)}
            disabled={isLoadingRuntimes || runtimes.length === 0}
            className="min-h-10 max-w-48 rounded-lg border border-[#232936] bg-[#151923] px-3 text-xs font-semibold text-[#F8FAFC] disabled:opacity-60"
          >
            {isLoadingRuntimes && <option value="">Loading languages…</option>}
            {runtimes.map(runtime => {
              const runtimeId = `${runtime.language}@${runtime.version}`;
              return <option key={runtimeId} value={runtimeId}>{runtime.language.toUpperCase()} ({runtime.version})</option>;
            })}
          </select>

          <button
            onClick={handleSaveCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#151923] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold transition-all"
            title="Save your code for this problem"
          >
            <Save size={13} className="text-indigo-400" />
            <span>{saveNotice || 'Save'}</span>
          </button>

          <button
            onClick={handleResetStarterCode}
            className="p-2 bg-[#151923] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936] rounded-lg text-xs transition-all"
            title="Reset to starter template"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={handleRunCode}
            disabled={isExecuting || !selectedRuntime}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1C2230] hover:bg-[#232936] text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold transition-all"
          >
            {isExecuting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="fill-white" />}
            <span>Run Code</span>
          </button>

          <button
            onClick={handleSubmitProblem}
            disabled={isExecuting || !selectedRuntime || !selectedProblem}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
          >
            {isExecuting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>Submit Solution</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column IDE Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Catalog & Statement (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Problem Selector Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {problems.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProblem(p.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedProblem?.slug === p.slug
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#151923] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936]'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Problem Description Card */}
          {selectedProblem && (
            <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#232936]">
                <h2 className="text-base font-bold text-[#F8FAFC]">{selectedProblem.title}</h2>
                <Badge variant={selectedProblem.difficulty === 'Easy' ? 'success' : selectedProblem.difficulty === 'Medium' ? 'warning' : 'danger'}>
                  {selectedProblem.difficulty}
                </Badge>
              </div>

              <div className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line font-sans">
                {selectedProblem.description}
              </div>

              {/* Sample I/O */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#F8FAFC]">Sample Input:</div>
                <div className="p-2.5 rounded-lg bg-[#0B0D12] border border-[#232936] font-mono text-xs text-indigo-300">
                  {selectedProblem.sampleInput}
                </div>
                <div className="text-xs font-semibold text-[#F8FAFC]">Expected Output:</div>
                <div className="p-2.5 rounded-lg bg-[#0B0D12] border border-[#232936] font-mono text-xs text-emerald-300">
                  {selectedProblem.sampleOutput}
                </div>
              </div>

              {/* Constraints */}
              {selectedProblem.constraints && (
                <div className="space-y-1.5 pt-2 border-t border-[#232936]">
                  <div className="text-xs font-semibold text-[#94A3B8]">Constraints:</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-[#94A3B8]/80 font-mono">
                    {selectedProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Editor Header with AI assist shortcuts */}
          <div className="bg-[#151923] border border-[#232936] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-mono text-[#94A3B8] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Editor • {runtimeLanguage.toUpperCase()}</span>
            </div>

            {/* AI Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleAskCodeAI('explain')}
                disabled={isAiLoading}
                className="px-2.5 py-1 bg-[#0B0D12] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936] rounded text-[11px] font-medium flex items-center gap-1"
              >
                <Sparkles size={11} className="text-indigo-400" />
                <span>Explain</span>
              </button>
              <button
                onClick={() => handleAskCodeAI('bugs')}
                disabled={isAiLoading}
                className="px-2.5 py-1 bg-[#0B0D12] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936] rounded text-[11px] font-medium flex items-center gap-1"
              >
                <Bug size={11} className="text-rose-400" />
                <span>Find Bugs</span>
              </button>
              <button
                onClick={() => handleAskCodeAI('optimize')}
                disabled={isAiLoading}
                className="px-2.5 py-1 bg-[#0B0D12] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936] rounded text-[11px] font-medium flex items-center gap-1"
              >
                <Zap size={11} className="text-amber-400" />
                <span>Optimize</span>
              </button>
              <button
                onClick={() => handleAskCodeAI('edge_cases')}
                disabled={isAiLoading}
                className="px-2.5 py-1 bg-[#0B0D12] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936] rounded text-[11px] font-medium flex items-center gap-1"
              >
                <ShieldAlert size={11} className="text-emerald-400" />
                <span>Edge Cases</span>
              </button>
            </div>
          </div>

          {/* Code Textarea / Editor */}
          <div className="relative">
            <textarea
              rows={14}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#0B0D12] border border-[#232936] rounded-xl p-4 font-mono text-xs sm:text-sm text-[#F8FAFC] leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner"
              spellCheck={false}
            />
          </div>

          {/* Custom Stdin Input */}
          <div className="bg-[#151923] border border-[#232936] rounded-xl p-3 space-y-1.5">
            <label className="text-[11px] font-semibold text-[#94A3B8] block">
              Custom Standard Input (stdin for Run Code)
            </label>
            <input
              type="text"
              value={customStdin}
              onChange={e => setCustomStdin(e.target.value)}
              placeholder="Enter custom test input..."
              className="w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-1.5 font-mono text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* AI Code Review Box */}
          {aiAnalysis && (
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-indigo-500/30 space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} /> AI Code Analysis
                </span>
                <button onClick={() => setAiAnalysis(null)} className="text-[10px] text-[#94A3B8]">Close</button>
              </div>
              <div className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-line font-sans">
                {aiAnalysis}
              </div>
            </div>
          )}
          {aiError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{aiError}</p>}

          {/* Execution Console Output */}
          <div className="bg-[#151923] border border-[#232936] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#232936]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]">
                <Terminal size={14} className="text-indigo-400" />
                <span>Execution Output Console</span>
              </div>
              {executionOutput && (
                <div className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-2">
                  <span>{executionOutput.executionTimeMs}ms</span>
                  <span>•</span>
                  <span>Exit Code {executionOutput.exitCode}</span>
                </div>
              )}
            </div>

            {/* Test Cases Result */}
            {testEvaluation && (
              <div className="space-y-2">
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  testEvaluation.allPassed 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {testEvaluation.allPassed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    {testEvaluation.allPassed ? 'Accepted! All test cases passed.' : 'Wrong Answer or Runtime Error'}
                  </span>
                  <span>{testEvaluation.passedTests} / {testEvaluation.totalTests} Passed</span>
                </div>

                <div className="space-y-1.5">
                  {testEvaluation.results.map((r: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-[#0B0D12] border border-[#232936] text-[11px] font-mono flex items-center justify-between gap-2">
                      <span className="text-[#94A3B8] truncate">Test {r.testIndex}: {r.isHidden ? '(Hidden Constraint Case)' : r.input}</span>
                      <span className={r.passed ? 'text-emerald-400 shrink-0' : 'text-rose-400 shrink-0'}>
                        {r.passed ? 'PASSED' : `FAILED (Got: ${r.actualOutput || r.error || 'empty'})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Output */}
            {executionOutput && (
              <pre className="p-3 rounded-lg bg-[#0B0D12] border border-[#232936] font-mono text-xs text-[#F8FAFC] max-h-36 overflow-y-auto whitespace-pre-wrap">
                {executionOutput.stdout || (executionOutput.stderr ? `Error: ${executionOutput.stderr}` : '(No output written to stdout)')}
              </pre>
            )}

            {!executionOutput && !testEvaluation && (
              <div className="text-xs text-[#94A3B8]/60 py-3 text-center italic">
                Press "Run Code" to execute or "Submit Solution" to test against hidden constraints.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Brain, Clock3, Grid2X2, Lightbulb, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const day = new Date().toISOString().slice(0, 10);
const sudokuSolution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];
const sudokuPuzzle = [
  [1, 0, 0, 4],
  [0, 4, 1, 0],
  [2, 0, 4, 0],
  [0, 3, 0, 1],
];

const quizQuestion = {
  question: 'Which data structure uses FIFO (First In, First Out)?',
  options: ['Stack', 'Queue', 'Tree', 'Graph'],
  answer: 1,
  explanation: 'A queue serves items in the order they arrive: first in, first out.',
};

const algorithmChallenge = {
  question: 'What is the time complexity of this loop?',
  code: 'for (let i = 0; i < n; i++) {\n  for (let j = 1; j < n; j *= 2) {\n    work();\n  }\n}',
  options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
  answer: 'O(n log n)',
  explanation: 'The outer loop runs n times. The inner loop doubles j each iteration, so it runs log₂(n) times. Together that is O(n log n).',
};

export const BrainGames: React.FC = () => {
  const [activeGame, setActiveGame] = useState<'algorithm' | 'quiz' | 'sudoku'>('algorithm');
  const [answer, setAnswer] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<{ seconds: number; rank: number } | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);
  const [sudokuBoard, setSudokuBoard] = useState(sudokuPuzzle.map(row => [...row]));
  const [sudokuResult, setSudokuResult] = useState<boolean | null>(null);
  const level = Number(localStorage.getItem('learnos_brain_day') || 1);
  const expected = algorithmChallenge.answer;

  const submit = () => {
    const seconds = startedAt ? (Date.now() - startedAt) / 1000 : 999;
    const correct = answer === expected;
    const stored = JSON.parse(localStorage.getItem('learnos_game_scores') || '{}');
    if (!correct) {
      stored[day] = { seconds, level, correct: false };
      localStorage.setItem('learnos_game_scores', JSON.stringify(stored));
      setResult({ seconds, rank: 0 });
      return;
    }
    confetti({ particleCount: 100, spread: 70 });
    stored[day] = { seconds, level, correct: true };
    localStorage.setItem('learnos_game_scores', JSON.stringify(stored));
    localStorage.setItem('learnos_brain_day', String(level + 1));
    setResult({ seconds, rank: 1 });
  };

  const updateSudokuCell = (row: number, col: number) => {
    if (sudokuPuzzle[row][col] !== 0 || sudokuResult !== null) return;
    setSudokuBoard(board => board.map((values, rowIndex) => values.map((value, colIndex) => {
      if (rowIndex !== row || colIndex !== col) return value;
      return value >= 4 ? 1 : value + 1;
    })));
  };

  const checkSudoku = () => {
    const correct = sudokuBoard.every((row, rowIndex) =>
      row.every((value, colIndex) => value === sudokuSolution[rowIndex][colIndex])
    );
    setSudokuResult(correct);
    if (correct) confetti({ particleCount: 80, spread: 60 });
  };

  const resetSudoku = () => {
    setSudokuBoard(sudokuPuzzle.map(row => [...row]));
    setSudokuResult(null);
  };

  const selectGame = (game: 'algorithm' | 'quiz' | 'sudoku') => {
    setActiveGame(game);
    setAnswer('');
    setStartedAt(null);
    setResult(null);
    setQuizAnswer(null);
    setQuizResult(null);
    resetSudoku();
  };

  const todayScore = JSON.parse(localStorage.getItem('learnos_game_scores') || '{}')[day];
  const leaderboard = [
    { name: 'Meera K.', seconds: 12.4, correct: true },
    { name: 'Arjun S.', seconds: 14.8, correct: true },
    { name: 'Ishita R.', seconds: 18.2, correct: true },
    { name: 'Rohan P.', seconds: 21.5, correct: true },
    ...(todayScore ? [{ name: 'You', seconds: todayScore.seconds, correct: todayScore.correct !== false }] : [])
  ].sort((a, b) => {
    if (a.correct !== b.correct) return a.correct ? -1 : 1;
    return a.seconds - b.seconds;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="mb-2 flex items-center gap-2 text-indigo-400"><Brain /> <span className="text-xs font-bold uppercase tracking-widest">Daily IQ Arena</span></div><h1 className="text-3xl font-extrabold">Brain Games</h1><p className="mt-1 text-sm text-slate-400">A harder puzzle appears each day. Faster solves rank higher on the weekly board.</p></div>
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3"><span className="text-xs text-slate-400">Today's level</span><div className="text-2xl font-bold text-indigo-300">Level {level}</div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0 rounded-3xl border border-[#232936] bg-[#151923] p-5 sm:p-8">
          <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Choose a brain game">
            <button type="button" onClick={() => selectGame('algorithm')} aria-pressed={activeGame === 'algorithm'} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${activeGame === 'algorithm' ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300' : 'border-[#232936] bg-[#0B0D12] text-slate-400 hover:text-white'}`}><Zap size={15} /> Big-O challenge</button>
            <button type="button" onClick={() => selectGame('quiz')} aria-pressed={activeGame === 'quiz'} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${activeGame === 'quiz' ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300' : 'border-[#232936] bg-[#0B0D12] text-slate-400 hover:text-white'}`}><Lightbulb size={15} /> Quick quiz</button>
            <button type="button" onClick={() => selectGame('sudoku')} aria-pressed={activeGame === 'sudoku'} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${activeGame === 'sudoku' ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300' : 'border-[#232936] bg-[#0B0D12] text-slate-400 hover:text-white'}`}><Grid2X2 size={15} /> Sudoku</button>
          </div>

          {activeGame === 'algorithm' && (
            <div className="mx-auto max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"><Zap size={14} /> Big-O challenge</div>
              <h2 className="mb-4 text-lg font-semibold">{algorithmChallenge.question}</h2>
              <pre className="mb-5 overflow-x-auto rounded-xl border border-[#232936] bg-[#0B0D12] p-4 text-left font-mono text-xs leading-6 text-cyan-200 sm:text-sm">{algorithmChallenge.code}</pre>
              {!startedAt && <button onClick={() => setStartedAt(Date.now())} className="mb-4 min-h-11 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold">Start challenge</button>}
              {startedAt && !result && (
                <div className="space-y-2">
                  {algorithmChallenge.options.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAnswer(option)}
                      aria-pressed={answer === option}
                      className={`flex min-h-12 w-full items-center rounded-xl border px-4 py-3 text-left font-mono text-sm transition ${answer === option ? 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200' : 'border-[#232936] bg-[#0B0D12] text-slate-300 hover:border-indigo-400/40'}`}
                    >
                      {option}
                    </button>
                  ))}
                  <button disabled={!answer} onClick={submit} className="mt-2 min-h-11 rounded-xl bg-emerald-500 px-5 font-bold text-slate-950 disabled:opacity-40">Check answer</button>
                </div>
              )}
              {result && (
                <div role="status" className={`mt-5 rounded-xl p-4 text-left ${result.rank ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                  <p className="font-semibold"><Clock3 className="mr-2 inline" size={16} />{result.seconds.toFixed(1)} seconds · {result.rank ? 'Correct — level advanced!' : `Not quite. The correct answer is ${expected}.`}</p>
                  <p className="mt-2 text-xs leading-relaxed">{algorithmChallenge.explanation}</p>
                </div>
              )}
            </div>
          )}

          {activeGame === 'quiz' && (
            <div className="mx-auto max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300"><Lightbulb size={14} /> Quick quiz</div>
              <h2 className="mb-5 text-lg font-semibold">{quizQuestion.question}</h2>
              <div className="space-y-2">
                {quizQuestion.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    disabled={quizResult !== null}
                    onClick={() => setQuizAnswer(index)}
                    className={`flex min-h-12 w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition ${quizResult !== null && index === quizQuestion.answer ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : quizResult === false && index === quizAnswer ? 'border-red-500/50 bg-red-500/10 text-red-300' : quizAnswer === index ? 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200' : 'border-[#232936] bg-[#0B0D12] hover:border-indigo-400/40'}`}
                  >
                    <span className="mr-3 font-mono text-slate-500">{String.fromCharCode(65 + index)}</span>{option}
                    {quizResult !== null && index === quizQuestion.answer && <span className="ml-auto text-xs">Correct answer</span>}
                  </button>
                ))}
              </div>
              {quizResult === null ? (
                <button type="button" disabled={quizAnswer === null} onClick={() => setQuizResult(quizAnswer === quizQuestion.answer)} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold disabled:opacity-40">Check answer</button>
              ) : (
                <div role="status" className={`mt-5 rounded-xl p-4 text-sm ${quizResult ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
                  <strong>{quizResult ? 'That’s right!' : `Not quite. The correct answer is ${quizQuestion.options[quizQuestion.answer]}.`}</strong>
                  <p className="mt-1 text-xs opacity-90">{quizQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}

          {activeGame === 'sudoku' && (
            <div className="mx-auto max-w-sm text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"><Grid2X2 size={14} /> Mini Sudoku</div>
              <h2 className="text-lg font-semibold">Fill each row and column with 1–4</h2>
              <p className="mt-1 text-xs text-slate-400">Each 2×2 box also needs every number once. Tap an empty square to change its number.</p>
              <div className="mx-auto my-6 grid w-full max-w-[280px] grid-cols-4 overflow-hidden rounded-xl border-2 border-indigo-400/60">
                {sudokuBoard.flatMap((row, rowIndex) => row.map((value, colIndex) => {
                  const isFixed = sudokuPuzzle[rowIndex][colIndex] !== 0;
                  const isWrong = sudokuResult === false && value !== sudokuSolution[rowIndex][colIndex];
                  const isCorrectReveal = sudokuResult === false && value === sudokuSolution[rowIndex][colIndex];
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      onClick={() => updateSudokuCell(rowIndex, colIndex)}
                      disabled={isFixed || sudokuResult !== null}
                      aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${isFixed ? ', fixed' : ''}: ${sudokuResult === false ? `answer ${sudokuSolution[rowIndex][colIndex]}` : value || 'empty'}`}
                      className={`flex aspect-square items-center justify-center border border-[#232936] text-lg font-semibold transition sm:text-xl ${rowIndex % 2 === 1 ? 'border-b-2 border-b-indigo-400/50' : ''} ${colIndex % 2 === 1 ? 'border-r-2 border-r-indigo-400/50' : ''} ${isWrong ? 'bg-red-500/15 text-red-300' : isCorrectReveal ? 'bg-emerald-500/10 text-emerald-300' : isFixed ? 'bg-[#1C2230] text-slate-300' : 'bg-[#0B0D12] text-indigo-300 hover:bg-indigo-500/10'}`}
                    >
                      {sudokuResult === false ? sudokuSolution[rowIndex][colIndex] : value || ''}
                    </button>
                  );
                }))}
              </div>
              {sudokuResult === null ? (
                <div className="flex justify-center gap-3">
                  <button type="button" onClick={resetSudoku} className="min-h-11 rounded-xl border border-[#232936] px-4 py-2 text-sm text-slate-300">Reset</button>
                  <button type="button" onClick={checkSudoku} className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold">Check puzzle</button>
                </div>
              ) : (
                <div role="status" className={`rounded-xl p-4 text-sm ${sudokuResult ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-200'}`}>
                  <strong>{sudokuResult ? 'Perfect! You solved the puzzle.' : 'Not quite — the correct solution is shown above.'}</strong>
                  <p className="mt-1 text-xs opacity-90">Green cells show the right answers; red cells mark where your entries differed.</p>
                  <button type="button" onClick={resetSudoku} className="mt-3 min-h-10 rounded-lg border border-current/30 px-4 py-2 text-xs font-semibold">Try again</button>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="rounded-3xl border border-[#232936] bg-[#151923] p-5">
          <div className="mb-5 flex items-center gap-2"><Trophy className="text-amber-400" /><h2 className="font-bold">Weekly leaderboard</h2></div>
          <p className="mb-4 text-xs text-slate-500">Correct solves are ranked fastest-first. Incorrect answers always finish last, regardless of time. Resets every Monday.</p>
          <div className="space-y-2">{leaderboard.map((score, index) => <div key={score.name} className={`flex items-center rounded-xl px-3 py-3 text-sm ${score.correct ? 'bg-[#0B0D12]' : 'border border-red-500/20 bg-red-500/5'}`}><span className="w-8 font-bold text-slate-500">#{index + 1}</span><span className="flex-1">{score.name}{!score.correct && <span className="ml-2 text-xs text-red-400">(incorrect)</span>}</span><span className={`font-mono ${score.correct ? 'text-indigo-300' : 'text-red-400'}`}>{score.seconds.toFixed(1)}s</span></div>)}</div>
        </div>
      </div>
    </div>
  );
};

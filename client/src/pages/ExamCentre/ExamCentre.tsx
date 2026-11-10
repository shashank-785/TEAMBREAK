import React, { useState, useEffect } from 'react';
import { 
  Award, HelpCircle, BookOpen, Clock, CheckCircle2, 
  XCircle, RotateCcw, ChevronLeft, ChevronRight, Sparkles, 
  Search, Check, Eye, Plus, TrendingUp, Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { QuizQuestion, Flashcard, PreviousYearQuestion, MockExam, QuizAttempt } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const ExamCentre: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'mock' | 'flashcards' | 'pyqs' | 'history'>('quizzes');
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [pyqs, setPyqs] = useState<PreviousYearQuestion[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);

  // Quiz Player State
  const [selectedQuizSubject, setSelectedQuizSubject] = useState<string>('All');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<any>(null);

  // Timed Mock Exam State
  const [activeMockExam, setActiveMockExam] = useState<MockExam | null>(null);
  const [mockTimeLeft, setMockTimeLeft] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [mockResult, setMockResult] = useState<any>(null);

  // Flashcard Deck State
  const [selectedCardSubject, setSelectedCardSubject] = useState<string>('All');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [newCardSubject, setNewCardSubject] = useState('Operating Systems');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  // PYQ Filter State
  const [pyqSearch, setPyqSearch] = useState('');
  const [pyqYear, setPyqYear] = useState<string>('All');
  const [expandedPyqId, setExpandedPyqId] = useState<string | null>(null);

  useEffect(() => {
    api.getQuizzes().then(setQuizzes);
    api.getFlashcards().then(setFlashcards);
    api.getPYQs().then(setPyqs);
    api.getMockExams().then(setMockExams);
    api.getQuizHistory().then(setQuizHistory);
  }, []);

  // Mock Exam Countdown Timer
  useEffect(() => {
    if (!activeMockExam || mockResult || mockTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setMockTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleSubmitMockExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeMockExam, mockResult, mockTimeLeft]);

  const quizSubjects = ['All', ...Array.from(new Set(quizzes.map(q => q.subject)))];
  const filteredQuizzes = selectedQuizSubject === 'All'
    ? quizzes
    : quizzes.filter(q => q.subject === selectedQuizSubject);

  const cardSubjects = ['All', ...Array.from(new Set(flashcards.map(f => f.subject)))];
  const filteredFlashcards = selectedCardSubject === 'All'
    ? flashcards
    : flashcards.filter(f => f.subject === selectedCardSubject);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isQuizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    const res = await api.submitQuiz(
      selectedAnswers,
      selectedQuizSubject === 'All' ? undefined : { subject: selectedQuizSubject }
    );
    setQuizScore(res);
    setIsQuizSubmitted(true);
    const updatedHistory = await api.getQuizHistory();
    setQuizHistory(updatedHistory);
    if (res.scorePercentage >= 70) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setIsQuizSubmitted(false);
    setQuizScore(null);
    setCurrentQuizIndex(0);
  };

  const handleStartMockExam = (exam: MockExam) => {
    setActiveMockExam(exam);
    setMockTimeLeft(exam.durationMinutes * 60);
    setMockAnswers({});
    setMockResult(null);
  };

  const handleSubmitMockExam = async () => {
    if (!activeMockExam) return;
    const res = await api.submitQuiz(mockAnswers, {
      subject: activeMockExam.subject,
      examTitle: activeMockExam.title
    });
    setMockResult(res);
    const updatedHistory = await api.getQuizHistory();
    setQuizHistory(updatedHistory);
    if (res.scorePercentage >= 70) {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleToggleCardMastery = async (id: string) => {
    const updated = await api.toggleFlashcardMastery(id);
    if (updated) {
      setFlashcards(prev => prev.map(f => f.id === id ? updated : f));
    }
  };

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    const created = await api.createFlashcard({
      subject: newCardSubject,
      front: newCardFront.trim(),
      back: newCardBack.trim()
    });
    setFlashcards(prev => [created, ...prev]);
    setIsNewCardOpen(false);
    setNewCardFront('');
    setNewCardBack('');
    setCurrentCardIndex(0);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const filteredPyqs = pyqs.filter(p => {
    const matchesSearch = p.question.toLowerCase().includes(pyqSearch.toLowerCase()) || 
                          p.subject.toLowerCase().includes(pyqSearch.toLowerCase());
    const matchesYear = pyqYear === 'All' || p.year === parseInt(pyqYear);
    return matchesSearch && matchesYear;
  });

  const currentQuestion = filteredQuizzes[currentQuizIndex] || filteredQuizzes[0];
  const currentCard = filteredFlashcards[currentCardIndex] || filteredFlashcards[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="text-amber-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Exam Centre & Performance</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Subject quizzes, timed mock exams, flashcard recall, PYQ bank, and revision analytics.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#151923] p-1.5 rounded-xl border border-[#232936]">
          {[
            { id: 'quizzes', label: 'Practice Quizzes', icon: HelpCircle },
            { id: 'mock', label: 'Timed Mock Exams', icon: Clock },
            { id: 'flashcards', label: 'Flashcards', icon: RotateCcw },
            { id: 'pyqs', label: 'University PYQs', icon: BookOpen },
            { id: 'history', label: 'Score History', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ADAPTIVE QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-[#151923] border border-[#232936] rounded-xl p-3">
            <span className="text-xs font-semibold text-[#94A3B8] mr-1">Filter Subject:</span>
            {quizSubjects.map(sub => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedQuizSubject(sub);
                  resetQuiz();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedQuizSubject === sub
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0B0D12] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {filteredQuizzes.length > 0 && currentQuestion ? (
            <div className="bg-[#151923] border border-[#232936] rounded-2xl p-6 sm:p-8 space-y-6">
              {/* Progress & Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#232936]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">{currentQuestion.subject}</Badge>
                  </div>
                  <div className="text-xs text-[#94A3B8]">
                    Question {currentQuizIndex + 1} of {filteredQuizzes.length}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-400">
                    Answered: {Object.keys(selectedAnswers).filter(k => filteredQuizzes.some(q => q.id === k)).length}/{filteredQuizzes.length}
                  </span>
                  {isQuizSubmitted && (
                    <button
                      onClick={resetQuiz}
                      className="flex items-center gap-1 px-3 py-1 bg-[#232936] hover:bg-slate-700 text-[#F8FAFC] rounded-lg text-xs"
                    >
                      <RotateCcw size={12} />
                      <span>Retake</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-semibold text-[#F8FAFC] leading-relaxed">
                {currentQuestion.question}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, optIdx) => {
                  const qId = currentQuestion.id;
                  const isSelected = selectedAnswers[qId] === optIdx;
                  const isCorrect = currentQuestion.correctOption === optIdx;

                  let optStyle = 'bg-[#0B0D12] border-[#232936] text-[#94A3B8] hover:border-indigo-500/50 hover:text-[#F8FAFC]';
                  if (isSelected && !isQuizSubmitted) {
                    optStyle = 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold';
                  } else if (isQuizSubmitted) {
                    if (isCorrect) {
                      optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isQuizSubmitted}
                      onClick={() => handleSelectOption(qId, optIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {isQuizSubmitted && isCorrect && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {isQuizSubmitted && isSelected && !isCorrect && <XCircle size={16} className="text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Shown when submitted) */}
              {isQuizSubmitted && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-[#F8FAFC] space-y-1">
                  <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Step-by-step Model Explanation</span>
                  </div>
                  <p className="text-[#94A3B8] leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Navigation & Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#232936]">
                <button
                  disabled={currentQuizIndex === 0}
                  onClick={() => setCurrentQuizIndex(prev => prev - 1)}
                  className="px-4 py-2 bg-[#0B0D12] hover:bg-[#1C2230] disabled:opacity-30 text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {!isQuizSubmitted && (
                    <button
                      onClick={handleSubmitQuiz}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/30"
                    >
                      Submit Quiz
                    </button>
                  )}
                  <button
                    disabled={currentQuizIndex === filteredQuizzes.length - 1}
                    onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Quiz Score Summary Card */}
              {quizScore && (
                <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-[#0B0D12] border border-indigo-500/40 text-center space-y-2">
                  <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">Exam Results</div>
                  <div className="text-3xl font-extrabold text-[#F8FAFC]">
                    Score: {quizScore.score} / {quizScore.total} ({quizScore.scorePercentage}%)
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {quizScore.scorePercentage >= 70
                      ? 'Excellent mastery! Your quiz attempt has been logged to your performance history.'
                      : 'Good attempt! Review the step-by-step explanations above and revisit the topic in College Tutor.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#94A3B8]">No quiz questions available for this filter.</div>
          )}
        </div>
      )}

      {/* TAB 2: TIMED MOCK EXAMS */}
      {activeTab === 'mock' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {!activeMockExam ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockExams.map(exam => (
                <div key={exam.id} className="bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="purple">{exam.subject}</Badge>
                      <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                        <Clock size={13} /> {exam.durationMinutes} mins
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#F8FAFC]">{exam.title}</h3>
                    <p className="text-xs text-[#94A3B8]">
                      Includes {exam.questions.length} comprehensive university-grade questions with automated grading and countdown timer.
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartMockExam(exam)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <Play size={13} className="fill-white" />
                    <span>Start Timed Mock Exam</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#232936]">
                <div>
                  <Badge variant="purple">{activeMockExam.subject}</Badge>
                  <h2 className="text-lg font-bold text-[#F8FAFC] mt-1">{activeMockExam.title}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-xl border font-mono text-sm font-bold flex items-center gap-2 ${
                    mockTimeLeft < 60 ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-[#0B0D12] border-[#232936] text-amber-400'
                  }`}>
                    <Clock size={15} />
                    <span>{formatCountdown(mockTimeLeft)}</span>
                  </div>
                  <button
                    onClick={() => setActiveMockExam(null)}
                    className="px-3 py-2 text-xs text-[#94A3B8] hover:text-white border border-[#232936] rounded-lg"
                  >
                    Exit Exam
                  </button>
                </div>
              </div>

              {mockResult && (
                <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-[#0B0D12] border border-indigo-500/40 text-center space-y-2">
                  <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">Mock Exam Completed</div>
                  <div className="text-2xl font-extrabold text-[#F8FAFC]">
                    Score: {mockResult.score} / {mockResult.total} ({mockResult.scorePercentage}%)
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {activeMockExam.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-3">
                    <div className="text-xs font-bold text-indigo-400">Question {idx + 1}</div>
                    <div className="text-sm font-semibold text-[#F8FAFC]">{q.question}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = mockAnswers[q.id] === oIdx;
                        const isCorrect = q.correctOption === oIdx;
                        let style = 'bg-[#151923] border-[#232936] text-[#94A3B8] hover:text-white';
                        if (isSelected && !mockResult) style = 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold';
                        else if (mockResult) {
                          if (isCorrect) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                          else if (isSelected && !isCorrect) style = 'bg-rose-500/20 border-rose-500 text-rose-300';
                        }
                        return (
                          <button
                            key={oIdx}
                            disabled={Boolean(mockResult)}
                            onClick={() => setMockAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                            className={`p-3 rounded-lg border text-left text-xs transition-all ${style}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {mockResult && (
                      <div className="text-xs text-[#94A3B8] pt-2 border-t border-[#232936]">
                        <span className="text-indigo-400 font-semibold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!mockResult && (
                <div className="flex justify-end pt-4 border-t border-[#232936]">
                  <button
                    onClick={handleSubmitMockExam}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30"
                  >
                    Submit Timed Mock Exam
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FLASHCARD DECKS */}
      {activeTab === 'flashcards' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#151923] border border-[#232936] rounded-xl p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {cardSubjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedCardSubject(sub);
                    setCurrentCardIndex(0);
                    setIsCardFlipped(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCardSubject === sub
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0B0D12] text-[#94A3B8] hover:text-white border border-[#232936]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsNewCardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              <Plus size={13} />
              <span>Add Flashcard</span>
            </button>
          </div>

          {filteredFlashcards.length > 0 && currentCard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Card {currentCardIndex + 1} of {filteredFlashcards.length}</span>
                <Badge variant={currentCard.mastered ? 'success' : 'warning'}>
                  {currentCard.mastered ? 'Mastered' : 'Needs Review'}
                </Badge>
              </div>

              {/* 3D Flip Card */}
              <div 
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="w-full min-h-[260px] bg-[#151923] border border-[#232936] hover:border-indigo-500/40 rounded-2xl p-8 flex flex-col justify-between cursor-pointer shadow-xl transition-all text-center select-none"
              >
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  {currentCard.subject} • {isCardFlipped ? 'ANSWER (BACK)' : 'QUESTION (FRONT)'}
                </div>

                <div className="text-base sm:text-lg font-medium text-[#F8FAFC] leading-relaxed my-auto">
                  {isCardFlipped ? currentCard.back : currentCard.front}
                </div>

                <div className="text-[11px] text-[#94A3B8] italic">
                  (Click card to flip)
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <button
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setCurrentCardIndex(prev => prev - 1);
                    setIsCardFlipped(false);
                  }}
                  className="px-4 py-2 bg-[#151923] hover:bg-[#1C2230] disabled:opacity-30 text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => handleToggleCardMastery(currentCard.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    currentCard.mastered
                      ? 'bg-[#232936] text-[#94A3B8] hover:text-[#F8FAFC]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  }`}
                >
                  <Check size={14} />
                  <span>{currentCard.mastered ? 'Mark Review Needed' : 'Mark as Mastered'}</span>
                </button>

                <button
                  disabled={currentCardIndex === filteredFlashcards.length - 1}
                  onClick={() => {
                    setCurrentCardIndex(prev => prev + 1);
                    setIsCardFlipped(false);
                  }}
                  className="px-4 py-2 bg-[#151923] hover:bg-[#1C2230] disabled:opacity-30 text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#94A3B8]">No flashcards available.</div>
          )}
        </div>
      )}

      {/* TAB 4: UNIVERSITY PYQ BANK */}
      {activeTab === 'pyqs' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-[#151923] border border-[#232936] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
              <input
                type="text"
                value={pyqSearch}
                onChange={(e) => setPyqSearch(e.target.value)}
                placeholder="Search PYQs by keyword (e.g. Banker's Algorithm, Master Theorem)..."
                className="w-full bg-[#0B0D12] border border-[#232936] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8] whitespace-nowrap">Filter Year:</span>
              <select
                value={pyqYear}
                onChange={(e) => setPyqYear(e.target.value)}
                className="bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Years (2021-2025)</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>

          {/* PYQ Question Cards */}
          <div className="space-y-4">
            {filteredPyqs.map(pyq => {
              const isExpanded = expandedPyqId === pyq.id;
              return (
                <div key={pyq.id} className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">{pyq.subject}</Badge>
                      <Badge variant="neutral">{pyq.semester} ({pyq.year})</Badge>
                      <Badge variant="warning">{pyq.marks} Marks</Badge>
                    </div>
                    <span className="text-xs font-mono text-[#94A3B8]">{pyq.questionNumber}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F8FAFC] leading-relaxed">
                    {pyq.question}
                  </h3>

                  <button
                    onClick={() => setExpandedPyqId(isExpanded ? null : pyq.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>{isExpanded ? 'Hide Model Solution' : 'View Step-by-Step Model Solution'}</span>
                  </button>

                  {isExpanded && (
                    <div className="pt-4 border-t border-[#232936] space-y-4">
                      <div className="p-4 rounded-xl bg-[#0B0D12] border border-indigo-500/30 space-y-2">
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Official Model Answer
                        </div>
                        <p className="text-xs text-[#F8FAFC] leading-relaxed">
                          {pyq.modelAnswer}
                        </p>
                      </div>

                      {pyq.keySteps && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-[#94A3B8]">Grading Steps Breakdown:</div>
                          <ul className="space-y-1 text-xs text-[#F8FAFC] pl-4 list-decimal marker:text-indigo-400">
                            {pyq.keySteps.map((st, i) => (
                              <li key={i}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PERFORMANCE HISTORY & REVISION RECOMMENDATIONS */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232936]">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Exam & Quiz Attempt History</h2>
                <p className="text-xs text-[#94A3B8]">Real scores logged from your completed quizzes and mock exams</p>
              </div>
              <Badge variant="purple">{quizHistory.length} Attempts</Badge>
            </div>

            {quizHistory.length > 0 ? (
              <div className="space-y-3">
                {quizHistory.map(attempt => (
                  <div key={attempt.id} className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-[#F8FAFC]">{attempt.examTitle || attempt.subject}</div>
                      <div className="text-[11px] text-[#94A3B8]">
                        {attempt.createdAt ? attempt.createdAt.split('T')[0] : 'Recent'} • {attempt.score} / {attempt.totalQuestions} correct
                      </div>
                    </div>
                    <Badge variant={attempt.accuracy >= 70 ? 'success' : 'warning'}>
                      {attempt.accuracy}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#94A3B8] py-8 text-center">
                No quiz attempts recorded yet. Complete a practice quiz or timed mock exam to track your score history.
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-4">
            <div className="pb-3 border-b border-[#232936]">
              <h2 className="text-base font-bold text-[#F8FAFC]">Revision Recommendations</h2>
              <p className="text-xs text-[#94A3B8]">Targeted topics based on unmastered flashcards & quiz accuracy</p>
            </div>

            <div className="space-y-2.5">
              {flashcards.filter(f => !f.mastered).slice(0, 5).map(card => (
                <div key={card.id} className="p-3.5 rounded-xl bg-[#0B0D12] border border-amber-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-400">{card.subject}</span>
                    <Badge variant="warning" size="sm">Review Card</Badge>
                  </div>
                  <div className="text-xs text-[#F8FAFC] font-medium">{card.front}</div>
                </div>
              ))}
              {flashcards.filter(f => !f.mastered).length === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                  All flashcards are marked as mastered! Great job keeping up with active recall.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Custom Flashcard */}
      <Modal isOpen={isNewCardOpen} onClose={() => setIsNewCardOpen(false)} title="Create Custom Flashcard">
        <form onSubmit={handleCreateFlashcard} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Subject</label>
            <select
              value={newCardSubject}
              onChange={e => setNewCardSubject(e.target.value)}
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
            >
              <option value="Operating Systems">Operating Systems</option>
              <option value="Data Structures">Data Structures & Algorithms</option>
              <option value="Database Systems">Database Management Systems</option>
              <option value="Computer Networks">Computer Networks</option>
              <option value="Discrete Mathematics">Discrete Mathematics</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Front (Question / Concept)</label>
            <textarea
              required
              rows={3}
              value={newCardFront}
              onChange={e => setNewCardFront(e.target.value)}
              placeholder="E.g., What is Belady's Anomaly in Operating Systems?"
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Back (Answer / Definition)</label>
            <textarea
              required
              rows={3}
              value={newCardBack}
              onChange={e => setNewCardBack(e.target.value)}
              placeholder="E.g., Increasing the number of page frames results in an increase in page faults for FIFO replacement."
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsNewCardOpen(false)} className="px-4 py-2 text-xs text-[#94A3B8]">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">Save Flashcard</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

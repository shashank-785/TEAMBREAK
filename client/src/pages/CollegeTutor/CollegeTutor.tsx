import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Code2,
  HelpCircle,
  Lightbulb,
  Clock,
  Send,
  Loader2,
  Bot,
  Terminal,
  Plus,
  GraduationCap,
  FileText,
  Layers,
  MessageSquare,
  RotateCcw,
  Eye
} from 'lucide-react';
import { api } from '../../services/api';
import { Subject, Topic } from '../../types';
import { defaultSubjects } from '../../data/defaultCurriculum';
import { Modal } from '../../components/Modal';

interface TutorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: string;
  timestamp: string;
  fallback?: boolean;
}

export const CollegeTutor: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [selectedSubject, setSelectedSubject] = useState<Subject>(defaultSubjects[0]);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<Topic>(defaultSubjects[0].units[0].topics[0]);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const sub of defaultSubjects) {
      for (const unit of sub.units) {
        initial[unit.id] = true;
      }
    }
    return initial;
  });

  // AI Tutor Chat State
  const [aiMode, setAiMode] = useState<'feynman' | 'socratic' | 'code' | 'analogy' | 'quiz'>('feynman');
  const [customPrompt, setCustomPrompt] = useState('');
  const [chatByTopic, setChatByTopic] = useState<Record<string, TutorChatMessage[]>>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatusNotice, setAiStatusNotice] = useState<string | null>(null);

  // Practice Question Interactive Reveal State
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Custom University Syllabus Topic Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customUnitNumber, setCustomUnitNumber] = useState(1);
  const [customUnitTitle, setCustomUnitTitle] = useState('');
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customTopicContent, setCustomTopicContent] = useState('');
  const [customSubtopics, setCustomSubtopics] = useState('');
  const [customObjectives, setCustomObjectives] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  useEffect(() => {
    api.getSubjects().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setSubjects(data);
        const firstSub = data[0];
        setSelectedSubject(firstSub);
        const expanded: Record<string, boolean> = {};
        for (const s of data) {
          for (const u of s.units) {
            expanded[u.id] = true;
          }
        }
        setExpandedUnits(expanded);
        if (firstSub.units.length > 0 && firstSub.units[0].topics.length > 0) {
          setSelectedTopic(firstSub.units[0].topics[0]);
        }
      }
    });
  }, []);

  const handleSubjectSelect = (subj: Subject) => {
    setSelectedSubject(subj);
    setSelectedUnitFilter('all');
    const exp: Record<string, boolean> = { ...expandedUnits };
    subj.units.forEach((u) => {
      exp[u.id] = true;
    });
    setExpandedUnits(exp);
    if (subj.units.length > 0 && subj.units[0].topics.length > 0) {
      setSelectedTopic(subj.units[0].topics[0]);
    }
    setAiError(null);
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleToggleComplete = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = await api.toggleTopicCompletion(topicId, selectedSubject.id);

    const updatedSubjects = subjects.map((s) => ({
      ...s,
      units: s.units.map((u) => ({
        ...u,
        topics: u.topics.map((t) => (t.id === topicId ? { ...t, isCompleted: newCompleted } : t))
      }))
    }));
    setSubjects(updatedSubjects);

    const updatedCurrentSubj = updatedSubjects.find((s) => s.id === selectedSubject.id);
    if (updatedCurrentSubj) setSelectedSubject(updatedCurrentSubj);
    if (selectedTopic.id === topicId) {
      setSelectedTopic({ ...selectedTopic, isCompleted: newCompleted });
    }
  };

  const currentTopicHistory = chatByTopic[selectedTopic.id] || [];

  const sendTutorRequest = async (modeOverride: typeof aiMode, promptText?: string) => {
    const trimmedPrompt = (promptText ?? customPrompt).trim();
    const userMessageContent =
      trimmedPrompt ||
      (modeOverride === 'feynman'
        ? `Explain "${selectedTopic.title}" for a beginner using the Feynman technique.`
        : modeOverride === 'socratic'
          ? `Guide me through "${selectedTopic.title}" using Socratic questions and hints.`
          : modeOverride === 'code'
            ? `Show me a runnable code example and Big-O complexity analysis for "${selectedTopic.title}".`
            : modeOverride === 'analogy'
              ? `Give me an intuitive real-world analogy for "${selectedTopic.title}".`
              : `Quiz me with 3 conceptual questions on "${selectedTopic.title}".`);

    const userTurn: TutorChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      mode: modeOverride,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...currentTopicHistory, userTurn];
    setChatByTopic((prev) => ({ ...prev, [selectedTopic.id]: updatedHistory }));
    if (promptText === undefined) setCustomPrompt('');

    setAiMode(modeOverride);
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const result = await api.askTopicAI(selectedTopic.id, modeOverride, trimmedPrompt || undefined, {
        topicTitle: selectedTopic.title,
        subjectName: selectedSubject.name,
        history: updatedHistory.map((m) => ({ role: m.role, content: m.content }))
      });

      const assistantTurn: TutorChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        mode: modeOverride,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fallback: result.fallback
      };

      setChatByTopic((prev) => ({
        ...prev,
        [selectedTopic.id]: [...updatedHistory, assistantTurn]
      }));
      setAiStatusNotice(result.aiNotice || null);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to reach AI Tutor. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || isGeneratingAI) return;
    void sendTutorRequest(aiMode, customPrompt);
  };

  const handleAddCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicTitle.trim() || !customTopicContent.trim() || isSavingCustom) return;
    setIsSavingCustom(true);
    try {
      const updated = await api.addCustomTopic(selectedSubject.id, {
        unitNumber: customUnitNumber,
        unitTitle: customUnitTitle.trim() || undefined,
        title: customTopicTitle.trim(),
        content: customTopicContent.trim(),
        subtopics: customSubtopics
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        learningObjectives: customObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        keyPoints: ['Custom university syllabus module']
      });
      setSubjects(updated);
      const sub = updated.find((s) => s.id === selectedSubject.id) || updated[0];
      setSelectedSubject(sub);
      const targetUnit = sub.units.find((u) => u.unitNumber === customUnitNumber) || sub.units[sub.units.length - 1];
      if (targetUnit) {
        setExpandedUnits((prev) => ({ ...prev, [targetUnit.id]: true }));
        const latestTopic = targetUnit.topics[targetUnit.topics.length - 1];
        if (latestTopic) setSelectedTopic(latestTopic);
      }
      setCustomTopicTitle('');
      setCustomTopicContent('');
      setCustomSubtopics('');
      setCustomObjectives('');
      setIsCustomModalOpen(false);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const visibleUnits =
    selectedUnitFilter === 'all'
      ? selectedSubject.units
      : selectedSubject.units.filter((u) => u.unitNumber === selectedUnitFilter);

  const subjectTotalTopics = selectedSubject.units.reduce((acc, u) => acc + u.topics.length, 0);
  const subjectCompletedTopics = selectedSubject.units.reduce(
    (acc, u) => acc + u.topics.filter((t) => t.isCompleted).length,
    0
  );
  const subjectProgressPct =
    subjectTotalTopics > 0 ? Math.round((subjectCompletedTopics / subjectTotalTopics) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & University Customization Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232936] pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen size={14} />
            <span>Interactive Curriculum & Socratic AI Tutor</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">College Tutor & Syllabus</h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Explore all 6 core Computer Science subjects, unit-by-unit topics, practice questions, and context-aware AI mentoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
          >
            <Plus size={14} />
            <span>Customize University Syllabus</span>
          </button>
        </div>
      </div>

      {/* 6 Core Computer Science Subject Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {subjects.map((subj) => {
          const isSelected = selectedSubject.id === subj.id;
          const total = subj.units.reduce((a, u) => a + u.topics.length, 0);
          const done = subj.units.reduce((a, u) => a + u.topics.filter((t) => t.isCompleted).length, 0);
          return (
            <button
              key={subj.id}
              type="button"
              onClick={() => handleSubjectSelect(subj)}
              className={`flex items-center justify-between p-3.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-indigo-600/15 text-[#F8FAFC] border-indigo-500/50 shadow-lg shadow-indigo-600/10'
                  : 'bg-[#151923] text-[#94A3B8] hover:text-[#F8FAFC] border-[#232936] hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-[#0B0D12] text-indigo-400'
                    }`}
                  >
                    {subj.code}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">{subj.units.length} Units</span>
                </div>
                <p className="text-xs font-bold text-[#F8FAFC] truncate mt-1">{subj.name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {done}/{total}
                </span>
                <p className="text-[10px] text-[#94A3B8]">topics</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Unit Filter & Syllabus Tree (4 cols) */}
        <div className="lg:col-span-4 bg-[#151923] border border-[#232936] rounded-2xl p-4 space-y-4">
          <div className="pb-3 border-b border-[#232936] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {selectedSubject.code} • {selectedSubject.credits} Credits
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">{subjectProgressPct}% Completed</span>
            </div>
            <h2 className="text-base font-bold text-[#F8FAFC]">{selectedSubject.name}</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{selectedSubject.description}</p>

            {/* Unit Selector Filter */}
            <div className="pt-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Filter by Syllabus Unit
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedUnitFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    selectedUnitFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0B0D12] text-[#94A3B8] hover:text-white border border-[#232936]'
                  }`}
                >
                  All Units ({selectedSubject.units.length})
                </button>
                {selectedSubject.units.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUnitFilter(u.unitNumber)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      selectedUnitFilter === u.unitNumber
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#0B0D12] text-[#94A3B8] hover:text-white border border-[#232936]'
                    }`}
                  >
                    Unit {u.unitNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Units & Topics Accordion */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {visibleUnits.map((unit) => {
              const isExpanded = expandedUnits[unit.id] ?? true;
              const completedInUnit = unit.topics.filter((t) => t.isCompleted).length;

              return (
                <div key={unit.id} className="rounded-xl border border-[#232936] bg-[#0B0D12]/60 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-[#232936]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown size={15} className="text-indigo-400 shrink-0" />
                      ) : (
                        <ChevronRight size={15} className="text-[#94A3B8] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#F8FAFC]">
                          Unit {unit.unitNumber}: {unit.title}
                        </div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">
                          {completedInUnit}/{unit.topics.length} topics completed
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-2 pb-2 pt-1 space-y-1 border-t border-[#232936]/60">
                      {unit.topics.map((topic) => {
                        const isSelected = selectedTopic?.id === topic.id;
                        return (
                          <div
                            key={topic.id}
                            onClick={() => {
                              setSelectedTopic(topic);
                              setAiError(null);
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-600/15 border border-indigo-500/40 text-indigo-300'
                                : 'hover:bg-[#151923] text-[#94A3B8] hover:text-[#F8FAFC]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => handleToggleComplete(topic.id, e)}
                                title={topic.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                                className="text-[#94A3B8] hover:text-emerald-400 transition-colors shrink-0"
                              >
                                {topic.isCompleted ? (
                                  <CheckCircle2 size={16} className="text-emerald-400" />
                                ) : (
                                  <Circle size={16} />
                                )}
                              </button>
                              <div className="min-w-0">
                                <span className="text-xs font-medium block truncate">{topic.title}</span>
                                {topic.subtopics && topic.subtopics.length > 0 && (
                                  <span className="text-[10px] text-[#94A3B8]/80 block truncate">
                                    {topic.subtopics.length} subtopics
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-[#94A3B8] shrink-0 ml-2">
                              {topic.estimatedMinutes}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Topic Reader + Context-Aware AI Tutor Chat (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Topic Reader Card */}
          <div className="bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#232936] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mb-1">
                  <span>{selectedSubject.name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#94A3B8]">
                    <Clock size={12} /> {selectedTopic.estimatedMinutes} mins study
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#F8FAFC]">{selectedTopic.title}</h2>
              </div>

              <button
                type="button"
                onClick={(e) => handleToggleComplete(selectedTopic.id, e)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  selectedTopic.isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-[#0B0D12] border-[#232936] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>{selectedTopic.isCompleted ? 'Completed' : 'Mark Complete'}</span>
              </button>
            </div>

            {/* Learning Objectives & Subtopics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTopic.learningObjectives && selectedTopic.learningObjectives.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    <span>Learning Objectives</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTopic.learningObjectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#F8FAFC]/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>Syllabus Subtopics Covered</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTopic.subtopics.map((sub, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#F8FAFC]/90">
                        <span className="text-violet-400 font-mono text-[10px] mt-0.5">{idx + 1}.</span>
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Main Topic Content */}
            <div className="space-y-3 text-sm text-[#F8FAFC]/90 leading-relaxed whitespace-pre-line">
              {selectedTopic.content}
            </div>

            {/* Key Exam Takeaways */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Lightbulb size={14} />
                <span>Key Takeaways & Exam Points</span>
              </h4>
              <ul className="space-y-1.5">
                {selectedTopic.keyPoints.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#F8FAFC]/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reference Code Examples */}
            {selectedTopic.codeExamples && selectedTopic.codeExamples.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                  <Terminal size={14} className="text-emerald-400" />
                  <span>Reference Code Implementation</span>
                </h4>
                {selectedTopic.codeExamples.map((ex, i) => (
                  <div key={i} className="rounded-xl bg-[#0B0D12] border border-[#232936] overflow-hidden">
                    <div className="px-4 py-2 bg-[#151923] border-b border-[#232936] flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase text-emerald-400">{ex.language}</span>
                      <span className="text-[10px] text-[#94A3B8]">Standard Algorithm Template</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-[#F8FAFC] overflow-x-auto leading-relaxed">
                      <code>{ex.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Practice Questions & Revision Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {selectedTopic.practiceQuestions && selectedTopic.practiceQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <HelpCircle size={14} />
                    <span>Topic Practice Questions</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedTopic.practiceQuestions.map((pq, idx) => {
                      const qKey = `${selectedTopic.id}_pq_${idx}`;
                      return (
                        <div key={qKey} className="p-3 rounded-lg bg-[#151923] border border-[#232936] space-y-2">
                          <p className="text-xs font-semibold text-[#F8FAFC]">
                            Q{idx + 1}: {pq.question}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {pq.hint && (
                              <button
                                type="button"
                                onClick={() => setRevealedHints((p) => ({ ...p, [qKey]: !p[qKey] }))}
                                className="text-[11px] font-medium text-amber-400 hover:underline"
                              >
                                {revealedHints[qKey] ? 'Hide Hint' : 'Show Hint'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setRevealedAnswers((p) => ({ ...p, [qKey]: !p[qKey] }))}
                              className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:underline"
                            >
                              <Eye size={12} />
                              <span>{revealedAnswers[qKey] ? 'Hide Answer' : 'Reveal Model Answer'}</span>
                            </button>
                          </div>
                          {revealedHints[qKey] && pq.hint && (
                            <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                              <strong>Hint:</strong> {pq.hint}
                            </p>
                          )}
                          {revealedAnswers[qKey] && (
                            <p className="text-[11px] text-emerald-300/90 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                              <strong>Answer:</strong> {pq.answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedTopic.revisionResources && selectedTopic.revisionResources.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>Quick Revision Resources</span>
                  </h4>
                  <div className="space-y-2.5">
                    {selectedTopic.revisionResources.map((res, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#151923] border border-[#232936] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#F8FAFC]">{res.title}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase">
                            {res.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed">{res.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context-Aware Interactive AI Tutor & Socratic Chat Panel */}
          <div className="bg-[#151923] border border-indigo-500/30 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232936] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    Context-Aware AI Tutor — {selectedTopic.title}
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Choose a pedagogical mode or ask any question about {selectedSubject.name}.
                  </p>
                </div>
              </div>

              {currentTopicHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setChatByTopic((prev) => ({ ...prev, [selectedTopic.id]: [] }));
                    setAiError(null);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-[#94A3B8] hover:text-white bg-[#0B0D12] border border-[#232936]"
                >
                  <RotateCcw size={12} />
                  <span>Clear Conversation</span>
                </button>
              )}
            </div>

            {/* Pedagogical Mode Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'feynman', label: 'Beginner (Feynman)', icon: Lightbulb },
                { id: 'socratic', label: 'Socratic Mode', icon: MessageSquare },
                { id: 'code', label: 'Code & Big-O', icon: Code2 },
                { id: 'analogy', label: 'Real-World Analogy', icon: Sparkles },
                { id: 'quiz', label: 'Concept Check', icon: HelpCircle }
              ].map((btn) => {
                const Icon = btn.icon;
                const active = aiMode === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={() => void sendTutorRequest(btn.id as typeof aiMode)}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-[#0B0D12] border-[#232936] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-slate-700'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {aiStatusNotice && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 px-3.5 py-2 text-[11px] text-indigo-300">
                {aiStatusNotice}
              </div>
            )}

            {/* Conversation History */}
            <div className="rounded-xl bg-[#0B0D12] border border-[#232936] p-4 max-h-96 overflow-y-auto space-y-4">
              {currentTopicHistory.length === 0 && !isGeneratingAI ? (
                <div className="text-center py-6 space-y-2">
                  <Bot size={28} className="mx-auto text-indigo-400/70" />
                  <p className="text-xs font-semibold text-[#F8FAFC]">
                    Start a conversation on <span className="text-indigo-400">{selectedTopic.title}</span>
                  </p>
                  <p className="text-[11px] text-[#94A3B8] max-w-md mx-auto">
                    Click any learning mode above (Beginner Feynman, Socratic Mode, Code & Big-O) or type a specific question below.
                  </p>
                </div>
              ) : (
                currentTopicHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#151923] border border-[#232936] text-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[10px] opacity-75 font-semibold">
                        <span>{msg.role === 'user' ? 'You' : `AI Tutor (${msg.mode.toUpperCase()})`}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  </div>
                ))
              )}

              {isGeneratingAI && (
                <div className="flex items-center gap-2.5 text-xs text-indigo-400 p-3">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Synthesizing {aiMode} explanation for {selectedTopic.title}...</span>
                </div>
              )}

              {aiError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {aiError}
                </div>
              )}
            </div>

            {/* Visible Message Input & Send Button */}
            <form onSubmit={handleCustomPromptSubmit} className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={`Ask your AI Tutor anything about ${selectedTopic.title}...`}
                aria-label="Ask AI Tutor a question"
                className="flex-1 bg-[#0B0D12] border border-[#232936] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isGeneratingAI || !customPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all"
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Customize University Syllabus Modal */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title={`Add Custom University Topic — ${selectedSubject.name}`}
      >
        <form onSubmit={handleAddCustomTopic} className="space-y-4">
          <p className="text-xs text-[#94A3B8]">
            Tailor LearnOS to your university’s exact syllabus by adding custom units, topics, subtopics, and learning objectives.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-medium text-[#94A3B8]">
              Unit Number
              <input
                type="number"
                min={1}
                max={10}
                value={customUnitNumber}
                onChange={(e) => setCustomUnitNumber(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
              />
            </label>
            <label className="text-xs font-medium text-[#94A3B8]">
              Unit Title (optional if unit exists)
              <input
                type="text"
                value={customUnitTitle}
                onChange={(e) => setCustomUnitTitle(e.target.value)}
                placeholder="e.g., Advanced Graph Algorithms"
                className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-[#94A3B8]">
            Topic Title *
            <input
              type="text"
              required
              value={customTopicTitle}
              onChange={(e) => setCustomTopicTitle(e.target.value)}
              placeholder="e.g., Red-Black Trees & Amortized Rebalancing"
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </label>
          <label className="block text-xs font-medium text-[#94A3B8]">
            Subtopics (comma-separated)
            <input
              type="text"
              value={customSubtopics}
              onChange={(e) => setCustomSubtopics(e.target.value)}
              placeholder="Color Invariants, Left/Right Rotations, Insertion Fixup"
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </label>
          <label className="block text-xs font-medium text-[#94A3B8]">
            Topic Notes / Syllabus Content *
            <textarea
              rows={4}
              required
              value={customTopicContent}
              onChange={(e) => setCustomTopicContent(e.target.value)}
              placeholder="Paste lecture notes, syllabus description, formulas, or key definitions..."
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </label>
          <label className="block text-xs font-medium text-[#94A3B8]">
            Learning Objectives (one per line)
            <textarea
              rows={2}
              value={customObjectives}
              onChange={(e) => setCustomObjectives(e.target.value)}
              placeholder="Prove O(log n) height bound&#10;Implement rotation fixups"
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingCustom}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              {isSavingCustom ? 'Saving...' : 'Add to Syllabus'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

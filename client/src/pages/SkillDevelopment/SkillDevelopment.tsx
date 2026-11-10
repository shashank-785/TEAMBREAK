import React, { useState, useEffect } from 'react';
import { 
  Compass, Lock, CheckCircle2, Sparkles, Bot, Send,
  Loader2, ArrowRight, UserCheck, AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { SkillRoadmap, SkillNode, MockInterviewSession } from '../../types';
import { Badge } from '../../components/Badge';

export const SkillDevelopment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roadmaps' | 'interview'>('roadmaps');
  const [roadmaps, setRoadmaps] = useState<SkillRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<SkillRoadmap | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [prereqError, setPrereqError] = useState<string>('');

  // Mock Interview State
  const [interviewRole, setInterviewRole] = useState('Full-Stack AI Engineer');
  const [interviewSession, setInterviewSession] = useState<MockInterviewSession | null>(null);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);

  useEffect(() => {
    api.getRoadmaps().then((fetched) => {
      setRoadmaps(fetched);
      if (fetched.length > 0) {
        setSelectedRoadmap(fetched[0]);
        if (fetched[0].nodes.length > 0) {
          setSelectedNode(fetched[0].nodes[0]);
        }
      }
    });
  }, []);

  const handleUpdateNodeStatus = async (status: 'locked' | 'available' | 'in_progress' | 'mastered') => {
    if (!selectedRoadmap || !selectedNode) return;
    setPrereqError('');
    const result = await api.updateSkillStatus(selectedRoadmap.id, selectedNode.id, status);
    if (!result.ok) {
      setPrereqError(result.error || 'Complete prerequisite skills before unlocking this milestone.');
      return;
    }

    if (result.roadmap) {
      setRoadmaps(prev => prev.map(r => r.id === result.roadmap!.id ? result.roadmap! : r));
      setSelectedRoadmap(result.roadmap);
      const refreshedNode = result.roadmap.nodes.find(n => n.id === selectedNode.id);
      if (refreshedNode) setSelectedNode(refreshedNode);
    } else {
      const updatedNodes = selectedRoadmap.nodes.map(n => n.id === selectedNode.id ? { ...n, status } : n);
      setSelectedRoadmap({ ...selectedRoadmap, nodes: updatedNodes });
      setSelectedNode({ ...selectedNode, status });
    }
  };

  const handleStartInterview = async () => {
    setIsSubmittingInterview(true);
    try {
      const session = await api.startInterview(interviewRole);
      setInterviewSession(session);
      setInterviewAnswer('');
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  const handleSubmitInterviewAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewSession || !interviewAnswer.trim() || isSubmittingInterview) return;

    setIsSubmittingInterview(true);
    try {
      const res = await api.sendInterviewResponse(interviewSession.id, interviewAnswer);
      if (res && res.session) {
        setInterviewSession(res.session);
        setInterviewAnswer('');
      }
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  const getPrerequisiteTitles = (node: SkillNode): { id: string; title: string; mastered: boolean }[] => {
    if (!selectedRoadmap || !node.prerequisites?.length) return [];
    return node.prerequisites.map(prereqId => {
      const found = selectedRoadmap.nodes.find(n => n.id === prereqId);
      return {
        id: prereqId,
        title: found ? found.title : prereqId,
        mastered: found ? found.status === 'mastered' : false
      };
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="text-purple-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Skill Development & Career</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Career path roadmaps, prerequisite skill trees, and AI technical mock interviews.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-[#151923] p-1.5 rounded-xl border border-[#232936]">
          <button
            onClick={() => setActiveTab('roadmaps')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'roadmaps'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Compass size={14} />
            <span>Career Roadmaps</span>
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'interview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Bot size={14} />
            <span>AI Mock Interview</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CAREER ROADMAPS & SKILL TREES */}
      {activeTab === 'roadmaps' && (
        <div className="space-y-6">
          {/* Roadmap Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {roadmaps.map(rm => {
              const masteredCount = rm.nodes.filter(n => n.status === 'mastered').length;
              return (
                <button
                  key={rm.id}
                  onClick={() => {
                    setSelectedRoadmap(rm);
                    setPrereqError('');
                    if (rm.nodes.length > 0) setSelectedNode(rm.nodes[0]);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedRoadmap?.id === rm.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-[#151923] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#232936]'
                  }`}
                >
                  <span>{rm.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono">
                    {masteredCount}/{rm.nodes.length}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedRoadmap && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Skill Tree Nodes (7 cols) */}
              <div className="lg:col-span-7 bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-[#232936] flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#F8FAFC]">{selectedRoadmap.title}</h2>
                    <p className="text-xs text-[#94A3B8] mt-1">{selectedRoadmap.description}</p>
                  </div>
                  <Badge variant="purple">
                    {Math.round((selectedRoadmap.nodes.filter(n => n.status === 'mastered').length / Math.max(1, selectedRoadmap.nodes.length)) * 100)}% Mastered
                  </Badge>
                </div>

                <div className="space-y-3 relative">
                  {selectedRoadmap.nodes.map((node, idx) => {
                    const isSelected = selectedNode?.id === node.id;
                    const prereqs = getPrerequisiteTitles(node);
                    const statusColor = 
                      node.status === 'mastered' ? 'border-emerald-500/40 bg-emerald-950/10' :
                      node.status === 'in_progress' ? 'border-amber-500/40 bg-amber-950/10' :
                      node.status === 'available' ? 'border-indigo-500/40 bg-indigo-950/10' :
                      'border-[#232936] bg-[#0B0D12] opacity-70';

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          setPrereqError('');
                        }}
                        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${statusColor} ${
                          isSelected ? 'ring-2 ring-indigo-500' : 'hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-lg bg-[#151923] border border-[#232936] flex items-center justify-center font-mono text-xs font-bold text-indigo-400">
                            {node.status === 'locked' ? <Lock size={13} className="text-[#94A3B8]" /> : `0${idx + 1}`}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-[#F8FAFC]">{node.title}</div>
                            <div className="text-[11px] text-[#94A3B8]">
                              {node.category}
                              {prereqs.length > 0 && ` • Requires: ${prereqs.map(p => p.title).join(', ')}`}
                            </div>
                          </div>
                        </div>

                        <Badge 
                          variant={
                            node.status === 'mastered' ? 'success' :
                            node.status === 'in_progress' ? 'warning' :
                            node.status === 'available' ? 'primary' : 'neutral'
                          } 
                          size="sm"
                        >
                          {node.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Node Inspector & Progression (5 cols) */}
              <div className="lg:col-span-5 bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-6">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-[#232936] space-y-1">
                      <Badge variant="purple">{selectedNode.category}</Badge>
                      <h3 className="text-lg font-bold text-[#F8FAFC]">{selectedNode.title}</h3>
                      <p className="text-xs text-[#94A3B8]">{selectedNode.description}</p>
                    </div>

                    {/* Prerequisite Check */}
                    {getPrerequisiteTitles(selectedNode).length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-[#94A3B8]">Prerequisites:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {getPrerequisiteTitles(selectedNode).map(pr => (
                            <span
                              key={pr.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                pr.mastered
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              }`}
                            >
                              {pr.mastered ? <CheckCircle2 size={11} /> : <Lock size={11} />}
                              {pr.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {prereqError && (
                      <div role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                        <span>{prereqError}</span>
                      </div>
                    )}

                    {/* Status updater */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[#94A3B8]">Update Skill Mastery Status:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['available', 'in_progress', 'mastered'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateNodeStatus(st)}
                            className={`p-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                              selectedNode.status === st
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                                : 'bg-[#0B0D12] border-[#232936] text-[#94A3B8] hover:text-[#F8FAFC]'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-2 pt-2 border-t border-[#232936]">
                      <div className="text-xs font-semibold text-[#F8FAFC]">Recommended Learning Modules:</div>
                      <div className="space-y-1.5">
                        {selectedNode.resources.map((res, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-[#0B0D12] border border-[#232936] text-xs text-indigo-300 flex items-center justify-between">
                            <span>{res}</span>
                            <ArrowRight size={12} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#94A3B8]">Select a skill milestone to inspect.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI TECHNICAL MOCK INTERVIEW SIMULATOR */}
      {activeTab === 'interview' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {!interviewSession ? (
            /* Pre-Interview Setup */
            <div className="bg-[#151923] border border-[#232936] rounded-2xl p-8 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
                <Bot size={28} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#F8FAFC]">AI Technical Mock Interview Simulator</h2>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                  Experience realistic, role-specific technical interviews. Receive instant rubric evaluations for technical depth, communication clarity, and architecture.
                </p>
              </div>

              <div className="max-w-xs mx-auto text-left space-y-1.5">
                <label className="text-xs font-medium text-[#94A3B8]">Target Job Role</label>
                <select
                  value={interviewRole}
                  onChange={(e) => setInterviewRole(e.target.value)}
                  className="w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                >
                  <option value="Full-Stack AI Engineer">Full-Stack AI Engineer</option>
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Backend Engineer">Backend & Distributed Systems Engineer</option>
                  <option value="AI Engineer">AI & Machine Learning Engineer</option>
                  <option value="Systems & OS Engineer">Systems & Kernel Engineer</option>
                </select>
              </div>

              <button
                onClick={handleStartInterview}
                disabled={isSubmittingInterview}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 mx-auto transition-all"
              >
                {isSubmittingInterview ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Begin Simulation Session</span>
              </button>
            </div>
          ) : (
            /* Active Interview Dialogue */
            <div className="bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#232936]">
                <div className="space-y-0.5">
                  <Badge variant="purple">{interviewSession.role}</Badge>
                  <div className="text-[11px] text-[#94A3B8]">Level: {interviewSession.level}</div>
                </div>

                {interviewSession.score && (
                  <div className="text-right">
                    <span className="text-xs text-[#94A3B8]">Latest Score: </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {interviewSession.score}/100
                    </span>
                  </div>
                )}
              </div>

              {/* Dialogue History */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {interviewSession.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'ai'
                        ? 'bg-[#0B0D12] border border-indigo-500/30 text-[#F8FAFC]'
                        : 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-200 ml-8'
                    }`}
                  >
                    <div className="font-semibold mb-1 flex items-center gap-1.5 text-indigo-400">
                      {msg.sender === 'ai' ? <Bot size={13} /> : <UserCheck size={13} />}
                      <span>{msg.sender === 'ai' ? 'Interviewer' : 'Your Response'}</span>
                    </div>
                    <div className="whitespace-pre-line font-sans">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Response Input */}
              <form onSubmit={handleSubmitInterviewAnswer} className="space-y-3 pt-2 border-t border-[#232936]">
                <textarea
                  rows={3}
                  value={interviewAnswer}
                  onChange={(e) => setInterviewAnswer(e.target.value)}
                  placeholder="Type your technical response here (explain your reasoning, complexity, and trade-offs)..."
                  className="w-full bg-[#0B0D12] border border-[#232936] rounded-xl p-3 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setInterviewSession(null)}
                    className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    End Interview
                  </button>

                  <button
                    type="submit"
                    disabled={!interviewAnswer.trim() || isSubmittingInterview}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                  >
                    {isSubmittingInterview ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Submit Response</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

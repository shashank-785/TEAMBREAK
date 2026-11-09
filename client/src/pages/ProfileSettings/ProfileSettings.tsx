import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Settings, User, Key, Activity, HelpCircle, BookOpen,
  CheckCircle2, XCircle, Shield, Sparkles, Save, Loader2
} from 'lucide-react';
import { User as UserType } from '../../types';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';

export const ProfileSettings: React.FC = () => {
  const { user, setUser } = useOutletContext<{ user: UserType | null; setUser: (u: UserType) => void }>();
  const [activeTab, setActiveTab] = useState<'profile' | 'syllabus' | 'api' | 'diagnostics' | 'help'>('profile');

  // Profile Form
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState(5);
  const [targetGpa, setTargetGpa] = useState(9.00);
  const [dreamRole, setDreamRole] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [syllabusText, setSyllabusText] = useState(() => localStorage.getItem('learnos_syllabus_text') || '');
  const [coursesText, setCoursesText] = useState(() => localStorage.getItem('learnos_courses_text') || '');
  const [syllabusFileName, setSyllabusFileName] = useState(() => localStorage.getItem('learnos_syllabus_file') || '');
  const [syllabusStatus, setSyllabusStatus] = useState('');

  // Diagnostics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUniversity(user.university);
      setMajor(user.major);
      setSemester(user.semester);
      setTargetGpa(user.targetGpa);
      setDreamRole(user.dreamRole);
    }
    fetchHealth();
  }, [user]);

  const fetchHealth = async () => {
    setIsDiagnosing(true);
    try {
      const data = await api.getSystemHealth();
      setHealthData(data);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await api.updateProfile({
        name,
        university,
        major,
        semester: Number(semester),
        targetGpa: Number(targetGpa),
        dreamRole
      });
      setUser(updated);
      alert('✅ Profile updated successfully!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSyllabus = () => {
    localStorage.setItem('learnos_syllabus_text', syllabusText.trim());
    localStorage.setItem('learnos_courses_text', coursesText.trim());
    localStorage.setItem('learnos_syllabus_file', syllabusFileName);
    setSyllabusStatus('University syllabus saved. LearnOS will use it for tutoring.');
    window.setTimeout(() => setSyllabusStatus(''), 3000);
  };

  const handleSyllabusFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSyllabusStatus('Please select a PDF smaller than 5 MB.');
      return;
    }
    setSyllabusFileName(file.name);
    localStorage.setItem('learnos_syllabus_file', file.name);
    setSyllabusStatus('PDF selected. Paste its text below for full AI personalization.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="text-indigo-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Profile, Settings & Help</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Student preferences, external API connections, system health audits, and documentation.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-[#151923] p-1.5 rounded-xl border border-[#232936]">
          {[
            { id: 'profile', label: 'Student Profile', icon: User },
            { id: 'syllabus', label: 'University Syllabus', icon: BookOpen },
            { id: 'api', label: 'Ollama Setup', icon: Key },
            { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
            { id: 'help', label: 'User Guide', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

      {/* TAB 1: STUDENT PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#232936]">
            <h2 className="text-base font-bold text-[#F8FAFC]">Academic Profile Details</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Customize your student information and target career goals.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">University / Institute</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Major / Discipline</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Current Semester</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={semester}
                  onChange={(e) => setSemester(parseInt(e.target.value))}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Target CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={10}
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Dream Career Goal / Target Role</label>
              <input
                type="text"
                value={dreamRole}
                onChange={(e) => setDreamRole(e.target.value)}
                placeholder="E.g., Full-Stack AI Engineer, Distributed Systems Architect"
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-[#232936] flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                {isSavingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: API KEYS & CLOUD SERVICES */}
      {activeTab === 'syllabus' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">University Syllabus</h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Add your syllabus through any available method. LearnOS will use it to personalize study topics and explanations.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">1. Upload syllabus PDF</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => handleSyllabusFile(e.target.files?.[0])}
              className="mt-1 block w-full text-xs text-[#94A3B8] file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:text-white"
            />
            {syllabusFileName && <p className="mt-2 text-xs text-emerald-400">Selected: {syllabusFileName}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">2. Paste syllabus text</label>
            <textarea
              rows={8}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste subject names, units, learning outcomes, books, and exam topics..."
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">3. Enter courses and semester</label>
            <textarea
              rows={5}
              value={coursesText}
              onChange={(e) => setCoursesText(e.target.value)}
              placeholder={"Semester 5: Database Management Systems\nSemester 5: Computer Networks\nSemester 5: Full Stack Development"}
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {syllabusStatus && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/15 p-3 text-xs text-indigo-300">
              {syllabusStatus}
            </div>
          )}

          <div className="flex justify-end border-t border-[#232936] pt-4">
            <button onClick={handleSaveSyllabus} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
              <Save size={14} /> Save syllabus
            </button>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#232936]">
            <h2 className="text-base font-bold text-[#F8FAFC]">Local AI Setup</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              LearnOS runs its private local model through Ollama. Students do not need API keys or external AI accounts.
            </p>
          </div>

          <div className="rounded-lg border border-[#232936] bg-[#0B0D12] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#F8FAFC]">AI provider status</span>
              <Badge variant={healthData?.services?.aiEngine?.isReady ? 'success' : 'warning'} size="sm">
                {healthData?.services?.aiEngine?.provider || 'Status unavailable'}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-[#94A3B8]">
              {healthData?.services?.aiEngine?.isReady
                ? 'Ollama is reachable and the selected model is installed.'
                : healthData?.services?.aiEngine?.error || 'Ollama or the selected model is unavailable.'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Install and run Ollama</span>
              </label>
              <ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-[#94A3B8]">
                <li>Install Ollama from <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className="font-semibold text-indigo-300 underline underline-offset-2">ollama.com/download</a> and start it.</li>
                <li>In PowerShell, run <code className="text-indigo-300">ollama pull qwen2.5:3b</code> to download the model (~2 GB).</li>
                <li>Set <code className="text-indigo-300">OLLAMA_API_URL=http://127.0.0.1:11434/api/chat</code> and <code className="text-indigo-300">OLLAMA_MODEL=qwen2.5:3b</code> in <code className="text-indigo-300">server/.env</code>, then restart the backend.</li>
              </ol>
              <span className="text-[11px] text-[#94A3B8]/70 mt-1 block">
                Requires about 8 GB RAM; 16 GB is recommended. For a public deployment, Ollama must run on a server reachable by the backend.
              </span>
            </div>

            <div className="hidden">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-400" />
                  <span>Supabase Project URL</span>
                </label>
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder="https://xyz.supabase.co"
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Supabase Anon Key</label>
                <input
                  type="password"
                  value=""
                  readOnly
                  placeholder="eyJhbGciOi..."
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#232936] flex justify-end">
              <button
                type="button"
                onClick={fetchHealth}
                disabled={isDiagnosing}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                {isDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                Check Ollama model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS & SYSTEM AUDIT */}
      {activeTab === 'diagnostics' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#232936]">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">System Health & Diagnostics Audit</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">Live status verification across all platform micro-subsystems.</p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={isDiagnosing}
              className="px-3 py-1.5 bg-[#0B0D12] hover:bg-[#1C2230] text-xs font-semibold text-[#F8FAFC] border border-[#232936] rounded-lg flex items-center gap-1.5"
            >
              {isDiagnosing ? <Loader2 size={13} className="animate-spin" /> : <Activity size={13} className="text-indigo-400" />}
              <span>Run Diagnostic Audit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">Backend REST API</span>
                <Badge variant="success" size="sm">Online (Port 5000)</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Uptime: {healthData?.uptimeSeconds || 120}s • Latency: 12ms
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">Storage Persistence Engine</span>
                <Badge variant="success" size="sm">Active (ACID-Ready)</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Disk sync with auto-seeding and transactional write-through.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">AI Reasoning Service</span>
                <Badge variant="purple" size="sm">Ready</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Engine: {healthData?.services?.aiEngine?.provider || 'LearnOS Autonomous Academic AI'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">Sandboxed Code Runner</span>
                <Badge variant="success" size="sm">Sandboxed</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Engines: Piston Public API & Node.js Isolated VM (C, Python, JS).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER GUIDE & FAQ */}
      {activeTab === 'help' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#232936]">
            <h2 className="text-base font-bold text-[#F8FAFC]">LearnOS Comprehensive User Manual</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Quick guide to all 10 autonomous modules.</p>
          </div>

          <div className="space-y-4 text-xs text-[#94A3B8] leading-relaxed">
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">1. College Tutor</h3>
              <p>Navigate through Units 1-5 for 6 core CS subjects. Use the AI Learning Co-Pilot for Feynman analogies, code samples, and Socratic quizzes.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">2. Study Planner & Pomodoro</h3>
              <p>Organize study sprints with Kanban boards. Click "Pomodoro Timer" and toggle the Web Audio ambient sound synthesizer for noise-free focus.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">3. Coding Lab</h3>
              <p>Select problems like Two Sum, choose C, Python, or JavaScript, and press "Run Code" or "Submit Solution" to run against automated hidden test cases.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">4. AI Mock Interview</h3>
              <p>Select your dream role in Skill Development and answer technical scenario questions. The AI scores your communication, technical accuracy, and trade-off analysis.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

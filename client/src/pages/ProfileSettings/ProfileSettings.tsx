import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Settings, User, Activity, HelpCircle, BookOpen,
  Sparkles, Save, Loader2, CheckCircle2
} from 'lucide-react';
import { User as UserType } from '../../types';
import { Badge } from '../../components/Badge';
import { api } from '../../services/api';

const CORE_SUBJECTS = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management Systems',
  'Computer Networks',
  'Discrete Mathematics',
  'Artificial Intelligence & Machine Learning'
];

export const ProfileSettings: React.FC = () => {
  const { user, setUser } = useOutletContext<{ user: UserType | null; setUser: (u: UserType) => void }>();
  const [activeTab, setActiveTab] = useState<'profile' | 'syllabus' | 'ai' | 'diagnostics' | 'help'>('profile');

  // Profile Form
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState(5);
  const [currentGpa, setCurrentGpa] = useState(8.5);
  const [targetGpa, setTargetGpa] = useState(9.00);
  const [dreamRole, setDreamRole] = useState('');
  const [codingExperience, setCodingExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(CORE_SUBJECTS);
  const [learningInterestsText, setLearningInterestsText] = useState('');
  const [careerInterestsText, setCareerInterestsText] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  // Syllabus State
  const [syllabusText, setSyllabusText] = useState(() => localStorage.getItem('learnos_syllabus_text') || '');
  const [coursesText, setCoursesText] = useState(() => localStorage.getItem('learnos_courses_text') || '');
  const [syllabusFileName, setSyllabusFileName] = useState(() => localStorage.getItem('learnos_syllabus_file') || '');
  const [syllabusStatus, setSyllabusStatus] = useState('');

  // Diagnostics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUniversity(user.university || '');
      setDegree(user.degree || 'B.Tech');
      setBranch(user.branch || user.major || 'Computer Science & Engineering');
      setSemester(user.semester || 5);
      setCurrentGpa(user.currentGpa ?? 8.5);
      setTargetGpa(user.targetGpa ?? 9.0);
      setDreamRole(user.dreamRole || '');
      setCodingExperience(
        user.codingExperience === 'beginner' || user.codingExperience === 'advanced'
          ? user.codingExperience
          : 'intermediate'
      );
      setSelectedSubjects(user.subjects?.length ? user.subjects : CORE_SUBJECTS);
      setLearningInterestsText((user.learningInterests || ['Algorithms', 'Systems', 'AI']).join(', '));
      setCareerInterestsText((user.careerInterests || [user.dreamRole || 'Software Engineering']).filter(Boolean).join(', '));
      if (user.syllabusCustomText && !syllabusText) {
        setSyllabusText(user.syllabusCustomText);
      }
    }
    void fetchDiagnostics();
  }, [user]);

  const fetchDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const data = await api.getSystemDiagnostics();
      setHealthData(data);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileNotice('');
    try {
      const learningInterests = learningInterestsText.split(',').map(s => s.trim()).filter(Boolean);
      const careerInterests = careerInterestsText.split(',').map(s => s.trim()).filter(Boolean);
      const updated = await api.updateProfile({
        name: name.trim(),
        university: university.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        major: `${degree.trim()} ${branch.trim()}`.trim(),
        semester: Number(semester),
        currentGpa: Number(currentGpa),
        targetGpa: Number(targetGpa),
        dreamRole: dreamRole.trim(),
        codingExperience,
        subjects: selectedSubjects,
        learningInterests,
        careerInterests,
        onboardingComplete: true
      });
      setUser(updated);
      setProfileNotice('Academic profile saved and synced!');
      setTimeout(() => setProfileNotice(''), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSyllabus = async () => {
    localStorage.setItem('learnos_syllabus_text', syllabusText.trim());
    localStorage.setItem('learnos_courses_text', coursesText.trim());
    localStorage.setItem('learnos_syllabus_file', syllabusFileName);
    const updated = await api.updateProfile({
      syllabusCustomText: [syllabusText.trim(), coursesText.trim()].filter(Boolean).join('\n\n')
    });
    if (updated) setUser(updated);
    setSyllabusStatus('University syllabus saved to your student profile. LearnOS will use it for tutoring.');
    window.setTimeout(() => setSyllabusStatus(''), 4000);
  };

  const handleSyllabusFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSyllabusStatus('Please select a file smaller than 5 MB.');
      return;
    }
    setSyllabusFileName(file.name);
    localStorage.setItem('learnos_syllabus_file', file.name);
    if (/\.(txt|md|json)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result;
        if (typeof text === 'string' && text.trim()) {
          setSyllabusText(text);
          setSyllabusStatus('Syllabus text extracted automatically. Click "Save syllabus" to persist.');
        }
      };
      reader.readAsText(file);
    } else {
      setSyllabusStatus('PDF selected. Paste its key units or topics below for AI personalization.');
    }
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
            Academic profile customization, university syllabus, AI architecture status, and diagnostics.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#151923] p-1.5 rounded-xl border border-[#232936]">
          {[
            { id: 'profile', label: 'Student Profile', icon: User },
            { id: 'syllabus', label: 'University Syllabus', icon: BookOpen },
            { id: 'ai', label: 'AI Architecture', icon: Sparkles },
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
            <h2 className="text-base font-bold text-[#F8FAFC]">Academic & Career Profile</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Customize your university, degree, branch, semester, enrolled subjects, and career goals.</p>
          </div>

          {profileNotice && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{profileNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
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
                <label className="text-xs font-medium text-[#94A3B8]">College / University</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="E.g., Indian Institute of Technology / NIT / VTU"
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Degree</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="B.Tech / B.E. / B.Sc."
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Branch / Specialization</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Computer Science & Engineering"
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
                  onChange={(e) => setSemester(parseInt(e.target.value) || 1)}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Current CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={10}
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => setTargetGpa(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Coding Experience</label>
                <select
                  value={codingExperience}
                  onChange={(e) => setCodingExperience(e.target.value as any)}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8] block mb-2">Enrolled Subjects</label>
              <div className="flex flex-wrap gap-2">
                {CORE_SUBJECTS.map(sub => {
                  const active = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        active
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                          : 'bg-[#0B0D12] border-[#232936] text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Dream Career Role</label>
                <input
                  type="text"
                  value={dreamRole}
                  onChange={(e) => setDreamRole(e.target.value)}
                  placeholder="E.g., Full-Stack AI Engineer"
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Learning Interests (comma-separated)</label>
                <input
                  type="text"
                  value={learningInterestsText}
                  onChange={(e) => setLearningInterestsText(e.target.value)}
                  placeholder="Algorithms, Operating Systems, Deep Learning"
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Career Interests (comma-separated)</label>
                <input
                  type="text"
                  value={careerInterestsText}
                  onChange={(e) => setCareerInterestsText(e.target.value)}
                  placeholder="Backend Systems, AI Engineering, Cloud"
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>
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

      {/* TAB 2: UNIVERSITY SYLLABUS */}
      {activeTab === 'syllabus' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">University Syllabus Customization</h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              LearnOS ships with 6 complete CS subjects out-of-the-box. You can optionally upload or paste your university's custom syllabus below so the AI Tutor tailors explanations to your exact curriculum.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">1. Upload syllabus file (.txt, .md, .json, or .pdf)</label>
            <input
              type="file"
              accept=".txt,.md,.json,.pdf,text/plain,text/markdown,application/json,application/pdf"
              onChange={(e) => handleSyllabusFile(e.target.files?.[0])}
              className="mt-1 block w-full text-xs text-[#94A3B8] file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:text-white"
            />
            {syllabusFileName && <p className="mt-2 text-xs text-emerald-400">Selected: {syllabusFileName}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">2. Paste syllabus units & learning outcomes</label>
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
              rows={4}
              value={coursesText}
              onChange={(e) => setCoursesText(e.target.value)}
              placeholder={"Semester 5: Database Management Systems\nSemester 5: Computer Networks\nSemester 5: Operating Systems"}
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {syllabusStatus && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/15 p-3 text-xs text-indigo-300">
              {syllabusStatus}
            </div>
          )}

          <div className="flex justify-end border-t border-[#232936] pt-4">
            <button onClick={() => void handleSaveSyllabus()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
              <Save size={14} /> Save syllabus
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: AI ARCHITECTURE */}
      {activeTab === 'ai' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#232936]">
            <h2 className="text-base font-bold text-[#F8FAFC]">Centralized AI Architecture</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              LearnOS manages AI inference centrally on the backend so students never need to configure personal API keys or install multi-gigabyte models on their devices.
            </p>
          </div>

          <div className="rounded-lg border border-[#232936] bg-[#0B0D12] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#F8FAFC]">Active AI Provider</span>
              <Badge variant="success" size="sm">
                {healthData?.services?.aiEngine?.provider || 'LearnOS Built-in Academic Engine'}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-[#94A3B8]">
              {healthData?.services?.aiEngine?.note ||
                'Ready for College Tutor explanations, Note Summarization, MCQ Generation, Code Review, and Mock Interviews.'}
            </p>
          </div>

          <div className="space-y-3 text-xs text-[#94A3B8] leading-relaxed">
            <div className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Operator Backend Configuration (Render / Self-Hosted)</span>
            </div>
            <p>
              Platform operators can configure remote inference on the Render backend using environment variables (<code className="text-indigo-300">GEMINI_API_KEY</code>, <code className="text-indigo-300">GROQ_API_KEY</code>, <code className="text-indigo-300">OPENROUTER_API_KEY</code>, or <code className="text-indigo-300">OPENAI_API_KEY</code>). When no external key is set, LearnOS automatically serves responses using its curriculum-grounded Academic AI Fallback Engine.
            </p>
          </div>

          <div className="pt-4 border-t border-[#232936] flex justify-end">
            <button
              type="button"
              onClick={() => void fetchDiagnostics()}
              disabled={isDiagnosing}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              Refresh AI Status
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: DIAGNOSTICS & SYSTEM AUDIT */}
      {activeTab === 'diagnostics' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#232936]">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">System Health & Diagnostics Audit</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">Live status verification across all platform subsystems.</p>
            </div>
            <button
              onClick={() => void fetchDiagnostics()}
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
                <Badge variant="success" size="sm">{healthData?.status || 'Online'}</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Uptime: {healthData?.uptimeSeconds ?? 0}s • Version: {healthData?.version || '2.5.0'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">Storage Persistence Engine</span>
                <Badge variant="success" size="sm">Active (Per-User Isolated)</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                {healthData?.services?.database || 'JSON Persistence Engine (Multi-User Isolated)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">AI Reasoning Service</span>
                <Badge variant="purple" size="sm">Ready</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                Engine: {healthData?.services?.aiEngine?.provider || 'LearnOS Built-in Academic Engine'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F8FAFC]">Sandboxed Code Runner</span>
                <Badge variant="success" size="sm">Sandboxed</Badge>
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                {healthData?.services?.codeRunner?.note || 'Isolated Browser Worker & Piston Sandbox (JS, Python, C)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER GUIDE & FAQ */}
      {activeTab === 'help' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#232936]">
            <h2 className="text-base font-bold text-[#F8FAFC]">LearnOS Comprehensive User Manual</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Quick guide to all platform modules.</p>
          </div>

          <div className="space-y-4 text-xs text-[#94A3B8] leading-relaxed">
            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">1. College Tutor & Syllabus</h3>
              <p>Explore 6 core CS subjects across unit-by-unit topics, subtopics, learning objectives, practice questions, and revision resources. Ask the context-aware AI Tutor for Feynman analogies, Socratic questions, or code examples, or add custom university topics.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">2. Study Planner & Pomodoro</h3>
              <p>Organize study sprints with Kanban boards, manage your weekly class timetable, track SuperMemo spaced repetition reviews, and run Pomodoro focus sessions with synthesized ambient audio.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">3. Coding Lab</h3>
              <p>Select problems like Two Sum, Valid Parentheses, or Binary Search, write solutions in JavaScript, Python, or C, save your code, and run or submit against automated test cases.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-1">
              <h3 className="font-semibold text-[#F8FAFC]">4. Skill Development & AI Mock Interview</h3>
              <p>Follow structured career roadmaps with prerequisite tracking and practice role-specific technical interviews with instant rubric scoring.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

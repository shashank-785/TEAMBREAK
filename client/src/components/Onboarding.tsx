import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap, Sparkles, Check } from 'lucide-react';
import { User } from '../types';
import { Avatar, avatarOptions } from './Avatar';
import { AISetupNotice } from './AISetupNotice';

const CORE_SUBJECT_OPTIONS = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management Systems',
  'Computer Networks',
  'Discrete Mathematics',
  'Artificial Intelligence & Machine Learning'
];

const DEGREE_OPTIONS = ['B.Tech', 'B.E.', 'B.Sc (CS)', 'BCA', 'M.Tech', 'MCA'];

interface Props {
  user?: User | null;
  onComplete: (profile: User, syllabus: string, courses: string, coding: string, goal: string) => void;
  onSkip?: () => void;
}

export const Onboarding: React.FC<Props> = ({ user, onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [degree, setDegree] = useState(user?.degree || 'B.Tech');
  const [branch, setBranch] = useState(user?.branch || user?.major || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(user?.semester || 5);
  const [currentGpa, setCurrentGpa] = useState(user?.currentGpa || 0);
  const [targetGpa, setTargetGpa] = useState(user?.targetGpa || 9.0);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || `learnos-avatar:${avatarOptions[0].id}`);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    user?.subjects?.length ? user.subjects : CORE_SUBJECT_OPTIONS
  );
  const [learningInterests, setLearningInterests] = useState(
    user?.learningInterests?.join(', ') || 'Algorithms, Distributed Systems, Applied AI'
  );
  const [careerInterests, setCareerInterests] = useState(
    user?.careerInterests?.join(', ') || user?.dreamRole || 'Full-Stack AI Engineer, Software Engineer'
  );
  const [coding, setCoding] = useState(user?.codingExperience || 'Python, JavaScript, Data Structures');
  const [syllabus, setSyllabus] = useState(user?.syllabusCustomText || '');

  const toggleSubject = (subName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
    );
  };

  const canContinueStep0 = Boolean(name.trim() && university.trim() && branch.trim());
  const canContinueStep1 = selectedSubjects.length > 0 && Boolean(careerInterests.trim());

  const finish = () => {
    const careerList = careerInterests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const learningList = learningInterests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryGoal = careerList[0] || 'Full-Stack AI Engineer';
    const coursesStr = selectedSubjects.join(', ');

    onComplete(
      {
        id: user?.id || 'usr_personalized',
        name: name.trim() || user?.name || 'Student',
        email: email.trim() || user?.email || 'student@university.edu',
        university: university.trim() || 'University of Technology',
        degree,
        branch: branch.trim(),
        major: `${degree} ${branch.trim()}`.trim(),
        semester,
        subjects: selectedSubjects,
        learningInterests: learningList,
        careerInterests: careerList,
        codingExperience: coding.trim(),
        syllabusCustomText: syllabus.trim(),
        onboardingComplete: true,
        targetGpa,
        currentGpa,
        dreamRole: primaryGoal,
        avatarUrl: avatarUrl || `learnos-avatar:${avatarOptions[0].id}`,
        streakDays: user?.streakDays ?? 1,
        totalStudyHours: user?.totalStudyHours ?? 0,
        quizzesCompleted: user?.quizzesCompleted ?? 0,
        problemsSolved: user?.problemsSolved ?? 0,
        createdAt: user?.createdAt || new Date().toISOString()
      },
      syllabus,
      coursesStr,
      coding,
      primaryGoal
    );
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-[#e7e4f0] bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#efedff] p-4 text-slate-900">
      <div className="my-8 w-full max-w-2xl rounded-[2rem] border border-white bg-white/95 p-6 shadow-[0_24px_70px_rgba(65,53,117,0.14)] sm:p-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <GraduationCap />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Academic Profile Onboarding</h1>
              <p className="text-sm text-slate-500">
                Customize your degree, branch, subjects, and career goals—or skip anytime.
              </p>
            </div>
          </div>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
            >
              Skip for now →
            </button>
          )}
        </div>

        <div className="mb-5">
          <AISetupNotice />
        </div>

        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-violet-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="text-xs font-semibold text-slate-700">Choose your student avatar</legend>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {avatarOptions.map((avatar) => {
                  const value = `learnos-avatar:${avatar.id}`;
                  const selected = avatarUrl === value;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      aria-label={`${avatar.label} avatar`}
                      aria-pressed={selected}
                      onClick={() => setAvatarUrl(value)}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border p-2 transition ${
                        selected
                          ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
                          : 'border-slate-200 bg-white hover:border-violet-300'
                      }`}
                    >
                      <Avatar avatarUrl={value} name={avatar.label} className="h-9 w-9" />
                      <span className="text-[11px] text-slate-600">{avatar.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-700">
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                College or University
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g., IIT / NIT / VTU / Anna University"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Degree
                <select value={degree} onChange={(e) => setDegree(e.target.value)} className={inputClass}>
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700">
                Branch / Major
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Computer Science & Engineering"
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Current Semester
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Current CGPA / 10
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={currentGpa}
                  onChange={(e) => setCurrentGpa(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Target CGPA / 10
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-slate-700">
                Enrolled Subjects (Select your active CS courses)
              </span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CORE_SUBJECT_OPTIONS.map((sub) => {
                  const active = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition ${
                        active
                          ? 'border-violet-400 bg-violet-50 text-violet-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                      }`}
                    >
                      <span>{sub}</span>
                      {active && <Check size={14} className="text-violet-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-xs font-medium text-slate-700">
              Learning Interests (comma-separated)
              <input
                value={learningInterests}
                onChange={(e) => setLearningInterests(e.target.value)}
                placeholder="Algorithms, System Design, Machine Learning, Databases"
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Career Interests & Dream Roles (comma-separated)
              <input
                value={careerInterests}
                onChange={(e) => setCareerInterests(e.target.value)}
                placeholder="Full-Stack AI Engineer, Backend Systems Engineer, Data Scientist"
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Programming Languages & Experience
              <input
                value={coding}
                onChange={(e) => setCoding(e.target.value)}
                placeholder="Python, JavaScript/TypeScript, C/C++"
                className={inputClass}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-xs font-medium text-slate-700">
              Optional: Paste Custom University Syllabus Notes or Course Outcomes
              <textarea
                rows={7}
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Optional: Paste university-specific units or topics here. LearnOS already includes a complete 6-subject CS curriculum out of the box!"
                className={inputClass}
              />
            </label>
            <p className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs text-violet-800">
              All 6 core Computer Science subjects (DSA, OS, DBMS, Computer Networks, Discrete Mathematics, and AI & ML) are preloaded and ready immediately. You can also add custom university units anytime inside College Tutor or Profile & Settings.
            </p>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              disabled={step === 0 ? !canContinueStep0 : !canContinueStep1}
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_0_#edc52f] disabled:opacity-40"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_0_#edc52f]"
            >
              <Sparkles size={16} /> Launch LearnOS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

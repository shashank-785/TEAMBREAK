import React, { useState } from 'react';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { User } from '../types';
import { Avatar, avatarOptions } from './Avatar';
import { AISetupNotice } from './AISetupNotice';

interface Props {
  onComplete: (profile: User, syllabus: string, courses: string, coding: string, goal: string) => void;
}

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState(1);
  const [currentGpa, setCurrentGpa] = useState(0);
  const [targetGpa, setTargetGpa] = useState(9);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [goal, setGoal] = useState('');
  const [coding, setCoding] = useState('');
  const [courses, setCourses] = useState('');
  const [syllabus, setSyllabus] = useState('');

  const canContinue = step === 0
    ? name.trim() && email.trim() && university.trim() && major.trim() && avatarUrl
    : step === 1
      ? goal.trim() && coding.trim() && courses.trim()
      : syllabus.trim();

  const finish = () => {
    onComplete({
      id: 'usr_personalized',
      name: name.trim(), email: email.trim(), university: university.trim(), major: major.trim(),
      semester, targetGpa, currentGpa, dreamRole: goal.trim(), avatarUrl,
      streakDays: 0, totalStudyHours: 0, quizzesCompleted: 0, problemsSolved: 0,
      createdAt: new Date().toISOString()
    }, syllabus, courses, coding, goal);
  };

  const inputClass = 'mt-2 w-full rounded-xl border border-[#e7e4f0] bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#efedff] p-4 text-slate-900">
      <div className="my-8 w-full max-w-2xl rounded-[2rem] border border-white bg-white/95 p-6 shadow-[0_24px_70px_rgba(65,53,117,0.14)] sm:p-9">
        <div className="mb-7 flex items-center gap-4">
          <div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><GraduationCap /></div>
          <div><h1 className="text-2xl font-bold">Build your LearnOS</h1><p className="text-sm text-slate-500">A few details help us make this space yours.</p></div>
        </div>
        <div className="mb-6"><AISetupNotice /></div>
        {step === 0 && (
          <fieldset className="mb-6">
            <legend className="text-sm font-semibold text-slate-800">Choose your avatar</legend>
            <p className="mb-3 mt-1 text-xs text-slate-500">Pick the one that feels like you. You can change it later.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {avatarOptions.map(avatar => {
                const value = `learnos-avatar:${avatar.id}`;
                const selected = avatarUrl === value;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    aria-label={`${avatar.label} avatar`}
                    aria-pressed={selected}
                    onClick={() => setAvatarUrl(value)}
                    className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 transition ${selected ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 bg-white hover:border-violet-300'}`}
                  >
                    <Avatar avatarUrl={value} name={avatar.label} className="h-10 w-10" />
                    <span className="text-[11px] text-slate-600">{avatar.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
        <div className="mb-7 flex gap-2">{[0, 1, 2].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-violet-500' : 'bg-slate-200'}`} />)}</div>

        {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
          {[['Full name', name, setName, 'text'], ['Email', email, setEmail, 'email'], ['College or university', university, setUniversity, 'text'], ['Branch or major', major, setMajor, 'text']].map(([label, value, setter, type]: any) =>
            <label key={label} className="text-xs font-medium text-slate-700">{label}<input type={type} value={value} onChange={e => setter(e.target.value)} className={inputClass} /></label>)}
          <label className="text-xs font-medium text-slate-700">Current semester<input type="number" min="1" max="12" value={semester} onChange={e => setSemester(Number(e.target.value))} className={inputClass} /></label>
          {semester > 1 && <label className="text-xs font-medium text-slate-700">Current CGPA / 10<input type="number" min="0" max="10" step="0.01" value={currentGpa} onChange={e => setCurrentGpa(Number(e.target.value))} className={inputClass} /></label>}
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">Target CGPA / 10<input type="number" min="0" max="10" step="0.01" value={targetGpa} onChange={e => setTargetGpa(Number(e.target.value))} className={inputClass} /></label>
        </div>}

        {step === 1 && <div className="space-y-4">
          <label className="text-xs font-medium text-slate-700">What do you want to become?<input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Example: AI Engineer, Product Developer, Data Scientist" className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">Coding languages and experience<textarea rows={3} value={coding} onChange={e => setCoding(e.target.value)} placeholder="Example: Python beginner, JavaScript intermediate, preparing for coding interviews" className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">Current semester subjects<textarea rows={4} value={courses} onChange={e => setCourses(e.target.value)} placeholder="Database Systems, Operating Systems, Computer Networks..." className={inputClass} /></label>
        </div>}

        {step === 2 && <div className="space-y-4">
          <label className="text-xs font-medium text-slate-700">Paste your university syllabus<textarea rows={10} value={syllabus} onChange={e => setSyllabus(e.target.value)} placeholder="Paste subject units, topics, course outcomes and recommended books..." className={inputClass} /></label>
          <p className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-xs text-violet-800">PDF upload is available later in Profile & Settings. You can also paste a syllabus here now.</p>
        </div>}

        <div className="mt-7 flex justify-end">
          {step < 2 ? <button disabled={!canContinue} onClick={() => setStep(step + 1)} className="flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_0_#edc52f] disabled:opacity-40">Continue <ArrowRight size={16} /></button>
            : <button disabled={!canContinue} onClick={finish} className="flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_0_#edc52f] disabled:opacity-40"><Sparkles size={16} /> Personalize LearnOS</button>}
        </div>
      </div>
    </div>
  );
};

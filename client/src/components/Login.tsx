import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, GraduationCap, LogIn, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { AISetupNotice } from './AISetupNotice';

interface Props {
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

const studyCards = [
  { title: 'Lecture notes', detail: 'Keep everything together', icon: BookOpen, style: 'bg-[#ffe47d] rotate-[-3deg]' },
  { title: 'Flashcards', detail: 'Remember the little things', icon: Sparkles, style: 'bg-[#c6c2ff] rotate-[2deg]' },
  { title: 'Quick quizzes', detail: 'Check what you know', icon: Check, style: 'bg-[#ffb7a9] rotate-[2deg]' },
  { title: 'Study plans', detail: 'One day at a time', icon: GraduationCap, style: 'bg-[#b8e4d7] rotate-[-2deg]' }
];

export const Login: React.FC<Props> = ({ onLogin, onSignup }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        const result = await api.register(email.trim(), password, confirmPassword, {});
        onSignup(result.user);
      } else {
        const result = await api.login(email.trim(), password);
        onLogin(result.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'mt-2 w-full rounded-xl border border-[#e7e4f0] bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100';

  return (
    <main className="min-h-screen overflow-y-auto bg-[#efedff] px-4 py-5 text-slate-900 sm:px-8 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl items-center gap-8 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <section className="mx-auto w-full max-w-xl py-4 lg:py-10">
          <a href={import.meta.env.BASE_URL} className="inline-flex items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white"><GraduationCap size={20} /></span>
            <span className="font-extrabold tracking-tight">Learn<span className="text-violet-600">OS</span></span>
          </a>
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">A little more focus, a lot less overwhelm</p>
          <h1 className="mt-3 max-w-lg text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
            Make your next study session <span className="text-violet-600">count.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
            Your notes, revision, courses and study plans—together in one friendly space built for university life.
          </p>

          <div className="mt-6 max-w-lg">
            <AISetupNotice />
          </div>

          <div className="mt-8 grid max-w-md grid-cols-2 gap-4 px-1 py-2">
            {studyCards.map(({ title, detail, icon: Icon, style }) => (
              <div key={title} className={`min-h-32 rounded-[1.6rem] p-4 shadow-[0_12px_30px_rgba(74,61,126,0.10)] transition-transform hover:rotate-0 ${style}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-slate-800"><Icon size={18} /></span>
                <p className="mt-4 text-sm font-extrabold text-slate-900">{title}</p>
                <p className="mt-0.5 text-[11px] text-slate-700/80">{detail}</p>
              </div>
            ))}
          </div>

        </section>

        <section className="mx-auto w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(65,53,117,0.14)] backdrop-blur sm:p-9">
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2efff] px-3 py-1.5 text-[11px] font-bold text-violet-700">
              <Sparkles size={13} /> YOUR STUDY SPACE
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">
              {mode === 'login' ? 'Welcome back' : 'Let’s get you started'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login' ? 'Pick up right where you left off.' : 'Create your account, then make it yours.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-700">
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={event => { setEmail(event.target.value); setError(''); }}
                placeholder="you@university.edu"
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Password{mode === 'signup' && <span className="font-normal text-slate-500"> · at least 8 characters</span>}
              <input
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={event => { setPassword(event.target.value); setError(''); }}
                placeholder="Enter your password"
                className={inputClass}
              />
            </label>
            {mode === 'signup' && (
              <label className="block text-xs font-semibold text-slate-700">
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={event => { setConfirmPassword(event.target.value); setError(''); }}
                  placeholder="Type your password again"
                  className={inputClass}
                />
              </label>
            )}
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">{error}</p>}
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_5px_0_#edc52f] transition hover:-translate-y-0.5 hover:bg-[#ffdf68] disabled:cursor-wait disabled:opacity-60"
            >
              {mode === 'login' ? <LogIn size={17} /> : <Sparkles size={17} />}
              {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Log in to LearnOS' : 'Create my account')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-100" />Your learning, in one place<span className="h-px flex-1 bg-slate-100" />
          </div>
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="w-full rounded-full border border-[#e9e5f4] bg-white px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
          >
            {mode === 'login' ? 'New to LearnOS? Create an account' : 'Already have an account? Log in'}
          </button>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
            Your AI study partner runs on LearnOS. No student API keys or separate AI app required.
          </p>
        </section>
      </div>
    </main>
  );
};

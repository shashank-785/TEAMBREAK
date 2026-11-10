import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Modal } from './Modal';
import { api } from '../services/api';
import { User } from '../types';
import { Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { Onboarding } from './Onboarding';
import { Login } from './Login';

export const Layout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isQuickAskOpen, setIsQuickAskOpen] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [isLoadingQuickAnswer, setIsLoadingQuickAnswer] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [onboardingCompleteBackend, setOnboardingCompleteBackend] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem('learnos_theme') === 'dark' ? 'dark' : 'light'
  ));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('learnos_theme', theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getAuthStatus().catch(() => ({ registered: false, onboardingComplete: false })),
      localStorage.getItem('learnos_token') ? api.getMe().catch(() => null) : Promise.resolve(null)
    ]).then(([status, currentUser]) => {
      if (!active) return;
      setRegistered(status.registered);
      setOnboardingCompleteBackend(status.onboardingComplete);
      if (currentUser) {
        setUser(currentUser);
        if (status.onboardingComplete) setOnboardingComplete(true);
      }
    }).finally(() => {
      if (active) setAuthChecked(true);
    });
    return () => { active = false; };
  }, []);

  const handleQuickAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim() || isLoadingQuickAnswer) return;

    setIsLoadingQuickAnswer(true);
    setQuickAnswer(null);
    try {
      const response = await api.sendAiMessage(quickQuestion, 'Quick Ask Floating Widget');
      setQuickAnswer(response.text || 'Explanation generated.');
    } catch {
      setQuickAnswer('Unable to generate answer right now.');
    } finally {
      setIsLoadingQuickAnswer(false);
    }
  };

  const handleOnboardingComplete = async (profile: User, syllabus: string, courses: string, coding: string, goal: string) => {
    localStorage.setItem('learnos_onboarding_complete', 'true');
    localStorage.setItem('learnos_syllabus_text', syllabus);
    localStorage.setItem('learnos_courses_text', courses);
    localStorage.setItem('learnos_coding_profile', coding);
    localStorage.setItem('learnos_career_goal', goal);
    const saved = await api.updateProfile(profile);
    setUser(saved);
    setOnboardingComplete(true);
    setOnboardingCompleteBackend(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('learnos_token');
    localStorage.removeItem('learnos_demo_session');
    localStorage.removeItem('learnos_demo_user');
    setUser(null);
    setOnboardingComplete(false);
  };

  if (!authChecked) return <div className="min-h-screen bg-[var(--app-bg)]" />;
  if (!user) return <Login onLogin={currentUser => {
    setUser(currentUser);
    api.getAuthStatus().then(status => {
      setRegistered(status.registered);
      setOnboardingCompleteBackend(status.onboardingComplete);
      setOnboardingComplete(status.onboardingComplete);
    });
  }} onSignup={currentUser => {
    setRegistered(true);
    setUser(currentUser);
    setOnboardingComplete(false);
    setOnboardingCompleteBackend(false);
  }} onDemo={demoUser => {
    setUser(demoUser);
    setRegistered(true);
    setOnboardingComplete(true);
    setOnboardingCompleteBackend(true);
  }} />;

  if (registered && !onboardingCompleteBackend && !onboardingComplete) return <Onboarding onComplete={handleOnboardingComplete} />;
  if (!onboardingComplete) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm md:hidden"
        />
      )}

      <Sidebar
        user={user}
        isOpen={isMobileSidebarOpen}
        onNavigate={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[var(--app-bg)] md:ml-64">
        <Navbar
          user={user}
          onOpenQuickAsk={() => setIsQuickAskOpen(true)}
          onLogout={handleLogout}
          onMenuToggle={() => setIsMobileSidebarOpen(open => !open)}
          theme={theme}
          onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ user, setUser }} />
        </main>
      </div>

      {/* Omnipresent Quick AI Modal */}
      <Modal 
        isOpen={isQuickAskOpen} 
        onClose={() => setIsQuickAskOpen(false)} 
        title="Ask LearnOS Academic AI Tutor"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#94A3B8]">
            Ask any question about Data Structures, Operating Systems, Computer Networks, DBMS, algorithms, or exam preparation.
          </p>

          <form onSubmit={handleQuickAskSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                placeholder="E.g., How does virtual memory paging work and what causes thrashing?"
                className="w-full bg-[#0B0D12] border border-[#232936] rounded-lg p-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAskOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#232936] rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!quickQuestion.trim() || isLoadingQuickAnswer}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                {isLoadingQuickAnswer ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Generate Answer</span>
              </button>
            </div>
          </form>

          {/* AI Response Display */}
          {quickAnswer && (
            <div className="mt-4 p-4 rounded-xl bg-[#0B0D12] border border-indigo-500/30 space-y-2 max-h-80 overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Bot size={15} />
                <span>AI Tutor Response:</span>
              </div>
              <div className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-line font-sans">
                {quickAnswer}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

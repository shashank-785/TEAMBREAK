import React, { useState, useEffect } from 'react';
import { Search, Flame, Clock, Sparkles, Menu, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onOpenQuickAsk?: () => void;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenQuickAsk, onLogout, onMenuToggle, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  useEffect(() => {
    // Quick health probe
    fetch('/api/system/health')
      .then(res => res.ok ? setIsBackendHealthy(true) : setIsBackendHealthy(false))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to appropriate view based on query
    const q = searchQuery.toLowerCase();
    if (q.includes('code') || q.includes('python') || q.includes('c') || q.includes('sum')) {
      navigate('/coding');
    } else if (q.includes('exam') || q.includes('quiz') || q.includes('pyq')) {
      navigate('/exams');
    } else if (q.includes('note') || q.includes('summary')) {
      navigate('/notes');
    } else if (q.includes('plan') || q.includes('schedule') || q.includes('pomodoro')) {
      navigate('/planner');
    } else {
      navigate('/tutor');
    }
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#232936] bg-[#0B0D12]/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#232936] text-[#94A3B8] transition hover:border-indigo-500/40 hover:text-white md:hidden"
      >
        <Menu size={19} />
      </button>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative min-w-0 max-w-md flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search LearnOS..."
          aria-label="Search LearnOS"
          className="w-full rounded-xl border border-[#232936] bg-[#151923] py-2.5 pl-10 pr-10 text-xs text-[#F8FAFC] transition-colors placeholder:text-[#94A3B8]/60 focus:border-indigo-500 focus:outline-none sm:py-2"
        />
        <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-700 bg-[#232936] px-1.5 py-0.5 font-mono text-[10px] text-[#94A3B8] sm:block">
          /
        </kbd>
      </form>

      {/* Stats & Quick Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#232936] bg-[#151923] text-amber-300 transition hover:border-indigo-500/40 sm:h-9 sm:w-9"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        {/* System Health Status */}
        <div 
          className="hidden items-center gap-1.5 rounded-full border border-[#232936] bg-[#151923] px-2.5 py-1 text-[11px] sm:flex"
          title={isBackendHealthy ? 'Backend Node.js & DB Connected' : 'Offline Mode (Local Engine Active)'}
        >
          {isBackendHealthy ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono">Backend Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-mono">Local Store</span>
            </>
          )}
        </div>

        {/* Streak Counter */}
        {user && (
          <div className="hidden items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 lg:flex">
            <Flame size={15} className="fill-amber-400 text-amber-400" />
            <span>{user.streakDays} Day Streak</span>
          </div>
        )}

        {/* Total Study Hours */}
        {user && (
          <div className="hidden items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 lg:flex">
            <Clock size={15} />
            <span>{user.totalStudyHours} hrs</span>
          </div>
        )}

        {/* AI Quick Tutor Action Button */}
        <button
          onClick={() => {
            if (onOpenQuickAsk) onOpenQuickAsk();
            else navigate('/assistant');
          }}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-95 sm:h-auto sm:px-3.5 sm:py-2"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">Ask AI Tutor</span>
        </button>
        {onLogout && (
          <button onClick={onLogout} aria-label="Log out" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#151923] hover:text-white sm:h-auto sm:w-auto sm:px-2 sm:py-1.5">
            <LogOut size={16} className="sm:hidden" />
            <span className="hidden text-xs font-semibold sm:inline">Log out</span>
          </button>
        )}
      </div>
    </header>
  );
};

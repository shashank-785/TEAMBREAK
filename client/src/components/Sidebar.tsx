import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, GraduationCap, Calendar, FileText, 
  Award, Code2, Compass, Bot, BarChart3, Settings, 
  Flame, ChevronRight, Puzzle
} from 'lucide-react';
import { User } from '../types';
import { Avatar } from './Avatar';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onNavigate: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'College Tutor', path: '/tutor', icon: GraduationCap, badge: 'Syllabus' },
  { name: 'Study Planner', path: '/planner', icon: Calendar, badge: 'Pomodoro' },
  { name: 'Notes & Docs', path: '/notes', icon: FileText },
  { name: 'Exam Centre', path: '/exams', icon: Award, badge: 'PYQs' },
  { name: 'Coding Lab', path: '/coding', icon: Code2, badge: 'Sandbox' },
  { name: 'Skill Dev', path: '/skills', icon: Compass, badge: 'Roadmaps' },
  { name: 'AI Assistant', path: '/assistant', icon: Bot, isAi: true },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Brain Games', path: '/games', icon: Puzzle, badge: 'IQ' },
  { name: 'Profile & Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onNavigate }) => {
  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen w-64 select-none flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <GraduationCap className="text-white" size={20} />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              <span>Learn</span><span className="text-violet-600">OS</span>
              <span className="text-[10px] bg-[var(--accent-soft)] text-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--border)] font-mono">v3.0</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Your study space</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-[var(--text-muted)]/70 uppercase">
          Core Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              className={({ isActive }) => `
                flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-alt)]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'}
                    />
                    <span>{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.isAi && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} className="text-[var(--accent)]" />}
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Mini Student Card */}
      {user && (
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-alt)]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <Avatar avatarUrl={user.avatarUrl} name={user.name} className="h-10 w-10 border border-violet-200 text-xl" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-[var(--text-primary)] truncate">{user.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">Sem {user.semester} • {user.major.split(' ')[0]}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                  <Flame size={12} className="fill-amber-400 text-amber-400" /> {user.streakDays}d
                </span>
                <span className="text-[10px] font-mono text-emerald-400">GPA {user.currentGpa.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

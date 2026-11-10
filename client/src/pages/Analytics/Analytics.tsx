import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Flame, Code2, TrendingUp, Trophy, BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { Achievement } from '../../types';
import { Badge } from '../../components/Badge';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getAnalytics().then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-12 text-[#94A3B8]">Loading student analytics...</div>;
  }

  const { user, weeklyStudyHours = [], subjectMasteries = [], codingStats, activityHeatmap = [], achievements = [] } = data;
  const weeklyHoursSum = weeklyStudyHours.reduce((acc: number, item: any) => acc + (Number(item.hours) || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Academic & Career Analytics</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time tracking of subject mastery, study hours, coding solves, streaks, and milestone badges.
          </p>
        </div>

        <Badge variant="purple">Live Student Data</Badge>
      </div>

      {/* Top 3 High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94A3B8]">Consecutive Streak & Hours</span>
            <Flame className="text-amber-400 fill-amber-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-[#F8FAFC]">{user.streakDays} Days</div>
          <div className="text-[11px] text-amber-400">
            Total Study Time Logged: {Number(user.totalStudyHours ?? user.studyHoursTotal ?? 0).toFixed(1)} hrs
          </div>
        </div>

        <div className="bg-[#151923] border border-[#232936] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94A3B8]">Cumulative GPA</span>
            <TrendingUp className="text-emerald-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-[#F8FAFC]">{Number(user.currentGpa || 0).toFixed(2)}</div>
          <div className="text-[11px] text-emerald-400">Targeting {Number(user.targetGpa || 9).toFixed(2)} / 10.00</div>
        </div>

        <div className="bg-[#151923] border border-[#232936] rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94A3B8]">Coding Problem Solves</span>
            <Code2 className="text-indigo-400" size={18} />
          </div>
          <div className="text-3xl font-extrabold text-[#F8FAFC]">{user.problemsSolved} Solved</div>
          <div className="text-[11px] text-indigo-400">{codingStats?.acceptanceRate ?? 0}% Catalog Completion</div>
        </div>
      </div>

      {/* Subject Mastery Progress across all 6 CS subjects */}
      {subjectMasteries.length > 0 && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-[#F8FAFC]">Subject Syllabus Mastery</h2>
            </div>
            <span className="text-xs text-[#94A3B8]">{subjectMasteries.length} Core Subjects</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectMasteries.map((sub: any) => (
              <div key={sub.code || sub.subject} className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F8FAFC] truncate">{sub.subject}</span>
                  <span className="font-mono text-indigo-400">{sub.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#151923] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, sub.progress))}%` }}
                  />
                </div>
                {sub.completedTopics !== undefined && (
                  <div className="text-[11px] text-[#94A3B8]">
                    {sub.completedTopics} / {sub.totalTopics} syllabus topics mastered
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2-Column Section: Study Hours Bar Chart & Coding Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Study Hours Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Weekly Study Hours Breakdown</h2>
            <span className="text-xs font-mono text-[#94A3B8]">Total: {weeklyHoursSum.toFixed(1)} hrs this week</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2">
            {weeklyStudyHours.map((d: any, idx: number) => {
              const heightPct = Math.min(100, Math.round((d.hours / 8) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] text-[#94A3B8] opacity-80 group-hover:opacity-100 transition-opacity font-mono">
                    {d.hours}h
                  </span>
                  <div className="w-full bg-[#0E1118] rounded-t-lg h-36 flex items-end overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all group-hover:from-indigo-500 group-hover:to-indigo-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coding Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">Coding Problems by Difficulty</h2>
          
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-semibold">Easy Problems</span>
                <span className="font-mono text-[#F8FAFC]">{codingStats.easy} Solved</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1118] overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (codingStats.easy / 35) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold">Medium Problems</span>
                <span className="font-mono text-[#F8FAFC]">{codingStats.medium} Solved</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1118] overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (codingStats.medium / 30) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-400 font-semibold">Hard Problems</span>
                <span className="font-mono text-[#F8FAFC]">{codingStats.hard} Solved</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1118] overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (codingStats.hard / 10) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Activity Streak Heatmap */}
      <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">30-Day Study Activity Streak</h2>
          <span className="text-xs text-[#94A3B8]">Consecutive daily consistency</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {activityHeatmap.map((item: any, i: number) => {
            let color = 'bg-[#0E1118] border-[#232936]';
            if (item.count >= 4) color = 'bg-indigo-500 border-indigo-400';
            else if (item.count >= 2) color = 'bg-indigo-700 border-indigo-600';
            else if (item.count >= 1) color = 'bg-indigo-950 border-indigo-900';

            return (
              <div 
                key={i} 
                title={`${item.date}: ${item.count} sessions`}
                className={`w-5 h-5 rounded-md border ${color} cursor-pointer hover:scale-110 transition-transform`}
              />
            );
          })}
        </div>
      </div>

      {/* Gamification Achievements & Trophy Wall */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={20} />
          <h2 className="text-base font-bold text-[#F8FAFC]">Milestone Badges & Achievements</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach: Achievement) => (
            <div 
              key={ach.id}
              className={`p-5 rounded-xl border space-y-3 transition-all ${
                ach.unlocked 
                  ? 'bg-[#151923] border-indigo-500/30' 
                  : 'bg-[#0B0D12] border-[#232936] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  ach.unlocked ? 'bg-amber-500/15 text-amber-400' : 'bg-[#1C2230] text-[#94A3B8]'
                }`}>
                  <Trophy size={18} />
                </div>
                {ach.unlocked ? (
                  <Badge variant="success" size="sm">Unlocked</Badge>
                ) : (
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#F8FAFC]">{ach.title}</h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{ach.description}</p>
              </div>

              {!ach.unlocked && (
                <div className="w-full h-1.5 rounded-full bg-[#0E1118] overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

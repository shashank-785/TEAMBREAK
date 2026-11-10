import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar, CheckSquare, Clock, Plus, Trash2, 
  RotateCcw, Play, Pause, Volume2, Edit3,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { PlannerTask, ScheduleItem, RevisionItem, User } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

const SUBJECT_OPTIONS = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management Systems',
  'Computer Networks',
  'Discrete Mathematics',
  'Artificial Intelligence & Machine Learning',
  'General'
];

export const StudyPlanner: React.FC = () => {
  const outlet = useOutletContext<{ user?: User | null; setUser?: (u: User) => void }>() || {};
  const [activeTab, setActiveTab] = useState<'tasks' | 'timetable' | 'revision' | 'pomodoro'>('tasks');
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);

  // Task Creation Modal State
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Data Structures & Algorithms');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-11-15');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<'assignment' | 'exam_prep' | 'reading' | 'coding'>('assignment');

  // Task Edit Modal State
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);

  // Schedule Creation Modal State
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);
  const [newSchedTitle, setNewSchedTitle] = useState('');
  const [newSchedDay, setNewSchedDay] = useState(1);
  const [newSchedStart, setNewSchedStart] = useState('09:00');
  const [newSchedEnd, setNewSchedEnd] = useState('10:30');
  const [newSchedType, setNewSchedType] = useState<'lecture' | 'lab' | 'self_study' | 'revision'>('lecture');
  const [newSchedLocation, setNewSchedLocation] = useState('Room 301 / Study Desk');

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(3);
  const [ambientSound, setAmbientSound] = useState<'none' | 'white' | 'rain' | 'binaural'>('none');
  const [pomodoroNotice, setPomodoroNotice] = useState('');

  // Web Audio Context for offline ambient sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  useEffect(() => {
    api.getTasks().then(setTasks);
    api.getSchedules().then(setSchedules);
    api.getRevisions().then(setRevisions);
  }, []);

  const completeFocusBlock = async () => {
    setCompletedSessions(prev => prev + 1);
    const totalHours = await api.recordPomodoro();
    if (typeof totalHours === 'number' && outlet.user && outlet.setUser) {
      outlet.setUser({ ...outlet.user, totalStudyHours: totalHours });
    }
    setPomodoroNotice('Focus session logged (+25 mins added to your study analytics).');
    setTimeout(() => setPomodoroNotice(''), 5000);
  };

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      if (timerMode === 'work') {
        void completeFocusBlock();
        switchTimerMode('shortBreak');
      } else {
        setPomodoroNotice('Break finished! Ready for your next focus block.');
        switchTimerMode('work');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, timerMode]);

  const switchTimerMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setTimerMode(mode);
    setIsRunning(false);
    if (mode === 'work') setTimeLeft(25 * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Web Audio Synthesizer for offline ambient focus sounds
  const toggleAmbientSound = (type: 'none' | 'white' | 'rain' | 'binaural') => {
    if (noiseNodeRef.current) {
      try { (noiseNodeRef.current as any).stop?.(); } catch {}
      noiseNodeRef.current.disconnect();
      noiseNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (type === 'none') {
      setAmbientSound('none');
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else if (type === 'binaural') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(432, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      noiseNodeRef.current = whiteNoise;
      setAmbientSound(type);
    } catch (e) {
      console.warn('Web Audio Ambient error:', e);
      setAmbientSound('none');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const created = await api.createTask({
      title: newTaskTitle.trim(),
      subjectName: newTaskSubject,
      dueDate: newTaskDueDate,
      priority: newTaskPriority,
      status: 'todo',
      category: newTaskCategory
    });

    setTasks(prev => [created, ...prev]);
    setIsNewTaskOpen(false);
    setNewTaskTitle('');
  };

  const handleSaveEditedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    const updated = await api.updateTask(editingTask.id, {
      title: editingTask.title.trim(),
      subjectName: editingTask.subjectName,
      dueDate: editingTask.dueDate,
      priority: editingTask.priority,
      status: editingTask.status,
      category: editingTask.category
    });
    if (updated) {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
    setEditingTask(null);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await api.updateTask(taskId, { status: newStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await api.deleteTask(taskId);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedTitle.trim()) return;
    const created = await api.createSchedule({
      title: newSchedTitle.trim(),
      subject: newSchedTitle.trim(),
      dayOfWeek: Number(newSchedDay),
      startTime: newSchedStart,
      endTime: newSchedEnd,
      type: newSchedType,
      location: newSchedLocation.trim() || 'Campus'
    });
    setSchedules(prev => [...prev, created]);
    setIsNewScheduleOpen(false);
    setNewSchedTitle('');
  };

  const handleDeleteSchedule = async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    await api.deleteSchedule(id);
  };

  const handleAdvanceRevision = async (id: string) => {
    const updated = await api.advanceRevision(id);
    if (updated) {
      setRevisions(prev => prev.map(r => r.id === id ? updated : r));
    }
  };

  const daysOfWeek = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="text-indigo-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Study Planner & Productivity</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Weekly timetable, Kanban tasks, spaced repetition revisions, and focus timer.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-[#151923] p-1.5 rounded-xl border border-[#232936]">
          {[
            { id: 'tasks', label: 'Task Kanban', icon: CheckSquare },
            { id: 'timetable', label: 'Class Timetable', icon: Calendar },
            { id: 'revision', label: 'Spaced Repetition', icon: RotateCcw },
            { id: 'pomodoro', label: 'Pomodoro Timer', icon: Clock },
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

      {/* TAB 1: TASK KANBAN BOARD */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <span>Active Sprint Tasks: {tasks.filter(t => t.status !== 'completed').length} pending • {tasks.filter(t => t.status === 'completed').length} completed</span>
            </div>
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              <Plus size={14} />
              <span>Create New Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: To Do */}
            <div className="bg-[#151923] border border-[#232936] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#232936]">
                <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">To Do</span>
                <Badge variant="neutral" size="sm">{tasks.filter(t => t.status === 'todo').length}</Badge>
              </div>

              <div className="space-y-3">
                {tasks.filter(t => t.status === 'todo').map(task => (
                  <div key={task.id} className="p-4 rounded-xl bg-[#0B0D12] border border-[#232936] hover:border-slate-700 space-y-2.5 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#F8FAFC]">{task.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setEditingTask(task)} title="Edit task" className="text-[#94A3B8] hover:text-indigo-400">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} title="Delete task" className="text-[#94A3B8] hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>{task.subjectName}</span>
                      <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'} size="sm">{task.priority}</Badge>
                    </div>
                    <div className="pt-2 border-t border-[#232936] flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8]">Due: {task.dueDate}</span>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        <span>Start</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-[#151923] border border-[#232936] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#232936]">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">In Progress</span>
                <Badge variant="warning" size="sm">{tasks.filter(t => t.status === 'in_progress').length}</Badge>
              </div>

              <div className="space-y-3">
                {tasks.filter(t => t.status === 'in_progress').map(task => (
                  <div key={task.id} className="p-4 rounded-xl bg-[#0B0D12] border border-amber-500/20 hover:border-amber-500/40 space-y-2.5 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#F8FAFC]">{task.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setEditingTask(task)} title="Edit task" className="text-[#94A3B8] hover:text-indigo-400">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} title="Delete task" className="text-[#94A3B8] hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>{task.subjectName}</span>
                      <Badge variant={task.priority === 'high' ? 'danger' : 'warning'} size="sm">{task.priority}</Badge>
                    </div>
                    <div className="pt-2 border-t border-[#232936] flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'todo')}
                        className="text-[#94A3B8] hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <span>Complete</span>
                        <CheckCircle2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="bg-[#151923] border border-[#232936] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#232936]">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Completed</span>
                <Badge variant="success" size="sm">{tasks.filter(t => t.status === 'completed').length}</Badge>
              </div>

              <div className="space-y-3">
                {tasks.filter(t => t.status === 'completed').map(task => (
                  <div key={task.id} className="p-4 rounded-xl bg-[#0B0D12] border border-emerald-500/20 opacity-80 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#F8FAFC] line-through">{task.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setEditingTask(task)} title="Edit task" className="text-[#94A3B8] hover:text-indigo-400">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} title="Delete task" className="text-[#94A3B8] hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">{task.subjectName}</div>
                    <div className="pt-2 border-t border-[#232936] flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={13} /> Done
                      </span>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        className="text-[#94A3B8] hover:text-white"
                      >
                        Reopen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS TIMETABLE GRID */}
      {activeTab === 'timetable' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Weekly Class & Study Schedule</h3>
              <span className="text-xs text-[#94A3B8]">Customize your lectures, labs, and dedicated study blocks</span>
            </div>
            <button
              onClick={() => setIsNewScheduleOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 self-start sm:self-auto"
            >
              <Plus size={14} />
              <span>Add Schedule Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {daysOfWeek.map((day) => {
              const daySchedules = schedules
                .filter(s => s.dayOfWeek === day.value)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={day.label} className="p-3 rounded-xl bg-[#0B0D12] border border-[#232936] space-y-3">
                  <div className="text-xs font-bold text-indigo-400 pb-2 border-b border-[#232936] flex items-center justify-between">
                    <span>{day.label}</span>
                    <span className="text-[10px] text-[#94A3B8]">{daySchedules.length}</span>
                  </div>
                  <div className="space-y-2">
                    {daySchedules.length > 0 ? (
                      daySchedules.map(item => (
                        <div 
                          key={item.id} 
                          className={`p-2.5 rounded-lg border text-xs space-y-1 relative group ${
                            item.type === 'lecture' ? 'bg-indigo-950/20 border-indigo-500/30' :
                            item.type === 'lab' ? 'bg-emerald-950/20 border-emerald-500/30' :
                            'bg-amber-950/20 border-amber-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-semibold text-[#F8FAFC] leading-snug">{item.title}</div>
                            <button
                              onClick={() => handleDeleteSchedule(item.id)}
                              title="Remove slot"
                              className="text-[#94A3B8] hover:text-rose-400 opacity-70 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">{item.startTime} - {item.endTime}</div>
                          <div className="text-[10px] text-indigo-300 font-mono">{item.location}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-[#94A3B8]/60 italic py-4 text-center">
                        No classes scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SPACED REPETITION REVISION MANAGER */}
      {activeTab === 'revision' && (
        <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">SuperMemo Spaced Repetition Queue</h3>
              <p className="text-xs text-[#94A3B8]">Calculates optimal recall intervals: 1d → 3d → 7d → 14d → 30d.</p>
            </div>
            <Badge variant="warning">{revisions.filter(r => r.dueToday).length} Due Today</Badge>
          </div>

          <div className="space-y-3">
            {revisions.map(item => (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  item.dueToday 
                    ? 'bg-amber-950/10 border-amber-500/30 shadow-md' 
                    : 'bg-[#0B0D12] border-[#232936]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F8FAFC]">{item.topicTitle}</span>
                    {item.dueToday && <Badge variant="warning" size="sm">Review Due Today</Badge>}
                  </div>
                  <div className="text-xs text-[#94A3B8]">
                    {item.subjectName} • Last reviewed {item.lastReviewed} • Next: {item.nextReviewDate}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-indigo-400">Interval Stage {item.stage}/5</div>
                    <div className="w-24 h-1.5 bg-[#232936] rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500" style={{ width: `${(item.stage / 5) * 100}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdvanceRevision(item.id)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 whitespace-nowrap"
                  >
                    Mark Reviewed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: POMODORO FOCUS TIMER */}
      {activeTab === 'pomodoro' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 bg-[#151923] border border-[#232936] rounded-2xl p-8 text-center space-y-6">
            {/* Mode Selector */}
            <div className="inline-flex p-1 rounded-xl bg-[#0B0D12] border border-[#232936]">
              <button
                onClick={() => switchTimerMode('work')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  timerMode === 'work' ? 'bg-indigo-600 text-white' : 'text-[#94A3B8]'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => switchTimerMode('shortBreak')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  timerMode === 'shortBreak' ? 'bg-indigo-600 text-white' : 'text-[#94A3B8]'
                }`}
              >
                Short Break (5m)
              </button>
              <button
                onClick={() => switchTimerMode('longBreak')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  timerMode === 'longBreak' ? 'bg-indigo-600 text-white' : 'text-[#94A3B8]'
                }`}
              >
                Long Break (15m)
              </button>
            </div>

            {/* Huge Timer Display */}
            <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-[#F8FAFC]">
              {formatTimer(timeLeft)}
            </div>

            {pomodoroNotice && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {pomodoroNotice}
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95 ${
                  isRunning 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
                <span>{isRunning ? 'Pause' : 'Start Focus Session'}</span>
              </button>

              <button
                onClick={() => switchTimerMode(timerMode)}
                className="p-3.5 bg-[#0B0D12] hover:bg-[#1C2230] text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl border border-[#232936] transition-colors"
                title="Reset Timer"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={() => void completeFocusBlock()}
                className="px-4 py-3.5 bg-[#0B0D12] hover:bg-[#1C2230] text-emerald-400 rounded-xl border border-emerald-500/30 text-xs font-semibold transition-colors"
                title="Log a completed 25-minute study session"
              >
                + Log Completed Session
              </button>
            </div>
          </div>

          {/* Ambient Sound Synthesizer & Stats */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-[#151923] border border-[#232936] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Volume2 size={16} />
                <span>Focus Ambient Audio</span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Web Audio synthesized noise generators to drown out distractions. Zero streaming bandwidth needed!
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'none', label: 'Mute', desc: 'Silent' },
                  { id: 'white', label: 'White Noise', desc: 'Flat sound spectrum' },
                  { id: 'rain', label: 'Soft Rain', desc: 'Low-pass pink noise' },
                  { id: 'binaural', label: 'Binaural 432Hz', desc: 'Alpha study waves' },
                ].map(snd => (
                  <button
                    key={snd.id}
                    onClick={() => toggleAmbientSound(snd.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      ambientSound === snd.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-[#0B0D12] border-[#232936] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <div className="text-xs">{snd.label}</div>
                    <div className="text-[10px] text-[#94A3B8]/60 mt-0.5">{snd.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-[#151923] border border-[#232936] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#94A3B8]">Completed Pomodoros Today</span>
                <span className="text-lg font-bold text-amber-400 font-mono">{completedSessions}</span>
              </div>
              <div className="mt-2 text-xs text-[#94A3B8]">
                Each finished focus block logs +0.42 hrs directly to your student analytics and daily activity heatmap.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      <Modal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} title="Create New Study Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Task Title</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="E.g., Complete Dynamic Programming practice set"
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Subject</label>
              <select
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                {SUBJECT_OPTIONS.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Due Date</label>
              <input
                type="date"
                required
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Category</label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as any)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                <option value="assignment">Assignment</option>
                <option value="exam_prep">Exam Prep</option>
                <option value="reading">Reading</option>
                <option value="coding">Coding</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Task */}
      <Modal isOpen={Boolean(editingTask)} onClose={() => setEditingTask(null)} title="Edit Study Task">
        {editingTask && (
          <form onSubmit={handleSaveEditedTask} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Task Title</label>
              <input
                type="text"
                required
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Subject</label>
                <select
                  value={editingTask.subjectName}
                  onChange={(e) => setEditingTask({ ...editingTask, subjectName: e.target.value })}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                >
                  {SUBJECT_OPTIONS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Due Date</label>
                <input
                  type="date"
                  required
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Priority</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Category</label>
                <select
                  value={editingTask.category}
                  onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam_prep">Exam Prep</option>
                  <option value="reading">Reading</option>
                  <option value="coding">Coding</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8]">Status</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                  className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                Save Task Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Create Schedule Slot */}
      <Modal isOpen={isNewScheduleOpen} onClose={() => setIsNewScheduleOpen(false)} title="Add Class / Study Schedule Slot">
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Course or Session Title</label>
            <input
              type="text"
              required
              value={newSchedTitle}
              onChange={(e) => setNewSchedTitle(e.target.value)}
              placeholder="E.g., CS301: Algorithms Lecture"
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Day of Week</label>
              <select
                value={newSchedDay}
                onChange={(e) => setNewSchedDay(Number(e.target.value))}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
              >
                {daysOfWeek.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Session Type</label>
              <select
                value={newSchedType}
                onChange={(e) => setNewSchedType(e.target.value as any)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab Practical</option>
                <option value="self_study">Self Study Session</option>
                <option value="revision">Revision Block</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Start Time</label>
              <input
                type="time"
                required
                value={newSchedStart}
                onChange={(e) => setNewSchedStart(e.target.value)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">End Time</label>
              <input
                type="time"
                required
                value={newSchedEnd}
                onChange={(e) => setNewSchedEnd(e.target.value)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Location / Room</label>
            <input
              type="text"
              value={newSchedLocation}
              onChange={(e) => setNewSchedLocation(e.target.value)}
              placeholder="E.g., Lecture Hall B2 / Library"
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsNewScheduleOpen(false)}
              className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              Add to Timetable
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

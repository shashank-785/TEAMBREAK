import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowRight, Award, BookOpen, CalendarDays, Check, ChevronRight, Circle,
  Clock3, Code2, FilePlus2, Flame, GraduationCap, Layers3, LoaderCircle,
  NotebookPen, Sparkles, Target
} from 'lucide-react';
import { api } from '../../services/api';
import { PlannerTask, Subject, User } from '../../types';

const studyTools = [
  { title: 'Notes & sources', description: 'Keep class materials in one place.', icon: NotebookPen, path: '/notes', surface: 'bg-[#ffe98d]', iconSurface: 'bg-white/70' },
  { title: 'Quiz yourself', description: 'Practice with quizzes and flashcards.', icon: Award, path: '/exams', surface: 'bg-[#c9c5ff]', iconSurface: 'bg-white/70' },
  { title: 'Make a study plan', description: 'Turn a busy week into small steps.', icon: CalendarDays, path: '/planner', surface: 'bg-[#bde8d9]', iconSurface: 'bg-white/70' },
  { title: 'Coding practice', description: 'Build your skills one problem at a time.', icon: Code2, path: '/coding', surface: 'bg-[#ffd5ca]', iconSurface: 'bg-white/70' }
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: User | null }>();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.getTasks(), api.getSubjects()])
      .then(([fetchedTasks, fetchedSubjects]) => {
        if (!active) return;
        setTasks(fetchedTasks);
        setSubjects(fetchedSubjects);
      })
      .catch(error => {
        if (active) setTaskError(error instanceof Error ? error.message : 'Your study data could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const upcomingTasks = useMemo(() => tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4), [tasks]);

  const handleToggleTask = async (task: PlannerTask) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    setTaskError('');
    setTasks(current => current.map(item => item.id === task.id ? { ...item, status: nextStatus } : item));
    try {
      const saved = await api.updateTask(task.id, { status: nextStatus });
      if (!saved) throw new Error('Your change could not be saved. Check your connection and try again.');
      setTasks(current => current.map(item => item.id === task.id ? saved : item));
    } catch (error) {
      setTasks(current => current.map(item => item.id === task.id ? task : item));
      setTaskError(error instanceof Error ? error.message : 'Your task could not be updated.');
    }
  };

  const greetingName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const metrics = [
    { label: 'Current GPA', value: user?.currentGpa ? user.currentGpa.toFixed(2) : '—', detail: user?.targetGpa ? `Goal ${user.targetGpa.toFixed(1)}` : 'Add your GPA in profile', icon: GraduationCap, tone: 'bg-[#eeebff] text-[#6754cb]' },
    { label: 'Study hours', value: `${user?.totalStudyHours ?? 0}`, detail: 'Hours logged', icon: Clock3, tone: 'bg-[#e3f5ed] text-[#318268]' },
    { label: 'Problems solved', value: `${user?.problemsSolved ?? 0}`, detail: 'Coding practice', icon: Code2, tone: 'bg-[#fff1d2] text-[#b77d1d]' },
    { label: 'Study streak', value: `${user?.streakDays ?? 0}`, detail: 'Days in a row', icon: Flame, tone: 'bg-[#ffe9e2] text-[#cd7059]' }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)]">{today}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl">
            A good day to learn, {greetingName}.
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">Your courses, study tools and next steps are all right here.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/planner')}
          className="inline-flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_4px_0_#edc52f] transition hover:-translate-y-0.5"
        >
          <Sparkles size={16} /> Start studying <ArrowRight size={15} />
        </button>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#e7e1fb] bg-[#e8e5ff] p-5 sm:p-8 lg:p-9">
        <div className="relative z-10 max-w-2xl lg:max-w-[58%]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-700">
            <Sparkles size={13} /> Your learning corner
          </span>
          <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Make a little progress. It adds up.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
            Pick a course, add your class notes, or ask your LearnOS tutor to help with the tricky bits.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/tutor')} className="inline-flex items-center gap-2 rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_4px_0_#edc52f] transition hover:-translate-y-0.5">
              <BookOpen size={16} /> Explore my courses
            </button>
            <button type="button" onClick={() => navigate('/assistant')} className="inline-flex items-center gap-2 rounded-full border border-white bg-white/75 px-5 py-3 text-sm font-bold text-violet-800 transition hover:bg-white">
              <Sparkles size={16} /> Ask LearnOS
            </button>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-8 hidden h-64 w-64 rotate-6 rounded-[3rem] bg-[#d2ceff] sm:block lg:right-12 lg:top-1/2 lg:-translate-y-1/2">
          <div className="absolute left-8 top-8 h-44 w-40 -rotate-6 rounded-[1.7rem] border border-white/80 bg-white p-4 shadow-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffe98d] text-amber-900"><NotebookPen size={19} /></div>
            <div className="mt-6 h-2 w-24 rounded-full bg-slate-200" />
            <div className="mt-2 h-2 w-32 rounded-full bg-slate-100" />
            <div className="mt-2 h-2 w-28 rounded-full bg-slate-100" />
            <div className="mt-5 flex h-10 items-center justify-center rounded-xl bg-[#eff9f4] text-[10px] font-bold text-emerald-800">One step at a time</div>
          </div>
          <div className="absolute bottom-8 right-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffd84d] text-slate-900 shadow-lg"><Sparkles size={24} /></div>
        </div>
      </section>

      <section aria-label="Your learning progress" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_5px_18px_rgba(54,48,91,0.04)] sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
            </div>
            <p className="mt-3 text-2xl font-black tracking-tight text-[var(--text-primary)]">{value}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{detail}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-600">Pick up where you like</p>
            <h2 className="mt-1 text-lg font-extrabold text-[var(--text-primary)]">Your study toolkit</h2>
          </div>
          <button type="button" onClick={() => navigate('/notes')} className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900">
            My library <ChevronRight size={15} />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {studyTools.map(({ title, description, icon: Icon, path, surface, iconSurface }) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(path)}
              className={`group flex min-h-36 items-start gap-4 rounded-[1.5rem] border border-white/80 p-5 text-left shadow-[0_5px_18px_rgba(54,48,91,0.05)] transition hover:-translate-y-1 ${surface}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconSurface} text-slate-900`}><Icon size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-900">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-700/80">{description}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">Open <ArrowRight size={13} className="transition group-hover:translate-x-1" /></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.7rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_5px_18px_rgba(54,48,91,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-violet-600"><Target size={13} /> A few next steps</p>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--text-primary)]">Your study plan</h2>
            </div>
            <button type="button" onClick={() => navigate('/planner')} className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-alt)] px-3 py-2 text-[11px] font-bold text-violet-700 hover:bg-violet-100">
              See planner <ChevronRight size={14} />
            </button>
          </div>

          {taskError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{taskError}</p>}
          {loading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-[var(--text-muted)]"><LoaderCircle size={17} className="animate-spin" /> Loading your plan…</div>
          ) : upcomingTasks.length ? (
            <ul className="mt-4 space-y-2.5">
              {upcomingTasks.map(task => (
                <li key={task.id} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-alt)] p-3">
                  <button type="button" aria-label={`Mark ${task.title} ${task.status === 'completed' ? 'incomplete' : 'complete'}`} onClick={() => void handleToggleTask(task)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm hover:bg-violet-50">
                    {task.status === 'completed' ? <Check size={16} /> : <Circle size={16} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[var(--text-primary)]">{task.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{task.subjectName || task.category} · Due {task.dueDate}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${task.priority === 'high' ? 'bg-[#ffebe4] text-[#a84931]' : task.priority === 'medium' ? 'bg-[#fff3cf] text-[#8e6414]' : 'bg-[#eaf4ef] text-[#39775c]'}`}>{task.priority}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl bg-[var(--surface-alt)] px-4 py-6 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-violet-600"><Check size={18} /></span>
              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">{loading ? 'Loading your plan…' : 'A little breathing room.'}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Add a task when you’re ready to plan your next study session.</p>
              <button type="button" onClick={() => navigate('/planner')} className="mt-3 text-xs font-bold text-violet-700">Add a study task <ArrowRight size={13} className="ml-1 inline" /></button>
            </div>
          )}
        </section>

        <section className="rounded-[1.7rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_5px_18px_rgba(54,48,91,0.04)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-700"><Layers3 size={13} /> Your curriculum</p>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--text-primary)]">Courses</h2>
            </div>
            <button type="button" onClick={() => navigate('/tutor')} aria-label="Browse all courses" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f5ef] text-emerald-800 hover:bg-[#d7eee4]"><ArrowRight size={16} /></button>
          </div>

          {loading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-[var(--text-muted)]"><LoaderCircle size={17} className="animate-spin" /> Loading courses…</div>
          ) : subjects.length ? (
            <ul className="mt-4 space-y-2">
              {subjects.slice(0, 4).map((subject, index) => (
                <li key={subject.id}>
                  <button type="button" onClick={() => navigate('/tutor')} className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface-alt)] p-3 text-left transition hover:bg-violet-50">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${['bg-[#ffe98d] text-amber-900', 'bg-[#d9d5ff] text-violet-800', 'bg-[#bde8d9] text-emerald-900', 'bg-[#ffd5ca] text-rose-900'][index]}`}><BookOpen size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-[var(--text-primary)]">{subject.name}</span>
                      <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{subject.code} · {subject.units.length} units</span>
                    </span>
                    <ChevronRight size={15} className="shrink-0 text-[var(--text-muted)]" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl bg-[var(--surface-alt)] p-5 text-center">
              <p className="text-xs text-[var(--text-muted)]">Your courses will appear here.</p>
              <button type="button" onClick={() => navigate('/tutor')} className="mt-2 text-xs font-bold text-violet-700">Browse courses <ArrowRight size={13} className="ml-1 inline" /></button>
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-[1.7rem] border border-[#eee2d8] bg-[#fff7ed] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-700"><FilePlus2 size={19} /></span>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Bring your class materials together</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">Save lecture notes and study from the material you already have.</p>
          </div>
        </div>
        <button type="button" onClick={() => navigate('/notes')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-orange-800 shadow-sm transition hover:bg-orange-50">
          Open my library <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
};

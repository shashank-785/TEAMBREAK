import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { api, AiSetupStatus } from '../services/api';

export const AISetupNotice: React.FC = () => {
  const [status, setStatus] = useState<AiSetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setStatus(await api.getAiSetupStatus());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const ready = status?.isReady === true;
  const warming = status?.state === 'loading';
  const Icon = loading || warming ? LoaderCircle : ready ? CheckCircle2 : Sparkles;

  return (
    <section
      aria-live="polite"
      className={`rounded-2xl border p-4 ${
        ready ? 'border-emerald-200 bg-emerald-50/80' : 'border-violet-200 bg-violet-50/90'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            ready ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-violet-700'
          }`}
        >
          <Icon size={18} className={loading || warming ? 'animate-spin' : ''} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">LearnOS Academic AI Engine</h2>
            {status && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  ready ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'
                }`}
              >
                {loading || warming ? 'Checking' : ready ? 'Live Cloud AI' : 'Built-in Curriculum AI Active'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {loading
              ? 'Connecting to LearnOS Academic Engine…'
              : status?.message ||
                'College Tutor, Socratic Mentoring, Notes Summarizer, and Mock Interviews are ready to use—no API keys or local model downloads required.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh AI status"
          title="Refresh AI status"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-violet-700 disabled:opacity-50"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </section>
  );
};

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { api, AiSetupStatus } from '../services/api';

export const AISetupNotice: React.FC = () => {
  const [status, setStatus] = useState<AiSetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      setStatus(await api.getAiSetupStatus());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to check LearnOS AI setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const ready = status?.isReady === true;
  const warming = status?.state === 'loading';
  const Icon = loading || warming ? LoaderCircle : ready ? CheckCircle2 : error ? AlertCircle : Sparkles;

  return (
    <section
      aria-live="polite"
      className={`rounded-2xl border p-4 ${ready ? 'border-emerald-200 bg-emerald-50/80' : 'border-violet-200 bg-violet-50/90'}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ready ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-violet-700'}`}>
          <Icon size={18} className={loading || warming ? 'animate-spin' : ''} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">LearnOS local AI</h2>
            {status && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ready ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'}`}>
                {loading || warming ? 'Starting' : ready ? 'Ready' : 'Server setup'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {loading ? 'Checking the LearnOS server…' : error || status?.message}
          </p>
          {!loading && error && (
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              AI setup happens on the LearnOS backend. You do not need to install an AI app on your device.
            </p>
          )}
          {!loading && status?.setupRequired && (
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              One-time server setup: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700">npm run setup:model</code>
            </p>
          )}
        </div>
        {(error || (status && !ready && !warming)) && (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh AI setup status"
            title="Refresh AI setup status"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-violet-700 disabled:opacity-50"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>
    </section>
  );
};

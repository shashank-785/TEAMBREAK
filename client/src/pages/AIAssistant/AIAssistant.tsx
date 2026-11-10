import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bot, Send, Copy, Check, Loader2, User, FileText, Bug, Calendar,
  Calculator, Lightbulb, Plus, Square, RotateCw
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

const ChatMarkdown = lazy(() => import('./ChatMarkdown').then(module => ({ default: module.ChatMarkdown })));

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export const AIAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handledLeadPrompt = useRef(false);
  const leadPrompt = (location.state as { prompt?: string } | null)?.prompt;
  const abortController = useRef<AbortController | null>(null);
  const isSending = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryPrompt, setRetryPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async (conversationId: string) => {
    const conversation = await api.getAiConversation(conversationId);
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages || []);
    setSendError(null);
    setRetryPrompt('');
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const [history, health] = await Promise.all([
          api.getAiConversations(),
          api.getSystemHealth()
        ]);
        if (!active) return;
        setConversations(history);
        setAiStatus(health.services?.aiEngine || null);
        if (history.length) {
          await loadConversation(history[0].id);
        } else {
          const created = await api.createAiConversation();
          if (!active) return;
          setConversations([created]);
          setActiveConversationId(created.id);
          setMessages([]);
        }
      } catch (error) {
        if (active) setSendError(error instanceof Error ? error.message : 'Unable to load LearnOS chat.');
      } finally {
        if (active) setIsLoadingChats(false);
      }
    };
    void initialize();
    return () => {
      active = false;
      abortController.current?.abort();
    };
  }, [loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? inputMessage).trim();
    if (!textToSend || isSending.current || isLoadingChats) return;
    isSending.current = true;
    setSendError(null);
    setRetryPrompt('');
    setInputMessage('');
    setIsLoading(true);

    let conversationId = activeConversationId;
    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    const lastMessage = messages[messages.length - 1];
    const isRetry = lastMessage?.role === 'user' && lastMessage.text === textToSend;
    const responseId = 'assistant_' + Date.now();
    setMessages(previous => [...previous, ...(isRetry ? [] : [userMessage]), {
      id: responseId,
      role: 'assistant',
      text: '',
      timestamp: new Date().toISOString()
    }]);

    const controller = new AbortController();
    abortController.current = controller;
    try {
      if (!conversationId) {
        const conversation = await api.createAiConversation();
        conversationId = conversation.id;
        setActiveConversationId(conversation.id);
        setConversations(previous => [conversation, ...previous]);
      }

      const response = await api.sendAiConversationMessage(
        conversationId,
        textToSend,
        token => setMessages(previous => previous.map(item =>
          item.id === responseId ? { ...item, text: item.text + token } : item
        )),
        controller.signal
      );
      setMessages(previous => previous.map(item => item.id === responseId ? response : item));
      setConversations(previous => {
        const current = previous.find(item => item.id === conversationId);
        if (!current) return previous;
        const updated = {
          ...current,
          title: current.title === 'New chat' ? textToSend.slice(0, 60) : current.title,
          updatedAt: response.timestamp
        };
        return [updated, ...previous.filter(item => item.id !== conversationId)];
      });
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages(previous => previous.filter(item => item.id !== responseId));
        setSendError('Response stopped. You can retry the last question.');
      } else {
        setMessages(previous => previous.filter(item => item.id !== responseId));
        setSendError(error instanceof Error ? error.message : 'The AI request failed.');
      }
      setRetryPrompt(textToSend);
    } finally {
      abortController.current = null;
      isSending.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!leadPrompt || handledLeadPrompt.current || isLoadingChats || !activeConversationId) return;
    handledLeadPrompt.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void handleSendMessage(leadPrompt);
  }, [leadPrompt, location.pathname, navigate, isLoadingChats, activeConversationId]);

  const startNewChat = async () => {
    if (isLoading) return;
    try {
      const conversation = await api.createAiConversation();
      setConversations(previous => [conversation, ...previous]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      setSendError(null);
      setRetryPrompt('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to start a new chat.');
    }
  };

  const selectConversation = async (conversationId: string) => {
    if (isLoading || conversationId === activeConversationId) return;
    try {
      await loadConversation(conversationId);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to load this conversation.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const promptPresets = [
    { title: 'Resume Review', icon: FileText, prompt: 'Review my resume for a software engineering internship. What sections, action verbs, and impact metrics should I emphasize?' },
    { title: 'Debug Error', icon: Bug, prompt: 'Help me debug this code. Explain how to find the root cause, then suggest a minimal fix.' },
    { title: '7-Day Exam Plan', icon: Calendar, prompt: 'Create a realistic 7-day revision plan for Operating Systems and Data Structures before my exams.' },
    { title: 'Feynman Analogy', icon: Lightbulb, prompt: 'Explain the difference between TCP and UDP using a simple everyday analogy.' },
    { title: 'Master Theorem', icon: Calculator, prompt: 'Solve this recurrence step by step using the Master Theorem: T(n) = 3T(n/4) + n log n.' }
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#232936] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Bot size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-[#F8FAFC]">Academic &amp; Career AI Assistant</h1>
            <p className="text-[11px] text-[#94A3B8]">Private local AI with your recent chat context</p>
          </div>
        </div>
        <Badge variant={aiStatus?.isReady ? 'success' : 'warning'} size="sm">
          {aiStatus?.provider || 'Checking local engine…'}
        </Badge>
      </div>

      {aiStatus?.isReady === false && (
        <div role="status" className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <span>{aiStatus.error || 'The LearnOS local model is unavailable. See the one-time setup instructions.'}</span>
          <Link to="/settings" className="shrink-0 font-semibold text-amber-200 underline underline-offset-2">View setup instructions</Link>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void startNewChat()}
          disabled={isLoading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#232936] bg-[#151923] px-3 py-2 text-xs font-semibold text-[#F8FAFC] hover:border-indigo-500/50 disabled:opacity-50"
        >
          <Plus size={14} /> New chat
        </button>
        <select
          value={activeConversationId}
          onChange={event => void selectConversation(event.target.value)}
          disabled={isLoading || isLoadingChats || conversations.length === 0}
          aria-label="Previous conversations"
          className="min-w-0 flex-1 rounded-lg border border-[#232936] bg-[#151923] px-3 py-2 text-xs text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
        >
          {isLoadingChats && <option value="">Loading conversations…</option>}
          {!isLoadingChats && conversations.map(conversation => (
            <option key={conversation.id} value={conversation.id}>{conversation.title || 'New chat'}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {promptPresets.map(preset => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.title}
              onClick={() => void handleSendMessage(preset.prompt)}
              disabled={isLoading || isLoadingChats}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-[#232936] bg-[#151923] px-3 py-1.5 text-xs font-medium text-[#94A3B8] transition-all hover:border-indigo-500/40 hover:text-[#F8FAFC] disabled:opacity-50"
            >
              <Icon size={12} className="text-indigo-400" />
              <span>{preset.title}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {messages.map(message => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
                isUser ? 'bg-indigo-600' : 'border border-[#232936] bg-[#151923] text-indigo-400'
              }`}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`relative max-w-[90%] space-y-2 rounded-2xl border p-4 text-xs leading-relaxed sm:text-sm ${
                isUser
                  ? 'border-indigo-500/30 bg-indigo-600/20 text-[#F8FAFC]'
                  : 'border-[#232936] bg-[#151923] text-[#F8FAFC]'
              }`}>
                {message.text ? (
                  <Suspense fallback={<div className="whitespace-pre-wrap">{message.text}</div>}>
                    <ChatMarkdown content={message.text} />
                  </Suspense>
                ) : (
                  <span className="inline-flex items-center gap-2 text-indigo-300">
                    <Loader2 size={13} className="animate-spin" /> Thinking…
                  </span>
                )}
                {!isUser && message.text && (
                  <div className="flex items-center justify-between border-t border-[#232936]/60 pt-2 text-[10px] text-[#94A3B8]">
                    <span>LearnOS · local model</span>
                    <button
                      onClick={() => copyToClipboard(message.text, message.id)}
                      className="flex items-center gap-1 hover:text-[#F8FAFC]"
                    >
                      {copiedId === message.id ? <><Check size={11} className="text-emerald-400" /><span className="text-emerald-400">Copied</span></> : <><Copy size={11} /><span>Copy Markdown</span></>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {sendError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          <span>{sendError}</span>
          <div className="flex gap-2">
            {retryPrompt && !isLoading && <button onClick={() => void handleSendMessage(retryPrompt)} className="flex items-center gap-1 font-semibold underline"><RotateCw size={12} /> Retry</button>}
          </div>
        </div>
      )}

      <form
        onSubmit={event => {
          event.preventDefault();
          void handleSendMessage();
        }}
        className="relative"
      >
        <textarea
          rows={2}
          value={inputMessage}
          onChange={event => setInputMessage(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSendMessage();
            }
          }}
          placeholder="Ask a study question, paste code, or ask about your notes… (Enter to send)"
          disabled={isLoadingChats}
          className="w-full resize-none rounded-xl border border-[#232936] bg-[#151923] py-3 pl-4 pr-14 text-xs text-[#F8FAFC] shadow-lg placeholder:text-[#94A3B8]/60 focus:border-indigo-500 focus:outline-none sm:text-sm"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={() => abortController.current?.abort()}
            aria-label="Stop generating"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-rose-600 text-white transition-all hover:bg-rose-500"
          >
            <Square size={13} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoadingChats}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        )}
      </form>
    </div>
  );
};

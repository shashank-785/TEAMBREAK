import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatMarkdown: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => <h1 className="mb-2 text-base font-bold">{children}</h1>,
      h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-bold text-indigo-200">{children}</h2>,
      h3: ({ children }) => <h3 className="mb-1 mt-2 font-semibold">{children}</h3>,
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-400 pl-3 text-[#CBD5E1]">{children}</blockquote>,
      code: ({ children, className }) => className
        ? <code className="block overflow-x-auto rounded-lg bg-[#0B0D12] p-3 font-mono text-[11px] text-indigo-100">{children}</code>
        : <code className="rounded bg-[#0B0D12] px-1 py-0.5 font-mono text-[11px] text-indigo-200">{children}</code>,
      pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg border border-[#232936] bg-[#0B0D12]">{children}</pre>,
      table: ({ children }) => <div className="overflow-x-auto"><table className="my-2 min-w-full border-collapse text-left">{children}</table></div>,
      th: ({ children }) => <th className="border border-[#232936] p-2 font-semibold">{children}</th>,
      td: ({ children }) => <td className="border border-[#232936] p-2">{children}</td>
    }}
  >
    {content}
  </ReactMarkdown>
);

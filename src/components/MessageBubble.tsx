import React from 'react';
import { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = (content: string) => {
    const handleCopy = async (text: string, key: string) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1200);
      } catch {}
    };

    // First, split content into segments separated by fenced code blocks ```lang\n...```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const segments: Array<{ type: 'code' | 'text'; lang?: string; text: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const before = content.slice(lastIndex, match.index);
      if (before) segments.push({ type: 'text', text: before });
      segments.push({ type: 'code', lang: match[1] || '', text: match[2] });
      lastIndex = match.index + match[0].length;
    }
    const after = content.slice(lastIndex);
    if (after) segments.push({ type: 'text', text: after });

    const renderInline = (text: string, keyPrefix: string) => {
      // Split into blocks by double newlines to form paragraphs/lists
      const blocks = text.split(/\n\n+/);
      const elements: React.ReactNode[] = [];

      const renderBoldAndInlineCode = (str: string, baseKey: string) => {
        // First handle inline code `code`
        const parts = str.split(/(`[^`]+`)/g);
        return parts.map((part, i) => {
          if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            const code = part.slice(1, -1);
            return (
              <code
                key={`${baseKey}-code-${i}`}
                className="px-1 py-0.5 rounded bg-gray-100/80 dark:bg-gray-800/80 text-[0.8rem] font-mono border border-gray-200/50 dark:border-gray-700/50"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
              >
                {code}
              </code>
            );
          }
          // Then handle bold **text**
          const boldSplit = part.split(/(\*\*[^*]+\*\*)/g);
          return boldSplit.map((chunk, j) => {
            if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4) {
              return (
                <strong key={`${baseKey}-bold-${i}-${j}`} className="font-semibold">
                  {chunk.slice(2, -2)}
                </strong>
              );
            }
            return <React.Fragment key={`${baseKey}-text-${i}-${j}`}>{chunk}</React.Fragment>;
          });
        });
      };

      blocks.forEach((block, bi) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => l.trim().startsWith('- ')) && lines.length > 0;
        if (isList) {
          elements.push(
            <ul key={`${keyPrefix}-ul-${bi}`} className="list-disc ml-5 space-y-1 text-sm">
              {lines.map((l, li) => (
                <li key={`${keyPrefix}-li-${bi}-${li}`}>{renderBoldAndInlineCode(l.replace(/^\s*-\s*/, ''), `${keyPrefix}-li-${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <p key={`${keyPrefix}-p-${bi}`} className="leading-relaxed text-sm">
              {renderBoldAndInlineCode(block, `${keyPrefix}-p-${bi}`)}
            </p>
          );
        }
      });

      return elements;
    };

    const rendered: React.ReactNode[] = [];
    segments.forEach((seg, i) => {
      if (seg.type === 'code') {
        const key = `code-${i}`;
        rendered.push(
          <div key={`${key}-wrap`} className="group relative">
            <pre
              className="bg-gray-900 text-gray-100 p-3 rounded-xl text-sm font-mono whitespace-pre overflow-x-auto shadow-inner mt-2 border border-gray-800"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}
            >
              <code
                className={`language-${seg.lang || 'plain'} whitespace-pre font-mono`}
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}
              >
                {seg.text}
              </code>
            </pre>
            <button
              aria-label={copiedKey === key ? 'Copied' : 'Copy code'}
              title={copiedKey === key ? 'Copied' : 'Copy code'}
              onClick={() => handleCopy(seg.text, key)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded bg-gray-800/90 hover:bg-gray-700 text-gray-200 border border-gray-700 shadow"
            >
              {copiedKey === key ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="10" height="10" rx="2" ry="2" />
                  <rect x="5" y="5" width="10" height="10" rx="2" ry="2" />
                </svg>
              )}
            </button>
          </div>
        );
      } else if (seg.text.trim()) {
        rendered.push(
          <div key={`text-${i}`} className="space-y-1">
            {renderInline(seg.text, `seg-${i}`)}
          </div>
        );
      }
    });

    return rendered.length ? rendered : null;
  };

  if (isSystem) {
    return (
      <div className="flex justify-center py-2 animate-in fade-in-0 duration-500">
        <div className="px-3 py-1.5 bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-full text-xs text-gray-600 dark:text-gray-300 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/50 dark:ring-gray-800/50 transition-all duration-300 group-hover:scale-110 ${
        isUser 
          ? 'bg-gradient-to-tr from-[#da7756] via-[#bd5d3a] to-[#a8462a] text-white' 
          : 'bg-gradient-to-tr from-[#8a8470] via-[#6b6651] to-[#3d3929] text-white'
      }`}>
        {isUser ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        )}
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[280px] ${isUser ? 'text-right' : ''}`}>
        <div className={`relative inline-block px-4 py-2.5 rounded-2xl shadow-md backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-[#da7756] via-[#bd5d3a] to-[#a8462a] text-white rounded-br-md' 
            : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 rounded-bl-md'
        } max-w-full relative overflow-hidden`}>
          
          {/* Subtle animation overlay */}
          <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
            isUser 
              ? 'bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100' 
              : 'bg-gradient-to-br from-[#da7756]/5 to-[#bd5d3a]/5 opacity-0 group-hover:opacity-100'
          }`}></div>
          
          <div className="relative text-sm leading-relaxed">
            {renderContent(message.content)}
          </div>
          
          {/* Message tail */}
          <div className={`absolute -bottom-0 ${
            isUser 
              ? '-right-0 w-3 h-3 bg-gradient-to-br from-[#da7756] via-[#bd5d3a] to-[#a8462a] transform rotate-45 translate-x-1.5 translate-y-1.5' 
              : '-left-0 w-3 h-3 bg-white/90 dark:bg-gray-800/90 border-l border-b border-gray-200/50 dark:border-gray-700/50 transform rotate-45 -translate-x-1.5 translate-y-1.5'
          }`}></div>
        </div>
        
        {/* Timestamp */}
        <div className={`flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 dark:text-gray-400 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span className="bg-white/60 dark:bg-gray-800/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm text-xs">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Context information */}
        {message.context?.selection && (
          <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className="inline-block max-w-[240px] p-2 bg-gray-100/80 dark:bg-gray-700/80 rounded-xl text-xs text-gray-600 dark:text-gray-300 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-2.5 h-2.5 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Selected text:</span>
              </div>
              <div className="italic opacity-80 text-xs">
                "{message.context.selection.substring(0, 80)}..."
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

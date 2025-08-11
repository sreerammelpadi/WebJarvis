import React from 'react';
import { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('``````')) {
        const code = line.slice(3, -3);
        return (
          <pre key={index} className="bg-gray-100/80 dark:bg-gray-800/80 p-4 rounded-2xl text-sm font-mono overflow-x-auto shadow-inner mt-3 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
            {code}
          </pre>
        );
      } else if (line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start mt-2 group">
            <div className="w-2 h-2 bg-current rounded-full mt-2 mr-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200"></div>
            <span className="flex-1">{line.slice(2)}</span>
          </div>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        const text = line.slice(2, -2);
        return (
          <div key={index} className="font-semibold bg-gradient-to-r from-[#da7756] to-[#bd5d3a] bg-clip-text text-transparent">
            {text}
          </div>
        );
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <div key={index} className="leading-relaxed">{line}</div>;
      }
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center py-4 animate-in fade-in-0 duration-500">
        <div className="px-6 py-3 bg-gradient-to-r from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-full text-sm text-gray-600 dark:text-gray-300 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-4 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/50 dark:ring-gray-800/50 transition-all duration-300 group-hover:scale-110 ${
        isUser 
          ? 'bg-gradient-to-tr from-[#da7756] via-[#bd5d3a] to-[#a8462a] text-white' 
          : 'bg-gradient-to-tr from-[#8a8470] via-[#6b6651] to-[#3d3929] text-white'
      }`}>
        {isUser ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        )}
        <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[320px] ${isUser ? 'text-right' : ''}`}>
        <div className={`relative inline-block px-6 py-4 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl ${
          isUser 
            ? 'bg-gradient-to-br from-[#da7756] via-[#bd5d3a] to-[#a8462a] text-white rounded-br-lg' 
            : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 rounded-bl-lg'
        } max-w-full relative overflow-hidden`}>
          
          {/* Subtle animation overlay */}
          <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 ${
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
              ? '-right-0 w-4 h-4 bg-gradient-to-br from-[#da7756] via-[#bd5d3a] to-[#a8462a] transform rotate-45 translate-x-2 translate-y-2' 
              : '-left-0 w-4 h-4 bg-white/90 dark:bg-gray-800/90 border-l border-b border-gray-200/50 dark:border-gray-700/50 transform rotate-45 -translate-x-2 translate-y-2'
          }`}></div>
        </div>
        
        {/* Timestamp and metadata */}
        <div className={`flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span className="bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-full backdrop-blur-sm">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.metadata?.cost !== undefined && (
            <span className="bg-[#da7756]/10 dark:bg-[#da7756]/20 text-[#bd5d3a] dark:text-[#da7756] px-2 py-1 rounded-full backdrop-blur-sm">
              ${message.metadata.cost.toFixed(4)}
            </span>
          )}
        </div>

        {/* Context information */}
        {message.context?.selection && (
          <div className={`mt-3 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className="inline-block max-w-[280px] p-3 bg-gray-100/80 dark:bg-gray-700/80 rounded-2xl text-xs text-gray-600 dark:text-gray-300 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Selected text:</span>
              </div>
              <div className="italic opacity-80">
                "{message.context.selection.substring(0, 100)}..."
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

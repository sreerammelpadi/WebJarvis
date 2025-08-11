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
      if (line.startsWith('```') && line.endsWith('```')) {
        const code = line.slice(3, -3);
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto shadow-inner">
            {code}
          </pre>
        );
      } else if (line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        const text = line.slice(2, -2);
        return (
          <span key={index} className="font-semibold">
            {text}
          </span>
        );
      } else {
        return <span key={index}>{line}</span>;
      }
    });
  };

  if (isSystem) {
    return (
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}>
        {isUser ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-3 py-2 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        } max-w-[80%]`}> 
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {renderContent(message.content)}
          </div>
        </div>
        
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formatTimestamp(message.timestamp)}
          {message.metadata?.cost !== undefined && (
            <span className="ml-2">Cost: ${message.metadata.cost.toFixed(4)}</span>
          )}
        </div>

        {message.context?.selection && (
          <div className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
              Selected: "{message.context.selection.substring(0, 80)}..."
            </span>
          </div>
        )}
      </div>
    </div>
  );
}; 
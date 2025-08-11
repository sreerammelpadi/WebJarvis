import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PageContent } from '@/types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, context?: any) => void;
  isProcessing: boolean;
  currentPage?: PageContent;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  currentPage
}) => {
  const [inputValue, setInputValue] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || isProcessing) return;
    const context = currentPage ? { pageUrl: currentPage.url } : undefined;
    onSendMessage(inputValue, context);
    setInputValue('');
    setEstimatedCost(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim()) {
      const estimatedTokens = Math.ceil(value.length / 4);
      const estimatedCost = (estimatedTokens / 1000) * 0.00015;
      setEstimatedCost(estimatedCost);
    } else {
      setEstimatedCost(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 w-10 h-10 rounded-xl bg-primary-500/15 text-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Ask anything about this page.</p>
              {currentPage?.title && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[280px] mx-auto">{currentPage.title}</p>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200/70 dark:border-gray-700/70 p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] max-h-[120px] px-3 py-2 border border-gray-300/70 dark:border-gray-600/70 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/60 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="px-4 h-[40px] bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-xl font-medium text-sm shadow-sm"
            title="Send"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>
        {estimatedCost !== null && estimatedCost > 0.01 && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Estimated cost: ${estimatedCost.toFixed(4)}</div>
        )}
      </div>
    </div>
  );
}; 
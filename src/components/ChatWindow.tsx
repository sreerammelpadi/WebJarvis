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
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

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
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-transparent to-white/20 dark:to-gray-900/20">
      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-6 max-w-sm animate-in fade-in-0 duration-700">
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-bounce"></div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ready to help!
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Ask me anything about this page or explore quick actions to get started.
                </p>
              </div>
              {currentPage?.title && (
                <div className="mt-6 p-4 bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {currentPage.title}
                      </p>
                      {currentPage.company && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {currentPage.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className="animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <MessageBubble message={message} />
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="px-6 py-4 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/80 backdrop-blur-xl border-t border-gray-200/30 dark:border-gray-700/30">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl transition-all duration-300 ${inputFocused ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}></div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask me anything about this page..."
              className={`relative w-full min-h-[52px] max-h-[120px] px-6 py-4 pr-14 bg-white/90 dark:bg-gray-800/90 border-2 rounded-3xl resize-none focus:outline-none text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 shadow-lg backdrop-blur-sm ${
                inputFocused 
                  ? 'border-blue-500/50 shadow-xl shadow-blue-500/10' 
                  : 'border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/50 dark:hover:border-gray-600/50'
              }`}
              rows={1}
              disabled={isProcessing}
            />
            {inputValue && (
              <button
                onClick={() => setInputValue('')}
                className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className={`group relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full shadow-lg hover:shadow-xl disabled:shadow-sm transition-all duration-300 flex items-center justify-center min-w-[52px] overflow-hidden ${
              !inputValue.trim() || isProcessing ? 'scale-95 opacity-70' : 'scale-100 opacity-100 hover:scale-105'
            }`}
          >
            <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            {isProcessing ? (
              <div className="relative w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="relative w-6 h-6 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            )}
          </button>
        </div>
        {estimatedCost !== null && estimatedCost > 0.01 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 animate-in slide-in-from-bottom-2 duration-300">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Estimated cost: ${estimatedCost.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
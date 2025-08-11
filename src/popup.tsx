import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { LeftNav } from './components/LeftNav';
import { useExtensionState } from './hooks/useExtensionState';
import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import { ChatMessage, PageContent } from '@/types';
import './styles/popup.css';

async function warmUpServiceWorker(): Promise<void> {
  try { await chrome.runtime.sendMessage({ type: 'PING' }); } catch {}
}

const InlineChatWindow: React.FC<{
  messages: ChatMessage[];
  onSendMessage: (content: string, context?: any) => void;
  isProcessing: boolean;
  currentPage?: PageContent;
}> = ({ messages, onSendMessage, isProcessing, currentPage }) => {
  const [inputValue, setInputValue] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim()) {
      const estimatedTokens = Math.ceil(value.length / 4);
      const est = (estimatedTokens / 1000) * 0.00015;
      setEstimatedCost(est);
    } else setEstimatedCost(null);
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-6 max-w-sm">
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ready to help!</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">Ask me anything about this page or explore quick actions to get started.</p>
              </div>
              {currentPage?.title && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentPage.title}</p>
                      {currentPage.company && (<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{currentPage.company}</p>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id}>
                <MessageBubble message={m} />
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/6 to-purple-500/6 rounded-3xl transition-all duration-300 ${inputFocused ? 'opacity-90 scale-102' : 'opacity-0 scale-100'}`}></div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask me anything about this page..."
              className={`relative w-full min-h-[52px] max-h-[120px] px-6 py-4 pr-14 bg-gray-50 dark:bg-gray-800 rounded-3xl resize-none focus:outline-none text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-150 ${inputFocused ? 'ring-2 ring-blue-400/40' : 'ring-0 hover:ring-1 hover:ring-gray-200/40'}`}
              rows={1}
              disabled={isProcessing}
            />
            {inputValue && (
              <button onClick={() => setInputValue('')} className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </div>
          <button onClick={handleSend} disabled={!inputValue.trim() || isProcessing} className={`group relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full shadow-lg hover:shadow-xl disabled:shadow-sm transition-all duration-150 flex items-center justify-center min-w-[52px] overflow-hidden ${!inputValue.trim() || isProcessing ? 'scale-95 opacity-70' : 'scale-100 opacity-100 hover:scale-105'}`}>
            <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-150 origin-left"></div>
            {isProcessing ? (<div className="relative w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (
              <svg className="relative w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            )}
          </button>
        </div>
        {estimatedCost !== null && estimatedCost > 0.01 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            <span>Estimated cost: ${estimatedCost.toFixed(4)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Popup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const { state, updateState } = useExtensionState();
  const { sendMessage, messages, isProcessing, clearChat } = useChat();

  useEffect(() => {
    const init = async () => {
      try {
        await warmUpServiceWorker();
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabUrl = tab?.url || '';
        if (!tab || !tab.id || !tabUrl) { setIsLoading(false); return; }
        const [nav] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { try { const anyPerf: any = performance as any; const navEntry = (performance.getEntriesByType('navigation') as any)[0]; const navStart = (anyPerf?.timeOrigin as number) || (anyPerf?.timing?.navigationStart as number) || (navEntry?.startTime as number) || Date.now(); return { navStart }; } catch { return { navStart: Date.now() }; } } });
        const navStart = (nav?.result as any)?.navStart || Date.now();
        const urlObj = new URL(tabUrl);
        const sessionKey = `${urlObj.origin}${urlObj.pathname}:${navStart}`;
        const storage = await chrome.storage.local.get(['currentPage', 'chatHistory', 'lastSessionKey']);
        const isNewPage = !storage.currentPage || storage.currentPage.url !== tabUrl;
        const isNewSession = storage.lastSessionKey !== sessionKey;
        if (isNewPage || isNewSession) { await clearChat(); updateState({ chatHistory: [] }); await chrome.storage.local.set({ lastSessionKey: sessionKey }); }
        if (isNewPage || isNewSession || !storage.currentPage) {
          let response = await chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE_CONTENT', tabId: tab.id }).catch(async () => { await warmUpServiceWorker(); return chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE_CONTENT', tabId: tab.id }); });
          if (response?.success) { updateState({ currentPage: response.data }); await chrome.storage.local.set({ currentPage: response.data }); }
        }
      } catch (error) { console.error('Failed to initialize popup:', error); } finally { setIsLoading(false); }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="w-[450px] h-[650px] bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WebCopilot</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Initializing your AI assistant...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[650px] bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 active:scale-95 ${showSidebar ? 'rotate-180' : ''}`} title={showSidebar ? 'Hide panel' : 'Show panel'}>
              <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">WebCopilot</h1>
                <p className="text-sm opacity-90 font-medium">AI Web Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Online</span>
            </div>
            <button onClick={() => chrome.runtime.openOptionsPage()} className="p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 active:scale-95" title="Settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0">
        <div className={`transform transition-all duration-300 ease-in-out ${showSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 w-0'}`}>
          {showSidebar && (<LeftNav currentPage={state.currentPage} onQuickAction={sendMessage} isProcessing={isProcessing} />)}
        </div>
        <div className={`flex-1 transition-all duration-300 ease-in-out ${showSidebar ? 'ml-2' : 'ml-0'}`}>
          <InlineChatWindow messages={messages} onSendMessage={sendMessage} isProcessing={isProcessing} currentPage={state.currentPage} />
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);
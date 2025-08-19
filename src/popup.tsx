import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { LeftNav } from './components/LeftNav';
import { useExtensionState } from './hooks/useExtensionState';
import { useTabChat } from './hooks/useTabChat';
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
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 80) + 'px';
    }
  }, [inputValue]);
  // Refocus input when processing completes (assistant response added)
  useEffect(() => {
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  const handleSend = () => {
    if (!inputValue.trim() || isProcessing) return;
    const context = currentPage ? { pageUrl: currentPage.url } : undefined;
    onSendMessage(inputValue, context);
    setInputValue('');
    setEstimatedCost(null);
    // Ensure focus stays on the input for immediate follow-up typing
    setTimeout(() => inputRef.current?.focus(), 0);
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
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white dark:bg-gray-900 min-h-0 chat-scrollbar">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4 max-w-xs">
              <div className="relative">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-[#da7756] via-[#f8ece7] to-[#f2d4c7] flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white bg-gradient-to-r from-[#da7756] to-[#bd5d3a] bg-clip-text text-transparent">Ready to help!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Ask me anything about this page or explore quick actions to get started.</p>
              </div>
              {currentPage?.title && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#da7756] rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{currentPage.title}</p>
                      {currentPage.company && (<p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{currentPage.company}</p>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
             <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-[#da7756]/6 to-[#bd5d3a]/6 rounded-2xl transition-all duration-300 ${inputFocused ? 'opacity-90 scale-102' : 'opacity-0 scale-100'}`}></div>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask me anything about this page..."
              className={`relative w-full min-h-[36px] max-h-[80px] px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-800 rounded-xl resize-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-150 ${inputFocused ? 'ring-2 ring-[#da7756]/40' : 'ring-0 hover:ring-1 hover:ring-gray-200/40'}`}
              rows={1}
              disabled={isProcessing}
            />
            {inputValue && (
              <button onClick={() => setInputValue('')} className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
          </div>
          <button onClick={handleSend} disabled={!inputValue.trim() || isProcessing} className={`group relative p-2.5 bg-gradient-to-r from-[#da7756] to-[#bd5d3a] hover:from-[#bd5d3a] hover:to-[#a8462a] disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-150 flex items-center justify-center min-w-[36px] overflow-hidden ${!inputValue.trim() || isProcessing ? 'scale-95 opacity-70' : 'scale-100 opacity-100 hover:scale-105'}`}>
            <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-150 origin-left"></div>
            {isProcessing ? (<div className="relative w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (
              <svg className="relative w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            )}
          </button>
        </div>
        {estimatedCost !== null && estimatedCost > 0.01 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
  const [tabId, setTabId] = useState<number>(0);
  const [sessionKey, setSessionKey] = useState<string>('');
  const { state, updateState } = useExtensionState();
  
  // Use tab-based chat once we have tab info
  const { sendMessage, messages, isProcessing, clearChat, isLoading: chatLoading } = useTabChat(
    tabId,
    state.currentPage?.url || '',
    state.currentPage?.title || '',
    sessionKey,
    state.currentPage
  );

  const totalTokens = useMemo(() => {
    let sum = 0;
    for (const m of messages) {
      if (m.metadata?.tokens) sum += Number(m.metadata.tokens) || 0;
    }
    return sum;
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      try {
        await warmUpServiceWorker();
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabUrl = tab?.url || '';
        if (!tab || !tab.id || !tabUrl) { setIsLoading(false); return; }
        
        // Set tab ID immediately
        setTabId(tab.id);
        
        const [nav] = await chrome.scripting.executeScript({ 
          target: { tabId: tab.id }, 
          func: () => { 
            try { 
              const anyPerf: any = performance as any; 
              const navEntry = (performance.getEntriesByType('navigation') as any)[0]; 
              const navStart = (anyPerf?.timeOrigin as number) || (anyPerf?.timing?.navigationStart as number) || (navEntry?.startTime as number) || Date.now(); 
              return { navStart }; 
            } catch { 
              return { navStart: Date.now() }; 
            } 
          } 
        });
        
        const navStart = (nav?.result as any)?.navStart || Date.now();
        const urlObj = new URL(tabUrl);
        const newSessionKey = `${urlObj.origin}${urlObj.pathname}:${navStart}`;
        setSessionKey(newSessionKey);
        
        // Check if we need to extract page content
        const storage = await chrome.storage.local.get(['currentPage']);
        const isNewPage = !storage.currentPage || storage.currentPage.url !== tabUrl;
        
        if (isNewPage || !storage.currentPage) {
          let response = await chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE_CONTENT', tabId: tab.id }).catch(async () => { 
            await warmUpServiceWorker(); 
            return chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE_CONTENT', tabId: tab.id }); 
          });
          if (response?.success) { 
            updateState({ currentPage: response.data }); 
            await chrome.storage.local.set({ currentPage: response.data }); 
          }
        } else {
          updateState({ currentPage: storage.currentPage });
        }
      } catch (error) { 
        console.error('Failed to initialize popup:', error); 
      } finally { 
        setIsLoading(false); 
      }
    };
    init();
  }, []);

  if (isLoading || chatLoading) {
    return (
      <div className="w-[600px] h-[600px] bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-[#da7756] via-[#f8ece7] to-[#f2d4c7] flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          </div>
          <div className="space-y-1"><h3 className="text-base font-semibold text-gray-900 dark:text-white">WebCopilot</h3><p className="text-sm text-gray-600 dark:text-gray-300">Initializing your AI assistant...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[600px] h-[600px] bg-white dark:bg-gray-900 flex flex-col overflow-hidden fixed inset-0 relative">
      {/* Compact Header */}
      <header className="px-4 py-1 bg-gradient-to-r from-[#c86b4a] via-[#b25a40] to-[#9d4a2e] text-white relative z-20 min-h-0 leading-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 active:scale-95 ${showSidebar ? 'rotate-180' : ''}`} title={showSidebar ? 'Hide panel' : 'Show panel'}>
              <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </button>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg></div><div><h1 className="text-sm font-bold tracking-tight">WebCopilot</h1><p className="text-xs opacity-90 font-medium">AI Web Assistant</p></div></div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tokens pill replacing Online */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.06a5.002 5.002 0 013.9 3.9H16a1 1 0 110 2h-1.1a5.002 5.002 0 01-3.9 3.9V17a1 1 0 11-2 0v-1.14A5.002 5.002 0 015.1 9.96H4a1 1 0 110-2h1.1A5.002 5.002 0 019 4.06V3a1 1 0 011-1zm0 4a3 3 0 100 6 3 3 0 000-6z"/></svg>
                <span>Tokens</span>
              </button>
              <div className="absolute right-0 mt-2 w-max max-w-xs px-2 py-1 rounded-md bg-gray-900 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                Total tokens in this chat: {totalTokens}
              </div>
            </div>
            <button onClick={() => chrome.runtime.openOptionsPage()} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 active:scale-95" title="Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Full Width Chat Area */}
        <div className="w-full"><InlineChatWindow messages={messages} onSendMessage={sendMessage} isProcessing={isProcessing} currentPage={state.currentPage} /></div>
        {showSidebar && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 transition-all duration-300" onClick={() => setShowSidebar(false)} />
        )}
        <div className={`absolute top-0 left-0 h-full z-20 transform transition-all duration-300 ease-in-out ${showSidebar ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
          <div className="h-full shadow-2xl"><LeftNav currentPage={state.currentPage} onQuickAction={sendMessage} isProcessing={isProcessing} /></div>
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWindow } from './components/ChatWindow';
import { LeftNav } from './components/LeftNav';
import { useExtensionState } from './hooks/useExtensionState';
import { useChat } from './hooks/useChat';
import './styles/popup.css';

async function warmUpServiceWorker(): Promise<void> {
  try { await chrome.runtime.sendMessage({ type: 'PING' }); } catch {}
}

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

        const [nav] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            try {
              const anyPerf: any = performance as any;
              const navEntry = (performance.getEntriesByType('navigation') as any)[0];
              const navStart = (anyPerf?.timeOrigin as number) || (anyPerf?.timing?.navigationStart as number) || (navEntry?.startTime as number) || Date.now();
              return { navStart };
            } catch (e) {
              return { navStart: Date.now() };
            }
          }
        });
        const navStart = (nav?.result as any)?.navStart || Date.now();
        const urlObj = new URL(tabUrl);
        const sessionKey = `${urlObj.origin}${urlObj.pathname}:${navStart}`;

        const storage = await chrome.storage.local.get(['currentPage', 'chatHistory', 'lastSessionKey']);
        const isNewPage = !storage.currentPage || storage.currentPage.url !== tabUrl;
        const isNewSession = storage.lastSessionKey !== sessionKey;

        if (isNewPage || isNewSession) {
          await clearChat();
          updateState({ chatHistory: [] });
          await chrome.storage.local.set({ lastSessionKey: sessionKey });
        }

        if (isNewPage || isNewSession || !storage.currentPage) {
          let response = await chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE_CONTENT', tabId: tab.id }).catch(async () => {
            await warmUpServiceWorker();
            return chrome.runtime.sendMessage({ type: 'EXTRACT_PAGE_CONTENT', tabId: tab.id });
          });
          if (response?.success) {
            updateState({ currentPage: response.data });
            await chrome.storage.local.set({ currentPage: response.data });
          }
        }
      } catch (error) {
        console.error('Failed to initialize popup:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Initializing WebCopilot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[600px] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden">
      <div className="h-full p-3">
        <div className="h-full rounded-2xl border border-gray-200/70 dark:border-gray-800/70 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex flex-col overflow-hidden">
          {/* Header */}
          <header className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar((v) => !v)} className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition" title={showSidebar ? 'Hide panel' : 'Show panel'}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
              <div className="w-9 h-9 bg-white/20 rounded-xl backdrop-blur flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-[15px] font-semibold leading-tight">WebCopilot</h1>
                <p className="text-[11px] opacity-90">AI Web Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => chrome.runtime.openOptionsPage()} className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition" title="Settings">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756.426-1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756.426-1.756 2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </header>

          {/* Body */}
          <main className="flex-1 flex min-h-0 bg-gradient-to-b from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-900/30 overflow-hidden">
            {showSidebar && (
              <div className="block">
                <LeftNav currentPage={state.currentPage} onQuickAction={sendMessage} isProcessing={isProcessing} />
              </div>
            )}
            <div className={showSidebar ? 'flex-1' : 'flex-1 w-full'}>
              <ChatWindow messages={messages} onSendMessage={sendMessage} isProcessing={isProcessing} currentPage={state.currentPage} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />); 
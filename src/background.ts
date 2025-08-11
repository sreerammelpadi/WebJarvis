import { ChromeMessage, ContextMenuInfo, ChatMessage } from '@/types';
import { LLMClient } from '@/lib/llm-client';
import { logger } from '@/lib/logger';

/**
 * Background service worker for WebCopilot extension
 * Handles message routing, context menus, and background tasks
 */
class BackgroundServiceWorker {
  private llm: LLMClient | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the background service worker
   */
  private async initialize(): Promise<void> {
    logger.group('Background initialize');
    this.setupContextMenus();
    this.setupMessageListeners();
    this.setupInstallationHandlers();

    // Initialize LLM client using stored settings
    try {
      const { settings } = await chrome.storage.local.get(['settings']);
      const provider = settings?.defaultModel === 'local-wasm' ? 'local-wasm' : 'openai';
      const apiKey = settings?.openaiApiKey;
      logger.info('Init LLM with provider', provider, 'apiKey', logger.mask(apiKey));
      this.llm = new LLMClient(provider, apiKey);
    } catch (e) {
      logger.warn('LLM init skipped until settings available', e);
    }

    logger.info('Background ready');
    logger.groupEnd();
  }

  /**
   * Setup context menu items
   */
  private setupContextMenus(): void {
    chrome.contextMenus.create({
      id: 'sendToWebCopilot',
      title: 'Send selection to WebCopilot',
      contexts: ['selection']
    });

    chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
      logger.info('Context menu clicked', { hasSelection: !!info.selectionText, tabId: tab?.id });
      if (info.menuItemId === 'sendToWebCopilot' && tab?.id) this.handleContextMenuClick(info, tab.id);
    });
  }

  /**
   * Handle context menu clicks
   */
  private handleContextMenuClick(info: chrome.contextMenus.OnClickData, tabId: number): void {
    if (!info.selectionText) return;

    const contextMenuInfo: ContextMenuInfo = {
      selectionText: info.selectionText,
      pageUrl: '', // Will be set by content script
      tabId
    };

    // Send message to content script to handle the selection
    chrome.tabs
      .sendMessage(tabId, {
        type: 'CONTEXT_MENU_SELECTION',
        payload: contextMenuInfo
      })
      .then(() => logger.info('Sent selection to content-script'))
      .catch((error: Error) => logger.error('Failed to send selection', error));
  }

  /**
   * Setup message listeners for communication with content scripts and popup
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
      logger.groupCollapsed(`onMessage ${message.type}`);
      logger.info('Sender', { tabId: sender.tab?.id });
      this.handleMessage(message, sender, sendResponse).finally(() => logger.groupEnd());
      return true; // Keep message channel open for async response
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'PING':
          sendResponse({ pong: true });
          break;
        case 'EXTRACT_PAGE_CONTENT':
          await this.handlePageExtraction(message, sender, sendResponse);
          break;

        case 'GET_EXTENSION_STATE':
          await this.handleGetState(message, sender, sendResponse);
          break;

        case 'UPDATE_SETTINGS':
          await this.handleUpdateSettings(message, sender, sendResponse);
          break;

        case 'EXPORT_DATA':
          await this.handleExportData(message, sender, sendResponse);
          break;

        case 'IMPORT_DATA':
          await this.handleImportData(message, sender, sendResponse);
          break;

        case 'PROCESS_CHAT_MESSAGE':
          await this.handleProcessChatMessage(message, sender, sendResponse);
          break;

        default:
          logger.warn('Unknown message type', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error('handleMessage error', error);
      sendResponse({ error: (error as Error).message });
    }
  }

  private extractRelevantSnippets(content: string, query: string, limitChars = 1000): string[] {
    const text = content || '';
    const q = (query || '').toLowerCase();
    const keywords = new Set(
      q
        .split(/[^a-z0-9+.-]+/i)
        .filter(w => w.length > 1)
        .concat(['price', 'pricing', 'cost', 'token', 'per', '1m', 'million', 'models', 'mini', '4o', 'o1', 'o3', 'gpt-4o', '4o-mini'])
        .map(w => w.toLowerCase())
    );
    const sentences = text.split(/(?<=[.!?\n])\s+/);
    const hits: string[] = [];
    for (const s of sentences) {
      const sLower = s.toLowerCase();
      for (const k of keywords) {
        if (k && sLower.includes(k)) { hits.push(s.trim()); break; }
      }
      if (hits.join(' ').length >= limitChars) break;
    }
    // De-duplicate and trim
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const h of hits) {
      const t = h.replace(/\s+/g, ' ').trim();
      if (!seen.has(t)) { seen.add(t); uniq.push(t); }
      if (uniq.join(' ').length >= limitChars) break;
    }
    return uniq.slice(0, 8);
  }

  /**
   * Chat processing
   */
  private async handleProcessChatMessage(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    logger.group('PROCESS_CHAT_MESSAGE');
    try {
      const userMessage = message.payload?.message?.content || '';
      const { settings, currentPage, lastSelection, chatHistory } = await chrome.storage.local.get(['settings', 'currentPage', 'lastSelection', 'chatHistory']);
      const provider = settings?.defaultModel === 'local-wasm' ? 'local-wasm' : 'openai';
      const apiKey = settings?.openaiApiKey;
      const maxTokens = settings?.maxTokens || 1000;
      logger.info('Settings', { provider, apiKey: logger.mask(apiKey), maxTokens });

      if (!this.llm) this.llm = new LLMClient(provider, apiKey);
      else await this.llm.setProvider(provider, apiKey);

      const contextParts: string[] = [];
      if (currentPage?.title || currentPage?.url) contextParts.push(`Page: ${currentPage?.title || ''} (${currentPage?.url || ''})`);
      if (currentPage?.description) contextParts.push(`Description: ${currentPage.description}`);
      if (lastSelection?.text) contextParts.push(`User selection: ${lastSelection.text}`);
      if (currentPage?.content) {
        const content = String(currentPage.content);
        const maxContextTokens = Math.max(256, Math.floor(maxTokens * 0.6));
        const maxContextChars = maxContextTokens * 4;
        contextParts.push(`Page content:\n${content.slice(0, maxContextChars)}`);
      }

      // Add recent conversation transcript to maintain context
      let conversationText = '';
      try {
        const history: ChatMessage[] = Array.isArray(chatHistory) ? chatHistory : [];
        const lastN = history.slice(-8); // last 8 messages
        const lines: string[] = [];
        for (const m of lastN) {
          if (m.role === 'system') continue;
          const role = m.role === 'assistant' ? 'Assistant' : 'User';
          const snippet = (m.content || '').toString().slice(0, 800);
          lines.push(`${role}: ${snippet}`);
        }
        conversationText = lines.join('\n');
      } catch {}

      const baseContext = contextParts.join('\n\n');
      const parts: string[] = [];
      if (baseContext) parts.push(`Context:\n${baseContext}`);
      if (conversationText) parts.push(`Conversation so far:\n${conversationText}`);
      parts.push(`Question: ${userMessage}`);
      const userPrompt = parts.join('\n\n');

      const systemPrompt = 'You are WebCopilot, a helpful, concise, and professional AI assistant for web pages. Use the provided page context faithfully. If context is limited, state limitations and ask clarifying questions.';

      logger.info('Generating response');
      const result = await this.llm.generateResponse(systemPrompt, userPrompt, maxTokens);
      logger.info('Generation success', { tokens: result.tokens, model: result.model, cost: result.cost });
      sendResponse({ success: true, data: result });
    } catch (error) {
      logger.error('Generation failed', error);
      sendResponse({ success: false, error: (error as Error).message });
    } finally {
      logger.groupEnd();
    }
  }

  /**
   * Handle page content extraction request
   */
  private async handlePageExtraction(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    logger.group('EXTRACT_PAGE_CONTENT');
    try {
      // Prefer explicit tabId from the message (popup), fall back to sender, then active tab
      let targetTabId: number | undefined = (message as any).tabId || sender.tab?.id;
      if (!targetTabId) {
        const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTabId = active?.id;
      }
      if (!targetTabId) {
        logger.warn('No tab ID for extraction');
        sendResponse({ error: 'No tab ID found' });
        return;
      }

      const tab = await chrome.tabs.get(targetTabId);
      logger.info('Executing extraction on tab', targetTabId, 'url', tab?.url);

      // Ask content script directly
      const response = await chrome.tabs
        .sendMessage(targetTabId, { type: 'EXTRACT_PAGE_CONTENT' })
        .catch((e) => {
          logger.warn('Content script did not respond; site may block scripts or content_script not injected', e);
          return null;
        });

      if (response?.success) {
        logger.info('Extraction success');
        try { await chrome.storage.local.set({ currentPage: response.data }); } catch {}
        sendResponse({ success: true, data: response.data });
      } else {
        // Fallback: extract minimal content directly via page execution
        logger.warn('Extraction returned no result; attempting fallback extraction');
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          func: () => {
            try {
              const trim = (txt: string) => txt.replace(/\s+/g, ' ').trim();
              const url = window.location.href;
              const title = document.title || '';
              const desc = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || '';
              // Prefer visible text to avoid heavy HTML
              const bodyText = trim(document.body?.innerText || document.body?.textContent || '');
              const content = bodyText.slice(0, 50000);
              // Simple hash
              let h = 0;
              const base = `${url}|${title}|${content.substring(0, 1000)}`;
              for (let i = 0; i < base.length; i++) {
                h = ((h << 5) - h) + base.charCodeAt(i);
                h |= 0;
              }
              return {
                success: true,
                data: {
                  url,
                  title,
                  description: desc,
                  content,
                  extractedAt: Date.now(),
                  hash: Math.abs(h).toString(36)
                }
              };
            } catch (e: any) {
              return { success: false, error: e?.message || 'Fallback failed' };
            }
          }
        });

        if (result?.result?.success) {
          logger.info('Fallback extraction success');
          try { await chrome.storage.local.set({ currentPage: result.result.data }); } catch {}
          sendResponse({ success: true, data: result.result.data });
        } else {
          logger.error('Fallback extraction failed', result?.result?.error);
          sendResponse({ error: 'Failed to extract page content' });
        }
      }
    } catch (error) {
      logger.error('Extraction failed', error);
      sendResponse({ error: 'Page extraction failed' });
    } finally {
      logger.groupEnd();
    }
  }

  /**
   * Handle get extension state request
   */
  private async handleGetState(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      // Get data from chrome.storage.local
      const result = await chrome.storage.local.get([
        'currentPage',
        'chatHistory',
        'memoryChunks',
        'promptTemplates',
        'settings'
      ]);

      sendResponse({ success: true, data: result });
    } catch (error) {
      logger.error('Get state error', error);
      sendResponse({ error: 'Failed to get extension state' });
    }
  }

  /**
   * Handle settings update request
   */
  private async handleUpdateSettings(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      const { settings } = (message as any).payload;

      // Store settings in chrome.storage.local
      await chrome.storage.local.set({ settings });
      const provider = settings?.defaultModel === 'local-wasm' ? 'local-wasm' : 'openai';
      const apiKey = settings?.openaiApiKey;
      logger.info('Update settings', { provider, apiKey: logger.mask(apiKey) });

      // Re-init or reconfigure LLM client immediately
      if (!this.llm) {
        this.llm = new LLMClient(provider, apiKey);
      } else {
        await this.llm.setProvider(provider, apiKey);
      }

      sendResponse({ success: true });
    } catch (error) {
      logger.error('Update settings error', error);
      sendResponse({ error: 'Failed to update settings' });
    }
  }

  /**
   * Handle data export request
   */
  private async handleExportData(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      // Get all data from storage
      const result = await chrome.storage.local.get(null);

      // Create downloadable blob
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);

      // Trigger download
      chrome.downloads.download({
        url: url,
        filename: `webcopilot-export-${new Date().toISOString().split('T')[0]}.json`,
        saveAs: true
      });

      sendResponse({ success: true });
    } catch (error) {
      logger.error('Export data error', error);
      sendResponse({ error: 'Failed to export data' });
    }
  }

  /**
   * Handle data import request
   */
  private async handleImportData(
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      const { data } = (message as any).payload;

      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Store imported data
      await chrome.storage.local.set(data);

      sendResponse({ success: true });
    } catch (error) {
      logger.error('Import data error', error);
      sendResponse({ error: 'Failed to import data' });
    }
  }

  /**
   * Setup installation and update handlers
   */
  private setupInstallationHandlers(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        logger.info('Installed');
        this.initializeDefaultSettings();
      } else if (details.reason === 'update') {
        logger.info('Updated');
      }
    });
  }

  /**
   * Initialize default settings on first install
   */
  private async initializeDefaultSettings(): Promise<void> {
    try {
      const defaultSettings = {
        defaultModel: 'gpt-4o-mini',
        embeddingModel: 'text-embedding-3-small',
        maxTokens: 2000,
        costThreshold: 0.1,
        enableCloudStorage: false,
        enableLocalModel: false,
        theme: 'auto',
        language: 'en',
        openaiApiKey: ''
      };

      await chrome.storage.local.set({ settings: defaultSettings });
      logger.info('Default settings initialized');
    } catch (error) {
      logger.error('Init default settings failed', error);
    }
  }
}

// Initialize the background service worker
new BackgroundServiceWorker(); 
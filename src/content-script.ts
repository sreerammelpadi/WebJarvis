import { PageExtractor } from '@/lib/page-extractor';
import { EmbeddingsManager } from '@/lib/embeddings';
import { StorageManager } from '@/lib/storage';
import { PageContent, ChromeMessage } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Content script that runs on web pages
 * Handles page content extraction, embeddings, and user interactions
 */
class ContentScript {
  private storage: StorageManager;
  private embeddings: EmbeddingsManager;
  private currentPage?: PageContent;
  private isInitialized = false;

  constructor() {
    this.storage = new StorageManager();
    this.embeddings = new EmbeddingsManager();
    this.initialize();
  }

  /**
   * Initialize the content script
   */
  private async initialize(): Promise<void> {
    try {
      logger.group('ContentScript initialize');
      await this.storage.initialize();
      this.setupMessageListeners();
      // Passive by default: do not auto-extract or observe
      this.isInitialized = true;
      logger.info('Content script ready');
      logger.groupEnd();
    } catch (error) {
      logger.error('Failed to initialize content script', error);
    }
  }

  /**
   * Setup message listeners for communication with background script
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
      logger.groupCollapsed(`onMessage ${message.type}`);
      this.handleMessage(message, sender, sendResponse)
        .catch((e) => logger.error('handleMessage promise rejected', e))
        .finally(() => logger.groupEnd());
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
        case 'CONTEXT_MENU_SELECTION':
          await this.handleContextMenuSelection(message, sendResponse);
          break;
        
        case 'EXTRACT_PAGE_CONTENT':
          await this.handleExtractPageContent(message, sendResponse);
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

  /**
   * Handle context menu selection
   */
  private async handleContextMenuSelection(
    message: ChromeMessage,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      const { selectionText, pageUrl } = (message as any).payload;
      
      // Store the selection for use in chat
      const selectionData = {
        text: selectionText,
        url: pageUrl || window.location.href,
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ 
        lastSelection: selectionData 
      });

      logger.info('Stored selection', { len: selectionText?.length });
      sendResponse({ success: true, data: selectionData });
    } catch (error) {
      logger.error('Context menu selection error', error);
      sendResponse({ error: 'Failed to handle selection' });
    }
  }

  /**
   * Handle page content extraction request
   */
  private async handleExtractPageContent(
    message: ChromeMessage,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      const pageContent = await this.extractPageContent();
      this.currentPage = pageContent;
      logger.info('Returning current page content', { hasJsonLd: !!pageContent.jsonLd, len: pageContent.content?.length });
      sendResponse({ success: true, data: pageContent });
    } catch (error) {
      logger.error('Page extraction error', error);
      sendResponse({ error: 'Failed to extract page content' });
    }
  }

  /**
   * Extract and process page content
   */
  private async extractPageContent(): Promise<PageContent> {
    try {
      const data = await PageExtractor.extractPageContent();
      logger.info('Extracted', { title: data.title, len: data.content?.length });
      return data;
    } catch (error) {
      logger.error('Page extraction failed', error);
      // Return fallback content
      return {
        url: window.location.href,
        title: document.title || 'Untitled Page',
        description: '',
        content: document.body?.textContent || '',
        extractedAt: Date.now(),
        hash: 'fallback'
      } as PageContent;
    }
  }

  /**
   * Get current page content
   */
  getCurrentPage(): PageContent | undefined {
    return this.currentPage;
  }

  /**
   * Check if content script is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Initialize content script
const contentScript = new ContentScript();

// Expose functions to window for background script access
(window as any).extractPageContent = () => {
  return contentScript.getCurrentPage();
};

(window as any).isWebCopilotReady = () => {
  return contentScript.isReady();
}; 
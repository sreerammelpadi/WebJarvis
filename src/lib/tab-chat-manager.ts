/**
 * Tab-based chat context manager
 * Maintains separate chat histories for each tab and handles cleanup
 */

import { ChatMessage, PageContent } from '@/types';
import { logger } from './logger';

export interface TabChatContext {
  tabId: number;
  url: string;
  title: string;
  sessionKey: string;
  chatHistory: ChatMessage[];
  pageContent?: PageContent;
  createdAt: number;
  lastAccessedAt: number;
}

export class TabChatManager {
  private static readonly STORAGE_KEY = 'tabChatContexts';
  private static readonly MAX_CONTEXTS = 50; // Limit to prevent storage bloat
  private static readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get chat context for a specific tab
   */
  static async getTabContext(tabId: number, url: string, sessionKey: string): Promise<TabChatContext | null> {
    try {
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      const contextKey = this.generateContextKey(tabId, sessionKey);
      const context = contexts[contextKey];
      
      if (context && context.url === url) {
        // Update last accessed time
        context.lastAccessedAt = Date.now();
        await this.saveContext(context);
        logger.info('Loaded tab context', { tabId, sessionKey, messagesCount: context.chatHistory.length });
        return context;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get tab context', error);
      return null;
    }
  }

  /**
   * Save or update chat context for a tab
   */
  static async saveTabContext(
    tabId: number,
    url: string,
    title: string,
    sessionKey: string,
    chatHistory: ChatMessage[],
    pageContent?: PageContent
  ): Promise<void> {
    try {
      const context: TabChatContext = {
        tabId,
        url,
        title,
        sessionKey,
        chatHistory: [...chatHistory], // Clone to avoid mutations
        pageContent,
        createdAt: Date.now(),
        lastAccessedAt: Date.now()
      };

      await this.saveContext(context);
      logger.info('Saved tab context', { tabId, sessionKey, messagesCount: chatHistory.length });
    } catch (error) {
      logger.error('Failed to save tab context', error);
    }
  }

  /**
   * Update chat history for an existing context
   */
  static async updateChatHistory(tabId: number, sessionKey: string, chatHistory: ChatMessage[]): Promise<void> {
    try {
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      const contextKey = this.generateContextKey(tabId, sessionKey);
      const context = contexts[contextKey];
      
      if (context) {
        context.chatHistory = [...chatHistory];
        context.lastAccessedAt = Date.now();
        await this.saveContext(context);
        logger.info('Updated chat history', { tabId, sessionKey, messagesCount: chatHistory.length });
      }
    } catch (error) {
      logger.error('Failed to update chat history', error);
    }
  }

  /**
   * Remove context for a specific tab
   */
  static async removeTabContext(tabId: number, sessionKey?: string): Promise<void> {
    try {
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      if (sessionKey) {
        // Remove specific session
        const contextKey = this.generateContextKey(tabId, sessionKey);
        delete contexts[contextKey];
        logger.info('Removed specific tab context', { tabId, sessionKey });
      } else {
        // Remove all contexts for this tab
        Object.keys(contexts).forEach(key => {
          if (contexts[key].tabId === tabId) {
            delete contexts[key];
          }
        });
        logger.info('Removed all contexts for tab', { tabId });
      }

      await chrome.storage.local.set({ [this.STORAGE_KEY]: contexts });
    } catch (error) {
      logger.error('Failed to remove tab context', error);
    }
  }

  /**
   * Clean up old and excess contexts
   */
  static async cleanupContexts(): Promise<void> {
    try {
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      const now = Date.now();
      const validContexts: Record<string, TabChatContext> = {};
      
      // Filter out old contexts and sort by last accessed
      const contextEntries = Object.entries(contexts)
        .filter(([_, context]) => (now - context.lastAccessedAt) < this.MAX_AGE)
        .sort(([_, a], [__, b]) => b.lastAccessedAt - a.lastAccessedAt);
      
      // Keep only the most recent contexts
      contextEntries.slice(0, this.MAX_CONTEXTS).forEach(([key, context]) => {
        validContexts[key] = context;
      });
      
      const removedCount = Object.keys(contexts).length - Object.keys(validContexts).length;
      if (removedCount > 0) {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: validContexts });
        logger.info('Cleaned up contexts', { removedCount, remainingCount: Object.keys(validContexts).length });
      }
    } catch (error) {
      logger.error('Failed to cleanup contexts', error);
    }
  }

  /**
   * Get all active tab IDs from stored contexts
   */
  static async getActiveTabIds(): Promise<number[]> {
    try {
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      const tabIds = new Set<number>();
      Object.values(contexts).forEach(context => tabIds.add(context.tabId));
      
      return Array.from(tabIds);
    } catch (error) {
      logger.error('Failed to get active tab IDs', error);
      return [];
    }
  }

  /**
   * Validate and clean up contexts for closed tabs
   */
  static async validateAndCleanupTabs(): Promise<void> {
    try {
      // Get all tabs that are currently open
      const openTabs = await chrome.tabs.query({});
      const openTabIds = new Set(openTabs.map(tab => tab.id).filter(id => id !== undefined));
      
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      let cleanupNeeded = false;
      const validContexts: Record<string, TabChatContext> = {};
      
      Object.entries(contexts).forEach(([key, context]) => {
        if (openTabIds.has(context.tabId)) {
          validContexts[key] = context;
        } else {
          cleanupNeeded = true;
        }
      });
      
      if (cleanupNeeded) {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: validContexts });
        const removedCount = Object.keys(contexts).length - Object.keys(validContexts).length;
        logger.info('Cleaned up closed tab contexts', { removedCount });
      }
    } catch (error) {
      logger.error('Failed to validate and cleanup tabs', error);
    }
  }

  /**
   * Initialize the tab chat manager (setup cleanup intervals, etc.)
   */
  static initialize(): void {
    // Run cleanup periodically
    setInterval(() => {
      this.cleanupContexts();
      this.validateAndCleanupTabs();
    }, this.CLEANUP_INTERVAL);

    // Initial cleanup
    this.cleanupContexts();
    this.validateAndCleanupTabs();
  }

  /**
   * Generate a unique context key for tab and session
   */
  private static generateContextKey(tabId: number, sessionKey: string): string {
    return `tab_${tabId}_${sessionKey}`;
  }

  /**
   * Save a single context to storage
   */
  private static async saveContext(context: TabChatContext): Promise<void> {
    const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
    const contexts: Record<string, TabChatContext> = tabChatContexts || {};
    
    const contextKey = this.generateContextKey(context.tabId, context.sessionKey);
    contexts[contextKey] = context;
    
    await chrome.storage.local.set({ [this.STORAGE_KEY]: contexts });
  }

  /**
   * Get statistics about stored contexts
   */
  static async getStats(): Promise<{ totalContexts: number; totalMessages: number; oldestContext: number; newestContext: number }> {
    try {
      const { tabChatContexts } = await chrome.storage.local.get([this.STORAGE_KEY]);
      const contexts: Record<string, TabChatContext> = tabChatContexts || {};
      
      const contextValues = Object.values(contexts);
      const totalMessages = contextValues.reduce((sum, ctx) => sum + ctx.chatHistory.length, 0);
      const timestamps = contextValues.map(ctx => ctx.lastAccessedAt);
      
      return {
        totalContexts: contextValues.length,
        totalMessages,
        oldestContext: timestamps.length > 0 ? Math.min(...timestamps) : 0,
        newestContext: timestamps.length > 0 ? Math.max(...timestamps) : 0
      };
    } catch (error) {
      logger.error('Failed to get stats', error);
      return { totalContexts: 0, totalMessages: 0, oldestContext: 0, newestContext: 0 };
    }
  }
}

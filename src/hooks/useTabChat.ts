import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, PageContent } from '@/types';
import { logger } from '@/lib/logger';

interface UseTabChatReturn {
  messages: ChatMessage[];
  isProcessing: boolean;
  sendMessage: (content: string, context?: any) => Promise<void>;
  clearChat: () => Promise<void>;
  addSystemMessage: (content: string) => void;
  isLoading: boolean;
}

export const useTabChat = (
  tabId: number,
  url: string,
  title: string,
  sessionKey: string,
  pageContent?: PageContent
): UseTabChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load chat context for this tab
  const loadTabContext = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.info('Loading tab context', { tabId, sessionKey });

      const response = await chrome.runtime.sendMessage({
        type: 'GET_TAB_CHAT_CONTEXT',
        payload: { tabId, url, sessionKey }
      });

      if (response?.success && response.data) {
        setMessages(response.data.chatHistory || []);
        logger.info('Loaded tab chat context', { messagesCount: response.data.chatHistory?.length || 0 });
      } else {
        // No existing context, start fresh
        setMessages([]);
        logger.info('No existing tab context, starting fresh');
      }
    } catch (error) {
      logger.error('Failed to load tab context', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [tabId, url, sessionKey]);

  // Save chat context for this tab
  const saveTabContext = useCallback(async (chatHistory: ChatMessage[]) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_TAB_CHAT_CONTEXT',
        payload: {
          tabId,
          url,
          title,
          sessionKey,
          chatHistory,
          pageContent
        }
      });
      logger.info('Saved tab chat context');
    } catch (error) {
      logger.error('Failed to save tab context', error);
    }
  }, [tabId, url, title, sessionKey, pageContent]);

  // Update chat history in background
  const updateChatHistory = useCallback(async (chatHistory: ChatMessage[]) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_TAB_CHAT_HISTORY',
        payload: {
          tabId,
          sessionKey,
          chatHistory
        }
      });
    } catch (error) {
      logger.error('Failed to update chat history', error);
    }
  }, [tabId, sessionKey]);

  // Load context on mount
  useEffect(() => {
    loadTabContext();
  }, [loadTabContext]);

  // Save context whenever messages change
  // NOTE: persistence of chat history is handled by the background service
  // after receiving the assistant response. Avoid saving on every local
  // messages change to prevent duplicate writes from the frontend.

  const sendMessage = useCallback(async (content: string, context?: any) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      context
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsProcessing(true);
    
    logger.group('sendMessage (tab-based)');
    logger.info('User message', { len: userMessage.content.length, tabId, sessionKey });

    try {
      // Send message to background for processing. Include tab/session info
      // so the background can persist updates to the tab-based context.
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_CHAT_MESSAGE',
        payload: { message: userMessage, context, tabId, sessionKey, pageContent }
      });
      
      logger.info('Background response', response);

      if (response?.success) {
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: response.data.content,
          timestamp: Date.now(),
          metadata: { tokens: response.data.tokens, model: response.data.model, cost: response.data.cost }
        };
        
        const updated = [...newMessages, assistantMessage];
        setMessages(updated);
        // Background will persist this assistant message; frontend only
        // updates local state here for immediate UI feedback.
        logger.info('Received assistant message');
      } else {
        const errorText = response?.error || 'Unknown error';
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorText}`,
          timestamp: Date.now()
        };
        
        const updated = [...newMessages, errorMessage];
        setMessages(updated);
        logger.warn('Assistant error message shown', { error: errorText });
      }
    } catch (error) {
      logger.error('sendMessage failed', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: Date.now()
      };
      
      const updated = [...newMessages, errorMessage];
      setMessages(updated);
      await updateChatHistory(updated);
    } finally {
      setIsProcessing(false);
      logger.groupEnd();
    }
  }, [messages, isProcessing, updateChatHistory, tabId, sessionKey]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    // Save empty chat history
    await saveTabContext([]);
    logger.info('Cleared tab chat');
  }, [saveTabContext]);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content,
      timestamp: Date.now()
    };
    
    const updated = [...messages, systemMessage];
    setMessages(updated);
    updateChatHistory(updated);
    logger.info('Added system message');
  }, [messages, updateChatHistory]);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearChat,
    addSystemMessage,
    isLoading
  };
};

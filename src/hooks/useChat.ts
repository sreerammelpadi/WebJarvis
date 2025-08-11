import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { logger } from '@/lib/logger';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const result = await chrome.storage.local.get(['chatHistory']);
        if (result.chatHistory) setMessages(result.chatHistory);
        logger.info('Loaded chat history', { count: result.chatHistory?.length || 0 });
      } catch (error) {
        logger.error('Failed to load chat history', error);
      }
    };
    loadChatHistory();
  }, []);

  const sendMessage = async (content: string, context?: any) => {
    if (!content.trim()) return;

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
    logger.group('sendMessage');
    logger.info('User message', { len: userMessage.content.length });

    try {
      await chrome.storage.local.set({ chatHistory: newMessages });
      logger.info('Saved user message');

      const response = await chrome.runtime.sendMessage({ type: 'PROCESS_CHAT_MESSAGE', payload: { message: userMessage, context } });
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
        await chrome.storage.local.set({ chatHistory: updated });
        logger.info('Saved assistant message');
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
        await chrome.storage.local.set({ chatHistory: updated });
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
      await chrome.storage.local.set({ chatHistory: updated });
    } finally {
      setIsProcessing(false);
      logger.groupEnd();
    }
  };

  const clearChat = async () => {
    setMessages([]);
    await chrome.storage.local.remove(['chatHistory']);
    logger.info('Cleared chat history');
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content,
      timestamp: Date.now()
    };
    const updated = [...messages, systemMessage];
    setMessages(updated);
    chrome.storage.local.set({ chatHistory: updated });
    logger.info('Added system message');
  };

  return { messages, isProcessing, sendMessage, clearChat, addSystemMessage };
}; 
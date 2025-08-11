import { useState, useEffect } from 'react';
import { ExtensionState, UserSettings } from '@/types';

const defaultSettings: UserSettings = {
  defaultModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  maxTokens: 2000,
  costThreshold: 0.10,
  enableCloudStorage: false,
  enableLocalModel: false,
  theme: 'auto',
  language: 'en'
};

const defaultState: ExtensionState = {
  chatHistory: [],
  memoryChunks: [],
  promptTemplates: [],
  settings: defaultSettings,
  isProcessing: false
};

export const useExtensionState = () => {
  const [state, setState] = useState<ExtensionState>(defaultState);

  useEffect(() => {
    // Load state from chrome storage
    const loadState = async () => {
      try {
        const result = await chrome.storage.local.get([
          'currentPage',
          'chatHistory',
          'memoryChunks',
          'promptTemplates',
          'settings'
        ]);

        setState(prev => ({
          ...prev,
          currentPage: result.currentPage || prev.currentPage,
          chatHistory: result.chatHistory || prev.chatHistory,
          memoryChunks: result.memoryChunks || prev.memoryChunks,
          promptTemplates: result.promptTemplates || prev.promptTemplates,
          settings: result.settings || prev.settings
        }));
      } catch (error) {
        console.error('Failed to load extension state:', error);
      }
    };

    loadState();
  }, []);

  const updateState = (updates: Partial<ExtensionState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Save to chrome storage
      const storageUpdates: any = {};
      if (updates.currentPage !== undefined) storageUpdates.currentPage = updates.currentPage;
      if (updates.chatHistory !== undefined) storageUpdates.chatHistory = updates.chatHistory;
      if (updates.memoryChunks !== undefined) storageUpdates.memoryChunks = updates.memoryChunks;
      if (updates.promptTemplates !== undefined) storageUpdates.promptTemplates = updates.promptTemplates;
      if (updates.settings !== undefined) storageUpdates.settings = updates.settings;
      
      if (Object.keys(storageUpdates).length > 0) {
        chrome.storage.local.set(storageUpdates).catch(error => {
          console.error('Failed to save state:', error);
        });
      }
      
      return newState;
    });
  };

  return { state, updateState };
}; 
# Tab-Based Chat Context System

This document explains how WebCopilot's tab-based chat context system works, which maintains separate chat histories for each browser tab and automatically cleans up when tabs are closed.

## Overview

The tab-based chat context system allows users to:
- Maintain separate chat histories for each browser tab
- Switch between tabs without losing chat context
- Automatically clean up chat data when tabs or windows are closed
- Persist chat context across extension popup opens/closes
- Handle multiple conversations simultaneously across different web pages

## Architecture

### Core Components

1. **TabChatManager** (`src/lib/tab-chat-manager.ts`)
   - Manages storage and retrieval of tab-based chat contexts
   - Handles cleanup of old and orphaned contexts
   - Provides utilities for context validation and statistics

2. **useTabChat Hook** (`src/hooks/useTabChat.ts`)
   - React hook that provides tab-aware chat functionality
   - Automatically loads and saves chat context for the current tab
   - Replaces the generic `useChat` hook in the popup

3. **Background Script Integration** (`src/background.ts`)
   - Listens for tab and window close events
   - Provides message handlers for tab context operations
   - Initializes cleanup intervals and validation

4. **Updated Popup** (`src/popup.tsx`)
   - Uses tab ID and session key to identify unique chat contexts
   - Loads appropriate chat history when opened
   - Saves chat updates in real-time

## How It Works

### Session Key Generation

Each tab's chat context is identified by a unique session key:
```typescript
const sessionKey = `${urlObj.origin}${urlObj.pathname}:${navigationStart}`;
```

This ensures:
- Different pages have separate chat contexts
- Page reloads create new chat sessions
- Same page in different tabs have separate contexts

### Context Storage Structure

```typescript
interface TabChatContext {
  tabId: number;           // Browser tab ID
  url: string;             // Full page URL
  title: string;           // Page title
  sessionKey: string;      // Unique session identifier
  chatHistory: ChatMessage[]; // Array of chat messages
  pageContent?: PageContent;   // Extracted page content
  createdAt: number;       // Context creation timestamp
  lastAccessedAt: number;  // Last access timestamp
}
```

### Storage Key Format

Contexts are stored with keys like: `tab_123_https://example.com/page:1703123456789`

This format allows for:
- Easy identification of contexts by tab ID
- Efficient cleanup of closed tabs
- Support for multiple sessions per tab (if page reloads)

## Lifecycle Management

### Context Creation
1. User opens extension popup on a tab
2. System generates session key based on URL and navigation timing
3. Attempts to load existing context for tab + session
4. If no context exists, creates new empty chat history
5. Saves initial context to storage

### Context Updates
1. User sends message or receives response
2. Chat history is updated in memory
3. Context is immediately saved to storage
4. Background script updates the stored context

### Context Cleanup
1. **Tab Close**: When `chrome.tabs.onRemoved` fires, removes all contexts for that tab
2. **Window Close**: When `chrome.windows.onRemoved` fires, validates all contexts
3. **Periodic Cleanup**: Every 30 minutes, removes old contexts (24+ hours old)
4. **Storage Limits**: Keeps only the 50 most recent contexts to prevent storage bloat

## API Reference

### TabChatManager Methods

```typescript
// Get existing context for a tab
static async getTabContext(tabId: number, url: string, sessionKey: string): Promise<TabChatContext | null>

// Save new or update existing context
static async saveTabContext(tabId: number, url: string, title: string, sessionKey: string, chatHistory: ChatMessage[], pageContent?: PageContent): Promise<void>

// Update just the chat history
static async updateChatHistory(tabId: number, sessionKey: string, chatHistory: ChatMessage[]): Promise<void>

// Remove context(s) for a tab
static async removeTabContext(tabId: number, sessionKey?: string): Promise<void>

// Clean up old contexts
static async cleanupContexts(): Promise<void>

// Validate and clean up closed tabs
static async validateAndCleanupTabs(): Promise<void>
```

### Background Message Types

```typescript
// Get tab chat context
chrome.runtime.sendMessage({
  type: 'GET_TAB_CHAT_CONTEXT',
  payload: { tabId, url, sessionKey }
});

// Save tab chat context
chrome.runtime.sendMessage({
  type: 'SAVE_TAB_CHAT_CONTEXT',
  payload: { tabId, url, title, sessionKey, chatHistory, pageContent }
});

// Update chat history only
chrome.runtime.sendMessage({
  type: 'UPDATE_TAB_CHAT_HISTORY',
  payload: { tabId, sessionKey, chatHistory }
});
```

### useTabChat Hook

```typescript
const {
  messages,        // Current chat messages
  isProcessing,    // Whether AI is processing
  sendMessage,     // Send a new message
  clearChat,       // Clear current chat
  addSystemMessage, // Add system message
  isLoading        // Whether context is loading
} = useTabChat(tabId, url, title, sessionKey, pageContent);
```

## Configuration

### Storage Limits
- **MAX_CONTEXTS**: 50 (maximum stored contexts)
- **MAX_AGE**: 24 hours (contexts older than this are cleaned up)
- **CLEANUP_INTERVAL**: 30 minutes (how often cleanup runs)

### Storage Keys
- **STORAGE_KEY**: `'tabChatContexts'` (main storage key)

## Benefits

1. **Better User Experience**
   - No lost conversations when switching tabs
   - Each page maintains its own context
   - Seamless multi-tab usage

2. **Memory Management**
   - Automatic cleanup prevents storage bloat
   - Old contexts are removed automatically
   - Closed tabs are cleaned up immediately

3. **Data Integrity**
   - Each tab has isolated chat history
   - No cross-contamination between conversations
   - Reliable context preservation

## Migration from Global Chat

The system is backward compatible:
- Existing global chat history is preserved
- New tab-based contexts are created alongside
- Users can still access old conversations through the old system (if needed)

## Troubleshooting

### Common Issues

1. **Contexts not loading**: Check browser console for tab ID and session key logs
2. **Memory usage**: Monitor storage with `TabChatManager.getStats()`
3. **Cleanup not working**: Verify tab event listeners are properly set up

### Debug Information

Enable detailed logging by checking the browser console:
- Tab context loading/saving operations
- Cleanup operations and removed context counts
- Session key generation and validation

### Storage Inspection

To inspect stored contexts:
```javascript
chrome.storage.local.get(['tabChatContexts'], (result) => {
  console.log('Stored contexts:', result.tabChatContexts);
});
```

## Performance Considerations

- Contexts are loaded lazily when popup opens
- Only active tab contexts are kept in memory
- Automatic cleanup prevents unlimited storage growth
- Efficient storage key structure for fast lookups

// Core types for WebCopilot extension

export interface PageContent {
  url: string;
  title: string;
  company?: string;
  description: string;
  content: string;
  jsonLd?: JobPosting;
  extractedAt: number;
  hash: string;
}

export interface JobPosting {
  '@type': 'JobPosting';
  title: string;
  company?: string;
  description: string;
  responsibilities?: string[];
  qualifications?: string[];
  location?: string;
  datePosted?: string;
  employmentType?: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: {
    selection?: string;
    pageLocation?: string;
    attachments?: Attachment[];
  };
  metadata?: {
    tokens?: number;
    model?: string;
    cost?: number;
  };
}

export interface Attachment {
  id: string;
  type: 'resume' | 'document' | 'image';
  name: string;
  content: string;
  size: number;
  uploadedAt: number;
}

export interface MemoryChunk {
  id: string;
  sourceUrl: string;
  chunkText: string;
  embedding: number[];
  chunkIndex: number;
  createdAt: number;
  tags: string[];
  metadata?: {
    title?: string;
    company?: string;
    type?: 'job' | 'resume' | 'general';
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  placeholders: string[];
  category: 'job' | 'resume' | 'general' | 'summary';
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  openaiApiKey?: string;
  huggingfaceApiKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  defaultModel: 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'gpt-5-mini' | 'o4-mini' | 'local-wasm';
  embeddingModel: 'text-embedding-3-small' | 'local-wasm';
  maxTokens: number;
  costThreshold: number;
  enableCloudStorage: boolean;
  enableLocalModel: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface RAGContext {
  query: string;
  relevantChunks: MemoryChunk[];
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
}

export interface LLMResponse {
  content: string;
  tokens: number;
  model: string;
  cost: number;
  finishReason: string;
}

export interface HighlightRange {
  startOffset: number;
  endOffset: number;
  text: string;
  element: Element;
  highlightId: string;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
}

export interface ExtensionState {
  currentPage?: PageContent;
  chatHistory: ChatMessage[];
  memoryChunks: MemoryChunk[];
  promptTemplates: PromptTemplate[];
  settings: UserSettings;
  isProcessing: boolean;
  lastError?: string;
}

// Chrome extension specific types
export interface ChromeMessage {
  type: string;
  payload?: any;
  tabId?: number;
  response?: any;
}

export interface ContextMenuInfo {
  selectionText: string;
  pageUrl: string;
  tabId: number;
}

// API response types
export interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

// Utility types
export type ModelProvider = 'openai' | 'huggingface' | 'local-wasm';
export type EmbeddingProvider = 'openai' | 'local-wasm';
export type FileFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'json';
export type SummaryType = 'short' | 'detailed' | 'tldr'; 
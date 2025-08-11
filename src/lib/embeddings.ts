import { MemoryChunk, EmbeddingProvider, OpenAIEmbeddingResponse } from '@/types';

/**
 * Embeddings manager for computing and storing text embeddings
 * Supports both OpenAI cloud and local WASM computation
 */
export class EmbeddingsManager {
  private openaiClient: any = null;
  private localEmbeddingModel: any = null;
  private provider: EmbeddingProvider = 'openai';

  constructor(provider: EmbeddingProvider = 'openai', apiKey?: string) {
    this.provider = provider;
    if (provider === 'openai' && apiKey) {
      // Dynamic import to avoid bundle issues
      this.initializeOpenAI(apiKey);
    }
  }

  /**
   * Initialize OpenAI client
   */
  private async initializeOpenAI(apiKey: string): Promise<void> {
    try {
      const { OpenAI } = await import('openai');
      this.openaiClient = new OpenAI({ apiKey });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('OpenAI client initialization failed');
    }
  }

  /**
   * Compute embeddings for text chunks
   */
  async computeEmbeddings(texts: string[]): Promise<number[][]> {
    if (this.provider === 'openai') {
      return this.computeOpenAIEmbeddings(texts);
    } else if (this.provider === 'local-wasm') {
      return this.computeLocalEmbeddings(texts);
    }
    
    throw new Error(`Unsupported embedding provider: ${this.provider}`);
  }

  /**
   * Compute embeddings using OpenAI API
   */
  private async computeOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float'
      });

      return response.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error(`Failed to compute OpenAI embeddings: ${error}`);
    }
  }

  /**
   * Compute embeddings using local WASM model
   */
  private async computeLocalEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.localEmbeddingModel) {
      await this.initializeLocalModel();
    }

    try {
      const embeddings: number[][] = [];
      
      for (const text of texts) {
        // Simple local embedding using character frequency (fallback)
        // In production, this would use a proper WASM model
        const embedding = this.computeSimpleEmbedding(text);
        embeddings.push(embedding);
      }
      
      return embeddings;
    } catch (error) {
      console.error('Local embedding error:', error);
      throw new Error(`Failed to compute local embeddings: ${error}`);
    }
  }

  /**
   * Initialize local WASM embedding model
   */
  private async initializeLocalModel(): Promise<void> {
    try {
      // This would load a proper WASM model in production
      // For now, we'll use a simple fallback
      this.localEmbeddingModel = 'initialized';
    } catch (error) {
      console.warn('Failed to initialize local model, using fallback:', error);
      this.localEmbeddingModel = 'fallback';
    }
  }

  /**
   * Simple fallback embedding using character frequency
   * This is a placeholder for proper WASM model integration
   */
  private computeSimpleEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0); // OpenAI embedding dimension
    
    // Simple character frequency-based embedding
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = charCode % embedding.length;
      embedding[index] += 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  /**
   * Create memory chunks from text content
   */
  async createMemoryChunks(
    sourceUrl: string,
    content: string,
    metadata?: { title?: string; company?: string; type?: 'job' | 'resume' | 'general' }
  ): Promise<MemoryChunk[]> {
    const chunks = this.chunkText(content);
    const embeddings = await this.computeEmbeddings(chunks);
    
    return chunks.map((chunk, index) => ({
      id: this.generateChunkId(sourceUrl, index),
      sourceUrl,
      chunkText: chunk,
      embedding: embeddings[index],
      chunkIndex: index,
      createdAt: Date.now(),
      tags: this.extractTags(chunk, metadata),
      metadata
    }));
  }

  /**
   * Split text into chunks for embedding
   */
  private chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = Math.min(start + maxChunkSize, text.length);
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastExclamation = text.lastIndexOf('!', end);
        const lastQuestion = text.lastIndexOf('?', end);
        const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastBreak > start + maxChunkSize * 0.7) {
          end = lastBreak + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      
      start = end;
    }
    
    return chunks;
  }

  /**
   * Extract relevant tags from chunk content
   */
  private extractTags(
    chunk: string,
    metadata?: { title?: string; company?: string; type?: 'job' | 'resume' | 'general' }
  ): string[] {
    const tags: string[] = [];
    
    if (metadata?.type) {
      tags.push(metadata.type);
    }
    
    if (metadata?.company) {
      tags.push('company:' + metadata.company.toLowerCase().replace(/\s+/g, '-'));
    }
    
    // Extract common job-related keywords
    const jobKeywords = [
      'requirements', 'qualifications', 'responsibilities', 'experience',
      'skills', 'education', 'benefits', 'salary', 'remote', 'hybrid'
    ];
    
    for (const keyword of jobKeywords) {
      if (chunk.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }

  /**
   * Generate unique chunk ID
   */
  private generateChunkId(sourceUrl: string, index: number): string {
    const urlHash = this.hashString(sourceUrl);
    return `${urlHash}-${index}-${Date.now()}`;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Change embedding provider
   */
  async setProvider(provider: EmbeddingProvider, apiKey?: string): Promise<void> {
    this.provider = provider;
    
    if (provider === 'openai' && apiKey) {
      await this.initializeOpenAI(apiKey);
    } else {
      this.openaiClient = null;
    }
    
    this.localEmbeddingModel = null; // Reset local model
  }

  /**
   * Get current provider
   */
  getProvider(): EmbeddingProvider {
    return this.provider;
  }

  /**
   * Estimate embedding costs for OpenAI
   */
  estimateOpenAICost(texts: string[]): number {
    const totalTokens = texts.reduce((sum, text) => sum + text.length, 0);
    // OpenAI text-embedding-3-small: $0.00002 per 1K tokens
    return (totalTokens / 1000) * 0.00002;
  }
} 
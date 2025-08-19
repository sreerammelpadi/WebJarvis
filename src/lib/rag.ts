import { MemoryChunk, RAGContext, PromptTemplate } from '@/types';

/**
 * RAG (Retrieval-Augmented Generation) system for intelligent context retrieval
 * Implements semantic search and context building for LLM prompts
 */
export class RAGSystem {
  private static readonly MAX_CONTEXT_CHUNKS = 5;
  private static readonly MAX_CONTEXT_LENGTH = 4000; // characters
  private static readonly SIMILARITY_THRESHOLD = 0.7;

  /**
   * Perform semantic search to find relevant context chunks
   */
  static async searchRelevantChunks(
    query: string,
    chunks: MemoryChunk[],
    topK: number = this.MAX_CONTEXT_CHUNKS
  ): Promise<MemoryChunk[]> {
    if (chunks.length === 0) return [];

    // For now, use simple keyword matching
    // In production, this would use proper semantic similarity
    const scoredChunks = chunks.map(chunk => ({
      chunk,
      score: this.computeRelevanceScore(query, chunk)
    }));

    // Sort by relevance score and return top K
    scoredChunks.sort((a, b) => b.score - a.score);
    
    return scoredChunks
      .slice(0, topK)
      .filter(item => item.score >= this.SIMILARITY_THRESHOLD)
      .map(item => item.chunk);
  }

  /**
   * Build RAG context for LLM prompt
   */
  static buildRAGContext(
    query: string,
    relevantChunks: MemoryChunk[],
    promptTemplate?: PromptTemplate
  ): RAGContext {
    const contextText = this.buildContextText(relevantChunks);
    const systemPrompt = this.buildSystemPrompt(promptTemplate, contextText);
    const userPrompt = this.buildUserPrompt(query, contextText);
    
    return {
      query,
      relevantChunks,
      systemPrompt,
      userPrompt,
      estimatedTokens: this.estimateTokens(systemPrompt + userPrompt)
    };
  }

  /**
   * Build context text from relevant chunks
   */
  private static buildContextText(chunks: MemoryChunk[]): string {
    if (chunks.length === 0) return '';

    let contextText = '';
    let currentLength = 0;

    for (const chunk of chunks) {
      const chunkText = `[Source: ${chunk.sourceUrl}]\n${chunk.chunkText}\n\n`;
      
      if (currentLength + chunkText.length > this.MAX_CONTEXT_LENGTH) {
        break;
      }
      
      contextText += chunkText;
      currentLength += chunkText.length;
    }

    return contextText.trim();
  }

  /**
   * Build system prompt with context
   */
  private static buildSystemPrompt(
    template?: PromptTemplate,
    contextText?: string
  ): string {
    let systemPrompt = 'You are WebCopilot, an AI assistant that helps users understand and interact with web content. ';

    if (template?.prompt) {
      // Replace placeholders in template
      systemPrompt += this.replaceTemplatePlaceholders(template.prompt, contextText);
    } else {
      systemPrompt += 'Provide helpful, accurate, and concise responses based on the context provided. ';
      systemPrompt += 'If the context is insufficient, ask for clarification. ';
      systemPrompt += 'Always cite sources when possible.';
    }

    if (contextText) {
      systemPrompt += `\n\nContext:\n${contextText}`;
    }

    return systemPrompt;
  }

  /**
   * Build user prompt with query
   */
  private static buildUserPrompt(query: string, contextText?: string): string {
    let userPrompt = query;

    if (contextText) {
      userPrompt = `Question: ${query}\n\nPlease use the provided context to answer this question.`;
    }

    return userPrompt;
  }

  /**
   * Replace template placeholders with actual values
   */
  private static replaceTemplatePlaceholders(
    template: string,
    contextText?: string
  ): string {
    let result = template;

    // Replace common placeholders
    const replacements: { [key: string]: string } = {
      '{context}': contextText || '',
      '{page_title}': document.title || 'Current Page',
      '{company}': this.extractCompanyFromContext(contextText) || 'Company',
      '{job_description}': contextText || '',
      '{user_name}': 'User', // Would come from user settings
      '{job_url}': window.location.href || '',
      '{selection}': this.getSelectedText() || ''
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }

    return result;
  }

  /**
   * Extract company name from context text
   */
  private static extractCompanyFromContext(contextText?: string): string | undefined {
    if (!contextText) return undefined;

    // Look for company patterns in context
    const companyPatterns = [
      /company[:\s]+([^.\n]+)/i,
      /employer[:\s]+([^.\n]+)/i,
      /organization[:\s]+([^.\n]+)/i
    ];

    for (const pattern of companyPatterns) {
      const match = contextText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Get currently selected text
   */
  private static getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  /**
   * Compute relevance score between query and chunk
   * This is a simple implementation - in production, use proper semantic similarity
   */
  private static computeRelevanceScore(query: string, chunk: MemoryChunk): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const chunkWords = chunk.chunkText.toLowerCase().split(/\s+/);
    
    let score = 0;
    let totalWords = queryWords.length;

    for (const queryWord of queryWords) {
      if (queryWord.length < 3) continue; // Skip very short words
      
      let wordScore = 0;
      for (const chunkWord of chunkWords) {
        if (chunkWord.includes(queryWord) || queryWord.includes(chunkWord)) {
          wordScore = Math.max(wordScore, queryWord.length / Math.max(queryWord.length, chunkWord.length));
        }
      }
      score += wordScore;
    }

    // Normalize score
    return totalWords > 0 ? score / totalWords : 0;
  }

  /**
   * Estimate token count (rough approximation)
   */
  private static estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get default prompt templates for common tasks
   */
  static getDefaultTemplates(): PromptTemplate[] {
    return [
      {
        id: 'extract-job',
        title: 'Extract Job Details',
        description: 'Extract structured job information from the page',
        prompt: 'Extract the following information from this job posting:\n- Title: {page_title}\n- Company: {company}\n- Description: {job_description}\n- Key Requirements\n- Responsibilities\n- Benefits\n\nFormat as JSON.',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'summarize',
        title: 'Summarize Content',
        description: 'Create a concise summary of the page content',
        prompt: 'Provide a {summary_type} summary of the following content:\n\n{context}\n\nSummary:',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'cover-letter',
        title: 'Generate Cover Letter',
        description: 'Create a tailored cover letter for this job',
        prompt: 'Using this job description:\n{job_description}\n\nAnd my resume:\n{resume_snippet}\n\nGenerate a professional cover letter (350 words) highlighting relevant experience.',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
  }

  /**
   * Optimize context for token efficiency
   */
  static optimizeContext(
    chunks: MemoryChunk[],
    maxTokens: number
  ): MemoryChunk[] {
    const optimized: MemoryChunk[] = [];
    let currentTokens = 0;
    const maxContextTokens = Math.floor(maxTokens * 0.7); // Reserve 30% for response

    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.chunkText);
      
      if (currentTokens + chunkTokens <= maxContextTokens) {
        optimized.push(chunk);
        currentTokens += chunkTokens;
      } else {
        break;
      }
    }

    return optimized;
  }
} 
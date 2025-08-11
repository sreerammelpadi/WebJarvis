import { PageContent, JobPosting } from '@/types';

/**
 * Page content extractor with intelligent parsing and cleaning
 * Prioritizes structured data (JSON-LD) over Readability extraction
 */
export class PageExtractor {
  private static readonly MAX_CONTENT_LENGTH = 50000; // 50KB limit for cost control
  private static readonly CHUNK_SIZE = 1000; // Characters per chunk for embeddings

  /**
   * Extract and process page content with intelligent fallbacks
   */
  static async extractPageContent(): Promise<PageContent> {
    const url = window.location.href;
    const title = this.extractTitle();
    
    // Try JSON-LD first (most reliable for job postings)
    const jsonLd = this.extractJsonLd();
    
    if (jsonLd && jsonLd['@type'] === 'JobPosting') {
      return this.processJobPostingJsonLd(jsonLd as JobPosting, url, title);
    }
    
    // Fallback to Readability + heuristics
    const readabilityContent = await this.extractWithReadability();
    const company = this.extractCompanyHeuristic();
    const description = this.extractDescriptionHeuristic();
    
    return {
      url,
      title,
      company,
      description,
      content: this.trimAndCleanHtml(readabilityContent),
      extractedAt: Date.now(),
      hash: this.generatePageHash(url, title, readabilityContent)
    };
  }

  /**
   * Extract JSON-LD structured data from the page
   */
  private static extractJsonLd(): any | null {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '');
          if (data['@type'] === 'JobPosting') {
            return data;
          }
        } catch (e) {
          console.warn('Failed to parse JSON-LD script:', e);
        }
      }
    } catch (e) {
      console.warn('Error extracting JSON-LD:', e);
    }
    
    return null;
  }

  /**
   * Process JobPosting JSON-LD data into normalized format
   */
  private static processJobPostingJsonLd(jsonLd: JobPosting, url: string, title: string): PageContent {
    const content = this.trimAndCleanHtml(jsonLd.description);
    
    return {
      url,
      title: jsonLd.title || title,
      company: jsonLd.company,
      description: jsonLd.description,
      content,
      jsonLd,
      extractedAt: Date.now(),
      hash: this.generatePageHash(url, jsonLd.title || title, content)
    };
  }

  /**
   * Extract main content using Readability algorithm
   */
  private static async extractWithReadability(): Promise<string> {
    try {
      // Import Readability dynamically to avoid bundle size issues
      const { Readability } = await import('@mozilla/readability');
      
      const documentClone = document.cloneNode(true) as Document;
      const reader = new Readability(documentClone);
      const article = reader.parse();
      
      return article?.content || this.extractFallbackContent();
    } catch (e) {
      console.warn('Readability extraction failed, using fallback:', e);
      return this.extractFallbackContent();
    }
  }

  /**
   * Fallback content extraction using basic heuristics
   */
  private static extractFallbackContent(): string {
    const selectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '#content',
      '.job-description',
      '.description'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent;
      }
    }
    
    // Last resort: get body content
    return document.body?.textContent || '';
  }

  /**
   * Extract company name using heuristics
   */
  private static extractCompanyHeuristic(): string | undefined {
    const companySelectors = [
      '[data-company]',
      '.company',
      '.company-name',
      '.employer',
      '.organization',
      'meta[property="og:site_name"]'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim()) {
          return content.trim();
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract description using heuristics
   */
  private static extractDescriptionHeuristic(): string {
    const descSelectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      '.description',
      '.summary',
      '.excerpt'
    ];
    
    for (const selector of descSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim()) {
          return content.trim();
        }
      }
    }
    
    return '';
  }

  /**
   * Extract page title
   */
  private static extractTitle(): string {
    return document.title || 
           document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
           'Untitled Page';
  }

  /**
   * Comprehensive HTML cleaning and trimming pipeline
   */
  private static trimAndCleanHtml(html: string): string {
    if (!html) return '';
    
    let cleaned = html;
    
    // Remove script and style tags
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags but preserve line breaks
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/p>/gi, '\n');
    cleaned = cleaned.replace(/<\/div>/gi, '\n');
    cleaned = cleaned.replace(/<\/h[1-6]>/gi, '\n');
    
    // Remove remaining HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // Decode HTML entities
    cleaned = this.decodeHtmlEntities(cleaned);
    
    // Remove base64 blobs (common in data URIs)
    cleaned = cleaned.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, '');
    
    // Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Trim and limit length
    cleaned = cleaned.trim();
    
    if (cleaned.length > this.MAX_CONTENT_LENGTH) {
      cleaned = cleaned.substring(0, this.MAX_CONTENT_LENGTH) + '...';
    }
    
    return cleaned;
  }

  /**
   * Decode common HTML entities
   */
  private static decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };
    
    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * Generate a hash for the page content
   */
  private static generatePageHash(url: string, title: string, content: string): string {
    const data = `${url}|${title}|${content.substring(0, 1000)}`;
    let hash = 0;
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Split content into chunks for embedding
   */
  static chunkContent(content: string): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < content.length) {
      const end = Math.min(start + this.CHUNK_SIZE, content.length);
      let chunk = content.substring(start, end);
      
      // Try to break at sentence boundaries
      if (end < content.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastExclamation = chunk.lastIndexOf('!');
        const lastQuestion = chunk.lastIndexOf('?');
        const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastBreak > start + this.CHUNK_SIZE * 0.7) {
          chunk = content.substring(start, lastBreak + 1);
          start = lastBreak + 1;
        } else {
          start = end;
        }
      } else {
        start = end;
      }
      
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  /**
   * Get raw HTML option for advanced users
   */
  static getRawHtml(): string {
    return this.trimAndCleanHtml(document.documentElement.outerHTML);
  }
} 
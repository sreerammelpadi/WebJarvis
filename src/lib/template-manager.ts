/**
 * Template manager for handling prompt templates
 * Provides CRUD operations and default templates
 */

import { PromptTemplate } from '@/types';
import { logger } from './logger';

export class TemplateManager {
  private static readonly STORAGE_KEY = 'promptTemplates';

  /**
   * Get all templates from storage
   */
  static async getTemplates(): Promise<PromptTemplate[]> {
    try {
      const { promptTemplates } = await chrome.storage.local.get([this.STORAGE_KEY]);
      
      if (!promptTemplates || promptTemplates.length === 0) {
        // Initialize with default templates
        const defaultTemplates = this.getDefaultTemplates();
        await this.saveTemplates(defaultTemplates);
        return defaultTemplates;
      }
      
      return promptTemplates;
    } catch (error) {
      logger.error('Failed to get templates', error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Save templates to storage
   */
  static async saveTemplates(templates: PromptTemplate[]): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: templates });
      logger.info('Saved templates', { count: templates.length });
    } catch (error) {
      logger.error('Failed to save templates', error);
    }
  }

  /**
   * Add a new template
   */
  static async addTemplate(title: string, prompt: string, description?: string): Promise<PromptTemplate> {
    try {
      const templates = await this.getTemplates();
      
      const newTemplate: PromptTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        prompt,
        description,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const updatedTemplates = [...templates, newTemplate];
      await this.saveTemplates(updatedTemplates);
      
      logger.info('Added template', { id: newTemplate.id, title });
      return newTemplate;
    } catch (error) {
      logger.error('Failed to add template', error);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  static async updateTemplate(id: string, updates: Partial<Pick<PromptTemplate, 'title' | 'prompt' | 'description'>>): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const templateIndex = templates.findIndex(t => t.id === id);
      
      if (templateIndex === -1) {
        throw new Error('Template not found');
      }

      templates[templateIndex] = {
        ...templates[templateIndex],
        ...updates,
        updatedAt: Date.now()
      };

      await this.saveTemplates(templates);
      logger.info('Updated template', { id, updates });
    } catch (error) {
      logger.error('Failed to update template', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === id);
      
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.isDefault) {
        throw new Error('Cannot delete default templates');
      }

      const updatedTemplates = templates.filter(t => t.id !== id);
      await this.saveTemplates(updatedTemplates);
      
      logger.info('Deleted template', { id });
    } catch (error) {
      logger.error('Failed to delete template', error);
      throw error;
    }
  }

  /**
   * Get a template by ID
   */
  static async getTemplate(id: string): Promise<PromptTemplate | null> {
    try {
      const templates = await this.getTemplates();
      return templates.find(t => t.id === id) || null;
    } catch (error) {
      logger.error('Failed to get template', error);
      return null;
    }
  }

  /**
   * Reset to default templates
   */
  static async resetToDefaults(): Promise<void> {
    try {
      const defaultTemplates = this.getDefaultTemplates();
      await this.saveTemplates(defaultTemplates);
      logger.info('Reset to default templates');
    } catch (error) {
      logger.error('Failed to reset templates', error);
      throw error;
    }
  }

  /**
   * Get default templates
   */
  private static getDefaultTemplates(): PromptTemplate[] {
    return [
      {
        id: 'summarize-page',
        title: 'Summarize Page',
        prompt: 'Please provide a concise summary of this page in 3-4 bullet points, highlighting the key information and main takeaways.',
        description: 'Creates a brief summary of the current page content',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'extract-key-points',
        title: 'Extract Key Points',
        prompt: 'Extract the most important key points from this page and present them as a numbered list. Focus on actionable information and critical details.',
        description: 'Identifies and lists the most important information from the page',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'explain-simply',
        title: 'Explain Simply',
        prompt: 'Explain the content of this page in simple terms that anyone can understand. Break down complex concepts and use everyday language.',
        description: 'Simplifies complex content for easy understanding',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'find-action-items',
        title: 'Find Action Items',
        prompt: 'Identify any action items, next steps, or tasks mentioned on this page. Present them as a clear checklist.',
        description: 'Extracts actionable tasks and next steps from the content',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'analyze-pros-cons',
        title: 'Analyze Pros & Cons',
        prompt: 'Analyze this content and provide a balanced view of the pros and cons, advantages and disadvantages, or benefits and drawbacks mentioned.',
        description: 'Provides a balanced analysis of positive and negative aspects',
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
  }

  /**
   * Export templates for backup
   */
  static async exportTemplates(): Promise<string> {
    try {
      const templates = await this.getTemplates();
      return JSON.stringify(templates, null, 2);
    } catch (error) {
      logger.error('Failed to export templates', error);
      throw error;
    }
  }

  /**
   * Import templates from backup
   */
  static async importTemplates(jsonData: string, replace: boolean = false): Promise<void> {
    try {
      const importedTemplates: PromptTemplate[] = JSON.parse(jsonData);
      
      // Validate imported data
      if (!Array.isArray(importedTemplates)) {
        throw new Error('Invalid template data format');
      }

      // Validate each template
      for (const template of importedTemplates) {
        if (!template.id || !template.title || !template.prompt) {
          throw new Error('Invalid template structure');
        }
      }

      if (replace) {
        await this.saveTemplates(importedTemplates);
      } else {
        const existingTemplates = await this.getTemplates();
        const mergedTemplates = [...existingTemplates];
        
        // Add imported templates, avoiding duplicates by ID
        for (const importedTemplate of importedTemplates) {
          if (!existingTemplates.find(t => t.id === importedTemplate.id)) {
            mergedTemplates.push({
              ...importedTemplate,
              isDefault: false, // Imported templates are not default
              updatedAt: Date.now()
            });
          }
        }
        
        await this.saveTemplates(mergedTemplates);
      }
      
      logger.info('Imported templates', { count: importedTemplates.length, replace });
    } catch (error) {
      logger.error('Failed to import templates', error);
      throw error;
    }
  }
}

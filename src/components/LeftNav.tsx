import React, { useState, useEffect } from 'react';
import { PageContent, PromptTemplate } from '@/types';

interface LeftNavProps {
  currentPage?: PageContent;
  onQuickAction: (action: string, context?: any) => void;
  isProcessing: boolean;
}

export const LeftNav: React.FC<LeftNavProps> = ({
  currentPage,
  onQuickAction,
  isProcessing
}) => {
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await chrome.storage.local.get(['promptTemplates']);
        if (result.promptTemplates) {
          setTemplates(result.promptTemplates);
        } else {
          const defaultTemplates: PromptTemplate[] = [
            {
              id: 'extract-job',
              name: 'Extract Job Details',
              description: 'Extract structured job information',
              template: 'Extract the following information from this job posting: title, company, requirements, responsibilities, and benefits.',
              placeholders: ['{page_title}', '{company}', '{job_description}'],
              category: 'job' as const,
              isDefault: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            },
            {
              id: 'summarize',
              name: 'Summarize Content',
              description: 'Create a concise summary',
              template: 'Provide a {summary_type} summary of this content in 3-4 bullet points.',
              placeholders: ['{summary_type}', '{context}'],
              category: 'general' as const,
              isDefault: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
          ];
          setTemplates(defaultTemplates);
          await chrome.storage.local.set({ promptTemplates: defaultTemplates });
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const handleQuickAction = (action: string) => {
    if (isProcessing) return;

    let prompt = '';
    let context = currentPage ? { pageUrl: currentPage.url } : undefined;

    switch (action) {
      case 'summarize':
        prompt = 'Please provide a concise summary of this page in 3-4 bullet points.';
        break;
      case 'extract-job':
        if (currentPage?.jsonLd) {
          prompt = 'Extract the key information from this job posting: title, company, requirements, responsibilities, and benefits.';
        } else {
          prompt = 'This page doesn\'t appear to be a job posting. Would you like me to help you extract other information instead?';
        }
        break;
      case 'cover-letter':
        if (currentPage?.jsonLd) {
          prompt = 'Help me draft a cover letter for this position. What key points should I highlight based on the job requirements?';
        } else {
          prompt = 'This page doesn\'t appear to be a job posting. Would you like me to help you with something else?';
        }
        break;
      default:
        prompt = action;
    }

    if (prompt) {
      onQuickAction(prompt, context);
    }
  };

  const handleTemplateClick = (template: PromptTemplate) => {
    if (isProcessing) return;

    let prompt = template.template;
    if (currentPage) {
      prompt = prompt.replace('{page_title}', currentPage.title || 'Current Page');
      prompt = prompt.replace('{company}', currentPage.company || 'Company');
      prompt = prompt.replace('{job_description}', currentPage.description || 'Page content');
      prompt = prompt.replace('{context}', currentPage.content.substring(0, 500) + '...');
    }

    onQuickAction(prompt, currentPage ? { pageUrl: currentPage.url } : undefined);
  };

  return (
    <aside className="w-64 border-r border-gray-200/70 dark:border-gray-800/70 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md flex flex-col">
      <div className="p-4 border-b border-gray-200/70 dark:border-gray-800/70">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Memory</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {memoryEnabled ? 'Storing page content for context' : 'Memory disabled'}
        </p>
      </div>

      <div className="p-4 border-b border-gray-200/70 dark:border-gray-800/70">
        <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => handleQuickAction('summarize')}
            disabled={isProcessing}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📝 Summarize Page
          </button>
          <button
            onClick={() => handleQuickAction('extract-job')}
            disabled={isProcessing}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💼 Extract Job Details
          </button>
          <button
            onClick={() => handleQuickAction('cover-letter')}
            disabled={isProcessing}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✉️ Generate Cover Letter
          </button>
        </div>
      </div>

      {currentPage && (
        <div className="p-4 border-b border-gray-200/70 dark:border-gray-800/70">
          <h3 className="text-sm font-medium mb-3">Current Page</h3>
          <div className="space-y-2 text-xs">
            <div className="font-medium text-gray-700 dark:text-gray-300 truncate">{currentPage.title}</div>
            {currentPage.company && (
              <div className="text-gray-500 dark:text-gray-400">Company: {currentPage.company}</div>
            )}
            <div className="text-gray-500 dark:text-gray-400 truncate">{currentPage.url}</div>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-medium mb-3">Templates</h3>
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              disabled={isProcessing}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={template.description}
            >
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.description}</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}; 
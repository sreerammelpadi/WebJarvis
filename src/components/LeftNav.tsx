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

  const quickActions = [
    {
      id: 'summarize',
      icon: '📄',
      label: 'Summarize Page',
      description: 'Get key points and overview',
      gradient: 'from-[#da7756] to-[#bd5d3a]'
    },
    {
      id: 'extract-job',
      icon: '💼',
      label: 'Extract Job Details',
      description: 'Parse job requirements',
      gradient: 'from-[#bd5d3a] to-[#a8462a]'
    },
    {
      id: 'cover-letter',
      icon: '✉️',
      label: 'Cover Letter Help',
      description: 'Draft application content',
      gradient: 'from-[#8a8470] to-[#6b6651]'
    }
  ];

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
    <aside className="w-64 h-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col">
      {/* Memory Toggle */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Memory</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#da7756]/30 dark:peer-focus:ring-[#da7756]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#da7756] peer-checked:to-[#bd5d3a]"></div>
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {memoryEnabled ? 'Storing context for better responses' : 'Context storage disabled'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={isProcessing}
              className="w-full group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-200`}></div>
              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-active:opacity-20 transition-opacity duration-75`}></div>
              <div className="relative flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${action.gradient} flex items-center justify-center text-sm shadow-sm`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{action.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Page */}
      {currentPage && (
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Current Page</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-[#da7756] rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {currentPage.title}
                  </p>
                  {currentPage.company && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {currentPage.company}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {new URL(currentPage.url).hostname}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Templates</h3>
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              disabled={isProcessing}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#da7756]/10 dark:hover:bg-[#da7756]/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title={template.description}
            >
              <div className="font-medium">{template.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.description}</div>
            </button>
          ))}
          {templates.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              No templates available
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

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
      description: 'Get key points and overview'
    },
    {
      id: 'extract-job',
      icon: '💼',
      label: 'Extract Job Details',
      description: 'Parse job requirements'
    },
    {
      id: 'cover-letter',
      icon: '✉️',
      label: 'Cover Letter Help',
      description: 'Draft application content'
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
    <aside className="w-60 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-r border-[#d4d0c1]/50 dark:border-[#4a453c]/50 shadow-xl">
      {/* Single Scrollable Container */}
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#da7756]/30 scrollbar-track-transparent p-4 space-y-4">
        
        {/* Memory Toggle Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Memory</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#e8e4d5] dark:bg-[#4a453c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#da7756]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#da7756]"></div>
            </label>
          </div>
          <p className="text-xs text-[#8a8470] dark:text-[#c7c1a8]">
            {memoryEnabled ? 'Storing context for better responses' : 'Context storage disabled'}
          </p>
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5] border-b border-[#d4d0c1]/30 dark:border-[#4a453c]/30 pb-1">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                disabled={isProcessing}
                className="w-full group relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 bg-[#f5f3ea]/80 dark:bg-[#342f28]/80 hover:bg-[#da7756]/10 dark:hover:bg-[#da7756]/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-[#e8e4d5]/50 dark:border-[#4a453c]/50 hover:border-[#da7756]/30"
              >
                <div className="relative flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#da7756] to-[#bd5d3a] flex items-center justify-center text-sm shadow-sm text-white">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#3d3929] dark:text-[#f0eee5] group-hover:text-[#bd5d3a] dark:group-hover:text-[#da7756] transition-colors">
                      {action.label}
                    </div>
                    <div className="text-xs text-[#8a8470] dark:text-[#c7c1a8] truncate">
                      {action.description}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-[#8a8470] dark:text-[#c7c1a8] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Page Section */}
        {/* {currentPage && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5] border-b border-[#d4d0c1]/30 dark:border-[#4a453c]/30 pb-1">Current Page</h3>
            <div className="p-3 bg-[#f5f3ea]/80 dark:bg-[#342f28]/80 rounded-xl border border-[#e8e4d5]/50 dark:border-[#4a453c]/50">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-[#da7756] rounded-full mt-1 flex-shrink-0 animate-pulse"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#3d3929] dark:text-[#f0eee5] truncate">
                    {currentPage.title}
                  </p>
                  {currentPage.company && (
                    <p className="text-xs text-[#6b6651] dark:text-[#c7c1a8] mt-1">
                      {currentPage.company}
                    </p>
                  )}
                  <p className="text-xs text-[#8a8470] dark:text-[#c7c1a8] mt-1 truncate">
                    {new URL(currentPage.url).hostname}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Templates Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5] border-b border-[#d4d0c1]/30 dark:border-[#4a453c]/30 pb-1">Templates</h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                disabled={isProcessing}
                className="w-full text-left p-3 rounded-xl bg-[#f5f3ea]/80 dark:bg-[#342f28]/80 hover:bg-[#da7756]/10 dark:hover:bg-[#da7756]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-[#e8e4d5]/50 dark:border-[#4a453c]/50 hover:border-[#da7756]/30 group hover:scale-[1.01] active:scale-[0.99]"
                title={template.description}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#da7756] rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#3d3929] dark:text-[#f0eee5] group-hover:text-[#bd5d3a] dark:group-hover:text-[#da7756] transition-colors">
                      {template.name}
                    </div>
                    <div className="text-xs text-[#8a8470] dark:text-[#c7c1a8] truncate mt-0.5">
                      {template.description}
                    </div>
                  </div>
                  <svg className="w-3 h-3 text-[#8a8470] dark:text-[#c7c1a8] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <div className="text-center py-6">
                <svg className="w-8 h-8 text-[#8a8470] dark:text-[#c7c1a8] mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs text-[#8a8470] dark:text-[#c7c1a8]">
                  No templates available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Padding for Better Scrolling */}
        <div className="h-4"></div>
      </div>
    </aside>
  );
};

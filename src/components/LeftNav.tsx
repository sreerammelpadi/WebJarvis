import React, { useState, useEffect } from 'react';
import { PageContent, PromptTemplate } from '@/types';
import { TemplateManager } from '@/lib/template-manager';

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
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await TemplateManager.getTemplates();
        setTemplates(templates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const handleTemplateClick = (template: PromptTemplate) => {
    if (isProcessing) return;

    const context = currentPage ? { pageUrl: currentPage.url } : undefined;
    onQuickAction(template.prompt, context);
  };

  return (
    <aside className="w-60 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-r border-[#d4d0c1]/50 dark:border-[#4a453c]/50 shadow-xl">
      {/* Single Scrollable Container */}
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#da7756]/30 scrollbar-track-transparent p-4">
        
        {/* Templates Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#d4d0c1]/30 dark:border-[#4a453c]/30 pb-2 mb-3">
            <h3 className="text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Templates</h3>
            <button
              onClick={() => {
                // Open options page and set templates tab as default
                chrome.storage.local.set({ defaultOptionsTab: 'templates' }).then(() => {
                  chrome.runtime.openOptionsPage();
                });
              }}
              className="p-1.5 rounded-lg bg-[#da7756]/10 hover:bg-[#da7756]/20 text-[#da7756] hover:text-[#bd5d3a] transition-all duration-200 active:scale-95"
              title="Manage templates"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                disabled={isProcessing}
                className="w-full text-left p-3 rounded-xl bg-[#f5f3ea]/80 dark:bg-[#342f28]/80 hover:bg-[#da7756]/10 dark:hover:bg-[#da7756]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-[#e8e4d5]/50 dark:border-[#4a453c]/50 hover:border-[#da7756]/30 group hover:scale-[1.01] active:scale-[0.99]"
                title={template.description || template.prompt}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#da7756] rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#3d3929] dark:text-[#f0eee5] group-hover:text-[#bd5d3a] dark:group-hover:text-[#da7756] transition-colors">
                      {template.title}
                    </div>
                    {template.description && (
                      <div className="text-xs text-[#8a8470] dark:text-[#c7c1a8] truncate mt-0.5">
                        {template.description}
                      </div>
                    )}
                  </div>
                  <svg className="w-3 h-3 text-[#8a8470] dark:text-[#c7c1a8] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-8 h-8 text-[#8a8470] dark:text-[#c7c1a8] mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs text-[#8a8470] dark:text-[#c7c1a8] mb-1">
                  No templates available
                </p>
                <p className="text-xs text-[#8a8470] dark:text-[#c7c1a8]">
                  Configure templates in settings
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

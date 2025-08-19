import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { UserSettings } from '@/types';
import { getModelDisplayInfo } from '@/lib/model-config';
import './styles/options.css';

const defaultSettings: UserSettings = {
  defaultModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  maxTokens: 2000,
  costThreshold: 0.1,
  enableCloudStorage: false,
  enableLocalModel: false,
  theme: 'auto',
  language: 'en',
  openaiApiKey: ''
};

const OptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(['settings']);
        const s = result?.settings ? { ...defaultSettings, ...result.settings } : defaultSettings;
        setSettings(s);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const persist = async (next: UserSettings) => {
    await chrome.storage.local.set({ settings: next });
    await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: { settings: next } }).catch(() => {});
  };

  const handleSave = async () => {
    await persist(settings);
    const btn = document.getElementById('save-settings');
    if (btn) {
      const t = btn.textContent;
      btn.textContent = 'Saved!';
      btn.classList.add('bg-green-600');
      setTimeout(() => {
        btn.textContent = t || 'Save Settings';
        btn.classList.remove('bg-green-600');
      }, 1200);
    }
  };

  const handleReset = async () => {
    setSettings(defaultSettings);
    await persist(defaultSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#eeece2] dark:bg-[#2a2520]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#da7756] mx-auto mb-4"></div>
          <p className="text-sm text-[#6b6651] dark:text-[#c7c1a8]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eeece2] dark:bg-[#2a2520] w-full">
      {/* Header with Claude gradient */}
      <header className="px-6 py-5 bg-gradient-to-r from-[#c86b4a] via-[#b25a40] to-[#9d4a2e] text-white w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">WebCopilot Settings</h1>
                <p className="text-sm opacity-90 font-medium">Configure your AI assistant</p>
              </div>
            </div>
            <button 
              onClick={() => window.close()} 
              className="p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 w-full">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'ai', label: 'AI Models', icon: '🤖' },
            { id: 'storage', label: 'Storage', icon: '💾' },
            { id: 'advanced', label: 'Advanced', icon: '🔧' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#da7756] to-[#bd5d3a] text-white shadow-lg hover:shadow-xl'
                  : 'bg-[#f5f3ea] dark:bg-[#342f28] text-[#3d3929] dark:text-[#f0eee5] hover:bg-[#da7756]/10 dark:hover:bg-[#da7756]/20 border border-[#e8e4d5] dark:border-[#4a453c]'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <div className="bg-[#f5f3ea]/80 dark:bg-[#342f28]/80 rounded-3xl shadow-xl border border-[#e8e4d5] dark:border-[#4a453c] overflow-hidden backdrop-blur-sm w-full">
          <div className="p-8 space-y-8 w-full">
            {activeTab === 'general' && (
              <div className="space-y-8 w-full">
                <div className="grid gap-6 sm:grid-cols-2 w-full">
                  <div className="space-y-3 w-full">
                    <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Theme</label>
                    <select 
                      value={settings.theme} 
                      onChange={(e) => handleSettingChange('theme', e.target.value as any)} 
                      className="w-full px-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                    >
                      <option value="auto">Auto (follow system)</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3 w-full">
                    <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Language</label>
                    <select 
                      value={settings.language} 
                      onChange={(e) => handleSettingChange('language', e.target.value)} 
                      className="w-full px-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3 w-full">
                    <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Maximum Response Tokens</label>
                    <input 
                      type="number" 
                      value={settings.maxTokens} 
                      onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value || '0'))} 
                      min={100} 
                      max={4000} 
                      className="w-full px-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-3 w-full">
                    <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Cost Warning Threshold</label>
                    <div className="relative w-full">
                      <span className="absolute left-4 top-3.5 text-[#8a8470] dark:text-[#c7c1a8]">$</span>
                      <input 
                        type="number" 
                        value={settings.costThreshold} 
                        onChange={(e) => handleSettingChange('costThreshold', parseFloat(e.target.value || '0'))} 
                        min={0.01} 
                        max={10} 
                        step={0.01} 
                        className="w-full pl-10 pr-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8 w-full">
                <div className="grid gap-6 sm:grid-cols-2 w-full">
                  <div className="space-y-3 w-full">
                    <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Default Language Model</label>
                    <select 
                      value={settings.defaultModel} 
                      onChange={(e) => handleSettingChange('defaultModel', e.target.value as any)} 
                      className="w-full px-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                    >
                      {getModelDisplayInfo().map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.displayName} - {model.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-3 w-full">
                    <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">Embedding Model</label>
                    <select 
                      value={settings.embeddingModel} 
                      onChange={(e) => handleSettingChange('embeddingModel', e.target.value as any)} 
                      className="w-full px-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                    >
                      <option value="text-embedding-3-small">text-embedding-3-small (Recommended)</option>
                      <option value="local-wasm">Local WASM (Offline, experimental)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3 w-full">
                  <label className="block text-sm font-semibold text-[#3d3929] dark:text-[#f0eee5]">OpenAI API Key</label>
                  <input 
                    type="password" 
                    value={settings.openaiApiKey || ''} 
                    onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)} 
                    placeholder="sk-..." 
                    className="w-full px-4 py-3 border border-[#d4d0c1] dark:border-[#4a453c] rounded-xl bg-[#eeece2] dark:bg-[#2a2520] text-[#3d3929] dark:text-[#f0eee5] focus:ring-2 focus:ring-[#da7756] focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-8 w-full">
                <div className="flex items-center gap-3 p-4 bg-[#eeece2] dark:bg-[#2a2520] rounded-xl border border-[#d4d0c1] dark:border-[#4a453c]">
                  <input 
                    type="checkbox" 
                    checked={settings.enableCloudStorage} 
                    onChange={(e) => handleSettingChange('enableCloudStorage', e.target.checked)} 
                    className="w-5 h-5 text-[#da7756] rounded focus:ring-[#da7756]"
                  />
                  <span className="text-sm font-medium text-[#3d3929] dark:text-[#f0eee5]">Enable cloud storage (Supabase)</span>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={async () => {
                      const result = await chrome.storage.local.get(null);
                      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); 
                      a.href = url; 
                      a.download = `webcopilot-export-${new Date().toISOString().split('T')[0]}.json`; 
                      a.click(); 
                      URL.revokeObjectURL(url);
                    }} 
                    className="px-6 py-3 bg-gradient-to-r from-[#8a8470] to-[#6b6651] hover:from-[#6b6651] hover:to-[#3d3929] text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    📤 Export Data
                  </button>
                  
                  <button 
                    onClick={() => {
                      const input = document.createElement('input'); 
                      input.type = 'file'; 
                      input.accept = '.json';
                      input.onchange = async (e: any) => { 
                        const f = e.target.files?.[0]; 
                        if (!f) return; 
                        const text = await f.text(); 
                        const data = JSON.parse(text); 
                        await chrome.storage.local.set(data); 
                      };
                      input.click();
                    }} 
                    className="px-6 py-3 bg-gradient-to-r from-[#8a8470] to-[#6b6651] hover:from-[#6b6651] hover:to-[#3d3929] text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    📥 Import Data
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6 w-full">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl w-full">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">Danger Zone</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">This action will reset all your settings to their default values. This cannot be undone.</p>
                  <button 
                    onClick={handleReset} 
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    🔄 Reset All Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed bottom save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#eeece2]/95 dark:bg-[#2a2520]/95 backdrop-blur border-t border-[#d4d0c1] dark:border-[#4a453c] p-6 shadow-2xl w-full">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button 
            id="save-settings" 
            onClick={handleSave} 
            className="px-8 py-3 bg-gradient-to-r from-[#da7756] to-[#bd5d3a] hover:from-[#bd5d3a] hover:to-[#a8462a] text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<OptionsPage />);

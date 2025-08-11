import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { UserSettings } from '@/types';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Replace the entire return statement in your OptionsPage component:

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header with gradient matching popup */}
      <header className="px-6 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white">
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8">
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
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 space-y-8">
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Theme</label>
                    <select 
                      value={settings.theme} 
                      onChange={(e) => handleSettingChange('theme', e.target.value as any)} 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="auto">Auto (follow system)</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Language</label>
                    <select 
                      value={settings.language} 
                      onChange={(e) => handleSettingChange('language', e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Maximum Response Tokens</label>
                    <input 
                      type="number" 
                      value={settings.maxTokens} 
                      onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value || '0'))} 
                      min={100} 
                      max={4000} 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Cost Warning Threshold</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500 dark:text-gray-400">$</span>
                      <input 
                        type="number" 
                        value={settings.costThreshold} 
                        onChange={(e) => handleSettingChange('costThreshold', parseFloat(e.target.value || '0'))} 
                        min={0.01} 
                        max={10} 
                        step={0.01} 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Default Language Model</label>
                    <select 
                      value={settings.defaultModel} 
                      onChange={(e) => handleSettingChange('defaultModel', e.target.value as any)} 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, cheaper)</option>
                      <option value="local-wasm">Local WASM (Offline, experimental)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">Embedding Model</label>
                    <select 
                      value={settings.embeddingModel} 
                      onChange={(e) => handleSettingChange('embeddingModel', e.target.value as any)} 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="text-embedding-3-small">text-embedding-3-small (Recommended)</option>
                      <option value="local-wasm">Local WASM (Offline, experimental)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">OpenAI API Key</label>
                  <input 
                    type="password" 
                    value={settings.openaiApiKey || ''} 
                    onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)} 
                    placeholder="sk-..." 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <input 
                    type="checkbox" 
                    checked={settings.enableCloudStorage} 
                    onChange={(e) => handleSettingChange('enableCloudStorage', e.target.checked)} 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Enable cloud storage (Supabase)</span>
                </div>
                
                <div className="flex gap-4">
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
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
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
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    📥 Import Data
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 p-6 shadow-2xl">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button 
            id="save-settings" 
            onClick={handleSave} 
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
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
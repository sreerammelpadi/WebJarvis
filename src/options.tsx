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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200/70 dark:border-gray-800/70 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h1 className="text-xl font-semibold">WebCopilot Settings</h1>
            </div>
            <button onClick={() => window.close()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-5">
          {['general','ai','storage','advanced'].map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-full border ${activeTab===id? 'bg-primary-600 text-white border-primary-600':'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur p-5 space-y-6 shadow-sm">
          {activeTab === 'general' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select value={settings.theme} onChange={(e) => handleSettingChange('theme', e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
                  <option value="auto">Auto (follow system)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select value={settings.language} onChange={(e) => handleSettingChange('language', e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Response Tokens</label>
                <input type="number" value={settings.maxTokens} onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value || '0'))} min={100} max={4000} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cost Warning Threshold</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input type="number" value={settings.costThreshold} onChange={(e) => handleSettingChange('costThreshold', parseFloat(e.target.value || '0'))} min={0.01} max={10} step={0.01} className="w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2">Default Language Model</label>
                <select value={settings.defaultModel} onChange={(e) => handleSettingChange('defaultModel', e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
                  <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster, cheaper)</option>
                  <option value="local-wasm">Local WASM (Offline, experimental)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                <input type="password" value={settings.openaiApiKey || ''} onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)} placeholder="sk-..." className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Embedding Model</label>
                <select value={settings.embeddingModel} onChange={(e) => handleSettingChange('embeddingModel', e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800">
                  <option value="text-embedding-3-small">text-embedding-3-small (Recommended)</option>
                  <option value="local-wasm">Local WASM (Offline, experimental)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={settings.enableCloudStorage} onChange={(e) => handleSettingChange('enableCloudStorage', e.target.checked)} />
                  <span>Enable cloud storage (Supabase)</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={async () => {
                  const result = await chrome.storage.local.get(null);
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `webcopilot-export-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url);
                }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">Export</button>
                <button onClick={() => {
                  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
                  input.onchange = async (e: any) => { const f = e.target.files?.[0]; if (!f) return; const text = await f.text(); const data = JSON.parse(text); await chrome.storage.local.set(data); };
                  input.click();
                }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">Import</button>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">Reset All Settings</button>
            </div>
          )}
        </div>
      </main>

      <div className="sticky bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200/70 dark:border-gray-800/70 p-4">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button id="save-settings" onClick={handleSave} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<OptionsPage />); 
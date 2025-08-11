import { openDB } from 'idb';
import { MemoryChunk, ChatMessage, PromptTemplate, UserSettings, PageContent } from '@/types';

export class StorageManager {
  private db: any = null;
  private readonly DB_NAME = 'WebCopilotDB';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade: (db: any) => this.upgradeDatabase(db)
    });
  }

  private upgradeDatabase(db: any): void {
    if (!db.objectStoreNames.contains('memoryChunks')) {
      const store = db.createObjectStore('memoryChunks', { keyPath: 'id' });
      store.createIndex('sourceUrl', 'sourceUrl');
      store.createIndex('tags', 'tags');
      store.createIndex('createdAt', 'createdAt');
    }

    if (!db.objectStoreNames.contains('chatMessages')) {
      const store = db.createObjectStore('chatMessages', { keyPath: 'id' });
      store.createIndex('timestamp', 'timestamp');
      store.createIndex('role', 'role');
    }

    if (!db.objectStoreNames.contains('promptTemplates')) {
      const store = db.createObjectStore('promptTemplates', { keyPath: 'id' });
      store.createIndex('category', 'category');
      store.createIndex('isDefault', 'isDefault');
    }

    if (!db.objectStoreNames.contains('pageContent')) {
      const store = db.createObjectStore('pageContent', { keyPath: 'url' });
      store.createIndex('hash', 'hash');
      store.createIndex('extractedAt', 'extractedAt');
    }

    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'id' });
    }
  }

  async storeMemoryChunks(chunks: MemoryChunk[]): Promise<void> {
    const tx = this.db.transaction('memoryChunks', 'readwrite');
    const store = tx.objectStore('memoryChunks');
    for (const chunk of chunks) await store.put(chunk);
    await tx.done;
  }

  async getMemoryChunksByUrl(sourceUrl: string): Promise<MemoryChunk[]> {
    const tx = this.db.transaction('memoryChunks', 'readonly');
    const index = tx.objectStore('memoryChunks').index('sourceUrl');
    const res = await index.getAll(sourceUrl);
    await tx.done;
    return res as MemoryChunk[];
  }

  async searchMemoryChunksByTags(tags: string[]): Promise<MemoryChunk[]> {
    const tx = this.db.transaction('memoryChunks', 'readonly');
    const all = (await tx.objectStore('memoryChunks').getAll()) as MemoryChunk[];
    await tx.done;
    return all.filter((c) => tags.some((t) => c.tags.includes(t)));
  }

  async getAllMemoryChunks(): Promise<MemoryChunk[]> {
    const tx = this.db.transaction('memoryChunks', 'readonly');
    const res = (await tx.objectStore('memoryChunks').getAll()) as MemoryChunk[];
    await tx.done;
    return res;
  }

  async deleteMemoryChunksByUrl(sourceUrl: string): Promise<void> {
    const chunks = await this.getMemoryChunksByUrl(sourceUrl);
    const tx = this.db.transaction('memoryChunks', 'readwrite');
    const store = tx.objectStore('memoryChunks');
    for (const c of chunks) await store.delete(c.id);
    await tx.done;
  }

  async storeChatMessage(message: ChatMessage): Promise<void> {
    const tx = this.db.transaction('chatMessages', 'readwrite');
    await tx.objectStore('chatMessages').put(message);
    await tx.done;
  }

  async getChatMessages(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const tx = this.db.transaction('chatMessages', 'readonly');
    const res = (await tx.objectStore('chatMessages').getAll()) as ChatMessage[];
    await tx.done;
    return res.sort((a, b) => b.timestamp - a.timestamp).slice(offset, offset + limit);
  }

  async clearChatHistory(): Promise<void> {
    const tx = this.db.transaction('chatMessages', 'readwrite');
    await tx.objectStore('chatMessages').clear();
    await tx.done;
  }

  async storePromptTemplate(template: PromptTemplate): Promise<void> {
    const tx = this.db.transaction('promptTemplates', 'readwrite');
    await tx.objectStore('promptTemplates').put(template);
    await tx.done;
  }

  async getPromptTemplatesByCategory(category: PromptTemplate['category']): Promise<PromptTemplate[]> {
    const tx = this.db.transaction('promptTemplates', 'readonly');
    const index = tx.objectStore('promptTemplates').index('category');
    const res = (await index.getAll(category)) as PromptTemplate[];
    await tx.done;
    return res;
  }

  async getAllPromptTemplates(): Promise<PromptTemplate[]> {
    const tx = this.db.transaction('promptTemplates', 'readonly');
    const res = (await tx.objectStore('promptTemplates').getAll()) as PromptTemplate[];
    await tx.done;
    return res;
  }

  async deletePromptTemplate(id: string): Promise<void> {
    const tx = this.db.transaction('promptTemplates', 'readwrite');
    await tx.objectStore('promptTemplates').delete(id);
    await tx.done;
  }

  async storePageContent(content: PageContent): Promise<void> {
    const tx = this.db.transaction('pageContent', 'readwrite');
    await tx.objectStore('pageContent').put(content);
    await tx.done;
  }

  async getPageContent(url: string): Promise<PageContent | undefined> {
    const tx = this.db.transaction('pageContent', 'readonly');
    const res = (await tx.objectStore('pageContent').get(url)) as PageContent | undefined;
    await tx.done;
    return res;
  }

  async storeSettings(settings: UserSettings): Promise<void> {
    const tx = this.db.transaction('settings', 'readwrite');
    await tx.objectStore('settings').put({ id: 'userSettings', ...settings });
    await tx.done;
  }

  async getSettings(): Promise<UserSettings | null> {
    const tx = this.db.transaction('settings', 'readonly');
    const res = (await tx.objectStore('settings').get('userSettings')) as UserSettings | null;
    await tx.done;
    return res || null;
  }

  async exportData(): Promise<string> {
    const data = {
      memoryChunks: await this.getAllMemoryChunks(),
      chatMessages: await this.getChatMessages(1000, 0),
      promptTemplates: await this.getAllPromptTemplates(),
      settings: await this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    if (data.memoryChunks) await this.storeMemoryChunks(data.memoryChunks);
    if (data.chatMessages) for (const m of data.chatMessages) await this.storeChatMessage(m);
    if (data.promptTemplates) for (const t of data.promptTemplates) await this.storePromptTemplate(t);
    if (data.settings) await this.storeSettings(data.settings);
  }

  async clearAllData(): Promise<void> {
    for (const storeName of ['memoryChunks', 'chatMessages', 'promptTemplates', 'pageContent', 'settings']) {
      const tx = this.db.transaction(storeName, 'readwrite');
      await tx.objectStore(storeName).clear();
      await tx.done;
    }
  }

  async getStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    for (const storeName of ['memoryChunks', 'chatMessages', 'promptTemplates', 'pageContent']) {
      const tx = this.db.transaction(storeName, 'readonly');
      stats[storeName] = await tx.objectStore(storeName).count();
      await tx.done;
    }
    return stats;
  }

  async close(): Promise<void> {
    if (this.db) this.db.close();
    this.db = null;
  }
} 
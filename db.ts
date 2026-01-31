
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { InvoiceProject, Seller, Consignee, ProductPreset, KnowledgeBase, CustomRule } from './types';

interface DSPDB extends DBSchema {
  projects: { key: string; value: InvoiceProject };
  sellers: { key: string; value: Seller };
  consignees: { key: string; value: Consignee };
  presets: { key: string; value: ProductPreset };
  knowledgeBase: { key: string; value: KnowledgeBase };
  customRules: { key: string; value: CustomRule };
  backups: { key: string; value: { id: string; timestamp: string; label: string; data: InvoiceProject[] } };
}

const DB_NAME = 'DocuStationProDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DSPDB>> | null = null;

export const initDB = async () => {
  // 如果连接已存在但已关闭或正在关闭，重置它
  if (dbPromise) {
    try {
      const db = await dbPromise;
      // 检查底层连接是否有效
    } catch (e) {
      dbPromise = null;
    }
  }

  if (!dbPromise) {
    dbPromise = openDB<DSPDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('sellers')) db.createObjectStore('sellers', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('consignees')) db.createObjectStore('consignees', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('knowledgeBase')) db.createObjectStore('knowledgeBase');
        if (!db.objectStoreNames.contains('customRules')) db.createObjectStore('customRules', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id' });
      },
    });
    
    const dbInstance = await dbPromise;
    // 监听意外关闭
    dbInstance.onclose = () => {
        dbPromise = null;
    };
    await migrateData(dbInstance);
  }
  return dbPromise;
};

async function migrateData(db: IDBPDatabase<DSPDB>) {
  if (localStorage.getItem('dsp_db_migrated_v1')) return;
  const migrateStore = async (lsKey: string, storeName: any) => {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) {
          const tx = db.transaction(storeName, 'readwrite');
          await Promise.all(items.map((i: any) => tx.store.put(i)));
          await tx.done;
        }
      } catch (e) { console.error(`Migration failed for ${lsKey}`, e); }
    }
  };
  await migrateStore('dsp_projects', 'projects');
  await migrateStore('savedSellers', 'sellers');
  await migrateStore('savedConsignees', 'consignees');
  await migrateStore('savedProductPresets', 'presets');
  await migrateStore('dsp_custom_rules', 'customRules');
  await migrateStore('dsp_backups', 'backups');
  const rawKB = localStorage.getItem('dsp_knowledge_base');
  if (rawKB) {
    try {
      const kb = JSON.parse(rawKB);
      await db.put('knowledgeBase', kb, 'main');
    } catch (e) { console.error('Migration failed for KB', e); }
  }
  localStorage.setItem('dsp_db_migrated_v1', 'true');
  localStorage.removeItem('dsp_projects');
  localStorage.removeItem('savedSellers');
  localStorage.removeItem('savedConsignees');
  localStorage.removeItem('savedProductPresets');
  localStorage.removeItem('dsp_knowledge_base');
  localStorage.removeItem('dsp_custom_rules');
  localStorage.removeItem('dsp_backups');
}

const withRetry = async <T>(fn: (db: IDBPDatabase<DSPDB>) => Promise<T>): Promise<T> => {
    try {
        const database = await initDB();
        return await fn(database);
    } catch (error: any) {
        // 如果连接失效或正在关闭，重置 Promise 并重试一次
        if (error.name === 'InvalidStateError' || error.message?.includes('closing') || error.message?.includes('closed')) {
            console.warn('[DB] Connection lost or closing, attempting reconnection...', error.message);
            dbPromise = null;
            const database = await initDB();
            return await fn(database);
        }
        throw error;
    }
};

export const db = {
  projects: {
    getAll: () => withRetry(db => db.getAll('projects')),
    saveAll: (items: InvoiceProject[]) => withRetry(async db => {
      const tx = db.transaction('projects', 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    })
  },
  sellers: {
    getAll: () => withRetry(db => db.getAll('sellers')),
    saveAll: (items: Seller[]) => withRetry(async db => {
      const tx = db.transaction('sellers', 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    })
  },
  consignees: {
    getAll: () => withRetry(db => db.getAll('consignees')),
    saveAll: (items: Consignee[]) => withRetry(async db => {
      const tx = db.transaction('consignees', 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    })
  },
  presets: {
    getAll: () => withRetry(db => db.getAll('presets')),
    saveAll: (items: ProductPreset[]) => withRetry(async db => {
      const tx = db.transaction('presets', 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    })
  },
  knowledgeBase: {
    get: () => withRetry(db => db.get('knowledgeBase', 'main')),
    save: (kb: KnowledgeBase) => withRetry(db => db.put('knowledgeBase', kb, 'main')),
  },
  customRules: {
    getAll: () => withRetry(db => db.getAll('customRules')),
    saveAll: (items: CustomRule[]) => withRetry(async db => {
      const tx = db.transaction('customRules', 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    })
  },
  backups: {
    getAll: () => withRetry(db => db.getAll('backups')),
    saveAll: (items: any[]) => withRetry(async db => {
      const tx = db.transaction('backups', 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    })
  }
};

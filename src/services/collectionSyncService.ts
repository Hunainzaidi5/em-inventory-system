import { FirebaseService } from '@/lib/firebaseService';

type SupportedKey =
  | 'inventoryItems'
  | 'toolsItems'
  | 'generalToolsItems'
  | 'ppeItems'
  | 'stationeryItems'
  | 'faultyReturns';

interface DatasetDoc<T = any> {
  id?: string;
  items: T[];
  updated_at: string;
}

async function hydrate(key: SupportedKey): Promise<void> {
  try {
    const doc = await FirebaseService.getById('datasets', key);
    if (doc && Array.isArray((doc as any).items)) {
      const items = (doc as any).items;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(items));
        window.dispatchEvent(new Event('inventory-sync'));
      }
    }
  } catch (e) {
    // ignore
  }
}

async function persist<T = any>(key: SupportedKey, items: T[]): Promise<void> {
  try {
    const payload: DatasetDoc<T> = {
      items: items || [],
      updated_at: new Date().toISOString(),
    };
    await FirebaseService.upsert('datasets', key, payload as any);
  } catch (e) {
    console.error('Failed to persist dataset', key, e);
  }
}

export const collectionSyncService = {
  hydrate,
  persist,
  async hydrateAll(): Promise<void> {
    await Promise.all([
      hydrate('inventoryItems'),
      hydrate('toolsItems'),
      hydrate('generalToolsItems'),
      hydrate('ppeItems'),
      hydrate('stationeryItems'),
      hydrate('faultyReturns'),
    ]);
  },
};

export default collectionSyncService;



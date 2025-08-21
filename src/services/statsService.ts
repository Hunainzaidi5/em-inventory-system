import { spareService } from '@/services/spareService';

/**
 * Stats service aggregates counts from various modules used across the app.
 * Some modules are persisted in Firestore (e.g., spare parts),
 * others currently use localStorage (e.g., tools, PPE, faulty returns, stationery, general tools).
 */
export interface DashboardCounts {
  sparePartsTotalQuantity: number;
  toolsTotalQuantity: number;
  generalToolsTotalQuantity: number;
  ppeTotalQuantity: number;
  stationeryTotalQuantity: number;
  faultyItemsCount: number;
  inventoryItemsTotalQuantity: number;
}

function sumQuantityFromLocalStorage(key: string, quantityKeys: string[]): number {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (!raw) return 0;
    const list = JSON.parse(raw) as Array<Record<string, any>>;
    return (list || []).reduce((acc, item) => {
      for (const qk of quantityKeys) {
        if (typeof item[qk] === 'number') {
          return acc + (item[qk] as number);
        }
      }
      return acc;
    }, 0);
  } catch {
    return 0;
  }
}

function countItemsFromLocalStorage(key: string): number {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (!raw) return 0;
    const list = JSON.parse(raw) as Array<Record<string, any>>;
    return (list || []).length;
  } catch {
    return 0;
  }
}

export const statsService = {
  async getDashboardCounts(): Promise<DashboardCounts> {
    // Spare parts: sum quantity from Firestore
    let sparePartsTotalQuantity = 0;
    try {
      const spareParts = await spareService.getAllSpareParts();
      sparePartsTotalQuantity = (spareParts || []).reduce((acc, p: any) => acc + Number(p?.quantity ?? 0), 0);
    } catch {
      sparePartsTotalQuantity = 0;
    }

    // Tools and General Tools: localStorage
    const toolsTotalQuantity = sumQuantityFromLocalStorage('toolsItems', ['quantity', 'qty', 'available', 'stock']);
    const generalToolsTotalQuantity = sumQuantityFromLocalStorage('generalToolsItems', ['quantity', 'qty', 'available', 'stock']);

    // PPE: localStorage
    const ppeTotalQuantity = sumQuantityFromLocalStorage('ppeItems', ['quantity', 'availableQuantity', 'available', 'stock']);

    // Stationery: localStorage
    const stationeryTotalQuantity = sumQuantityFromLocalStorage('stationeryItems', ['quantity', 'available', 'stock']);

    // Faulty: count records (each record is an issue)
    const faultyItemsCount = countItemsFromLocalStorage('faultyReturns');

    // Inventory (generic inventory module if used via localStorage)
    const inventoryItemsTotalQuantity = sumQuantityFromLocalStorage('inventoryItems', ['current_stock', 'quantity', 'available', 'stock']);

    return {
      sparePartsTotalQuantity,
      toolsTotalQuantity,
      generalToolsTotalQuantity,
      ppeTotalQuantity,
      stationeryTotalQuantity,
      faultyItemsCount,
      inventoryItemsTotalQuantity,
    };
  },
};

export default statsService;



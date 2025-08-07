import { LowStockItem, UrgencyLevel } from "@/components/dashboard/LowStockAlert";

declare module "@/services/inventoryService" {
  export interface InventoryItem extends LowStockItem {
    id: string;
    averageDailyUsage?: number;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
    imageUrl?: string;
    supplier?: string;
    reorderPoint: number;
    unit: string;
    status: 'active' | 'inactive' | 'discontinued';
  }

  export function getLowStockItems(): Promise<LowStockItem[]>;
  export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem>;
  export function getInventoryItem(id: string): Promise<InventoryItem | null>;
  export function createInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem>;
}

import { FirebaseService } from "@/lib/firebaseService";
import { LowStockItem } from "@/components/dashboard/LowStockAlert";
import { where, orderBy } from "firebase/firestore";

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  location?: string;
  supplier?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryUpdate {
  item_id: string;
  quantity_change: number;
  reason: string;
  user_id: string;
  timestamp: string;
}

export const inventoryService = {
  // Get all inventory items
  async getAllItems(): Promise<InventoryItem[]> {
    try {
      const items = await FirebaseService.query('inventory');
      return items as InventoryItem[];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw new Error('Failed to fetch inventory items');
    }
  },

  // Get low stock items
  async getLowStockItems(): Promise<LowStockItem[]> {
    try {
      // For now, fetch all items and filter client-side
      // In production, consider using a composite index for this query
      const items = await FirebaseService.query('inventory');
      
      const lowStockItems = items.filter((item: any) => 
        item.current_stock <= item.min_stock
      );
      
      return lowStockItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category || 'Unknown',
        currentStock: item.current_stock,
        minStock: item.min_stock,
        location: item.location || 'Unknown',
        unit: item.unit
      })) as LowStockItem[];
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw new Error('Failed to fetch low stock items');
    }
  },

  // Get item by ID
  async getItemById(itemId: string): Promise<InventoryItem | null> {
    try {
      const item = await FirebaseService.getById('inventory', itemId);
      return item as InventoryItem;
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      return null;
    }
  },

  // Create new item
  async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    try {
      const itemId = await FirebaseService.create('inventory', {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Return the created item with the ID
      return { ...item, id: itemId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as InventoryItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw new Error('Failed to create inventory item');
    }
  },

  // Update item
  async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      await FirebaseService.update('inventory', itemId, {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw new Error('Failed to update inventory item');
    }
  },

  // Delete item
  async deleteItem(itemId: string): Promise<void> {
    try {
      await FirebaseService.delete('inventory', itemId);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw new Error('Failed to delete inventory item');
    }
  },

  // Update stock quantity
  async updateStock(itemId: string, quantityChange: number, reason: string, userId: string): Promise<void> {
    try {
      const item = await this.getItemById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      const newStock = item.current_stock + quantityChange;
      if (newStock < 0) {
        throw new Error('Stock cannot go below 0');
      }

      // Update inventory item
      await this.updateItem(itemId, { current_stock: newStock });

      // Log the update
      await FirebaseService.create('inventoryUpdates', {
        item_id: itemId,
        quantity_change: quantityChange,
        reason,
        user_id: userId,
        timestamp: new Date().toISOString(),
        previous_stock: item.current_stock,
        new_stock: newStock
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Search items
  async searchItems(query: string): Promise<InventoryItem[]> {
    try {
      // Firebase doesn't support full-text search out of the box
      // For now, we'll fetch all items and filter client-side
      // In production, consider using Algolia or similar service
      const allItems = await this.getAllItems();
      const searchTerm = query.toLowerCase();
      
      return allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching items:', error);
      throw new Error('Failed to search items');
    }
  },

  // Get items by category
  async getItemsByCategory(category: string): Promise<InventoryItem[]> {
    try {
      // For now, fetch all items and filter client-side
      // In production, consider using a composite index for this query
      const allItems = await FirebaseService.query('inventory');
      return allItems.filter((item: any) => item.category === category) as InventoryItem[];
    } catch (error) {
      console.error('Error fetching items by category:', error);
      throw new Error('Failed to fetch items by category');
    }
  }
};

export default inventoryService;

// src/services/spareService.ts
import { FirebaseService } from '../lib/firebaseService';
import { SparePart } from '../types/spareTypes';

export interface CreateSparePartData {
  name: string;
  quantity: number;
  location: string;
  itemCode?: string;
  imis_code?: string;
  uom?: string;
  partNumber?: string;
  boq_number?: string;
  belongsto?: string;
  category?: string;
}

export const spareService = {
  // Get all spare parts
  async getAllSpareParts(): Promise<SparePart[]> {
    try {
      const spareParts = await FirebaseService.query('spareParts');
      return spareParts as SparePart[];
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      throw new Error('Failed to fetch spare parts');
    }
  },

  // Get spare part by ID
  async getSparePartById(id: string): Promise<SparePart | null> {
    try {
      const sparePart = await FirebaseService.getById('spareParts', id);
      return sparePart as SparePart;
    } catch (error) {
      console.error('Error fetching spare part by ID:', error);
      return null;
    }
  },

  // Create new spare part
  async createSparePart(data: CreateSparePartData): Promise<SparePart> {
    try {
      const sparePartId = await FirebaseService.create('spareParts', {
        ...data,
        lastUpdated: new Date().toISOString()
      });

      // Return the created spare part
      return {
        id: sparePartId,
        ...data,
        lastUpdated: new Date().toISOString()
      } as SparePart;
    } catch (error) {
      console.error('Error creating spare part:', error);
      throw new Error('Failed to create spare part');
    }
  },

  // Update spare part
  async updateSparePart(id: string, updates: Partial<SparePart>): Promise<void> {
    try {
      await FirebaseService.update('spareParts', id, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating spare part:', error);
      throw new Error('Failed to update spare part');
    }
  },

  // Delete spare part
  async deleteSparePart(id: string): Promise<void> {
    try {
      await FirebaseService.delete('spareParts', id);
    } catch (error) {
      console.error('Error deleting spare part:', error);
      throw new Error('Failed to delete spare part');
    }
  },

  // Get spare parts by category
  async getSparePartsByCategory(category: string): Promise<SparePart[]> {
    try {
      const allSpareParts = await this.getAllSpareParts();
      return allSpareParts.filter(part => part.category === category);
    } catch (error) {
      console.error('Error fetching spare parts by category:', error);
      throw new Error('Failed to fetch spare parts by category');
    }
  },

  // Get low stock spare parts
  async getLowStockSpareParts(): Promise<SparePart[]> {
    try {
      const allSpareParts = await this.getAllSpareParts();
      return allSpareParts.filter(part => part.quantity <= 0);
    } catch (error) {
      console.error('Error fetching low stock spare parts:', error);
      throw new Error('Failed to fetch low stock spare parts');
    }
  },

  // Search spare parts
  async searchSpareParts(query: string): Promise<SparePart[]> {
    try {
      const allSpareParts = await this.getAllSpareParts();
      const searchTerm = query.toLowerCase();
      
      return allSpareParts.filter(part => 
        part.name.toLowerCase().includes(searchTerm) ||
        part.partNumber?.toLowerCase().includes(searchTerm) ||
        part.itemCode?.toLowerCase().includes(searchTerm) ||
        part.imis_code?.toLowerCase().includes(searchTerm) ||
        part.category?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching spare parts:', error);
      throw new Error('Failed to search spare parts');
    }
  },

  // Update stock quantity
  async updateStock(id: string, quantityChange: number, reason: string, userId: string): Promise<void> {
    try {
      const sparePart = await this.getSparePartById(id);
      if (!sparePart) {
        throw new Error('Spare part not found');
      }

      const newStock = sparePart.quantity + quantityChange;
      if (newStock < 0) {
        throw new Error('Stock cannot go below 0');
      }

      // Update spare part stock
      await this.updateSparePart(id, { quantity: newStock });

      // Log the update
      await FirebaseService.create('sparePartUpdates', {
        spare_part_id: id,
        quantity_change: quantityChange,
        reason,
        user_id: userId,
        timestamp: new Date().toISOString(),
        previous_stock: sparePart.quantity,
        new_stock: newStock
      });
    } catch (error) {
      console.error('Error updating spare part stock:', error);
      throw error;
    }
  },

  // Subscribe to spare part changes
  subscribeToSpareParts(callback: (spareParts: SparePart[]) => void) {
    // Firebase doesn't have real-time subscriptions in the same way as Supabase
    // For now, we'll return a simple unsubscribe function
    // In production, consider using onSnapshot from Firestore
    return {
      subscription: {
        unsubscribe: () => {
          console.log('Spare parts subscription removed');
        }
      }
    };
  }
};

export default spareService;

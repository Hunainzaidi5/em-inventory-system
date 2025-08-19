import { FirebaseService } from '@/lib/firebaseService';

export type RequisitionType = 'issue' | 'return' | 'consume';

export interface ItemQuantityUpdate {
  id: string;
  item_id: string;
  quantity_change: number;
  type: RequisitionType;
  reason: string;
  user_id: string;
  timestamp: string;
  previous_quantity: number;
  new_quantity: number;
  location?: string;
  department?: string;
  notes?: string;
}

export interface CreateItemQuantityUpdateData {
  item_id: string;
  quantity_change: number;
  type: RequisitionType;
  reason: string;
  user_id: string;
  location?: string;
  department?: string;
  notes?: string;
}

export const itemQuantityService = {
  // Get all quantity updates
  async getAllQuantityUpdates(): Promise<ItemQuantityUpdate[]> {
    try {
      const updates = await FirebaseService.query('itemQuantityUpdates');
      return updates as ItemQuantityUpdate[];
    } catch (error) {
      console.error('Error fetching quantity updates:', error);
      throw new Error('Failed to fetch quantity updates');
    }
  },

  // Get quantity updates by item
  async getQuantityUpdatesByItem(itemId: string): Promise<ItemQuantityUpdate[]> {
    try {
      const allUpdates = await this.getAllQuantityUpdates();
      return allUpdates.filter(update => update.item_id === itemId);
    } catch (error) {
      console.error('Error fetching quantity updates by item:', error);
      throw new Error('Failed to fetch quantity updates by item');
    }
  },

  // Get quantity updates by user
  async getQuantityUpdatesByUser(userId: string): Promise<ItemQuantityUpdate[]> {
    try {
      const allUpdates = await this.getAllQuantityUpdates();
      return allUpdates.filter(update => update.user_id === userId);
    } catch (error) {
      console.error('Error fetching quantity updates by user:', error);
      throw new Error('Failed to fetch quantity updates by user');
    }
  },

  // Create new quantity update
  async createQuantityUpdate(data: CreateItemQuantityUpdateData): Promise<ItemQuantityUpdate> {
    try {
      // Get current item quantity
      const item = await FirebaseService.getById('inventory', data.item_id);
      if (!item) {
        throw new Error('Item not found');
      }

      const currentQuantity = (item as any).current_stock || 0;
      const newQuantity = currentQuantity + data.quantity_change;

      if (newQuantity < 0) {
        throw new Error('Quantity cannot go below 0');
      }

      // Update item quantity
      await FirebaseService.update('inventory', data.item_id, {
        current_stock: newQuantity,
        updated_at: new Date().toISOString()
      });

      // Create quantity update record
      const updateId = await FirebaseService.create('itemQuantityUpdates', {
        ...data,
        timestamp: new Date().toISOString(),
        previous_quantity: currentQuantity,
        new_quantity: newQuantity
      });

      // Return the created update
      return {
        id: updateId,
        ...data,
        timestamp: new Date().toISOString(),
        previous_quantity: currentQuantity,
        new_quantity: newQuantity
      } as ItemQuantityUpdate;
    } catch (error) {
      console.error('Error creating quantity update:', error);
      throw error;
    }
  },

  // Get quantity update by ID
  async getQuantityUpdateById(id: string): Promise<ItemQuantityUpdate | null> {
    try {
      const update = await FirebaseService.getById('itemQuantityUpdates', id);
      return update as ItemQuantityUpdate;
    } catch (error) {
      console.error('Error fetching quantity update by ID:', error);
      return null;
    }
  },

  // Update quantity update
  async updateQuantityUpdate(id: string, updates: Partial<ItemQuantityUpdate>): Promise<void> {
    try {
      await FirebaseService.update('itemQuantityUpdates', id, updates);
    } catch (error) {
      console.error('Error updating quantity update:', error);
      throw new Error('Failed to update quantity update');
    }
  },

  // Delete quantity update
  async deleteQuantityUpdate(id: string): Promise<void> {
    try {
      await FirebaseService.delete('itemQuantityUpdates', id);
    } catch (error) {
      console.error('Error deleting quantity update:', error);
      throw new Error('Failed to delete quantity update');
    }
  },

  // Get quantity updates by type
  async getQuantityUpdatesByType(type: RequisitionType): Promise<ItemQuantityUpdate[]> {
    try {
      const allUpdates = await this.getAllQuantityUpdates();
      return allUpdates.filter(update => update.type === type);
    } catch (error) {
      console.error('Error fetching quantity updates by type:', error);
      throw new Error('Failed to fetch quantity updates by type');
    }
  },

  // Search quantity updates
  async searchQuantityUpdates(query: string): Promise<ItemQuantityUpdate[]> {
    try {
      const allUpdates = await this.getAllQuantityUpdates();
      const searchTerm = query.toLowerCase();
      
      return allUpdates.filter(update => 
        update.reason.toLowerCase().includes(searchTerm) ||
        update.notes?.toLowerCase().includes(searchTerm) ||
        update.location?.toLowerCase().includes(searchTerm) ||
        update.department?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching quantity updates:', error);
      throw new Error('Failed to search quantity updates');
    }
  },

  // Get quantity updates in date range
  async getQuantityUpdatesInDateRange(startDate: Date, endDate: Date): Promise<ItemQuantityUpdate[]> {
    try {
      const allUpdates = await this.getAllQuantityUpdates();
      const start = startDate.getTime();
      const end = endDate.getTime();
      
      return allUpdates.filter(update => {
        const updateTime = new Date(update.timestamp).getTime();
        return updateTime >= start && updateTime <= end;
      });
    } catch (error) {
      console.error('Error fetching quantity updates in date range:', error);
      throw new Error('Failed to fetch quantity updates in date range');
    }
  }
};

export default itemQuantityService; 
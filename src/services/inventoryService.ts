import { supabase } from "@/lib/supabase";
import { LowStockItem } from "@/components/dashboard/LowStockAlert";

export interface InventoryItem extends Omit<LowStockItem, 'daysUntilStockout' | 'percentage' | 'urgency'> {
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

export const getLowStockItems = async (): Promise<LowStockItem[]> => {
  try {
    // Get all items that are below their reorder point
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .lte('current_stock', supabase.rpc('get_reorder_point', { p_item_id: 'id' }))
      .order('current_stock', { ascending: true });

    if (error) throw error;

    // Transform the data to match our frontend types
    return items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.current_stock,
      minStock: item.min_stock || item.reorder_point || 0,
      location: item.location || 'Unknown',
      partNumber: item.part_number,
      lastUpdated: item.updated_at,
      averageDailyUsage: item.average_daily_usage,
    }));
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

export const getInventoryItem = async (id: string): Promise<InventoryItem | null> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return null;
  }
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

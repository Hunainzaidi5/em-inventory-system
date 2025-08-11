// src/services/spareService.ts
import { supabase } from '../lib/supabase';
import { SparePart } from '../types/spareTypes';

const TABLE_NAME = 'spare_parts';

export const getSpareParts = async (category?: string) => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as SparePart[];
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    throw error;
  }
};

export const addSparePart = async (part: Omit<SparePart, 'id' | 'lastUpdated'>) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        ...part,
        last_updated: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data?.[0] as SparePart;
  } catch (error) {
    console.error('Error adding spare part:', error);
    throw error;
  }
};

export const updateSparePart = async (id: string, updates: Partial<SparePart>) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] as SparePart;
  } catch (error) {
    console.error('Error updating spare part:', error);
    throw error;
  }
};

export const deleteSparePart = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting spare part:', error);
    throw error;
  }
};

export const subscribeToSpareParts = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('spare_parts_changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: TABLE_NAME 
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

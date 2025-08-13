import { supabase } from '@/lib/supabase';

type RequisitionType = 'issue' | 'return' | 'consume';
type ItemType = 'inventory' | 'tool' | 'ppe' | 'stationery' | 'faulty_return' | 'general_tools' | 'spare_management';
type StatusType = 'completed' | 'pending' | 'overdue';

export interface Requisition {
  id: string;
  requisitionType: RequisitionType;
  itemType: ItemType;
  itemName: string;
  quantity: number;
  issuedTo: string;
  department: 'em_systems' | 'em_track' | 'em_power' | 'em_signalling' | 'em_communication' | 'em_third_rail' | 'em_safety_quality' | 'all';
  referenceNumber: string;
  createdAt: string;
  status: StatusType;
  location: 'Depot' | 'Station 1' | 'Station 2' | 'Station 3' | 'Station 4' | 'Station 5' | 'Station 6' | 'Station 7' | 'Station 8' | 'Station 9' | 'Station 10' | 'Station 11' | 'Station 12' | 'Station 13' | 'Station 14' | 'Station 15' | 'Station 16' | 'Station 17' | 'Station 18' | 'Station 19' | 'Station 20' | 'Station 21' | 'Station 22' | 'Station 23' | 'Station 24' | 'Station 25' | 'Station 26' | 'Stabling Yard' | 'all';
  notes?: string;
}

export interface RequisitionFormData extends Omit<Requisition, 'id' | 'createdAt' | 'referenceNumber' | 'status'> {
  id?: string;
  location: 'Depot' | 'Station 1' | 'Station 2' | 'Station 3' | 'Station 4' | 'Station 5' | 'Station 6' | 'Station 7' | 'Station 8' | 'Station 9' | 'Station 10' | 'Station 11' | 'Station 12' | 'Station 13' | 'Station 14' | 'Station 15' | 'Station 16' | 'Station 17' | 'Station 18' | 'Station 19' | 'Station 20' | 'Station 21' | 'Station 22' | 'Station 23' | 'Station 24' | 'Station 25' | 'Station 26' | 'Stabling Yard' | 'all';
}

export const getRequisitions = async () => {
  const { data, error } = await supabase
    .from('requisitions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching requisitions:', error);
    throw error;
  }

  return data as Requisition[];
};

export const createRequisition = async (requisition: Omit<RequisitionFormData, 'id'>) => {
  const { data, error } = await supabase
    .from('requisitions')
    .insert([{
      ...requisition,
      status: 'pending', // Default status
      created_at: new Date().toISOString(),
      reference_number: `TRX-${Date.now()}` // Simple reference number
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating requisition:', error);
    throw error;
  }

  return data as Requisition;
};

export const updateRequisition = async (id: string, updates: Partial<RequisitionFormData>) => {
  const { data, error } = await supabase
    .from('requisitions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating requisition:', error);
    throw error;
  }

  return data as Requisition;
};

export const deleteRequisition = async (id: string) => {
  const { error } = await supabase
    .from('requisitions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting requisition:', error);
    throw error;
  }
};

// Subscribe to requisition changes
export const subscribeToRequisitions = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('requisitions-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requisitions' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

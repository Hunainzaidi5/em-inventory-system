import { supabase } from '@/lib/supabase';

type RequisitionType = 'issue' | 'return' | 'consume';
type ItemType = 'inventory' | 'tool' | 'ppe' | 'stationery' | 'faulty_return' | 'general_tools' | 'spare_management';
type StatusType = 'completed' | 'pending' | 'overdue' | 'cancelled';

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

function toCamel(row: any): Requisition {
  return {
    id: row.id,
    requisitionType: row.requisition_type ?? row.requisitionType,
    itemType: row.item_type ?? row.itemType,
    itemName: row.item_name ?? row.itemName,
    quantity: row.quantity,
    issuedTo: row.issued_to ?? row.issuedTo,
    department: row.department,
    referenceNumber: row.reference_number ?? row.referenceNumber,
    createdAt: row.created_at ?? row.createdAt,
    status: row.status,
    location: row.location ?? row.location,
    notes: row.notes ?? undefined,
  } as Requisition;
}

function toSnake(payload: Omit<RequisitionFormData, 'id'> | Partial<RequisitionFormData>) {
  const p: any = payload;
  const out: any = {};
  if (p.requisitionType) out.requisition_type = p.requisitionType;
  if (p.itemType) out.item_type = p.itemType;
  if (p.itemName) out.item_name = p.itemName;
  if (typeof p.quantity === 'number') out.quantity = p.quantity;
  if (p.issuedTo) out.issued_to = p.issuedTo;
  if (p.department) out.department = p.department;
  if (p.location) out.location = p.location;
  if (p.notes !== undefined) out.notes = p.notes;
  return out;
}

export const getRequisitions = async (): Promise<Requisition[]> => {
  const { data, error } = await supabase
    .from('requisition')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Table missing (42P01) -> graceful fallback
    if ((error as any).code === '42P01') {
      console.warn('[requisitionService] Table requisition not found. Run the SQL to create it.');
      return [];
    }
    console.error('Error fetching requisitions:', error);
    throw error;
  }

  return (data || []).map(toCamel);
};

export const createRequisition = async (requisition: Omit<RequisitionFormData, 'id'>): Promise<Requisition> => {
  const snake = toSnake(requisition) as any;
  const row = {
    requisition_type: snake.requisition_type,
    item_type: snake.item_type,
    item_name: snake.item_name,
    quantity: snake.quantity,
    issued_to: snake.issued_to,
    department: snake.department,
    location: snake.location,
    notes: snake.notes,
    status: 'pending',
    created_at: new Date().toISOString(),
    reference_number: `TRX-${Date.now()}`,
  } as const;
  const { data, error } = await supabase
    .from('requisition')
    .insert([row])
    .select()
    .single();

  if (error) {
    if ((error as any).code === '42P01') {
      console.error('[requisitionService] Table requisition not found.');
    } else {
      console.error('Error creating requisition:', error);
    }
    throw error;
  }

  return toCamel(data);
};

export const updateRequisition = async (id: string, updates: Partial<RequisitionFormData>): Promise<Requisition> => {
  const snake = toSnake(updates) as any;
  const row: any = {};
  if (snake.requisition_type !== undefined) row.requisition_type = snake.requisition_type;
  if (snake.item_type !== undefined) row.item_type = snake.item_type;
  if (snake.item_name !== undefined) row.item_name = snake.item_name;
  if (snake.quantity !== undefined) row.quantity = snake.quantity;
  if (snake.issued_to !== undefined) row.issued_to = snake.issued_to;
  if (snake.department !== undefined) row.department = snake.department;
  if (snake.location !== undefined) row.location = snake.location;
  if (snake.notes !== undefined) row.notes = snake.notes;
  const { data, error } = await supabase
    .from('requisition')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if ((error as any).code === '42P01') {
      console.error('[requisitionService] Table requisition not found.');
    } else {
      console.error('Error updating requisition:', error);
    }
    throw error;
  }

  return toCamel(data);
};

export const deleteRequisition = async (id: string) => {
  const { error } = await supabase
    .from('requisition')
    .delete()
    .eq('id', id);

  if (error) {
    if ((error as any).code === '42P01') {
      console.error('[requisitionService] Table requisition not found.');
      return;
    }
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
      { event: '*', schema: 'public', table: 'requisition' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

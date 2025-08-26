import { FirebaseService } from '@/lib/firebaseService';

export interface IRItem {
  itemCode?: string;
  itemDescription: string;
  unit: string;
  quantity: number;
  remarks?: string;
}

export interface IssuanceRequisitionRecord {
  id?: string;
  requisitionNumber: string;
  department: string;
  requestDate?: string;
  requiredDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  items: IRItem[];
  created_at?: string;
  updated_at?: string;
}

export const issuanceRequisitionService = {
  async list(): Promise<IssuanceRequisitionRecord[]> {
    const rows = await FirebaseService.query('issuanceRequisitions');
    return rows as IssuanceRequisitionRecord[];
  },

  async create(record: Omit<IssuanceRequisitionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = await FirebaseService.create('issuanceRequisitions', {
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return id as string;
  },

  async update(id: string, updates: Partial<IssuanceRequisitionRecord>): Promise<void> {
    await FirebaseService.update('issuanceRequisitions', id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }
};

export default issuanceRequisitionService;



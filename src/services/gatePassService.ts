import { FirebaseService } from '@/lib/firebaseService';

export interface GatePassRecord {
  id: string;
  requisition_id: string;
  passNumber: string;
  requesterName?: string;
  department?: string;
  destination?: string;
  purpose?: string;
  itemsDescription?: string;
  quantitySummary?: string;
  expectedReturnDate?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  notes?: string;
  receiver?: { name?: string; department?: string; sign?: string; instructionFrom?: string; oltNo?: string; contact?: string };
  created_at?: string;
  updated_at?: string;
}

export interface CreateGatePassData extends Omit<GatePassRecord, 'id' | 'passNumber'> {
  passNumber?: string;
}

function generatePassNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `GP-${y}${m}${d}-${Date.now()}`;
}

export const gatePassService = {
  async create(data: CreateGatePassData): Promise<GatePassRecord> {
    const passNumber = data.passNumber || generatePassNumber();
    const id = await FirebaseService.create('gatePasses', {
      ...data,
      passNumber,
      approvalStatus: data.approvalStatus || 'pending',
      isActive: data.isActive ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { id, ...data, passNumber } as GatePassRecord;
  },

  async getById(id: string): Promise<GatePassRecord | null> {
    try {
      const row = await FirebaseService.getById('gatePasses', id);
      if (!row) return null;
      return { id, ...(row as any) } as GatePassRecord;
    } catch {
      return null;
    }
  },
};

export default gatePassService;



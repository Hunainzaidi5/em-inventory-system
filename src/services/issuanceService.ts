import { FirebaseService } from '@/lib/firebaseService';

export interface IssuanceRecord {
  id: string;
  requisition_id: string;
  issuer_name?: string;
  department?: string;
  date: string;
  // Issuer details
  issuer_designation?: string;
  issuer_contact?: string;
  issuer_signature?: string;
  issuer_olt_no?: string;
  tools: Array<{ description: string; unit?: string; qty: number; remarks?: string }>;
  receiver?: { name?: string; department?: string; sign?: string; instructionFrom?: string; oltNo?: string; contact?: string };
  created_at?: string;
  updated_at?: string;
}

export interface CreateIssuanceRecordData extends Omit<IssuanceRecord, 'id'> {}

export const issuanceService = {
  async create(data: CreateIssuanceRecordData): Promise<IssuanceRecord> {
    const id = await FirebaseService.create('issuanceRecords', {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { id, ...data } as IssuanceRecord;
  },

  async getById(id: string): Promise<IssuanceRecord | null> {
    try {
      const row = await FirebaseService.getById('issuanceRecords', id);
      if (!row) return null;
      return { id, ...(row as any) } as IssuanceRecord;
    } catch {
      return null;
    }
  },
};

export default issuanceService;



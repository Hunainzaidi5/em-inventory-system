import { FirebaseService } from '@/lib/firebaseService';

export interface IssuanceRecord {
  id: string;
  requisition_id: string;
  issuer_name?: string;
  department?: string;
  date: string;
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
};

export default issuanceService;



export type RequisitionType = 'issue' | 'return' | 'consume';
export type ItemType = 'inventory' | 'tool' | 'ppe' | 'stationery' | 'faulty_return' | 'general_tools' | 'spare_management';
export type StatusType = 'completed' | 'pending' | 'overdue' | 'cancelled';

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
  notes?: string;
  updated_at?: string;
  created_by?: string;
}

export interface RequisitionFormData extends Omit<Requisition, 'id' | 'createdAt' | 'referenceNumber' | 'status'> {
  id?: string;
}

export interface Filters {
  requisitionType: RequisitionType | 'all';
  itemType: ItemType | 'all';
  status: StatusType | 'all';
  department: 'em_systems' | 'em_track' | 'em_power' | 'em_signalling' | 'em_communication' | 'em_third_rail' | 'em_safety_quality' | 'all';
  dateRange: {
    start: string;
    end: string;
  };
  start: string;
  end: string;
}

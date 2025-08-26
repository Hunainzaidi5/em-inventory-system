// src/types/spareTypes.ts
export interface SparePart {
    id?: string;
    name: string;
    quantity: number;
    location: string;
    lastUpdated?: string;
    itemCode?: string;
    imis_code?: string;
    uom?: string;
    partNumber?: string;
    boq_number?: string;
    belongsto?: string;
    category?: string;
    source_file?: string;
    source_category?: string;
    source_system?: string;
  }
  
  export interface TabData {
    name: string;
    data: SparePart[];
    loading: boolean;
    error: string | null;
  }
  
  export interface SystemCategory {
    key: string;
    name: string;
    omFile: string;
    pmaFile: string;
    type: 'om' | 'pma' | 'both';
  }
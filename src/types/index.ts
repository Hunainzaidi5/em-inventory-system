// Core types for the E&M Inventory Management System

export type UserRole = 
  | 'admin'
  | 'dev' 
  | 'manager'
  | 'deputy_manager'
  | 'engineer'
  | 'assistant_engineer'
  | 'master_technician'
  | 'technician';

export type ItemCategory = 'O&M' | 'PMA';

export type SystemType = 
  | 'Elevator'
  | 'Escalator' 
  | 'PSD'
  | 'HVAC'
  | 'WSD'
  | 'LV'
  | 'FAS'
  | 'FES';

export type RequisitionType = 'issue' | 'return' | 'consume';

export type ItemStatus = 'available' | 'issued' | 'consumed' | 'faulty';

export type PPEType = 
  | 'Helmet Yellow'
  | 'Helmet White'
  | 'Inner Strip'
  | 'Reflective Waist'
  | 'Safety Shoes'
  | 'Goggles'
  | 'Dust Mask'
  | 'Raincoat'
  | 'Earplugs';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: ItemCategory;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface System {
  id: string;
  name: SystemType;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  partName: string;
  partNumber?: string;
  description?: string;
  categoryId: string;
  category?: Category;
  systemId: string;
  system?: System;
  locationId: string;
  location?: Location;
  quantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitPrice?: number;
  supplier?: string;
  partType?: string;
  specifications?: Record<string, unknown>;
  status: ItemStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  toolName: string;
  toolCode?: string;
  description?: string;
  locationId: string;
  location?: Location;
  quantity: number;
  availableQuantity: number;
  condition: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: ItemStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PPEItem {
  id: string;
  itemName: PPEType;
  sizeVariant?: string;
  description?: string;
  locationId: string;
  location?: Location;
  quantity: number;
  availableQuantity: number;
  expiryDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  status: ItemStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StationeryItem {
  id: string;
  itemName: string;
  itemCode?: string;
  description?: string;
  category: string; // 'Tape', 'Stationery', 'Gifts', etc.
  locationId: string;
  location?: Location;
  quantity: number;
  availableQuantity: number;
  unitCost?: number;
  supplier?: string;
  status: ItemStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Requisition {
  id: string;
  requisitionType: RequisitionType;
  itemType: 'inventory' | 'tool' | 'ppe' | 'stationery';
  itemId: string;
  quantity: number;
  issuedTo?: string;
  issuedBy: string;
  department?: string;
  purpose?: string;
  returnDate?: string;
  actualReturnDate?: string;
  conditionOnReturn?: string;
  notes?: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaultyReturn {
  id: string;
  requisitionId?: string;
  itemType: 'inventory' | 'tool' | 'ppe' | 'stationery';
  itemId: string;
  faultDescription: string;
  returnLocation: 'Warehouse' | 'C&C';
  returnedBy: string;
  returnDate: string;
  expectedResolution?: string;
  resolutionStatus: 'pending' | 'resolved' | 'disposed';
  replacementProvided: boolean;
  replacementItemId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GatePass {
  id: string;
  passNumber: string;
  requesterName: string;
  department: string;
  destination: string;
  purpose: string;
  itemsDescription: string;
  quantitySummary?: string;
  expectedReturnDate?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
  pdfUrl?: string;
  isActive: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface issuanceRecord {
  id: string;
  policyNumber: string;
  issuanceProvider: string;
  policyType: string;
  coverageDescription?: string;
  premiumAmount?: number;
  coverageAmount?: number;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  linkedItemType?: 'inventory' | 'tool' | 'ppe' | 'stationery';
  linkedItemId?: string;
  status: 'active' | 'expired' | 'cancelled';
  renewalReminderSent: boolean;
  documents?: Record<string, unknown>;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalItems: number;
  availableItems: number;
  issuedItems: number;
  consumedItems: number;
  faultyItems: number;
  lowStockItems: number;
  pendingReturns: number;
  recentRequisitions: number;
}

export interface FilterOptions {
  category?: string;
  system?: string;
  location?: string;
  status?: string;
  search?: string;
}
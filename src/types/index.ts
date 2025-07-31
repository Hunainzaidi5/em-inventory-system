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

export type TransactionType = 'issue' | 'return' | 'consume';

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
  qrCode?: string;
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

export interface GeneralItem {
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

export interface Transaction {
  id: string;
  transactionType: TransactionType;
  itemType: 'inventory' | 'tool' | 'ppe' | 'general';
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
  transactionId?: string;
  itemType: 'inventory' | 'tool' | 'ppe' | 'general';
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
  qrCode?: string;
  pdfUrl?: string;
  isActive: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceRecord {
  id: string;
  policyNumber: string;
  insuranceProvider: string;
  policyType: string;
  coverageDescription?: string;
  premiumAmount?: number;
  coverageAmount?: number;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  linkedItemType?: 'inventory' | 'tool' | 'ppe' | 'general';
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
  recentTransactions: number;
}

export interface FilterOptions {
  category?: string;
  system?: string;
  location?: string;
  status?: string;
  search?: string;
}
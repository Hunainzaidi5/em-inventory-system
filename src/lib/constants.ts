import type { UserRole, ItemCategory, SystemType, PPEType } from '@/types';

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin/Dev' },
  { value: 'dev', label: 'Developer' },
  { value: 'manager', label: 'Manager' },
  { value: 'deputy_manager', label: 'Deputy Manager' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'assistant_engineer', label: 'Assistant Engineer' },
  { value: 'master_technician', label: 'Master Technician' },
  { value: 'technician', label: 'Technician' },
];

export const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'O&M', label: 'Operations & Maintenance' },
  { value: 'PMA', label: 'Planned Maintenance Activities' },
];

export const SYSTEM_TYPES: { value: SystemType; label: string }[] = [
  { value: 'Elevator', label: 'Elevator' },
  { value: 'Escalator', label: 'Escalator' },
  { value: 'PSD', label: 'Platform Screen Door' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'WSD', label: 'Water Supply & Drainage' },
  { value: 'LV', label: 'Low Voltage' },
  { value: 'FAS', label: 'Fire Alarm System' },
  { value: 'FES', label: 'Fire Extinguishing System' },
];

export const PPE_TYPES: { value: PPEType; label: string }[] = [
  { value: 'Helmet Yellow', label: 'Helmet Yellow' },
  { value: 'Helmet White', label: 'Helmet White' },
  { value: 'Inner Strip', label: 'Inner Strip' },
  { value: 'Reflective Waist', label: 'Reflective Waist' },
  { value: 'Safety Shoes', label: 'Safety Shoes' },
  { value: 'Goggles', label: 'Goggles' },
  { value: 'Dust Mask', label: 'Dust Mask' },
  { value: 'Raincoat', label: 'Raincoat' },
  { value: 'Earplugs', label: 'Earplugs' },
];

export const LOCATIONS = [
  { id: '1', name: 'GMG Warehouse', description: 'Main warehouse facility' },
  { id: '2', name: 'E&M Systems Ground Floor Store', description: 'Ground floor storage area' },
  { id: '3', name: 'E&M Systems 2nd Floor Store', description: 'Second floor storage area' },
];

export const ITEM_STATUSES = [
  { value: 'available', label: 'Available', color: 'success' },
  { value: 'issued', label: 'Issued', color: 'info' },
  { value: 'consumed', label: 'Consumed', color: 'muted' },
  { value: 'faulty', label: 'Faulty', color: 'error' },
];

export const TRANSACTION_TYPES = [
  { value: 'issue', label: 'Issue' },
  { value: 'return', label: 'Return' },
  { value: 'consume', label: 'Consume' },
];

export const GENERAL_ITEM_CATEGORIES = [
  'Tape',
  'Stationery',
  'Gifts',
  'Cleaning Supplies',
  'Office Supplies',
  'Safety Equipment',
  'Maintenance Supplies',
  'Other',
];

export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
];

export const INSURANCE_STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'expired', label: 'Expired', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'muted' },
];
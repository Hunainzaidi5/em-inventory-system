// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  avatar?: string;
}

// Authentication request/response types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  // Add any additional registration fields here
}

export interface AuthResponse {
  user: User;
  token: string;
}

// User role type
export type UserRole = 
  | 'admin'
  | 'dev'
  | 'manager'
  | 'deputy_manager'
  | 'engineer'
  | 'assistant_engineer'
  | 'master_technician'
  | 'technician';

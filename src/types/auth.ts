// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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

// UserRole is defined below

export interface RegisterData extends LoginCredentials {
  name: string;
  role: UserRole;
  department: string;
  employee_id: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  session?: any; // Session object from Supabase
}

// User role type - must match the database enum
// Note: These values must match exactly with the database enum 'user_role'
export type UserRole = 
  | 'dev'              // Developer/Administrator - Full system access with dev tools
  | 'manager'          // Department manager
  | 'deputy_manager'   // Deputy manager
  | 'engineer'         // Engineer
  | 'assistant_engineer' // Assistant engineer
  | 'master_technician' // Master technician
  | 'technician';       // Regular technician

// User type definition
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  department?: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  last_login?: string;
  email_verified?: boolean;
}

// Authentication request/response types
export interface LoginCredentials {
  email: string;
  password: string;
}

// UserRole is defined below

export interface RegisterData extends LoginCredentials {
  displayName: string;
  role?: UserRole;
  department?: string;
  employee_id?: string;
  avatar?: string; // legacy support if a URL is provided
  avatarFile?: File; // optional raw file to upload during registration
}

export interface AuthResponse {
  success: boolean;
  user: User;
  message: string;
  token?: string;
  session?: any;
}

// Custom error class for authentication errors
export class AuthenticationError extends Error {
  code: string | number;
  details?: any;
  
  constructor(message: string, code: string | number = 'AUTH_ERROR', details?: any) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.details = details;
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
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

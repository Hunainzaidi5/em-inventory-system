# Authentication System Documentation

## Overview

The EM Inventory System uses Supabase for authentication, providing a secure and scalable authentication solution. This document outlines the authentication architecture, setup, and troubleshooting.

## Architecture

### Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages authentication state
   - Provides authentication methods to components
   - Handles session persistence

2. **AuthService** (`src/services/authService.ts`)
   - Handles all authentication operations
   - Manages rate limiting and security
   - Interfaces with Supabase Auth

3. **Supabase Client** (`src/lib/supabase.ts`)
   - Configured Supabase client
   - Handles API communication

4. **Environment Config** (`src/config/env.ts`)
   - Centralized environment variable management
   - Provides fallbacks for development

### Authentication Flow

1. **Login Process**:
   - User submits credentials
   - AuthService validates input
   - Supabase Auth authenticates user
   - User profile is fetched/created
   - Session is established
   - User is redirected to dashboard

2. **Session Management**:
   - Sessions are automatically managed by Supabase
   - Tokens are stored in localStorage
   - Auth state changes are monitored
   - Automatic token refresh

3. **Logout Process**:
   - Supabase session is cleared
   - Local storage is cleaned
   - User is redirected to login

## Setup

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://xprqghjyofmsiepdzhto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjM2NTIsImV4cCI6MjA3MDczOTY1Mn0.k7TM1qPZjGVPJKq7CWHmjo_qmKcfFHzUY06HTLn1294
```

### Database Schema

The authentication system requires the following database tables:

1. **profiles** table (extends Supabase auth.users)
2. **user_role** enum with valid roles
3. **RLS policies** for security

See `supabase-schema.sql` for the complete schema.

## User Roles

The system supports the following user roles:

- `dev` - Developer/Administrator (Full access)
- `manager` - Department manager
- `deputy_manager` - Deputy manager
- `engineer` - Engineer
- `assistant_engineer` - Assistant engineer
- `master_technician` - Master technician
- `technician` - Regular technician

## Security Features

### Rate Limiting
- Maximum 5 login attempts per 15-minute window
- Account lockout for 15 minutes after max attempts
- Automatic reset on successful login

### Input Validation
- Email format validation
- Password strength requirements (minimum 8 characters)
- Role validation against database enum

### Session Security
- Secure token storage
- Automatic session refresh
- Proper logout cleanup

## Development Tools

### Auth Debugger
In development mode, an auth debugger is available:
- Click the 🔧 button in the bottom-right corner
- Shows real-time authentication status
- Displays session information
- Monitors environment variables
- Tracks storage state

### Test User
For development testing:
- Use the "🧪 Test Login (Dev Only)" button on the login page
- Creates/uses a test user account
- Bypasses email verification for testing

## Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Ensure `.env` file exists with correct values
   - Check that variables are prefixed with `VITE_`

2. **"Invalid login credentials"**
   - Verify user exists in Supabase
   - Check if email is confirmed
   - Ensure correct password

3. **"Account locked"**
   - Wait 15 minutes for lockout to expire
   - Check rate limiting configuration

4. **"No active session"**
   - Clear browser storage
   - Check network connectivity
   - Verify Supabase configuration

### Debug Steps

1. **Check Environment**:
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_SUPABASE_URL);
   console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
   ```

2. **Check Session**:
   ```javascript
   // In browser console
   const { data: { session } } = await supabase.auth.getSession();
   console.log(session);
   ```

3. **Check Storage**:
   ```javascript
   // In browser console
   Object.keys(localStorage).filter(key => key.includes('supabase'));
   ```

4. **Use Auth Debugger**:
   - Enable in development mode
   - Monitor real-time status
   - Check for errors

### Error Codes

- `MISSING_CREDENTIALS` - Email or password not provided
- `ACCOUNT_LOCKED` - Too many failed attempts
- `AUTH_ERROR` - General authentication error
- `400` - Invalid request
- `401` - Authentication failed
- `403` - Access denied
- `429` - Too many requests
- `500` - Server error

## API Reference

### AuthService Methods

```typescript
// Login
login(credentials: LoginCredentials): Promise<AuthResponse>

// Register
register(userData: RegisterData): Promise<{ success: boolean; error?: string }>

// Logout
logout(): Promise<void>

// Get current user
getCurrentUser(): Promise<User | null>

// Update profile
updateProfile(updates: Partial<User>): Promise<User>

// Reset password
resetPassword(email: string): Promise<void>

// Subscribe to auth changes
onAuthStateChange(callback: (event: string, session: any) => void)
```

### AuthContext Hooks

```typescript
const {
  user,              // Current user object
  isAuthenticated,   // Authentication status
  isLoading,         // Loading state
  login,            // Login function
  logout,           // Logout function
  register,         // Register function
  updateProfile,    // Update profile function
  resetPassword,    // Reset password function
  refreshUser,      // Refresh user data
  error,            // Error state
} = useAuth();
```

## Best Practices

1. **Always check authentication state** before accessing protected routes
2. **Handle loading states** to provide good UX
3. **Use error boundaries** to catch authentication errors
4. **Validate input** on both client and server
5. **Implement proper logout** to clear all session data
6. **Monitor auth state changes** for real-time updates
7. **Use rate limiting** to prevent brute force attacks
8. **Store sensitive data securely** using environment variables

## Monitoring

### Logs to Monitor
- Authentication attempts (success/failure)
- Rate limiting events
- Session creation/destruction
- Profile updates
- Error occurrences

### Metrics to Track
- Login success rate
- Failed login attempts
- Session duration
- User registration rate
- Authentication errors by type

## Support

For authentication issues:
1. Check the Auth Debugger in development
2. Review browser console for errors
3. Verify environment configuration
4. Check Supabase dashboard for user status
5. Review this documentation for troubleshooting steps

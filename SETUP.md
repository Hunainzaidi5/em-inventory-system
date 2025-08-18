# E&M Inventory System Setup Guide

## Quick Start

### 1. Environment Configuration

The system is now configured with your Supabase project credentials. The environment variables are set with fallback values, so the application should work immediately.

**Current Configuration:**
- **Project URL**: `https://xprqghjyofmsiepdzhto.supabase.co`
- **Project ID**: `xprqghjyofmsiepdzhto`
- **Anon Key**: Configured and ready to use

### 2. Database Setup

Make sure your Supabase database has the required schema. Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor.

### 3. Start the Application

```bash
npm install
npm run dev
```

## Authentication System Features

### ✅ What's Working

1. **Complete Authentication Flow**
   - User registration and login
   - Session management
   - Protected routes
   - Role-based access control

2. **Security Features**
   - Rate limiting (5 attempts per 15 minutes)
   - Input validation
   - Secure token storage
   - Automatic session refresh

3. **Development Tools**
   - Auth Debugger (🔧 button in bottom-right)
   - Test Login button (🧪 on login page)
   - Real-time status monitoring
   - Connection testing

4. **Error Handling**
   - Comprehensive error messages
   - User-friendly notifications
   - Detailed logging for debugging

### 🔧 Debugging Tools

#### Auth Debugger
- Click the 🔧 button in the bottom-right corner
- Shows real-time authentication status
- Displays session information
- Monitors environment variables
- Tracks storage state
- Includes "Run Tests" button for connection testing

#### Test Login
- Use the "🧪 Test Login (Dev Only)" button on the login page
- Creates/uses a test user account
- Bypasses email verification for testing

#### Console Logging
- Detailed authentication logs in browser console
- Connection status updates
- Error tracking and debugging

## Testing the Authentication

### 1. Manual Testing
1. Open the application in development mode
2. Click the 🔧 Auth Debugger button
3. Click "🧪 Run Tests" to test the connection
4. Check the browser console for detailed results

### 2. Test Login
1. Go to the login page
2. Click "🧪 Test Login (Dev Only)" button
3. Should automatically log you in with a test account

### 3. Manual Login
1. Create a user account through registration
2. Verify email (if required)
3. Login with credentials

## Troubleshooting

### Common Issues

1. **"Connection failed"**
   - Check if Supabase project is active
   - Verify network connectivity
   - Check browser console for errors

2. **"Authentication failed"**
   - Verify user exists in Supabase
   - Check if email is confirmed
   - Ensure correct password

3. **"Missing environment variables"**
   - The system uses fallback values, so this shouldn't occur
   - If it does, check the `src/config/env.ts` file

### Debug Steps

1. **Check Auth Debugger**
   - Click 🔧 button
   - Review all status indicators
   - Look for red ❌ marks

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for authentication logs
   - Check for error messages

3. **Run Connection Tests**
   - Click "🧪 Run Tests" in Auth Debugger
   - Review test results in console
   - Check for specific error messages

## Production Deployment

### Environment Variables
For production, set these environment variables:

```env
VITE_SUPABASE_URL=https://xprqghjyofmsiepdzhto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcnFnaGp5b2Ztc2llcGR6aHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjM2NTIsImV4cCI6MjA3MDczOTY1Mn0.k7TM1qPZjGVPJKq7CWHmjo_qmKcfFHzUY06HTLn1294
```

### Security Considerations
- Remove test login button in production
- Disable Auth Debugger in production
- Ensure RLS policies are properly configured
- Monitor authentication logs

## Support

If you encounter issues:

1. **Check the Auth Debugger** - Most issues can be identified here
2. **Review Console Logs** - Detailed error information
3. **Run Connection Tests** - Verify Supabase connectivity
4. **Check Documentation** - See `AUTHENTICATION.md` for detailed info

The authentication system is now fully functional with comprehensive debugging tools to help identify and resolve any issues.

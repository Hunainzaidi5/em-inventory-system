# Fix for user_role Enum Error

## Error Description
```
ERROR: 22P02: invalid input value for enum user_role: "dev"
```

This error occurs when the `user_role` enum in your Supabase database doesn't include the "dev" value, but the application is trying to insert or update a profile with `role = 'dev'`.

## Root Cause
The `user_role` enum was likely created without the "dev" value, or the schema wasn't properly applied to your database.

## Quick Fix

### Option 1: Run the Enum Fix Script
Execute the `enum-fix.sql` file in your Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor  
3. Copy and paste the contents of `enum-fix.sql`
4. Run the script

### Option 2: Manual Fix
Run this command in your Supabase SQL Editor:

```sql
ALTER TYPE user_role ADD VALUE 'dev';
```

### Option 3: Complete RLS and Enum Fix
Run the `supabase-rls-fix.sql` file which includes both the enum fix and RLS policy updates.

## Verification

After applying the fix, verify it worked by running:

```sql
-- Check enum values
SELECT unnest(enum_range(NULL::user_role)) AS role_values;
```

You should see "dev" in the list of values.

## Files to Run (in order)

1. **`enum-fix.sql`** - Fixes just the enum issue
2. **`supabase-rls-fix.sql`** - Comprehensive fix including enum + RLS policies

## Expected Enum Values

After the fix, your `user_role` enum should include:
- admin
- dev
- manager  
- deputy_manager
- engineer
- assistant_engineer
- master_technician
- technician

## Dev User Profile

The fix scripts also ensure the dev user profile exists with:
- **Email**: syedhunainalizaidi@gmail.com
- **Role**: dev
- **Department**: E&M SYSTEMS
- **Employee ID**: DEV001

## Troubleshooting

If you still get errors after running the fix:

1. **Check if enum was updated**: Run the verification query above
2. **Check existing data**: Look for any profiles with invalid role values
3. **Clear application cache**: Restart your application
4. **Check browser console**: Look for additional error details

## Prevention

To prevent this in the future:
- Always run the complete schema file when setting up new environments
- Ensure enum values match between your application code and database schema
- Use explicit enum casting (`'dev'::user_role`) in SQL statements
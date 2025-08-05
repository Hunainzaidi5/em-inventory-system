import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/services/authService';
import { User } from '@/types/auth';

// Hardcoded dev user to ensure it's always available
const DEV_USER = {
  id: 'dev-hardcoded',
  email: 'syedhunainalizaidi@gmail.com',
  name: 'Syed Hunain Ali',
  role: 'dev',
  department: 'E&M SYSTEMS',
  employee_id: 'DEV001',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as User;

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        // First, get all auth users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) throw authError;
        
        // Then get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Combine the data
        const combinedUsers = authUsers.users.map(authUser => {
          const profile = profiles.find(p => p.id === authUser.id) || {};
          return {
            id: authUser.id,
            email: authUser.email || '',
            name: profile.full_name || '',
            role: profile.role || 'technician',
            department: profile.department || '',
            employee_id: profile.employee_id || '',
            is_active: profile.is_active ?? true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at,
            avatar: authUser.user_metadata?.avatar_url
          };
        });
        
        // Add the hardcoded dev user if not already in the list
        if (!combinedUsers.some(u => u.id === DEV_USER.id)) {
          combinedUsers.unshift(DEV_USER);
        }
        
        setUsers(combinedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
        // If there's an error, at least show the dev user
        setUsers([DEV_USER]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  
  // Only allow developers to access this page
  if (!user || user.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, string> = {
      'dev': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'manager': 'bg-green-100 text-green-800',
      'technician': 'bg-yellow-100 text-yellow-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    const badgeClass = roleMap[role] || roleMap['default'];
    
    return (
      <Badge className={`${badgeClass} capitalize`}>
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users and their permissions
          </p>
        </div>
        <Button onClick={() => navigate('/add-user')}>
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all user accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{user.employee_id || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'outline'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => navigate(`/profile/${user.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage; 
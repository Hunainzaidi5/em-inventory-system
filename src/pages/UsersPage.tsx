import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, UserPlus, Loader2 } from "lucide-react";
import { User } from "@/types/auth";
import { supabase } from "@/services/authService";

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Map profiles to User type
      const usersData = profiles.map(profile => ({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        department: profile.department,
        employee_id: profile.employee_id,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  useEffect(() => {
    if (user?.role === 'dev') {
      fetchUsers();
    }
  }, [user]);
  
  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // Delete from auth.users and profiles table (cascade)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      // Refresh the user list
      await fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  if (isLoading || isLoadingUsers) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Only allow developers to access this page
  if (!user || user.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Button onClick={() => navigate('/add-user')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userItem) => (
              <TableRow key={userItem.id}>
                <TableCell className="font-medium">{userItem.name}</TableCell>
                <TableCell>{userItem.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {userItem.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{userItem.department || '-'}</TableCell>
                <TableCell>
                  <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                    {userItem.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/edit-user/${userItem.id}`)}
                    disabled={userItem.id === 'dev-hardcoded' || userItem.id === user?.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(userItem.id)}
                    disabled={userItem.id === 'dev-hardcoded' || userItem.id === user?.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersPage; 
import React, { useEffect, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { User } from "@/types/auth";

const HARDCODED_USERS: User[] = [
  {
    id: 'dev-hardcoded',
    name: 'Syed Hunain Ali',
    email: 'syedhunainalizaidi@gmail.com',
    role: 'dev',
    department: 'E&M SYSTEMS',
    employee_id: 'DEV001',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(HARDCODED_USERS);
  
  // In a real app, you would fetch users from your API here
  useEffect(() => {
    // Simulate API call
    const fetchUsers = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/users');
        // const data = await response.json();
        // setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    
    fetchUsers();
  }, []);
  
  const handleDelete = (userId: string) => {
    if (userId === 'dev-hardcoded') {
      alert('Cannot delete the developer account');
      return;
    }
    // In a real app, you would make an API call to delete the user
    setUsers(users.filter(user => user.id !== userId));
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
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
                    disabled={userItem.id === 'dev-hardcoded'}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(userItem.id)}
                    disabled={userItem.id === 'dev-hardcoded'}
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
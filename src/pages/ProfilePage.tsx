import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Building, User, Calendar } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Not authenticated</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'dev':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <CardDescription>
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.toUpperCase()}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                {user.department}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                ID: {user.employee_id}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Joined {formatDate(user.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Your account information and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Personal Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Full Name:</span>
                    <span className="ml-2 text-gray-600">{user.name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2 text-gray-600">{user.email}</span>
                  </div>
                  <div>
                    <span className="font-medium">Employee ID:</span>
                    <span className="ml-2 text-gray-600">{user.employee_id}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Work Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Department:</span>
                    <span className="ml-2 text-gray-600">{user.department}</span>
                  </div>
                  <div>
                    <span className="font-medium">Role:</span>
                    <span className="ml-2 text-gray-600">{user.role}</span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Permissions</CardTitle>
          <CardDescription>
            Your current access level and permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Inventory Management</h4>
              <p className="text-sm text-gray-600">
                {user.role === 'dev' || user.role === 'admin' ? 'Full Access' : 'Read Only'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">User Management</h4>
              <p className="text-sm text-gray-600">
                {user.role === 'dev' ? 'Full Access' : 'No Access'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">System Settings</h4>
              <p className="text-sm text-gray-600">
                {user.role === 'dev' || user.role === 'admin' ? 'Full Access' : 'Read Only'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
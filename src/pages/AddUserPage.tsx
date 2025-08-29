import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, UserPlus, Upload, X, Check } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { getAvatarUrl, uploadAvatar } from '@/utils/avatarUtils';
import { PageContainer } from '@/components/layout/PageContainer';

// Form validation schema
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  role: z.enum(['dev', 'manager', 'deputy_manager', 'engineer', 'assistant_engineer', 'master_technician', 'technician']),
  department: z.string().min(1, 'Department is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  password: z.string().optional(),
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (!data.password && !data.confirmPassword) return true;
  if ((data.password || '').length < 8) return false;
  return data.password === data.confirmPassword;
}, {
  message: "Password must be at least 8 characters and match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof userSchema>;

const AddUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    displayName: '',
    role: 'technician',
    department: '',
    employee_id: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userId) {
      setIsEditing(true);
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const user = await userService.getUserById(userId);
      if (user) {
        setFormData({
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          department: user.department || '',
          employee_id: user.employee_id || '',
          password: '',
          confirmPassword: ''
        });
        if (user.avatar_url) {
          setAvatarPreview(user.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      const validatedData = userSchema.parse(formData);
      
      if (isEditing && userId) {
        // Update existing user basic fields
        await userService.updateUser(userId, {
          display_name: validatedData.displayName,
          role: validatedData.role,
          department: validatedData.department,
          employee_id: validatedData.employee_id
        });

        // If avatar file chosen, upload and save URL
        if (avatarFile) {
          const avatarUrl = await uploadAvatar(avatarFile, userId);
          await userService.updateUser(userId, { avatar_url: avatarUrl });
        }

        // If password provided, change password for current logged-in user
        if (validatedData.password) {
          await userService.changePassword(validatedData.password);
        }
        
        toast.success('User updated successfully');
      } else {
        // Create new user
        if (!validatedData.password) {
          throw new z.ZodError([{ message: 'Password is required', path: ['password'], code: 'custom' } as any]);
        }
        const created = await userService.createUser({
          email: validatedData.email,
          display_name: validatedData.displayName,
          role: validatedData.role,
          department: validatedData.department,
          employee_id: validatedData.employee_id
        });

        // Upload avatar for new user if provided
        if (avatarFile && created?.id) {
          const avatarUrl = await uploadAvatar(avatarFile, created.id);
          await userService.updateUser(created.id, { avatar_url: avatarUrl });
        }
        toast.success('User created successfully');
      }
      
      navigate('/dashboard/users');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('Error saving user:', error);
        toast.error('Failed to save user');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      dev: 'Developer/Administrator',
      manager: 'Department Manager',
      deputy_manager: 'Deputy Manager',
      engineer: 'Engineer',
      assistant_engineer: 'Assistant Engineer',
      master_technician: 'Master Technician',
      technician: 'Technician'
    };
    return roleNames[role] || role;
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="py-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Edit User' : 'Add New User'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update user information' : 'Create a new user account'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserPlus className="h-5 w-5 icon-accent-indigo" />
              {isEditing ? 'Edit User' : 'New User Details'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isEditing ? 'Update the user information below' : 'Fill in the details to create a new user account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="space-y-4">
                <Label className="text-gray-200">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="text-lg">
                      {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3">
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="avatar"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl 
                                bg-gradient-to-r from-slate-900 to-slate-700 text-white 
                                font-medium shadow-md hover:from-slate-800 hover:to-slate-600 
                                active:scale-95 transition-all duration-200 cursor-pointer
                                focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Upload Image</span>
                    </label>

                    {avatarFile && (
                      <p className="text-sm text-gray-500 font-medium">
                        {avatarFile.name}
                      </p>
                    )}
                  </div>
                    
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isEditing}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-gray-200">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-200">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries({
                        dev: 'Developer/Administrator',
                        manager: 'Department Manager',
                        deputy_manager: 'Deputy Manager',
                        engineer: 'Engineer',
                        assistant_engineer: 'Assistant Engineer',
                        master_technician: 'Master Technician',
                        technician: 'Technician'
                      }).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-gray-200">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_id" className="text-gray-200">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Section - New users required, edit users optional */}
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-200">{isEditing ? 'New Password (optional)' : 'Password *'}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-200">{isEditing ? 'Confirm New Password (optional)' : 'Confirm Password *'}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword || ''}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required={!isEditing}
                    />
                  </div>
                </div>
              </>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/users')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AddUserPage;
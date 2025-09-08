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
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/users')}
              className="flex items-center gap-2 text-[#6b6557] hover:bg-[#f0e9d9] hover:text-[#4a4539]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#4a4539]">
                {isEditing ? 'Edit User' : 'Add New User'}
              </h1>
              <p className="text-sm text-[#6b6557]">
                {isEditing ? 'Update user information' : 'Create a new user account'}
              </p>
            </div>
          </div>
        </div>

        <Card className="border border-[#e1d4b1] bg-white">
          <CardHeader className="bg-[#f8f5ed] border-b border-[#e1d4b1]">
            <CardTitle className="flex items-center gap-2 text-[#4a4539]">
              <UserPlus className="h-5 w-5 text-[#8b7c5a]" />
              {isEditing ? 'Edit User' : 'New User Details'}
            </CardTitle>
            <CardDescription className="text-[#6b6557]">
              {isEditing ? 'Update the user information below' : 'Fill in the details to create a new user account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="space-y-4">
                <Label className="text-[#4a4539] font-medium">Profile Picture</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-[#e1d4b1]">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="text-lg bg-[#f8f5ed] text-[#6b6557]">
                        {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-[#c53030] hover:bg-[#f0e9d9] transition-colors"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#8b7c5a] text-white 
                                font-medium shadow-sm hover:bg-[#6b6149] transition-colors duration-200 cursor-pointer
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b7c5a]"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Image</span>
                    </label>

                    {avatarFile && (
                      <p className="text-sm text-[#6b6557] font-medium">
                        {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#4a4539] font-medium">Email Address *</Label>
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
                  <Label htmlFor="displayName" className="text-[#4a4539] font-medium">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[#4a4539] font-medium">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger className="hover:border-[#8b7c5a] focus:ring-1 focus:ring-[#8b7c5a]">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="border-[#e1d4b1]">
                      {Object.entries({
                        dev: 'Developer/Administrator',
                        manager: 'Department Manager',
                        deputy_manager: 'Deputy Manager',
                        engineer: 'Engineer',
                        assistant_engineer: 'Assistant Engineer',
                        master_technician: 'Master Technician',
                        technician: 'Technician'
                      }).map(([value, label]) => (
                        <SelectItem 
                          key={value} 
                          value={value}
                          className="hover:bg-[#f0e9d9] focus:bg-[#f0e9d9]"
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-[#4a4539] font-medium">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_id" className="text-[#4a4539] font-medium">Employee ID *</Label>
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
                    <Label htmlFor="password" className="text-[#4a4539] font-medium">{isEditing ? 'New Password (optional)' : 'Password *'}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#4a4539] font-medium">{isEditing ? 'Confirm New Password (optional)' : 'Confirm Password *'}</Label>
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
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-[#e1d4b1]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/users')}
                  disabled={loading}
                  className="text-[#6b6557] border-[#d1c4a3] hover:bg-[#f0e9d9] hover:text-[#4a4539] hover:border-[#8b7c5a]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#8b7c5a] hover:bg-[#6b6149] text-white transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isEditing ? 'Update User' : 'Create User'}
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
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { 
  User, 
  Mail, 
  Shield, 
  Building, 
  CreditCard, 
  Camera, 
  ArrowLeft,
  Sparkles,
  Loader2,
  UserPlus,
  UserCheck
} from 'lucide-react';

// Define the roles that can be assigned to new users (excludes 'dev' role)
// These must match the database enum 'user_role'
const assignableRoles = [
  'dev',
  'manager',
  'deputy_manager',
  'engineer',
  'assistant_engineer',
  'master_technician',
  'technician'
] as const;
type AssignableRole = typeof assignableRoles[number];

// Define the form values type
type FormValues = {
  name: string;
  email: string;
  password: string;
  role: AssignableRole;
  department: string;
  employee_id: string;
};

// Define the form schema with a simpler approach
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().refine(
    (val) => assignableRoles.includes(val as AssignableRole),
    { message: 'Please select a valid role' }
  ),
  department: z.string().min(1, 'Department is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  avatar: z.any().optional(),
});

const UserCard = ({ title, children }: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
    <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-indigo-100">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-500 text-sm">Manage user account details and permissions</p>
        </div>
      </div>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

const AddUserPage = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { register: registerUser, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'technician' as AssignableRole,
      department: '',
      employee_id: '',
    },
  });

  // Fetch user data when in edit mode
  useEffect(() => {
    // Dev-only guard
    if (currentUser && currentUser.role !== 'dev') {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        
        // Set form values from the fetched user data
        setValue('name', user.full_name || '');
        setValue('email', user.email || '');
        setValue('role', user.role || 'technician');
        setValue('department', user.department || '');
        setValue('employee_id', user.employee_id || '');
        
        setIsEditing(true);
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast.error('Failed to load user data');
        navigate('/dashboard/users');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, setValue, navigate, currentUser]);

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      let avatarUrl = '';
      if (formData.avatar && formData.avatar.length > 0) {
        const file = formData.avatar[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${formData.email.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.${fileExt}`;
        
        // Upload the file to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload avatar.');
          return;
        }
        
        // Store just the filename in the database
        // The full URL will be constructed in getCurrentUser
        avatarUrl = fileName;
      }
      // Ensure the role is a valid UserRole
      const userRole = formData.role as UserRole;
      
      if (isEditing && userId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name,
            role: userRole,
            department: formData.department,
            employee_id: formData.employee_id,
            updated_at: new Date().toISOString(),
            ...(avatarUrl ? { avatar: avatarUrl } : {})
          })
          .eq('id', userId);

        if (updateError) throw updateError;
        
        // If the current user is updating their own profile, update the auth context
        if (currentUser?.id === userId) {
          // You might want to refresh the auth context here
        }
        
        toast.success('User updated successfully');
      } else {
        // Create new user
        const { error: registerError } = await registerUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: userRole,
          department: formData.department,
          employee_id: formData.employee_id,
          avatar: avatarUrl,
        });

        if (registerError) throw registerError;
        toast.success('User created successfully');
      }
      
      navigate('/dashboard/users');
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'An error occurred while saving the user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/users')}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors mr-4 group"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to User Management
                </button>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {isEditing ? 'Edit User Profile' : 'Add New User'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isEditing ? 'Update user information and permissions' : 'Create a new user account with appropriate role and access'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
              {isEditing ? (
                <UserCheck className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Form Card */}
        <UserCard title={isEditing ? 'Edit User Information' : 'User Information'}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-colors">
              <div className="p-4 rounded-full bg-indigo-100">
                <Camera className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-700">Profile Picture</p>
                <p className="text-xs text-gray-500">Upload an avatar image (optional)</p>
                <input 
                  id="avatar" 
                  type="file" 
                  accept="image/*" 
                  {...register('avatar')} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors" 
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 text-indigo-600" />
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  disabled={isLoading}
                  className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled={isLoading}
                  className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                    errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  disabled={isLoading}
                  className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                    errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter password (min 8 chars)"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Role <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="role" 
                  {...register('role')} 
                  className={`w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                    errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  <option value="" disabled>Select a role</option>
                  <option value="dev">Developer (Admin)</option>
                  <option value="manager">Manager</option>
                  <option value="deputy_manager">Deputy Manager</option>
                  <option value="engineer">Engineer</option>
                  <option value="assistant_engineer">Assistant Engineer</option>
                  <option value="master_technician">Master Technician</option>
                  <option value="technician">Technician</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Department <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="department"
                  {...register('department')}
                  disabled={isLoading}
                  className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                    errors.department ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter department"
                />
                {errors.department && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.department.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_id" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  Employee ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employee_id"
                  {...register('employee_id')}
                  disabled={isLoading}
                  className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                    errors.employee_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter employee ID"
                />
                {errors.employee_id && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.employee_id.message}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/users')}
                disabled={isLoading}
                className="h-11 px-6 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating User...' : 'Creating User...'}
                  </>
                ) : (
                  <>
                    {isEditing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {isEditing ? 'Update User' : 'Create User'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </UserCard>
      </div>
    </div>
  );
};

export default AddUserPage;
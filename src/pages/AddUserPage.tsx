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
  Lock, 
  Shield, 
  Building, 
  CreditCard, 
  Camera, 
  ArrowLeft, 
  UserPlus, 
  Save,
  X,
  Sparkles
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

const roleDisplayNames = {
  dev: 'Developer (Admin)',
  manager: 'Manager',
  deputy_manager: 'Deputy Manager',
  engineer: 'Engineer',
  assistant_engineer: 'Assistant Engineer',
  master_technician: 'Master Technician',
  technician: 'Technician'
};

const roleColors = {
  dev: 'from-purple-600 to-purple-700',
  manager: 'from-blue-600 to-blue-700',
  deputy_manager: 'from-indigo-600 to-indigo-700',
  engineer: 'from-green-600 to-green-700',
  assistant_engineer: 'from-emerald-600 to-emerald-700',
  master_technician: 'from-orange-600 to-orange-700',
  technician: 'from-gray-600 to-gray-700'
};

const InputField = ({ 
  icon: Icon, 
  label, 
  error, 
  children, 
  required = false 
}: {
  icon: React.ComponentType<any>;
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="space-y-2">
    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
      <div className="p-2 rounded-lg bg-gray-100 mr-3">
        <Icon className="w-4 h-4 text-gray-600" />
      </div>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      {children}
      {error && (
        <div className="absolute -bottom-6 left-0">
          <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md">{error}</p>
        </div>
      )}
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
  const [selectedRole, setSelectedRole] = useState<AssignableRole>('technician');
  const [animationKey, setAnimationKey] = useState(0);

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

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, []);

  // Fetch user data when in edit mode
  useEffect(() => {
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
        setSelectedRole(user.role || 'technician');
        
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
  }, [userId, setValue, navigate]);

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
        const updateData: any = {
          full_name: formData.name,
          role: userRole,
          department: formData.department,
          employee_id: formData.employee_id,
          updated_at: new Date().toISOString()
        };
        
        // Add avatar update if a new avatar was uploaded
        if (avatarUrl) {
          updateData.avatar = avatarUrl;
        }
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
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
          <button
            type="button"
            onClick={() => navigate('/dashboard/users')}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-6 group transition-all duration-300 hover:translate-x-1"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to User Management</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {isEditing ? 'Edit User' : 'Add New User'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isEditing ? 'Update user information and permissions' : 'Create a new user account with appropriate permissions'}
              </p>
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${roleColors[selectedRole]} shadow-lg`}>
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div key={`form-${animationKey}`} className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
            </div>
          </div>

          <div onSubmit={handleSubmit(onSubmit)} className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <div className="flex items-center space-x-2">
                  <X className="w-5 h-5 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-8">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h3>
                  <p className="text-gray-500 text-sm">Basic user details and contact information</p>
                </div>

                <InputField icon={User} label="Full Name" error={errors.name?.message} required>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter full name"
                    disabled={isLoading}
                  />
                </InputField>

                <InputField icon={Mail} label="Email Address" error={errors.email?.message} required>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter email address"
                    disabled={isLoading}
                  />
                </InputField>

                {!isEditing && (
                  <InputField icon={Lock} label="Password" error={errors.password?.message} required>
                    <input
                      type="password"
                      {...register('password')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="Enter secure password"
                      disabled={isLoading}
                    />
                  </InputField>
                )}

                <InputField icon={Camera} label="Profile Avatar">
                  <input
                    type="file"
                    accept="image/*"
                    {...register('avatar')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-medium hover:file:bg-indigo-100"
                    disabled={isLoading}
                  />
                </InputField>
              </div>

              {/* Professional Information */}
              <div className="space-y-8">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Professional Information</h3>
                  <p className="text-gray-500 text-sm">Role, department, and organizational details</p>
                </div>

                <InputField icon={Shield} label="Role" error={errors.role?.message} required>
                  <select
                    {...register('role', {
                      onChange: (e) => setSelectedRole(e.target.value as AssignableRole)
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                    disabled={isLoading}
                  >
                    {assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {roleDisplayNames[role]}
                      </option>
                    ))}
                  </select>
                </InputField>

                <InputField icon={Building} label="Department" error={errors.department?.message} required>
                  <input
                    {...register('department')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter department name"
                    disabled={isLoading}
                  />
                </InputField>

                <InputField icon={CreditCard} label="Employee ID" error={errors.employee_id?.message} required>
                  <input
                    {...register('employee_id')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="Enter employee ID"
                    disabled={isLoading}
                  />
                </InputField>

                {/* Role Preview Card */}
                <div className={`p-6 rounded-2xl bg-gradient-to-br ${roleColors[selectedRole]} shadow-lg transform transition-all duration-500 hover:scale-105`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <Shield className="w-6 h-6 text-white" />
                    <span className="text-white font-semibold">Selected Role</span>
                  </div>
                  <div className="text-white">
                    <div className="text-2xl font-bold mb-1">{roleDisplayNames[selectedRole]}</div>
                    <div className="text-white/80 text-sm">
                      This role will determine the user's permissions and access level
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-gray-100">
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit(onSubmit)}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isEditing ? 'Updating User...' : 'Creating User...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{isEditing ? 'Update User' : 'Create User'}</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard/users')}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-8 py-4 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/services/authService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

// Define the roles that can be assigned to new users (excludes 'dev' role)
// These must match the database enum 'user_role'
const assignableRoles = [
  'admin',
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
});

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
  }, [userId, setValue, navigate]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      if (isEditing && userId) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: data.name,
            role: data.role as UserRole,
            department: data.department,
            employee_id: data.employee_id,
            updated_at: new Date().toISOString()
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
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role as UserRole,
          department: data.department,
          employee_id: data.employee_id,
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
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit User' : 'Add New User'}
      </h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded shadow">
        <div className="mb-4">
          <label htmlFor="name" className="block mb-1 font-medium">Full Name</label>
          <input 
            id="name" 
            {...register('name')} 
            className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`} 
            disabled={isLoading}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium">Email</label>
          <input 
            id="email" 
            type="email" 
            {...register('email')} 
            className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 font-medium">Password</label>
          <input 
            id="password" 
            type="password" 
            {...register('password')} 
            className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="role" className="block mb-1 font-medium">Role</label>
          <select 
            id="role" 
            {...register('role')} 
            className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
            defaultValue=""
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
          {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="department" className="block mb-1 font-medium">Department</label>
          <input 
            id="department" 
            {...register('department')} 
            className={`w-full px-3 py-2 border rounded-md ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
        </div>
        <div className="mb-6">
          <label htmlFor="employee_id" className="block mb-1 font-medium">Employee ID</label>
          <input 
            id="employee_id" 
            {...register('employee_id')} 
            className={`w-full px-3 py-2 border rounded-md ${errors.employee_id ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id.message}</p>}
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading 
              ? (isEditing ? 'Updating...' : 'Creating...')
              : (isEditing ? 'Update User' : 'Add User')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/users')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserPage;
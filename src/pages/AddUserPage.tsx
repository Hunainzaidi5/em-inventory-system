import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';

// Define the form values type
type FormValues = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  employee_id: string;
};

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([
    'admin',
    'manager',
    'supervisor',
    'technician',
    'viewer'
  ] as const, {
    required_error: 'Please select a role',
  }),
  department: z.string().min(1, 'Department is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
});

const userRoles: UserRole[] = [
  'admin',
  'dev',
  'manager',
  'deputy_manager',
  'engineer',
  'assistant_engineer',
  'master_technician',
  'technician'
];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().refine(
    (val) => userRoles.includes(val as UserRole),
    { message: 'Invalid role' }
  ),
  department: z.string().min(1, 'Department is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
});

const AddUserPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'technician' as UserRole,
      department: '',
      employee_id: '',
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Call the register function from AuthContext
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department,
        employee_id: data.employee_id,
      });

      if (result.success) {
        toast.success('User created successfully');
        // Reset form
        resetForm();
        // Navigate back to users list
        navigate('/users');
      } else {
        const errorMessage = result.error || 'Failed to create user';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New User</h2>
        {errors.root && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{errors.root.message}</div>}
        <div className="mb-4">
          <label htmlFor="name" className="block mb-1 font-medium">Full Name</label>
          <input id="name" {...register('name')} className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : ''}`} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium">Email</label>
          <input id="email" type="email" {...register('email')} className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : ''}`} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 font-medium">Password</label>
          <input id="password" type="password" {...register('password')} className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : ''}`} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="role" className="block mb-1 font-medium">Role</label>
          <select id="role" {...register('role')} className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : ''}`}>
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="department" className="block mb-1 font-medium">Department</label>
          <input id="department" {...register('department')} className={`w-full px-3 py-2 border rounded-md ${errors.department ? 'border-red-500' : ''}`} />
          {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
        </div>
        <div className="mb-6">
          <label htmlFor="employee_id" className="block mb-1 font-medium">Employee ID</label>
          <input id="employee_id" {...register('employee_id')} className={`w-full px-3 py-2 border rounded-md ${errors.employee_id ? 'border-red-500' : ''}`} />
          {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id.message}</p>}
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold">Add User</button>
      </form>
    </div>
  );
};

export default AddUserPage; 
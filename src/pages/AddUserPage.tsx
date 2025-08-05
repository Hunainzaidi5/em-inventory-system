import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const userRoles = [
  'technician',
  'master_technician',
  'assistant_engineer',
  'engineer',
  'deputy_manager',
  'manager',
] as const;

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(userRoles, { required_error: 'Role is required' }),
  department: z.string().min(1, 'Department is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

const AddUserPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'technician',
      department: '',
      employee_id: '',
    },
  });

  const onSubmit = async (data: AddUserFormValues) => {
    try {
      const { success, error } = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department,
        employee_id: data.employee_id,
      });
      if (success) {
        navigate('/users');
      } else if (error) {
        setFormError('root', { message: error });
      }
    } catch (error) {
      setFormError('root', {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New User</h2>
        {errors.root && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {errors.root.message}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select id="role" {...register('role')} className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : ''}`}>
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input id="department" {...register('department')} className={errors.department ? 'border-red-500' : ''} />
            {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
          </div>
          <div>
            <Label htmlFor="employee_id">Employee ID</Label>
            <Input id="employee_id" {...register('employee_id')} className={errors.employee_id ? 'border-red-500' : ''} />
            {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id.message}</p>}
          </div>
        </div>
        <Button type="submit" className="w-full mt-6">Add User</Button>
      </form>
    </div>
  );
};

export default AddUserPage; 
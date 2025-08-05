import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
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

const addUserSchema = z.object({
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

type AddUserFormValues = z.infer<typeof addUserSchema>;

const AddUserPage = () => {
  const { register: registerUser, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only allow developers to access this page
  if (!currentUser || currentUser.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<AddUserFormValues, any, FormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'admin',
      department: '',
      employee_id: '',
    },
  });

  const onSubmit = async (data: AddUserFormValues) => {
    try {
      // Create the user without logging in
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
        department: data.department,
        employee_id: data.employee_id,
      }, false); // Pass false to prevent auto-login
      
      // Show success message
      alert(`User ${data.email} created successfully!`);
      
      // Redirect to users page
      navigate('/users');
    } catch (error) {
      console.error('Error creating user:', error);
      // Show error message to user
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
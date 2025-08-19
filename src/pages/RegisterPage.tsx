import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { env } from '@/config/env';

// Define valid roles (match your Supabase enum exactly)
const userRoles = [
  'technician',
  'master_technician',
  'assistant_engineer',
  'engineer',
  'deputy_manager',
  'manager',
  'dev',
] as const;

// Only show non-privileged roles to regular users (now just filter out 'dev' if needed)
const regularUserRoles = userRoles.filter((role) => role !== 'dev');

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(userRoles, { required_error: 'Role is required' }),
    department: z.string().min(1, 'Department is required'),
    employee_id: z.string().min(1, 'Employee ID is required'),
    avatar: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'dev',
      department: '',
      employee_id: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      // Only allow logged-in dev to register users
      if (user?.role !== 'dev') {
        setFormError('root', { message: 'Only Dev can create users. Please contact your administrator.' });
        return;
      }
      let avatarUrl = '';
      
      // Handle avatar upload if provided
      if (data.avatar && data.avatar.length > 0) {
        const file = data.avatar[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${data.email.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.${fileExt}`;
        
        // For now, we'll store the file name as a placeholder
        // In production, you'd upload to Firebase Storage
        avatarUrl = fileName;
      }

      const result = await authService.register({
        email: data.email,
        password: data.password,
        displayName: data.name,
        role: data.role,
        department: data.department,
        employee_id: data.employee_id,
      });

      if (result.success) {
        // Show a generic registration success message
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setFormError('root', { message: result.message || 'Registration failed' });
      }
    } catch (error) {
      setFormError('root', {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errors.root && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {errors.root.message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} className={errors.confirmPassword ? 'border-red-500' : ''} />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                {...register('role')}
                className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : ''}`}
              >
                {userRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} className={errors.department ? 'border-red-500' : ''} />
              {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input id="employee_id" {...register('employee_id')} className={errors.employee_id ? 'border-red-500' : ''} />
              {errors.employee_id && <p className="text-sm text-red-500">{errors.employee_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture (Optional)</Label>
              <Input 
                id="avatar" 
                type="file" 
                accept="image/*" 
                {...register('avatar')} 
                className={errors.avatar ? 'border-red-500' : ''} 
              />
              {errors.avatar && (
                <p className="text-sm text-red-500">
                  {typeof errors.avatar === 'object' && 'message' in errors.avatar 
                    ? String(errors.avatar.message) 
                    : 'Invalid avatar'}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default RegisterPage;

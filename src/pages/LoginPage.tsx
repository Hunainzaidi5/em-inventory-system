import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  console.log('[DEBUG] LoginPage rendered');
  const [isLoading, setIsLoading] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const { success, error } = await login({
        email: data.email,
        password: data.password,
      });
      if (success) {
        navigate('/dashboard', { replace: true });
      } else if (error) {
        if (error.toLowerCase().includes('email not confirmed')) {
          alert('Your email is not confirmed. Please check your inbox and confirm your email before logging in.');
        }
        setFormError('root', { message: error });
      }
    } catch (error) {
      setFormError('root', { 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#003366' }}>
      <Card className="w-full max-w-md border-0 shadow-2xl" style={{ backgroundColor: '#ffffff' }}>
        <CardHeader className="space-y-1 pb-8">
          <CardTitle className="text-3xl font-bold text-center" style={{ color: '#003366' }}>
            Sign In
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 px-8">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
                {errors.root.message}
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold" style={{ color: '#003366' }}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`h-12 border-2 focus:ring-2 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-[#003366] focus:ring-[#003366] focus:ring-opacity-20'
                }`}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold" style={{ color: '#003366' }}>
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium hover:underline transition-colors duration-200"
                  style={{ color: '#003366' }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`h-12 border-2 focus:ring-2 transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-[#003366] focus:ring-[#003366] focus:ring-opacity-20'
                }`}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-6">
            <Button 
              type="submit" 
              className="w-full h-12 text-white font-semibold text-base transition-all duration-200 hover:shadow-lg disabled:opacity-70"
              disabled={isLoading}
              style={{ 
                backgroundColor: '#003366',
                borderColor: '#003366'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
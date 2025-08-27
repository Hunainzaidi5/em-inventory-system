import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signInTestUser } from '@/utils/testAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  console.log('[DEBUG] LoginPage rendered');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      console.log('Attempting login with email:', data.email);
      setIsLoading(true);
      
      const { success, error } = await login({
        email: data.email,
        password: data.password,
      });
      
      console.log('Login response - success:', success, 'error:', error);
      
      if (success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        setFormError('root', { 
          message: 'Login failed. Please check your credentials and try again.' 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      if (errorMessage.toLowerCase().includes('email not confirmed')) {
        alert('Your email is not confirmed. Please check your inbox and confirm your email before logging in.');
      } else if (errorMessage.toLowerCase().includes('invalid login credentials')) {
        setFormError('root', { 
          message: 'Invalid email or password. Please try again.' 
        });
      } else {
        setFormError('root', { 
          message: errorMessage 
        });
      }
      
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting test login...');
      
      const { success, error } = await signInTestUser();
      
      if (success) {
        console.log('Test login successful, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.error('Test login failed:', error);
        setFormError('root', { 
          message: `Test login failed: ${error}` 
        });
      }
    } catch (error) {
      console.error('Test login error:', error);
      setFormError('root', { 
        message: 'Test login failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Company Branding */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-orange-700 text-white relative overflow-hidden">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

      <div className="text-center space-y-6 px-10 relative z-10">
        <img
          src="/eminventory.png"
          alt="Company Logo"
          className="mx-auto w-40 h-40 object-contain drop-shadow-lg"
        />
        <h1 className="text-4xl font-bold">Welcome to E&M Inventory</h1>
        <p className="text-blue-100/90 text-lg">
          Manage your systems and inventory with ease and efficiency.  
          Sign in to access your dashboard.
        </p>
      </div>
    </div>

    <style>{`
      .bg-grid-pattern {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgba(255,255,255,0.2)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
      }
    `}</style>


      {/* Right Side - Login Box */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              User Login
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your credentials to continue
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Error Message */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                {errors.root.message}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={`pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-700 to-orange-600 hover:from-blue-800 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Login'
              )}
            </Button>

            {/* Test Login Button - Only in development */}
            {import.meta.env.DEV && (
              <div className="mt-4">
                <div className="relative flex items-center py-3">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-gray-500 text-sm">Development</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleTestLogin}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-medium transition-all duration-300"
                  disabled={isLoading}
                >
                  🧪 Test Login (Dev Only)
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
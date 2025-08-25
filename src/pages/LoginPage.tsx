import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
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
        // Handle case where login didn't return a user but didn't throw an error
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ 
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.1) 0px, transparent 50%)'
    }}>
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <Card
        className="w-full max-w-md relative z-10 border-0 shadow-2xl overflow-hidden rounded-2xl"
        style={{ 
          background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
          boxShadow: '0 20px 40px rgba(0, 51, 102, 0.15), 0 0 0 1px rgba(0, 51, 102, 0.05)'
        }}
      >
        {/* Decorative top accent */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-sky-500"></div>
        
        <CardHeader className="space-y-3 pb-6 pt-8 px-8">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-50 p-4 shadow-lg">
              <img 
                src="/eminventory.png"
                alt="E&M Inventory Logo"
                className="w-16 h-16"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Shield className="h-3.5 w-3.5" /> Secure Access Portal
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-slate-500 text-sm">
            Sign in to access your E&M Inventory dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-8">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-start space-x-2.5">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                </div>
                <span>{errors.root.message}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className={`h-12 bg-white text-slate-800 placeholder-slate-400 border-slate-200 pl-11 pr-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'hover:border-slate-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`h-12 bg-white text-slate-800 placeholder-slate-400 border-slate-200 pl-11 pr-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'hover:border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col px-8 pb-8 pt-6">
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg rounded-xl disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2.5">
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Security badge */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-slate-500 text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>256-bit SSL encryption</span>
            </div>

            {/* Test Login Button - Only in development */}
            {import.meta.env.DEV && (
              <div className="mt-5 w-full">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs">Development</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleTestLogin}
                  className="w-full h-10 bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium transition-all duration-300 mt-3 rounded-xl shadow-sm"
                  disabled={isLoading}
                >
                  🧪 Test Login (Dev Only)
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Add the blob animation keyframes to your global CSS or use a CSS-in-JS solution */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
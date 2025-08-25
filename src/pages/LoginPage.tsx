import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Eye, EyeOff, Warehouse } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Professional background with improved visibility */}
      <div className="absolute inset-0 bg-grid-slate-800/20"></div>
      
      {/* Enhanced background image with better visibility */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-slate-900/80 z-0"></div>
        <img 
          src="/eminventory.png" 
          alt="E&M Inventory Background Logo" 
          className="w-full max-w-4xl object-contain opacity-25 z-0"
          style={{ height: '421px', width: '1280px' }}
        />
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-xl opacity-20 animate-blob"></div>
      </div>

      {/* Enhanced professional login card */}
      <Card className="w-full max-w-md relative z-10 border border-white/30 shadow-2xl overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 via-blue-900/80 to-slate-800/80 backdrop-blur-xl">
        {/* Decorative top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
        
        <CardHeader className="space-y-4 pb-6 pt-8 px-8">
          <div className="flex justify-center mb-3">
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/15 p-5 shadow-lg border border-white/30 backdrop-blur-sm">
              <img 
                src="/eminventory.png"
                alt="E&M Inventory Logo"
                className="w-14 h-14"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-white/15 text-blue-100 border border-white/30 backdrop-blur-sm">
              <Warehouse className="h-4 w-4" /> E&M Inventory Management System
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold text-center text-white tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-blue-100/90 text-base font-medium">
            Sign in to access your E&M Inventory dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 px-8">
            {errors.root && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-100 p-4 rounded-lg text-sm flex items-start space-x-3 backdrop-blur-sm">
                <div className="w-5 h-5 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                </div>
                <span className="font-medium">{errors.root.message}</span>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-blue-100">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-200 group-focus-within:text-white transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className={`h-14 bg-white/15 text-white placeholder-blue-200/70 border-white/30 pl-12 pr-4 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                    errors.email ? 'border-red-400/70 focus:ring-red-400 focus:border-red-400' : 'hover:border-white/50'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-300 mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-blue-100">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-200 hover:text-white transition-colors duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-200 group-focus-within:text-white transition-colors" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`h-14 bg-white/15 text-white placeholder-blue-200/70 border-white/30 pl-12 pr-12 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                    errors.password ? 'border-red-400/70 focus:ring-red-400 focus:border-red-400' : 'hover:border-white/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-200 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-300 mt-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col px-8 pb-8 pt-6">
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg disabled:opacity-70 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-base">Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base">Sign In</span>
                  <div className="w-2 h-2 bg-white rounded-full group-hover:animate-pulse"></div>
                </div>
              )}
            </Button>

            {/* Security badge */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-blue-200 text-xs font-medium">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL encryption • Enterprise-grade security</span>
            </div>

            {/* Test Login Button - Only in development */}
            {import.meta.env.DEV && (
              <div className="mt-6 w-full">
                <div className="relative flex items-center py-3">
                  <div className="flex-grow border-t border-white/30"></div>
                  <span className="flex-shrink mx-4 text-blue-200 text-sm">Development</span>
                  <div className="flex-grow border-t border-white/30"></div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleTestLogin}
                  className="w-full h-12 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition-all duration-300 mt-3 rounded-lg border border-amber-400/30 shadow-sm hover:shadow-md"
                  disabled={isLoading}
                >
                  🧪 Test Login (Dev Only)
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Add the blob animation keyframes */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Grid background pattern */
        .bg-grid-slate-800\/20 {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(30 41 59 / 0.2)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
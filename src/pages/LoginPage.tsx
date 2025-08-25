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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-900/20 via-slate-900/30 to-blue-800/20">
      {/* Large Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-15">
        <img 
          src="/eminventory.png" 
          alt="E&M Inventory Background Logo" 
          className="w-full max-w-4xl object-contain"
          style={{ height: '1920px', width: '911px' }}
        />
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-overlay filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-overlay filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Transparent login card */}
      <Card className="w-full max-w-md relative z-10 border border-white/20 shadow-2xl overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/30 via-blue-900/40 to-slate-900/30 backdrop-blur-md">
        {/* Decorative top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"></div>
        
        <CardHeader className="space-y-3 pb-6 pt-8 px-8">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/10 p-4 shadow-lg border border-white/20">
              <img 
                src="/eminventory.png"
                alt="E&M Inventory Logo"
                className="w-12 h-12"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/10 text-blue-100 border border-white/20">
              <Shield className="h-3.5 w-3.5" /> Secure Access Portal
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-center text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-blue-100/90 text-sm">
            Sign in to access your E&M Inventory dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-8">
            {errors.root && (
              <div className="bg-red-400/20 border border-red-400/40 text-red-100 p-3.5 rounded-xl text-sm flex items-start space-x-2.5 backdrop-blur-sm">
                <div className="w-4 h-4 bg-red-400/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                </div>
                <span>{errors.root.message}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium text-blue-100">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-blue-200 group-focus-within:text-white transition-colors" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className={`h-12 bg-white/10 text-white placeholder-blue-200/70 border-white/20 pl-11 pr-4 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                    errors.email ? 'border-red-400/70 focus:ring-red-400 focus:border-red-400' : 'hover:border-white/40'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-300 mt-1.5 flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-blue-100">
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
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-blue-200 group-focus-within:text-white transition-colors" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`h-12 bg-white/10 text-white placeholder-blue-200/70 border-white/20 pl-11 pr-11 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${
                    errors.password ? 'border-red-400/70 focus:ring-red-400 focus:border-red-400' : 'hover:border-white/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-blue-200 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-300 mt-1.5 flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col px-8 pb-8 pt-6">
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl disabled:opacity-70"
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
            <div className="mt-6 flex items-center justify-center space-x-2 text-blue-200 text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>256-bit SSL encryption</span>
            </div>

            {/* Test Login Button - Only in development */}
            {import.meta.env.DEV && (
              <div className="mt-5 w-full">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink mx-4 text-blue-200 text-xs">Development</span>
                  <div className="flex-grow border-t border-white/20"></div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleTestLogin}
                  className="w-full h-10 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-medium transition-all duration-300 mt-3 rounded-xl border border-amber-400/30 shadow-sm"
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
      `}</style>
    </div>
  );
}

export default LoginPage;
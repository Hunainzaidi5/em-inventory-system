import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Eye, EyeOff, Shield, CheckCircle2, AlertCircle, ArrowRight, Fingerprint } from 'lucide-react';
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
  const [isFormTouched, setIsFormTouched] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError: setFormError,
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const watchedFields = watch();

  useEffect(() => {
    if (watchedFields.email || watchedFields.password) {
      setIsFormTouched(true);
    }
  }, [watchedFields]);

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
        setLoginSuccess(true);
        // Add a brief delay to show success state
        setTimeout(() => {
          console.log('Login successful, navigating to dashboard');
          navigate('/dashboard', { replace: true });
        }, 1500);
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
      if (!loginSuccess) {
        setIsLoading(false);
      }
    }
  };

  const handleTestLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting test login...');
      
      const { success, error } = await signInTestUser();
      
      if (success) {
        setLoginSuccess(true);
        setTimeout(() => {
          console.log('Test login successful, navigating to dashboard');
          navigate('/dashboard', { replace: true });
        }, 1500);
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
      if (!loginSuccess) {
        setIsLoading(false);
      }
    }
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-md overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back!</h3>
            <p className="text-slate-600 mb-6">Redirecting you to your dashboard...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.1)_0%,transparent_50%)]"></div>
        </div>
      </div>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-0"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/25 to-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-4000"></div>
      </div>

      {/* Glass morphism container */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-0 shadow-2xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden transition-all duration-500 hover:shadow-3xl hover:bg-white/15">
          {/* Animated top accent */}
          <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 animate-gradient-x"></div>
          
          <CardHeader className="space-y-6 pb-8 pt-10 px-8">
            {/* Logo with glow effect */}
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/20 to-white/5 p-4 shadow-2xl border border-white/30 backdrop-blur-sm group hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl blur opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <img 
                  src="/eminventory.png"
                  alt="E&M Inventory Logo"
                  className="w-16 h-16 relative z-10"
                />
              </div>
            </div>
            
            {/* Security badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white border border-white/20 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <Fingerprint className="h-3.5 w-3.5" />
                <span>Secure Authentication</span>
              </div>
            </div>
            
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-blue-100/80 text-sm leading-relaxed">
              Access your E&M Inventory management system with enterprise-grade security
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 px-8">
              {/* Error message with enhanced styling */}
              {errors.root && (
                <div className="bg-red-500/10 border border-red-400/30 text-red-300 p-4 rounded-2xl text-sm flex items-start space-x-3 backdrop-blur-sm animate-shake">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="leading-relaxed">{errors.root.message}</span>
                </div>
              )}

              {/* Email field with enhanced styling */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-white/40 group-focus-within:text-blue-400 transition-colors duration-300" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email')}
                    className={`h-14 bg-white/5 text-white placeholder-white/50 border-white/20 pl-12 pr-4 rounded-2xl transition-all duration-300 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-white/10 backdrop-blur-sm ${
                      errors.email ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50' : 'hover:border-white/30 hover:bg-white/8'
                    } ${!errors.email && watchedFields.email && isValid ? 'border-emerald-400/50' : ''}`}
                  />
                  {!errors.email && watchedFields.email && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-300 mt-2 flex items-center space-x-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Password field with enhanced styling */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors duration-300 hover:underline flex items-center gap-1 group"
                  >
                    Forgot password?
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-white/40 group-focus-within:text-blue-400 transition-colors duration-300" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={`h-14 bg-white/5 text-white placeholder-white/50 border-white/20 pl-12 pr-12 rounded-2xl transition-all duration-300 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-white/10 backdrop-blur-sm ${
                      errors.password ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50' : 'hover:border-white/30 hover:bg-white/8'
                    } ${!errors.password && watchedFields.password && watchedFields.password.length > 0 ? 'border-emerald-400/50' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50 hover:text-white/80 transition-colors duration-300 z-10"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 mt-2 flex items-center space-x-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col px-8 pb-10 pt-6">
              {/* Enhanced submit button */}
              <Button 
                type="submit" 
                className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl disabled:opacity-50 group relative overflow-hidden"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <span>Sign In Securely</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>

              {/* Security information */}
              <div className="mt-8 flex items-center justify-center space-x-3 text-white/60 text-xs">
                <Shield className="w-4 h-4" />
                <span>Protected by 256-bit AES encryption</span>
              </div>

              {/* Development test login */}
              {import.meta.env.DEV && (
                <div className="mt-8 w-full">
                  <div className="relative flex items-center py-3">
                    <div className="flex-grow border-t border-white/20"></div>
                    <span className="flex-shrink mx-4 text-white/50 text-xs">Development Mode</span>
                    <div className="flex-grow border-t border-white/20"></div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleTestLogin}
                    className="w-full h-12 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition-all duration-300 mt-4 rounded-2xl shadow-md border border-amber-400/30 backdrop-blur-sm"
                    disabled={isLoading}
                  >
                    🧪 Test Login (Development)
                  </Button>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Enhanced CSS animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(-20px, -30px) scale(1.05);
          }
          50% {
            transform: translate(20px, -20px) scale(0.95);
          }
          75% {
            transform: translate(-10px, 10px) scale(1.02);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-float {
          animation: float 8s infinite ease-in-out;
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animation-delay-0 {
          animation-delay: 0s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.4);
        }
      `}} />
    </div>
  );
}

export default LoginPage;
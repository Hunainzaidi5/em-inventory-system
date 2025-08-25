import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/50"></div>
      
      {/* Floating orbs with enhanced animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-sky-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-300/15 to-purple-300/15 rounded-full mix-blend-multiply filter blur-3xl animate-float-slower"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-cyan-300/10 to-blue-300/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-gentle"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23000000' fill-opacity='1'%3e%3cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`
      }}></div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl overflow-hidden rounded-3xl backdrop-blur-sm bg-white/95 transition-all duration-500 hover:shadow-3xl animate-fade-in">
        {/* Enhanced decorative top accent with gradient animation */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 animate-gradient-x"></div>
        
        <CardHeader className="space-y-4 pb-6 pt-10 px-8 text-center">
          {/* Logo with enhanced styling */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity duration-300 animate-pulse-gentle"></div>
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-white to-slate-50 p-4 shadow-xl ring-1 ring-slate-200/50 transition-transform duration-300 group-hover:scale-105">
                <img 
                  src="/eminventory.png"
                  alt="E&M Inventory Logo"
                  className="w-16 h-16 drop-shadow-sm"
                />
              </div>
              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
          
          {/* Security badge with enhanced styling */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-2xl px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
              <Shield className="h-4 w-4 animate-pulse" />
              <span>Secure Access Portal</span>
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent animate-fade-in-up">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-500 text-base leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Sign in to access your E&M Inventory dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 px-8">
            {/* Enhanced error display */}
            {errors.root && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 text-red-700 p-4 rounded-2xl text-sm flex items-start space-x-3 animate-shake shadow-sm">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <span className="leading-relaxed">{errors.root.message}</span>
              </div>
            )}

            {/* Enhanced email field */}
            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className={`h-14 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 border-slate-200/60 pl-12 pr-4 rounded-2xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:bg-white hover:shadow-md group-hover:border-slate-300 ${
                    errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400 animate-pulse' : ''
                  }`}
                />
                {/* Focus ring enhancement */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/0 group-focus-within:ring-blue-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-2 flex items-center space-x-2 animate-slide-in">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Enhanced password field */}
            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-500" />
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-all duration-300 hover:underline relative group"
                >
                  Forgot password?
                  <div className="absolute inset-0 bg-blue-100 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 -m-1"></div>
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`h-14 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 border-slate-200/60 pl-12 pr-12 rounded-2xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 hover:bg-white hover:shadow-md group-hover:border-slate-300 ${
                    errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400 animate-pulse' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-all duration-300 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {/* Focus ring enhancement */}
                <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/0 group-focus-within:ring-blue-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-2 flex items-center space-x-2 animate-slide-in">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col px-8 pb-8 pt-6">
            {/* Enhanced sign in button */}
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl disabled:opacity-70 transform hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </Button>

            {/* Enhanced security badge */}
            <div className="mt-8 flex items-center justify-center space-x-2.5 text-slate-500 text-xs animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/60">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">256-bit SSL encryption</span>
              </div>
            </div>

            {/* Enhanced test login button */}
            {import.meta.env.DEV && (
              <div className="mt-6 w-full animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="relative flex items-center py-3">
                  <div className="flex-grow border-t border-slate-200/60"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs font-medium bg-white px-3 py-1 rounded-full border border-slate-200/60">Development Mode</span>
                  <div className="flex-grow border-t border-slate-200/60"></div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleTestLogin}
                  className="w-full h-12 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-amber-800 font-medium transition-all duration-300 mt-3 rounded-2xl shadow-sm hover:shadow-md border border-amber-200/60 transform hover:scale-[1.01]"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-2">
                    <span>🧪</span>
                    <span>Test Login (Dev Only)</span>
                  </div>
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Enhanced CSS animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(20px, -20px) rotate(1deg); }
          66% { transform: translate(-10px, 15px) rotate(-1deg); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-15px, -25px) rotate(-0.5deg); }
          50% { transform: translate(25px, -10px) rotate(1deg); }
          75% { transform: translate(-20px, 20px) rotate(-1deg); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        @keyframes slide-in {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        .animate-pulse-gentle { animation: pulse-gentle 4s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
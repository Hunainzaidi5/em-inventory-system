import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-10 animate-pulse"
          style={{ backgroundColor: '#003366' }}
        ></div>
        <div 
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-5"
          style={{ backgroundColor: '#003366' }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full opacity-10 animate-bounce"
          style={{ backgroundColor: '#003366', animationDuration: '3s' }}
        ></div>
      </div>

      <Card className="w-full max-w-lg border-0 shadow-2xl relative z-10 backdrop-blur-sm" style={{ backgroundColor: '#003366' }}>
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-white to-blue-400"></div>
        
        <CardHeader className="space-y-2 pb-8 pt-12">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center backdrop-blur-sm p-3">
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDgwMCA4MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjQwMCIgY3k9IjQwMCIgcj0iMzkwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjIwIi8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTcwIDEyMEwxODAgMTAwTDIwMCAxMjBMMjIwIDEwMEwyNDAgMTIwTDI2MCA4MEwyODAgMTAwTDMxMCA4MEwzNDAgMTAwTDM4MCA4MEw0MTAgMTAwTDQ1MCA4MEw0ODAgMTAwTDUyMCA2MEw1NTAgMTAwTDU5MCA4MEw2MjAgMTAwTDY1MCA2MEw2ODAgMTAwTDcwMCA1MEw3MjAgMTAwTDc1MCA2MEw3ODAgMTAwTDc1MCA0NDBMNzIwIDQ2MEw3MDAgNDIwTDY4MCA0NDBMNjUwIDQyMEw2MjAgNDQwTDU5MCA0MDBMNTUwIDQyMEw1MjAgMzgwTDQ4MCA0MDBMNDUwIDM2MEw0MTAgMzgwTDM4MCAzNDBMMzQwIDM2MEwzMTAgMzIwTDI4MCAzNDBMMjYwIDMwMEwyNDAgMzIwTDIyMCAyODBMMjAwIDMwMEwxODAgMjYwTDE3MCAyODBMMTAwIDIyMFoiIGZpbGw9IiMzMzQxNTUiLz4KPHJlY3QgeD0iMzIwIiB5PSIxNDAiIHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRkY4NTAwIiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS13aWR0aD0iNCIvPgo8cmVjdCB4PSIzNDAiIHk9IjE2MCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxyZWN0IHg9IjM1MCIgeT0iMTQ1IiB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzQxNTUiLz4KPHA+PC9wPgo8dGV4dCB4PSI0MDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjMwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzNDE1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+JDwvdGV4dD4KPHBhdGggZD0iTTE4MCAzMDBMMjAwIDMzMEwyMjAgMzEwTDI0MCAzNDBMMjgwIDM1MEwyNjAgMzcwTDMwMCAzODBMMzUwIDM1MEwzNzAgMzcwTDM1MCA0MDBMMzIwIDQyMEwyODAgNDAwTDI0MCA0MjBMMjAwIDQxMEwxNjAgNDMwTDE0MCA0MDBMMTIwIDQyMEwxMTAgMzgwTDEzMCAzNTBMMTUwIDMyMEwxODAgMzAwWiIgZmlsbD0iIzAwN0JCOCIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjMiLz4KPHBhdGggZD0iTTYyMCAzMDBMNjAwIDMzMEw1ODAgMzEwTDU2MCAzNDBMNTIwIDM1MEw1NDAgMzcwTDUwMCAzODBMNDUwIDM1MEw0MzAgMzcwTDQ1MCA0MDBMNDgwIDQyMEw1MjAgNDAwTDU2MCA0MjBMNjAwIDQxMEw2NDAgNDMwTDY2MCA0MDBMNjgwIDQyMEw2OTAgMzgwTDY3MCAzNTBMNjUwIDMyMEw2MjAgMzAwWiIgZmlsbD0iIzAwN0JCOCIgc3Ryb2tlPSIjMzM0MTU1IiBzdHJva2Utd2lkdGg9IjMiLz4KPHJlY3QgeD0iMzgwIiB5PSIzMDAiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRjI2MjYiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxyZWN0IHg9IjM3MCIgeT0iMzMwIiB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIGZpbGw9IiNGRjI2MjYiIHN0cm9rZT0iIzMzNDE1NSIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxyZWN0IHg9IjM3NSIgeT0iNDgwIiB3aWR0aD0iNTAiIGhlaWdodD0iMjAiIGZpbGw9IiMzMzQxNTUiLz4KPHJlY3QgeD0iMzAwIiB5PSI1MDAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMwMDdCQjgiIHN0cm9rZS13aWR0aD0iMyIvPgo8Y2lyY2xlIGN4PSIzNDAiIGN5PSI1MTUiIHI9IjUiIGZpbGw9IiMwMDdCQjgiLz4KPGxpbmUgeDE9IjM1NSIgeTE9IjUyNSIgeDI9IjM3NSIgeTI9IjUyNSIgc3Ryb2tlPSIjMDA3QkI4IiBzdHJva2Utd2lkdGg9IjMiLz4KPGxpbmUgeDE9IjMxNSIgeTE9IjUzNSIgeDI9IjM3NSIgeTI9IjUzNSIgc3Ryb2tlPSIjMDA3QkI4IiBzdHJva2Utd2lkdGg9IjMiLz4KPGxpbmUgeDE9IjMxNSIgeTE9IjU0NSIgeDI9IjM0NSIgeTI9IjU0NSIgc3Ryb2tlPSIjMDA3QkI4IiBzdHJva2Utd2lkdGg9IjMiLz4KPHJlY3QgeD0iMzEwIiB5PSI1NzAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIyNSIgZmlsbD0iI0ZGODUwMCIvPgo8cGF0aCBkPSJNMzQwIDU5NUwzNTAgNTg1TDM2MCA1OTVaIiBmaWxsPSIjRkY4NTAwIi8+CjxjaXJjbGUgY3g9IjU1MCIgY3k9IjM5MCIgcj0iMzAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMwMDdCQjgiIHN0cm9rZS13aWR0aD0iNCIvPgo8L3N2Zz4K"
                alt="Service Icon" 
                className="w-full h-full object-contain filter brightness-0 invert"
              />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-center text-white tracking-tight">
            Secure Access
          </CardTitle>
          <CardDescription className="text-center text-blue-100 text-lg font-medium">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 px-8">
            {errors.root && (
              <div className="bg-red-500 bg-opacity-20 border border-red-300 text-red-100 p-4 rounded-xl text-sm backdrop-blur-sm animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                  <span>{errors.root.message}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Label htmlFor="email" className="text-sm font-semibold text-blue-100 flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className={`h-14 bg-white bg-opacity-10 border-2 border-white border-opacity-30 text-white placeholder-blue-200 backdrop-blur-sm transition-all duration-300 focus:bg-opacity-20 focus:border-white focus:border-opacity-60 focus:ring-4 focus:ring-white focus:ring-opacity-20 hover:bg-opacity-15 ${
                    errors.email 
                      ? 'border-red-400 border-opacity-70 focus:border-red-400 focus:ring-red-400' 
                      : ''
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
              </div>
              {errors.email && (
                <p className="text-sm text-red-300 mt-2 flex items-center space-x-2 animate-pulse">
                  <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-blue-100 flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-200 hover:text-white transition-colors duration-300 hover:underline decoration-dotted underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`h-14 bg-white bg-opacity-10 border-2 border-white border-opacity-30 text-white placeholder-blue-200 backdrop-blur-sm transition-all duration-300 focus:bg-opacity-20 focus:border-white focus:border-opacity-60 focus:ring-4 focus:ring-white focus:ring-opacity-20 hover:bg-opacity-15 pr-12 ${
                    errors.password 
                      ? 'border-red-400 border-opacity-70 focus:border-red-400 focus:ring-red-400' 
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
              </div>
              {errors.password && (
                <p className="text-sm text-red-300 mt-2 flex items-center space-x-2 animate-pulse">
                  <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-10 pt-6">
            <Button 
              type="submit" 
              className="w-full h-14 bg-white text-navy-900 font-bold text-lg transition-all duration-300 hover:bg-blue-50 hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 disabled:hover:bg-white group relative overflow-hidden"
              disabled={isLoading}
              style={{ 
                backgroundColor: '#ffffff',
                color: '#003366'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="animate-pulse">Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <span>Sign In Securely</span>
                  <div className="w-2 h-2 bg-current rounded-full group-hover:animate-bounce"></div>
                </div>
              )}
            </Button>

            {/* Security Badge */}
            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-2 text-blue-200 text-xs font-medium">
                <Lock className="w-3 h-3" />
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>
          </CardFooter>
        </form>

        {/* Decorative Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-white to-blue-400"></div>
      </Card>
    </div>
  );
}

export default LoginPage;
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Warehouse, 
  AlertCircle,
  CheckCircle,
  XCircle,
  WifiOff,
  ArrowRight,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Enhanced validation with password strength
const passwordStrengthRegex = {
  weak: /^.{1,5}$/,
  fair: /^(?=.*[a-z]).{6,7}$/,
  good: /^(?=.*[a-z])(?=.*[A-Z]).{8,11}$/,
  strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/,
  veryStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/,
};

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .refine((email) => !email.includes('+'), 'Plus addressing is not supported'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Enhanced error types with recovery suggestions
const ERROR_TYPES = {
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  INVALID_CREDENTIALS: 'invalid_credentials',
  RATE_LIMITED: 'rate_limited',
  NETWORK_ERROR: 'network_error',
  SERVER_ERROR: 'server_error',
  ACCOUNT_LOCKED: 'account_locked',
  MAINTENANCE: 'maintenance',
  UNKNOWN: 'unknown',
} as const;

// Fixed error configuration with consistent structure
const ERROR_CONFIG = {
  [ERROR_TYPES.EMAIL_NOT_CONFIRMED]: {
    title: 'Email Verification Required',
    message: 'Please check your inbox and verify your email address to continue.',
    type: 'warning' as const,
    action: 'Resend verification email',
    recoverable: true,
  },
  [ERROR_TYPES.INVALID_CREDENTIALS]: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect.',
    type: 'error' as const,
    action: 'Reset password',
    recoverable: true,
  },
  [ERROR_TYPES.RATE_LIMITED]: {
    title: 'Too Many Attempts',
    message: 'Too many failed attempts. Please wait 15 minutes before trying again.',
    type: 'error' as const,
    action: 'Try again later',
    recoverable: false,
  },
  [ERROR_TYPES.NETWORK_ERROR]: {
    title: 'Connection Issue',
    message: 'Unable to connect to our servers. Please check your internet connection.',
    type: 'error' as const,
    action: 'Retry connection',
    recoverable: true,
  },
  [ERROR_TYPES.ACCOUNT_LOCKED]: {
    title: 'Account Temporarily Locked',
    message: 'Your account has been locked due to suspicious activity.',
    type: 'error' as const,
    action: 'Contact support',
    recoverable: false,
  },
  [ERROR_TYPES.SERVER_ERROR]: {
    title: 'Server Maintenance',
    message: 'Our servers are currently under maintenance. Please try again later.',
    type: 'error' as const,
    action: 'Try again later',
    recoverable: false,
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    type: 'error' as const,
    action: 'Try again',
    recoverable: true,
  },
} as const;

// Define the error type for state
type ErrorState = {
  title: string;
  message: string;
  type: 'warning' | 'error';
  action?: string;
  recoverable: boolean;
};

// Hooks
const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

const usePasswordStrength = (password: string) => {
  return useMemo(() => {
    if (!password) return { strength: 0, level: 'none', color: 'bg-gray-200' };
    
    if (passwordStrengthRegex.veryStrong.test(password)) {
      return { strength: 100, level: 'very strong', color: 'bg-emerald-500' };
    }
    if (passwordStrengthRegex.strong.test(password)) {
      return { strength: 80, level: 'strong', color: 'bg-green-500' };
    }
    if (passwordStrengthRegex.good.test(password)) {
      return { strength: 60, level: 'good', color: 'bg-yellow-500' };
    }
    if (passwordStrengthRegex.fair.test(password)) {
      return { strength: 40, level: 'fair', color: 'bg-orange-500' };
    }
    return { strength: 20, level: 'weak', color: 'bg-red-500' };
  }, [password]);
};

// Enhanced Components
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
    <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-orange-100 via-blue-50 to-orange-200" />
    
    {/* Small floating particles */}
    <div className="absolute inset-0">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-1 h-1 rounded-full animate-float ${
            i % 4 === 0 ? 'bg-orange-400' : 
            i % 4 === 1 ? 'bg-blue-400' : 
            i % 4 === 2 ? 'bg-amber-400' : 'bg-orange-300'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
    
    {/* Medium drifting particles */}
    <div className="absolute inset-0">
      {[...Array(15)].map((_, i) => (
        <div
          key={`medium-${i}`}
          className={`absolute w-2 h-2 rounded-full animate-drift opacity-50 ${
            i % 3 === 0 ? 'bg-orange-300' : 
            i % 3 === 1 ? 'bg-blue-300' : 'bg-amber-300'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
    
    {/* Large pulsing particles */}
    <div className="absolute inset-0">
      {[...Array(8)].map((_, i) => (
        <div
          key={`large-${i}`}
          className={`absolute w-3 h-3 rounded-full animate-pulse opacity-30 ${
            i % 2 === 0 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
    
    {/* Micro particles for subtle movement */}
    <div className="absolute inset-0">
      {[...Array(50)].map((_, i) => (
        <div
          key={`micro-${i}`}
          className={`absolute w-0.5 h-0.5 rounded-full animate-pulse opacity-60 ${
            i % 3 === 0 ? 'bg-orange-400' : 
            i % 3 === 1 ? 'bg-blue-400' : 'bg-amber-400'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
    
    {/* Gradient blobs */}
    <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-soft-light filter blur-xl opacity-25 animate-blob animation-delay-2000 bg-amber-300" />
    <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-soft-light filter blur-xl opacity-25 animate-blob animation-delay-4000 bg-orange-300" />
    <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full mix-blend-soft-light filter blur-xl opacity-20 animate-blob bg-blue-300" />
    <div className="absolute top-2/3 right-1/3 w-48 h-48 rounded-full mix-blend-soft-light filter blur-xl opacity-15 animate-blob bg-orange-400" />
    <div className="absolute bottom-1/4 left-1/3 w-56 h-56 rounded-full mix-blend-soft-light filter blur-xl opacity-18 animate-blob bg-amber-400" />
  </div>
);

const BrandingSection = ({ isDark }: { isDark: boolean }) => (
  <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-orange-400 text-white">
    {/* Enhanced background overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-orange-500/80" />
    
    {/* Grid Pattern Overlay */}
    <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
    
    {/* Animated background logo */}
    <div className="absolute inset-0 flex items-center justify-center opacity-5">
      <img 
        src="/logo.png" 
        alt=""
        className="w-full max-w-2xl object-contain animate-pulse"
        aria-hidden="true"
      />
    </div>

    {/* Content */}
    <div className="relative z-10 text-left max-w-lg space-y-8">
      {/* Enhanced logo section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-orange-300/30 backdrop-blur-sm">
            <Warehouse className="w-8 h-8 text-orange-100" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-blue-900" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold uppercase tracking-wide text-orange-50">
            E&M Inventory
          </div>
          <div className="text-sm text-orange-200/80">Management System</div>
        </div>
      </div>

      {/* Enhanced welcome message */}
      <div className="space-y-6">
        <h1 className="text-5xl font-extrabold leading-tight bg-gradient-to-r from-orange-400 to-indigo-400 bg-clip-text text-transparent">
          Welcome to the E&M Inventory Management
        </h1>
        <p className="text-xl text-orange-100/90 leading-relaxed">
        Your all-in-one platform for managing, tracking, and streamlining 
        E&M inventory with accuracy and efficiency. 
        Stay organized, improve visibility, and simplify operations all in one place.
        </p>
      </div>

      {/* Decorative elements */}
      <div className="flex gap-3 mt-8">
        <div className="w-16 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full opacity-80" />
        <div className="w-12 h-3 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full opacity-70" />
        <div className="w-8 h-3 bg-gradient-to-r from-blue-300 to-orange-300 rounded-full opacity-60" />
      </div>
    </div>
  </div>
);

const ConnectionStatus = ({ isOnline }: { isOnline: boolean }) => (
  <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isOnline ? 'opacity-0' : 'opacity-100'}`}>
    <Badge variant="destructive" className="flex items-center gap-2 px-3 py-2">
      <WifiOff className="w-4 h-4" />
      Offline
    </Badge>
  </div>
);

const PasswordStrengthIndicator = ({ password, show }: { password: string; show: boolean }) => {
  const { strength, level, color } = usePasswordStrength(password);
  
  if (!show || !password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-amber-600">Password strength</span>
        <span className={`font-medium capitalize ${
          strength >= 80 ? 'text-green-600' : 
          strength >= 60 ? 'text-yellow-600' : 
          strength >= 40 ? 'text-orange-600' : 
          'text-red-600'
        }`}>
          {level}
        </span>
      </div>
      <Progress value={strength} className="h-2" />
    </div>
  );
};

const EnhancedErrorAlert = ({ 
  error, 
  onAction, 
  onDismiss 
}: { 
  error: ErrorState; 
  onAction?: () => void; 
  onDismiss?: () => void; 
}) => (
  <Alert variant={error.type === 'warning' ? 'default' : 'destructive'} className="mb-6">
    <div className="flex items-start space-x-3">
      {error.type === 'warning' ? (
        <AlertCircle className="h-5 w-5 text-orange-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}
      <div className="flex-1 space-y-2">
        <AlertDescription>
          <div className="font-semibold text-sm mb-1">{error.title}</div>
          <div className="text-sm">{error.message}</div>
        </AlertDescription>
        {error.action && error.recoverable && onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="mt-2 h-8 text-xs"
          >
            {error.action}
          </Button>
        )}
      </div>
    </div>
  </Alert>
);

// Main Component
export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<ErrorState | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastLoginAttempt, setLastLoginAttempt] = useState<Date | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useConnectionStatus();
  const isDark = false;
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  // Memoized values
  const redirectPath = useMemo(() => 
    (location.state as any)?.from?.pathname || '/dashboard', 
    [location.state]
  );

  const isRateLimited = useMemo(() => {
    if (!lastLoginAttempt || loginAttempts < 3) return false;
    const timeSinceLastAttempt = Date.now() - lastLoginAttempt.getTime();
    return timeSinceLastAttempt < 15 * 60 * 1000; // 15 minutes
  }, [loginAttempts, lastLoginAttempt]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { 
      email: '', 
      password: '', 
      rememberMe: false 
    },
    mode: 'onChange',
  });

  const watchedPassword = form.watch('password');

  // Enhanced error classification
  const classifyError = useCallback((errorMessage: string): keyof typeof ERROR_CONFIG => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('email not confirmed') || lowerError.includes('not verified')) {
      return ERROR_TYPES.EMAIL_NOT_CONFIRMED;
    }
    if (lowerError.includes('invalid') || lowerError.includes('incorrect')) {
      return ERROR_TYPES.INVALID_CREDENTIALS;
    }
    if (lowerError.includes('too many') || lowerError.includes('rate limit')) {
      return ERROR_TYPES.RATE_LIMITED;
    }
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return ERROR_TYPES.NETWORK_ERROR;
    }
    if (lowerError.includes('locked') || lowerError.includes('suspended')) {
      return ERROR_TYPES.ACCOUNT_LOCKED;
    }
    if (lowerError.includes('maintenance') || lowerError.includes('unavailable')) {
      return ERROR_TYPES.SERVER_ERROR;
    }
    
    return ERROR_TYPES.UNKNOWN;
  }, []);

  // Enhanced submit handler
  const handleSubmit = useCallback(async (data: LoginFormValues) => {
    if (!isOnline) {
      setLoginError({ ...ERROR_CONFIG[ERROR_TYPES.NETWORK_ERROR] });
      return;
    }

    if (isRateLimited) {
      setLoginError({ ...ERROR_CONFIG[ERROR_TYPES.RATE_LIMITED] });
      return;
    }

    try {
      setIsLoading(true);
      setLoginError(null);
      
      console.log('Login attempt:', { email: data.email, timestamp: new Date().toISOString() });
      
      const loginCredentials = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        rememberMe: data.rememberMe,
      };
      
      const result = await login(loginCredentials);
      
      if (result.success) {
        console.log('Login successful:', { redirectPath });
        
        // Reset attempts on success
        setLoginAttempts(0);
        setLastLoginAttempt(null);
        
        // Navigate with success state
        navigate(redirectPath, { 
          replace: true, 
          state: { loginSuccess: true } 
        });
      } else {
        // Track failed attempts
        setLoginAttempts(prev => prev + 1);
        setLastLoginAttempt(new Date());
        
        const errorType = classifyError(result.error || 'Login failed');
        setLoginError({ ...ERROR_CONFIG[errorType] });
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      setLastLoginAttempt(new Date());
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const errorType = classifyError(errorMessage);
      setLoginError({ ...ERROR_CONFIG[errorType] });
      
      console.error('Login error:', { error, attempts: loginAttempts + 1 });
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate, redirectPath, classifyError, isOnline, isRateLimited, loginAttempts]);

  // Error recovery actions
  const handleErrorAction = useCallback(() => {
    if (!loginError) return;

    switch (loginError.title) {
      case 'Email Verification Required':
        // Implement resend verification
        console.log('Resending verification email...');
        break;
      case 'Invalid Credentials':
        // Navigate to password reset
        navigate('/forgot-password');
        break;
      case 'Connection Issue':
        // Retry connection
        setLoginError(null);
        break;
      default:
        setLoginError(null);
    }
  }, [loginError, navigate]);

  // Auto-focus email input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 bg-gradient-to-br from-orange-100 via-blue-50 to-orange-200">
      <AnimatedBackground />
      <ConnectionStatus isOnline={isOnline} />

      {/* Main container */}
      <div className="w-full max-w-7xl mx-auto rounded-3xl shadow-2xl overflow-hidden relative flex flex-col lg:flex-row bg-transparent z-10">
        <BrandingSection isDark={false} />

        {/* Login section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-orange-50 to-blue-50">
          <Card className="w-full max-w-md border shadow-2xl rounded-2xl bg-gradient-to-br from-orange-50/90 to-blue-50/90 backdrop-blur-sm border-orange-200/50 text-orange-900 card-plain relative overflow-hidden">
            {/* Animated particles for card */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-1 rounded-full animate-float ${
                    i % 3 === 0 ? 'bg-orange-400' : 
                    i % 3 === 1 ? 'bg-blue-400' : 'bg-amber-400'
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 4}s`,
                    animationDuration: `${6 + Math.random() * 3}s`,
                  }}
                />
              ))}
              {/* Larger floating particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`large-${i}`}
                  className={`absolute w-2 h-2 rounded-full animate-drift opacity-60 ${
                    i % 2 === 0 ? 'bg-orange-300' : 'bg-blue-300'
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${8 + Math.random() * 4}s`,
                  }}
                />
              ))}
              {/* Medium particles with pulse */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={`medium-${i}`}
                  className={`absolute w-1.5 h-1.5 rounded-full animate-pulse opacity-40 ${
                    i % 2 === 0 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
              {/* Subtle gradient orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full mix-blend-soft-light filter blur-xl opacity-20 animate-blob bg-orange-300" />
              <div className="absolute -bottom-20 -left-20 w-32 h-32 rounded-full mix-blend-soft-light filter blur-xl opacity-15 animate-blob bg-blue-300" />
              <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full mix-blend-soft-light filter blur-xl opacity-10 animate-blob bg-amber-300" />
            </div>
            <CardHeader className="space-y-6 pb-6 pt-8 px-8 relative z-10">
              {/* Enhanced logo section */}
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-3xl flex items-center justify-center">
                    <img 
                      src="/eminventory.png"
                      alt="E&M Inventory Logo"
                      className="w-40 h-40"
                    />
                  </div>
                </div>
              </div>
              
              
              <div className="text-center space-y-3">
                <CardTitle className="text-4xl font-bold tracking-tight text-orange-900">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base font-medium text-orange-700">
                  Sign in to access your comprehensive inventory dashboard
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-0">
              <CardContent className="space-y-6 px-8 relative z-10">
                {/* Enhanced error display */}
                {loginError && (
                  <EnhancedErrorAlert 
                    error={loginError} 
                    onAction={handleErrorAction}
                    onDismiss={() => setLoginError(null)}
                  />
                )}

                {/* Rate limiting warning */}
                {loginAttempts >= 2 && !isRateLimited && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Security Notice:</span> {3 - loginAttempts} attempt{3 - loginAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Enhanced email field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-orange-800">
                    Email Address *
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Mail className={`h-5 w-5 transition-colors ${
                        form.formState.errors.email 
                          ? 'text-red-500' 
                          : 'text-orange-600 group-focus-within:text-blue-600'
                      }`} />
                    </div>
                    <Input
                      ref={emailInputRef}
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      autoComplete="email"
                      aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                      {...form.register('email')}
                      className={`h-14 text-orange-900 placeholder-orange-400 border pl-12 pr-4 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-orange-50/50 ${
                        form.formState.errors.email 
                          ? 'border-red-400/70 focus:ring-red-200 focus:border-red-400' 
                          : 'hover:border-orange-300'
                      }`}
                    />
                    {form.formState.errors.email ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                    ) : form.watch('email') && !form.formState.errors.email ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    ) : null}
                  </div>
                  {form.formState.errors.email && (
                    <p id="email-error" className="text-sm text-red-600 mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                      <span>{form.formState.errors.email.message}</span>
                    </p>
                  )}
                </div>

                {/* Enhanced password field */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-semibold text-orange-800">
                      Password *
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-orange-600 hover:text-blue-600 transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-200 rounded px-1 py-0.5"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className={`h-5 w-5 transition-colors ${
                        form.formState.errors.password 
                          ? 'text-red-500' 
                          : 'text-orange-600 group-focus-within:text-blue-600'
                      }`} />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
                      {...form.register('password')}
                      className={`h-14 text-orange-900 placeholder-orange-400 border pl-12 pr-20 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-orange-50/50 ${
                        form.formState.errors.password 
                          ? 'border-red-400/70 focus:ring-red-200 focus:border-red-400' 
                          : 'hover:border-orange-300'
                      }`}
                    />
                    
                    {/* Password visibility toggle */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <div className="flex items-center gap-2">
                        {form.formState.errors.password ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : watchedPassword && !form.formState.errors.password ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-orange-500 hover:text-orange-700"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Password strength indicator */}
                  <PasswordStrengthIndicator password={watchedPassword} show={!!watchedPassword && !form.formState.errors.password} />
                  
                  {form.formState.errors.password && (
                    <p id="password-error" className="text-sm text-red-600 mt-2 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                      <span>{form.formState.errors.password.message}</span>
                    </p>
                  )}
                </div>

                {/* Remember me checkbox */}
                <div className="flex items-center space-x-3 pt-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...form.register('rememberMe')}
                    className="w-4 h-4 text-orange-600 bg-orange-50 border-orange-300 rounded focus:ring-orange-500 focus:ring-2 transition-colors"
                  />
                  <Label 
                    htmlFor="rememberMe" 
                    className="text-sm font-medium cursor-pointer select-none text-orange-800"
                  >
                    Keep me signed in for 30 days
                  </Label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col px-8 pb-8 pt-6 space-y-4 relative z-10">
                {/* Enhanced submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-16 bg-gradient-to-r from-orange-600 via-blue-500 to-orange-700 hover:from-orange-700 hover:via-blue-600 hover:to-orange-800 text-white font-bold transition-all duration-500 shadow-2xl hover:shadow-3xl rounded-xl disabled:opacity-70 group relative overflow-hidden"
                  disabled={isLoading || isRateLimited || !form.formState.isValid}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-blue-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 flex items-center justify-center space-x-3">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-lg">Signing in...</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-100" />
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-200" />
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-semibold">Sign In to Dashboard</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </Button>

              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Enhanced CSS with additional animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { 
            transform: translate(0px, 0px) scale(1) rotate(0deg); 
          }
          33% { 
            transform: translate(30px, -50px) scale(1.1) rotate(120deg); 
          }
          66% { 
            transform: translate(-20px, 20px) scale(0.9) rotate(240deg); 
          }
        }
        
        @keyframes bounce {
          0%, 100% { 
            transform: translateY(0); 
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1); 
          }
          50% { 
            transform: translateY(-25%); 
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
          }
          25% { 
            transform: translateY(-10px) translateX(5px); 
          }
          50% { 
            transform: translateY(-5px) translateX(-3px); 
          }
          75% { 
            transform: translateY(-15px) translateX(8px); 
          }
        }
        
        @keyframes drift {
          0%, 100% { 
            transform: translateX(0px) translateY(0px); 
          }
          33% { 
            transform: translateX(20px) translateY(-10px); 
          }
          66% { 
            transform: translateX(-15px) translateY(5px); 
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 8s ease-in-out infinite;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Enhanced shadow utilities */
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Custom focus styles */
        .focus-visible\\:ring-amber-500:focus-visible {
          --tw-ring-color: rgb(245 158 11);
        }
        
        /* Gradient text utilities */
        .text-gradient {
          background: linear-gradient(135deg, #f59e0b, #f97316);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Enhanced transitions */
        .transition-all-slow {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Backdrop blur support */
        .backdrop-blur-xs {
          backdrop-filter: blur(2px);
        }
        
        /* Custom scrollbar */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgb(156 163 175) transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgb(156 163 175);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

// Grid Pattern Style
const gridStyle = `
  .bg-grid-pattern {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgba(255,255,255,0.2)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
  }
`;

// Add global styles
document.head.insertAdjacentHTML('beforeend', `<style>${gridStyle}</style>`);

export default LoginPage;
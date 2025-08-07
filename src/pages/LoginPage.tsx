import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';

// Gear SVG Component
const Gear = ({ size = 80, teeth = 12, className = "" }) => {
  const radius = size / 2 - 8;
  const toothHeight = 6;
  const innerRadius = radius - toothHeight;
  
  const createGearPath = () => {
    const anglePerTooth = (2 * Math.PI) / teeth;
    let path = '';
    
    for (let i = 0; i < teeth; i++) {
      const angle1 = i * anglePerTooth;
      const angle2 = (i + 0.3) * anglePerTooth;
      const angle3 = (i + 0.7) * anglePerTooth;
      const angle4 = (i + 1) * anglePerTooth;
      
      const x1 = Math.cos(angle1) * innerRadius;
      const y1 = Math.sin(angle1) * innerRadius;
      const x2 = Math.cos(angle2) * radius;
      const y2 = Math.sin(angle2) * radius;
      const x3 = Math.cos(angle3) * radius;
      const y3 = Math.sin(angle3) * radius;
      const x4 = Math.cos(angle4) * innerRadius;
      const y4 = Math.sin(angle4) * innerRadius;
      
      if (i === 0) {
        path += `M ${x1} ${y1}`;
      }
      path += ` L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4}`;
    }
    path += ' Z';
    return path;
  };

  return (
    <svg width={size} height={size} className={className}>
      <g transform={`translate(${size/2}, ${size/2})`}>
        {/* Outer gear teeth */}
        <path
          d={createGearPath()}
          fill="currentColor"
          opacity="0.15"
        />
        {/* Inner circle */}
        <circle
          cx="0"
          cy="0"
          r={innerRadius * 0.6}
          fill="currentColor"
          opacity="0.1"
        />
        {/* Center hole */}
        <circle
          cx="0"
          cy="0"
          r={innerRadius * 0.3}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.2"
        />
        {/* Spokes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI) / 3;
          const x1 = Math.cos(angle) * (innerRadius * 0.3);
          const y1 = Math.sin(angle) * (innerRadius * 0.3);
          const x2 = Math.cos(angle) * (innerRadius * 0.6);
          const y2 = Math.sin(angle) * (innerRadius * 0.6);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.2"
            />
          );
        })}
      </g>
    </svg>
  );
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success/error logic
      if (data.email && data.password) {
        console.log('Login successful:', data);
        // navigate('/dashboard', { replace: true });
      } else {
        setFormError('root', { message: 'Invalid credentials' });
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
      {/* Meshing Gear System */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gear Chain 1: Top-left meshing system */}
        {/* Main gear - 24 teeth, clockwise */}
        <div 
          className="absolute top-12 left-12 text-blue-900 animate-spin"
          style={{ 
            animationDuration: '24s',
            animationDirection: 'normal'
          }}
        >
          <Gear size={120} teeth={24} />
        </div>
        
        {/* Meshing gear - 12 teeth, counter-clockwise, positioned to mesh */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            top: '48px', // 12px + 60px (half of 120px) - 30px (half of 60px)
            left: '132px', // 12px + 120px - 30px (half of 60px)
            animationDuration: '12s',
            animationDirection: 'reverse'
          }}
        >
          <Gear size={60} teeth={12} />
        </div>
        
        {/* Gear Chain 2: Right side system */}
        {/* Large gear - 20 teeth, counter-clockwise */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            top: '120px',
            right: '20px',
            animationDuration: '20s',
            animationDirection: 'reverse'
          }}
        >
          <Gear size={100} teeth={20} />
        </div>
        
        {/* Meshing with right large gear - 10 teeth, clockwise */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            top: '170px', // 120px + 50px (half of 100px) - 25px (half of 50px)
            right: '70px', // 20px + 100px - 25px (half of 50px)
            animationDuration: '10s',
            animationDirection: 'normal'
          }}
        >
          <Gear size={50} teeth={10} />
        </div>
        
        {/* Gear Chain 3: Bottom system */}
        {/* Bottom center gear - 16 teeth, clockwise */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            animationDuration: '16s',
            animationDirection: 'normal'
          }}
        >
          <Gear size={80} teeth={16} />
        </div>
        
        {/* Left bottom meshing gear - 8 teeth, counter-clockwise */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            bottom: '40px',
            left: 'calc(50% - 60px)', // Positioned to mesh with center gear
            animationDuration: '8s',
            animationDirection: 'reverse'
          }}
        >
          <Gear size={40} teeth={8} />
        </div>
        
        {/* Right bottom meshing gear - 8 teeth, counter-clockwise */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            bottom: '40px',
            right: 'calc(50% - 60px)', // Positioned to mesh with center gear
            animationDuration: '8s',
            animationDirection: 'reverse'
          }}
        >
          <Gear size={40} teeth={8} />
        </div>
        
        {/* Additional decorative gear - top right corner */}
        <div 
          className="absolute text-blue-900 animate-spin"
          style={{ 
            top: '20px',
            right: '160px',
            animationDuration: '14s',
            animationDirection: 'normal'
          }}
        >
          <Gear size={70} teeth={14} />
        </div>
      </div>

      <Card className="w-full max-w-lg border-0 shadow-2xl relative z-10 backdrop-blur-sm" style={{ backgroundColor: '#003366' }}>
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-white to-blue-400"></div>
        
        <CardHeader className="space-y-2 pb-8 pt-12">
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full flex items-center justify-center">
              <img 
                src="/eminventory.png"
                alt="Service Icon"
                className="w-32 h-32"
              />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-center text-white tracking-tight">
            E&M Inventory Management System
          </CardTitle>
          <CardDescription className="text-center text-blue-100 text-lg font-medium">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>

        <div>
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
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
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
                <a
                  href="#"
                  className="text-sm font-medium text-blue-200 hover:text-white transition-colors duration-300 hover:underline decoration-dotted underline-offset-4"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { 
                    required: 'Password is required' 
                  })}
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
              onClick={handleSubmit(onSubmit)} 
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
        </div>

        {/* Decorative Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-white to-blue-400"></div>
      </Card>
    </div>
  );
}
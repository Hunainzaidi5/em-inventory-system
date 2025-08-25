import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Using native JavaScript date formatting instead of date-fns
import { getAvatarUrl, uploadAvatar } from "@/utils/avatarUtils";
import { toast } from "sonner";
import { 
  Loader2, 
  Camera, 
  User, 
  Mail, 
  Shield, 
  Building, 
  CreditCard, 
  Calendar,
  Sparkles,
  Upload,
  UserCircle,
  TrendingUp,
  Activity
} from "lucide-react";

import { authService } from "@/services/authService";

const roleDisplayNames = {
  dev: 'Developer (Admin)',
  manager: 'Manager',
  deputy_manager: 'Deputy Manager',
  engineer: 'Engineer',
  assistant_engineer: 'Assistant Engineer',
  master_technician: 'Master Technician',
  technician: 'Technician'
};

const roleColors = {
  dev: 'from-purple-600 to-purple-700',
  manager: 'from-blue-600 to-blue-700',
  deputy_manager: 'from-indigo-600 to-indigo-700',
  engineer: 'from-green-600 to-green-700',
  assistant_engineer: 'from-emerald-600 to-emerald-700',
  master_technician: 'from-orange-600 to-orange-700',
  technician: 'from-gray-600 to-gray-700'
};

const StatCard = ({ icon: Icon, title, value, subtitle, color }: {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
}) => {
  const [animatedValue, setAnimatedValue] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br ${color} p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 group cursor-pointer`}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="text-white">
          <div className="text-2xl font-bold mb-1">
            {animatedValue}
          </div>
          <div className="text-white/80 font-medium">{title}</div>
          {subtitle && (
            <div className="text-white/60 text-sm mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value, color = "bg-gray-100" }: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105">
    <div className="flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const ProfileCard = ({ title, children }: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
    <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-indigo-100">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-500 text-sm">Manage your personal details and preferences</p>
        </div>
      </div>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define form schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  department: z.string().optional(),
  employee_id: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      employee_id: "",
    },
    mode: "onChange",
  });

  // Set form values when user data is available
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.display_name || "",
        email: user.email || "",
        department: user.department || "",
        employee_id: user.employee_id || "",
      });
    }
  }, [user, form]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading user data...</p>
        </div>
      </div>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (1MB max for base64 storage)
    if (file.size > 1024 * 1024) {
      toast.error('Image must be less than 1MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert file to base64 and update profile
      const base64Data = await uploadAvatar(file, user.id);
      await authService.updateProfile(user.id, { 
        avatar_url: base64Data 
      });
      
      // Refresh the user data to show the new avatar
      await refreshUser();
      
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);
      await authService.updateProfile(user.id, data);
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const userRole = user.role as keyof typeof roleColors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-600 text-lg">View and manage your account details</p>
            </div>
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${roleColors[userRole] || 'from-gray-600 to-gray-700'} shadow-lg`}>
              <UserCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Debug information - only show in development */}
        {import.meta.env.DEV && (
          <div className="mb-8 p-6 rounded-2xl bg-yellow-50 border border-yellow-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-yellow-800">Debug Information</h3>
            </div>
            <div className="space-y-2 text-sm text-yellow-800">
                              <p><span className="font-medium">Avatar URL:</span> {user.avatar_url || 'No avatar set'}</p>
                <p><span className="font-medium">Formatted Avatar URL:</span> {user.avatar_url ? getAvatarUrl(user.id, user.avatar_url) : 'No avatar set'}</p>
              <p><span className="font-medium">User ID:</span> {user.id}</p>
            </div>
          </div>
        )}

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={User}
            title="Profile Status"
            value="Active"
            subtitle="Account verified"
            color="from-emerald-600 to-emerald-700"
          />
          <StatCard
            icon={Shield}
            title="Role Level"
            value={roleDisplayNames[userRole] || user.role}
            subtitle="Access permissions"
            color={roleColors[userRole] || 'from-gray-600 to-gray-700'}
          />
          <StatCard
            icon={Calendar}
            title="Member Since"
            value={memberSince}
            subtitle="Account created"
            color="from-blue-600 to-blue-700"
          />
          <StatCard
            icon={TrendingUp}
            title="Profile Score"
            value="98%"
            subtitle="Completion rate"
            color="from-purple-600 to-purple-700"
          />
        </div>

        {/* Profile Information Card */}
        <ProfileCard title="Profile Information">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Avatar and Form Section */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 lg:w-1/3">
                <div className="relative group">
                  <Avatar 
                    className="h-40 w-40 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                    onClick={handleAvatarClick}
                  >
                    {user.avatar_url ? (
                      <>
                        <AvatarImage 
                          src={getAvatarUrl(user.id, user.avatar_url)}
                          alt={user.display_name} 
                          className="object-cover"
                          onError={(e) => {
                            console.error('Error loading avatar:', e);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="text-4xl bg-gradient-to-br from-indigo-100 to-purple-100">
                          {(user.display_name || user.email || 'User')
                            .split(' ')
                            .filter(Boolean)
                            .map(n => n[0]?.toUpperCase())
                            .slice(0, 2)
                            .join('')}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-gray-100 to-gray-200">
                        {(user.display_name || user.email || 'User')
                          .split(' ')
                          .filter(Boolean)
                          .map(n => n[0]?.toUpperCase())
                          .slice(0, 2)
                          .join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {isUploading ? (
                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                    ) : (
                      <Camera className="h-10 w-10 text-white" />
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-700">Profile Picture</p>
                  <p className="text-xs text-gray-500">Click to upload or change</p>
                  {isUploading && (
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields Section */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="h-4 w-4 text-indigo-600" />
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      disabled={isUpdating}
                      className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        form.formState.errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                      placeholder="Enter your full name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Mail className="h-4 w-4 text-indigo-600" />
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      disabled={isUpdating}
                      className={`h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors ${
                        form.formState.errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                      placeholder="Enter your email address"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building className="h-4 w-4 text-indigo-600" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      {...form.register("department")}
                      disabled={isUpdating}
                      className="h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      placeholder="Enter your department"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_id" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CreditCard className="h-4 w-4 text-indigo-600" />
                      Employee ID
                    </Label>
                    <Input
                      id="employee_id"
                      {...form.register("employee_id")}
                      disabled={isUpdating}
                      className="h-11 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      placeholder="Enter your employee ID"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isUpdating}
                    className="h-11 px-6 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Reset Changes
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isUpdating || !form.formState.isDirty}
                    className="h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Profile...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Information Grid */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard
                icon={Mail}
                label="Email Address"
                value={user.email}
                color="bg-blue-100"
              />
              
              <InfoCard
                icon={Shield}
                label="Role"
                value={roleDisplayNames[userRole] || (user.role ? user.role.replace('_', ' ') : 'Unknown')}
                color="bg-purple-100"
              />

              {user.department && (
                <InfoCard
                  icon={Building}
                  label="Department"
                  value={user.department}
                  color="bg-green-100"
                />
              )}

              {user.employee_id && (
                <InfoCard
                  icon={CreditCard}
                  label="Employee ID"
                  value={user.employee_id}
                  color="bg-orange-100"
                />
              )}

              <InfoCard
                icon={Calendar}
                label="Member Since"
                value={memberSince}
                color="bg-indigo-100"
              />

              <InfoCard
                icon={User}
                label="Account Status"
                value="Active & Verified"
                color="bg-emerald-100"
              />
            </div>
          </div>
        </ProfileCard>
      </div>
    </div>
  );
}
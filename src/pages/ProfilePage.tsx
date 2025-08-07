import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { updateProfile } from "@/services/authService";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return <div>Loading user data...</div>;
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

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Update the profile with the new avatar
      await updateProfile({ 
        avatarFile: file 
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

  // Log the user data for debugging
  console.log('Profile page user data:', user);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            View and manage your account details
          </p>
        </div>
      </div>
      
      {/* Debug information - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 p-4 rounded-md text-sm text-yellow-800 mb-4">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <p>Avatar URL: {user.avatar || 'No avatar set'}</p>
          <p>User ID: {user.id}</p>
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              This information will be displayed publicly so be careful what you share.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Avatar 
                    className="h-20 w-20 cursor-pointer transition-opacity group-hover:opacity-80"
                    onClick={handleAvatarClick}
                  >
                    {user.avatar ? (
                      <>
                        <AvatarImage 
                          src={`${user.avatar}?t=${Date.now()}`} // Add timestamp to prevent caching
                          alt={user.name} 
                          className="object-cover"
                          onError={(e) => {
                            console.error('Error loading avatar:', e);
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="text-lg">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="text-lg bg-gray-200">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
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
                <div>
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                {user.department && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p>{user.department}</p>
                  </div>
                )}
                {user.employee_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                    <p>{user.employee_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member since</p>
                  <p>{format(new Date(user.created_at), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

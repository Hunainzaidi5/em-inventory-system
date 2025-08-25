import { v4 as uuidv4 } from 'uuid';

// Convert file to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Upload avatar as base64 to Firestore (alternative to Firebase Storage)
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    // Validate file size (max 1MB for base64 storage)
    if (file.size > 1024 * 1024) {
      throw new Error('File size must be less than 1MB');
    }

    // Convert to base64
    const base64Data = await fileToBase64(file);
    
    // Store in Firestore under user's profile
    // This will be handled by the user service when updating profile
    return base64Data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar');
  }
};

// Get avatar URL from base64 data or placeholder
export const getAvatarUrl = (userId: string, avatarPath?: string): string => {
  if (!avatarPath) {
    return getDefaultAvatarUrl();
  }
  
  // If it's already a full URL, return it
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // If it's base64 data, return it directly
  if (avatarPath.startsWith('data:image/')) {
    return avatarPath;
  }
  
  // For now, return default avatar
  return getDefaultAvatarUrl();
};

// Delete avatar (no-op since we're not using Firebase Storage)
export const deleteAvatar = async (userId: string, avatarPath?: string): Promise<void> => {
  // Since we're storing avatars as base64 in Firestore, 
  // deletion is handled by updating the user profile
  console.log('Avatar deletion handled by profile update');
};

// Clean up old avatar files (no-op since we're not using Firebase Storage)
export const cleanupOldAvatars = async (userId: string): Promise<void> => {
  // No cleanup needed for base64 storage
  console.log('No cleanup needed for base64 avatar storage');
};

// Get default avatar URL
export const getDefaultAvatarUrl = (): string => {
  // Return a default avatar image URL
  // You can use a service like Gravatar or a local default image
  return 'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128';
};

// Alternative: Use Gravatar-style avatars based on user email
export const getGravatarUrl = (email: string, size: number = 128): string => {
  const hash = email.toLowerCase().trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random&color=fff&size=${size}`;
};

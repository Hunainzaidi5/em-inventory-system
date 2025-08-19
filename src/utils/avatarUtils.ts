import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Upload avatar to Firebase Storage
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${uuidv4()}.${fileExt}`;
    const storageRef = ref(storage, `avatars/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar');
  }
};

// Get avatar URL from Firebase Storage
export const getAvatarUrl = (userId: string, avatarPath?: string): string => {
  if (!avatarPath) {
    return '';
  }
  
  // If it's already a full URL, return it
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // For now, return the path as is
  // In production, you'd construct the full Firebase Storage URL
  return avatarPath;
};

// Delete avatar from Firebase Storage
export const deleteAvatar = async (userId: string, avatarPath?: string): Promise<void> => {
  if (!avatarPath) return;
  
  try {
    // Extract filename from path or URL
    let fileName = avatarPath;
    if (avatarPath.includes('/')) {
      fileName = avatarPath.split('/').pop() || '';
    }
    
    if (fileName) {
      const storageRef = ref(storage, `avatars/${fileName}`);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't throw error for cleanup operations
  }
};

// Clean up old avatar files for a user
export const cleanupOldAvatars = async (userId: string): Promise<void> => {
  try {
    const avatarsRef = ref(storage, 'avatars');
    const result = await listAll(avatarsRef);
    
    // Find all avatar files for this user
    const userAvatars = result.items.filter(item => 
      item.name.startsWith(`${userId}_`)
    );
    
    // Delete old avatar files (keep only the most recent one)
    if (userAvatars.length > 1) {
      // Sort by creation time and delete all but the most recent
      const sortedAvatars = userAvatars.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      // Delete all but the last one
      for (let i = 0; i < sortedAvatars.length - 1; i++) {
        await deleteObject(sortedAvatars[i]);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old avatars:', error);
    // Don't throw error for cleanup operations
  }
};

// Get default avatar URL
export const getDefaultAvatarUrl = (): string => {
  // Return a default avatar image URL
  // You can use a service like Gravatar or a local default image
  return '/placeholder.svg';
};

import { supabase } from '@/services/authService';
import { v4 as uuidv4 } from 'uuid';

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;
    
    // Upload the new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Clean up old avatars
    await cleanupOldAvatars(userId, fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw new Error('Failed to upload avatar');
  }
};

export const deleteAvatar = async (userId: string, fileName: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/${fileName}`]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't throw the error as this is a non-critical operation
  }
};

const cleanupOldAvatars = async (userId: string, keepFileName: string): Promise<void> => {
  try {
    const { data: oldFiles, error } = await supabase.storage
      .from('avatars')
      .list(userId);
    
    if (error) throw error;
    
    if (oldFiles && oldFiles.length > 1) {
      const filesToRemove = oldFiles
        .filter(file => file.name !== keepFileName.split('/').pop())
        .map(file => `${userId}/${file.name}`);
      
      if (filesToRemove.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(filesToRemove)
          .catch(console.error); // Non-critical if cleanup fails
      }
    }
  } catch (error) {
    console.error('Error cleaning up old avatars:', error);
    // Don't throw the error as this is a non-critical operation
  }
};

export const getAvatarUrl = (userId: string, avatarPath: string): string => {
  if (!avatarPath) return '';
  
  const baseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/+$/, '');
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // If it's a path (starts with /), it's a path in the storage bucket
  if (avatarPath.startsWith('/')) {
    return `${baseUrl}/storage/v1/object/public/avatars${avatarPath}`;
  }
  
  // Otherwise, treat it as a filename in the avatars bucket
  return `${baseUrl}/storage/v1/object/public/avatars/${userId}/${avatarPath}`;
};

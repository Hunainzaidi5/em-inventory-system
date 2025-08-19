import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Signs in a test user for development purposes
 * @returns Promise that resolves when sign in is complete
 */
export async function signInTestUser(): Promise<{ success: boolean; error?: string }> {
  // Only allow test user in development
  if (import.meta.env.PROD) {
    const message = 'Test user login is disabled in production';
    console.warn(message);
    return { success: false, error: message };
  }

  const testEmail = 'syedhunainalizaidi@gmail.com';
  const testPassword = 'Apple_1414';

  try {
    const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during test login';
    console.error('Test user sign in failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Creates a test user in Firebase Authentication
 * This should only be used in development
 */
export async function createTestUser() {
  if (import.meta.env.PROD) {
    throw new Error('Cannot create test user in production');
  }

  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  
  const testEmail = 'syedhunainalizaidi@gmail.com';
  const testPassword = 'Apple_1414';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('Test user created:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

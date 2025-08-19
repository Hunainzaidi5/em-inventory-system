import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from './firebase';
import { FirebaseService } from './firebaseService';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export class FirebaseAuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await this.updateLastLogin(user.uid);
      
      return this.mapFirebaseUser(user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Sign up with email and password
  static async signUp(
    email: string, 
    password: string, 
    displayName: string
  ): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user profile in Firestore
      await this.createUserProfile(user.uid, {
        email,
        displayName,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      return this.mapFirebaseUser(user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback(this.mapFirebaseUser(user));
      } else {
        callback(null);
      }
    });
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(uid: string, updates: any): Promise<void> {
    try {
      await FirebaseService.update('users', uid, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<any> {
    try {
      return await FirebaseService.getById('users', uid);
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Create user profile in Firestore
  private static async createUserProfile(uid: string, profileData: any): Promise<void> {
    try {
      await FirebaseService.create('users', {
        uid,
        ...profileData
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Update last login timestamp
  private static async updateLastLogin(uid: string): Promise<void> {
    try {
      await FirebaseService.update('users', uid, {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for this as it's not critical
    }
  }

  // Map Firebase User to our interface
  private static mapFirebaseUser(user: User): FirebaseUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  }
}

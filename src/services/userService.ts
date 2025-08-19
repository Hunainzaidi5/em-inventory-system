import { FirebaseService } from '@/lib/firebaseService';
import { User, UserRole } from '@/types/auth';

export interface CreateUserData {
  email: string;
  display_name: string;
  role: UserRole;
  department?: string;
  employee_id?: string;
  is_active?: boolean;
}

export const userService = {
  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await FirebaseService.query('users');
      return users as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const userId = await FirebaseService.create('users', {
        ...userData,
        email: userData.email.toLowerCase().trim(),
        display_name: userData.display_name.trim(),
        is_active: userData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        email_verified: false
      });

      // Return the created user
      return {
        id: userId,
        ...userData,
        email: userData.email.toLowerCase().trim(),
        display_name: userData.display_name.trim(),
        is_active: userData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        email_verified: false
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await FirebaseService.upsert('users', userId, {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      await FirebaseService.delete('users', userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await FirebaseService.getById('users', userId);
      return user as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.role === role);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw new Error('Failed to fetch users by role');
    }
  },

  // Get active users
  async getActiveUsers(): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.is_active);
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw new Error('Failed to fetch active users');
    }
  },

  // Search users
  async searchUsers(query: string): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers();
      const searchTerm = query.toLowerCase();
      
      return allUsers.filter(user => 
        user.display_name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm) ||
        user.employee_id?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }
};

export default userService;

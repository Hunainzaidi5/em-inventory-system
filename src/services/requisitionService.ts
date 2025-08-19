import { FirebaseService } from '@/lib/firebaseService';

type RequisitionType = 'issue' | 'return' | 'consume';

export interface Requisition {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  type: RequisitionType;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department?: string;
  location?: string;
}

export interface CreateRequisitionData {
  user_id: string;
  item_id: string;
  quantity: number;
  type: RequisitionType;
  reason: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  department?: string;
  location?: string;
  notes?: string;
}

export const requisitionService = {
  // Get all requisitions
  async getAllRequisitions(): Promise<Requisition[]> {
    try {
      const requisitions = await FirebaseService.query('requisitions');
      return requisitions as Requisition[];
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      throw new Error('Failed to fetch requisitions');
    }
  },

  // Get requisitions by user
  async getRequisitionsByUser(userId: string): Promise<Requisition[]> {
    try {
      const allRequisitions = await this.getAllRequisitions();
      return allRequisitions.filter(req => req.user_id === userId);
    } catch (error) {
      console.error('Error fetching user requisitions:', error);
      throw new Error('Failed to fetch user requisitions');
    }
  },

  // Get requisition by ID
  async getRequisitionById(requisitionId: string): Promise<Requisition | null> {
    try {
      const requisition = await FirebaseService.getById('requisitions', requisitionId);
      return requisition as Requisition;
    } catch (error) {
      console.error('Error fetching requisition by ID:', error);
      return null;
    }
  },

  // Create new requisition
  async createRequisition(data: CreateRequisitionData): Promise<Requisition> {
    try {
      const requisitionId = await FirebaseService.create('requisitions', {
        ...data,
        status: 'pending',
        requested_at: new Date().toISOString(),
        priority: data.priority || 'medium'
      });

      // Return the created requisition
      return {
        id: requisitionId,
        ...data,
        status: 'pending',
        requested_at: new Date().toISOString(),
        priority: data.priority || 'medium'
      } as Requisition;
    } catch (error) {
      console.error('Error creating requisition:', error);
      throw new Error('Failed to create requisition');
    }
  },

  // Update requisition
  async updateRequisition(requisitionId: string, updates: Partial<Requisition>): Promise<void> {
    try {
      await FirebaseService.update('requisitions', requisitionId, updates);
    } catch (error) {
      console.error('Error updating requisition:', error);
      throw new Error('Failed to update requisition');
    }
  },

  // Approve requisition
  async approveRequisition(requisitionId: string, approvedBy: string, notes?: string): Promise<void> {
    try {
      await this.updateRequisition(requisitionId, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approvedBy,
        notes: notes || undefined
      });
    } catch (error) {
      console.error('Error approving requisition:', error);
      throw new Error('Failed to approve requisition');
    }
  },

  // Reject requisition
  async rejectRequisition(requisitionId: string, rejectedBy: string, reason: string): Promise<void> {
    try {
      await this.updateRequisition(requisitionId, {
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: rejectedBy,
        notes: reason
      });
    } catch (error) {
      console.error('Error rejecting requisition:', error);
      throw new Error('Failed to reject requisition');
    }
  },

  // Complete requisition
  async completeRequisition(requisitionId: string): Promise<void> {
    try {
      await this.updateRequisition(requisitionId, {
        status: 'completed'
      });
    } catch (error) {
      console.error('Error completing requisition:', error);
      throw new Error('Failed to complete requisition');
    }
  },

  // Delete requisition
  async deleteRequisition(requisitionId: string): Promise<void> {
    try {
      await FirebaseService.delete('requisitions', requisitionId);
    } catch (error) {
      console.error('Error deleting requisition:', error);
      throw new Error('Failed to delete requisition');
    }
  },

  // Get pending requisitions
  async getPendingRequisitions(): Promise<Requisition[]> {
    try {
      const allRequisitions = await this.getAllRequisitions();
      return allRequisitions.filter(req => req.status === 'pending');
    } catch (error) {
      console.error('Error fetching pending requisitions:', error);
      throw new Error('Failed to fetch pending requisitions');
    }
  },

  // Get requisitions by status
  async getRequisitionsByStatus(status: Requisition['status']): Promise<Requisition[]> {
    try {
      const allRequisitions = await this.getAllRequisitions();
      return allRequisitions.filter(req => req.status === status);
    } catch (error) {
      console.error('Error fetching requisitions by status:', error);
      throw new Error('Failed to fetch requisitions by status');
    }
  },

  // Get requisitions by priority
  async getRequisitionsByPriority(priority: Requisition['priority']): Promise<Requisition[]> {
    try {
      const allRequisitions = await this.getAllRequisitions();
      return allRequisitions.filter(req => req.priority === priority);
    } catch (error) {
      console.error('Error fetching requisitions by priority:', error);
      throw new Error('Failed to fetch requisitions by priority');
    }
  },

  // Search requisitions
  async searchRequisitions(query: string): Promise<Requisition[]> {
    try {
      const allRequisitions = await this.getAllRequisitions();
      const searchTerm = query.toLowerCase();
      
      return allRequisitions.filter(req => 
        req.reason.toLowerCase().includes(searchTerm) ||
        req.notes?.toLowerCase().includes(searchTerm) ||
        req.department?.toLowerCase().includes(searchTerm) ||
        req.location?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching requisitions:', error);
      throw new Error('Failed to search requisitions');
    }
  },

  // Subscribe to requisition changes
  subscribeToRequisitions(callback: (requisitions: Requisition[]) => void) {
    // Firebase doesn't have real-time subscriptions in the same way as Supabase
    // For now, we'll return a simple unsubscribe function
    // In production, consider using onSnapshot from Firestore
    return {
      subscription: {
        unsubscribe: () => {
          console.log('Requisition subscription removed');
        }
      }
    };
  }
};

export default requisitionService;

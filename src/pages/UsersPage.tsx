import React, { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAllUsers, updateUserStatus, deleteUser, UserListItem } from '@/services/userService';
import { testDatabaseAccess } from '@/services/testService';
import { Trash2, UserCheck, UserX, Plus, Edit, Eye, RefreshCw, Bug } from 'lucide-react';

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  
  // Only allow developers to access this page
  if (!user || user.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Reload users when the page regains focus (user navigates back)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[DEBUG] Page regained focus, reloading users...');
      loadUsers();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also reload when the component mounts or location changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DEBUG] Page became visible, reloading users...');
        loadUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add debug logging for users state
  useEffect(() => {
    console.log('[DEBUG] Users state updated:', users.length, 'users');
  }, [users]);

  const handleTestDatabase = async () => {
    console.log('[DEBUG] Testing database access...');
    const result = await testDatabaseAccess();
    console.log('[DEBUG] Test result:', result);
    alert('Check console for test results');
  };

  const handleRefreshUsers = async () => {
    console.log('[DEBUG] Manual refresh triggered');
    await loadUsers();
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(`toggle-${userId}`);
      await updateUserStatus(userId, !currentStatus);
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(`delete-${userId}`);
      await deleteUser(userId);
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'dev': 'bg-purple-100 text-purple-800',
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'deputy_manager': 'bg-indigo-100 text-indigo-800',
      'engineer': 'bg-green-100 text-green-800',
      'assistant_engineer': 'bg-teal-100 text-teal-800',
      'master_technician': 'bg-orange-100 text-orange-800',
      'technician': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">User Management (Developer Only)</h1>
          <p className="text-gray-600">Manage users, their roles, and permissions.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            onClick={handleTestDatabase}
            title="Test Database Access"
          >
            <Bug size={16} />
            Test DB
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            onClick={handleRefreshUsers}
            title="Refresh User List"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/add-user')}
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loadingUsers ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found. Add your first user to get started.
                    </td>
                  </tr>
                ) : (
                  users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userItem.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                            {formatRole(userItem.role)}
                          </span>
                          {userItem.department && (
                            <div className="text-sm text-gray-500 mt-1">
                              {userItem.department}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userItem.employee_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userItem.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(userItem.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(userItem.id, userItem.is_active)}
                            disabled={actionLoading === `toggle-${userItem.id}`}
                            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                              userItem.is_active 
                                ? 'text-red-600 hover:text-red-700' 
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={userItem.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {actionLoading === `toggle-${userItem.id}` ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : userItem.is_active ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem.id)}
                            disabled={actionLoading === `delete-${userItem.id}`}
                            className="p-2 rounded text-red-600 hover:text-red-700 hover:bg-gray-100 transition-colors"
                            title="Delete User"
                          >
                            {actionLoading === `delete-${userItem.id}` ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Total Users: {users.length}
        </div>
      )}
    </div>
  );
};

export default UsersPage; 
import React, { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { User, UserRole } from '@/types/auth';
import { PageContainer } from '@/components/layout/PageContainer';

// Helper function to format role names for display
const formatRoleName = (role: string): string => {
  // Map 'admin' to 'dev' since we're standardizing on 'dev' for administrator/developer role
  const normalizedRole = role === 'admin' ? 'dev' : role;
  
  const roleMap: Record<string, string> = {
    'dev': 'Developer (Admin)',
    'manager': 'Manager',
    'deputy_manager': 'Deputy Manager',
    'engineer': 'Engineer',
    'assistant_engineer': 'Assistant Engineer',
    'master_technician': 'Master Technician',
    'technician': 'Technician'
  };
  
  return roleMap[normalizedRole] || role;
};

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User | ''; direction: 'asc' | 'desc' }>({ 
    key: '', 
    direction: 'asc' 
  });

  // Fetch all users from Firebase
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      const users = await userService.getAllUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user permanently? This action cannot be undone.')) return;
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      alert('User deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Handle sorting when sortConfig changes
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...users];
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        // Handle potential undefined values
        const aValue = a[sortConfig.key as keyof User] || '';
        const bValue = b[sortConfig.key as keyof User] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  // Request sort function
  const requestSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator for a column
  const getSortIndicator = (key: keyof User) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  if (!user || user.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#4a4539]">User Management</h1>
          <p className="text-sm text-[#6b6557] mt-1">Manage system users and their permissions</p>
        </div>
        <button
          className="px-4 py-2 bg-[#8b7c5a] text-white rounded-md hover:bg-[#6b6149] transition-colors duration-200 flex items-center gap-2 shadow-sm"
          onClick={() => navigate('/dashboard/add-user')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add User
        </button>
      </div>
      
      {loadingUsers ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-[#f8f5ed] rounded-lg border border-[#e1d4b1] p-8">
          <svg className="mx-auto h-12 w-12 text-[#8b7c5a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-[#4a4539]">No users found</h3>
          <p className="mt-1 text-sm text-[#6b6557]">
            Get started by adding a new user to the system.
          </p>
          <div className="mt-6">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#8b7c5a] hover:bg-[#6b6149] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8b7c5a] transition-colors duration-200"
              onClick={() => navigate('/dashboard/add-user')}
            >
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add User
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-[#e1d4b1]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e1d4b1]">
            <thead className="bg-[#f8f5ed]">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#6b6557] uppercase tracking-wider cursor-pointer hover:bg-[#f0e9d9] transition-colors duration-150"
                  onClick={() => requestSort('display_name')}
                >
                  <div className="flex items-center">
                    <span className="mr-1">Name</span> {getSortIndicator('display_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#f0e9d9] transition-colors duration-150"
                  onClick={() => requestSort('email')}
                >
                  <div className="flex items-center">
                    Email {getSortIndicator('email')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#f0e9d9] transition-colors duration-150"
                  onClick={() => requestSort('role')}
                >
                  <div className="flex items-center">
                    Role {getSortIndicator('role')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#f0e9d9] transition-colors duration-150"
                  onClick={() => requestSort('department')}
                >
                  <div className="flex items-center">
                    Department {getSortIndicator('department')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#f0e9d9] transition-colors duration-150"
                  onClick={() => requestSort('employee_id')}
                >
                  <div className="flex items-center">
                    Employee ID {getSortIndicator('employee_id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-[#f0e9d9] transition-colors duration-150"
                  onClick={() => requestSort('is_active')}
                >
                  <div className="flex items-center">
                    Status {getSortIndicator('is_active')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#6b6557] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f0e9d9]">
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#4a4539]">{user.display_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b6557]">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'dev' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'deputy_manager' ? 'bg-indigo-100 text-indigo-800' :
                      user.role === 'engineer' ? 'bg-green-100 text-green-800' :
                      user.role === 'assistant_engineer' ? 'bg-emerald-100 text-emerald-800' :
                      user.role === 'master_technician' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800' // Default for technician and others
                    }`}>
                      {formatRoleName(user.role as UserRole)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b6557]">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b6557] font-mono">{user.employee_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-[#8b7c5a] hover:text-[#6b6149] mr-4 transition-colors duration-150 flex items-center"
                      onClick={() => navigate(`/dashboard/edit-user/${user.id}`)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      className="text-[#c53030] hover:text-[#9b2c2c] transition-colors duration-150 flex items-center"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      </div>
    </PageContainer>
  );
};

export default UsersPage; 
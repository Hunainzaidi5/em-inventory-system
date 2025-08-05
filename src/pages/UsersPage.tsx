import React from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  
  // Only allow developers to access this page
  if (!user || user.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Management (Developer Only)</h1>
      <p>This is the User Management page. Only developers can create, edit, or delete users.</p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => navigate('/add-user')}
      >
        Add User
      </button>
      {/* Developer-only user management UI goes here */}
    </div>
  );
};

export default UsersPage; 
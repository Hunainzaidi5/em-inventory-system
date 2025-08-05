import React from "react";
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const UsersPage = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }
  if (!user || user.role !== 'dev') {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Management (Developer Only)</h1>
      <p>This is the User Management page. Only developers can create, edit, or delete users.</p>
      {/* Developer-only user management UI goes here */}
    </div>
  );
};

export default UsersPage; 
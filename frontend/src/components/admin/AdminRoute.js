import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15110E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#B56A35] border-t-transparent" />
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;

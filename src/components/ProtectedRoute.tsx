import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'staff' | 'manager' | 'operative' | 'super_admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, error } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="premium-glass p-8 text-center">
          <div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If there's an auth error, show it
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="premium-glass p-8 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="heading-2 text-white">Authentication Error</h2>
          </div>
          <p className="body-2 text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="premium-glass p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="heading-1 text-white mb-2">Access Denied</h2>
          <p className="body-1 text-slate-300 mb-6">
            You don't have permission to access this page. This area is restricted to {allowedRoles.join(', ')} users only.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has the right role
  return <>{children}</>;
};

export default ProtectedRoute;
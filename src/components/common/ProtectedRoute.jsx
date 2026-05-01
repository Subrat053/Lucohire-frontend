import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const activeRole = user?.activeRole || user?.role;

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    if (activeRole === 'provider') {
      return <Navigate to="/provider/plans" replace />;
    }

    if (activeRole === 'recruiter') {
      return <Navigate to="/recruiter/job-postings" replace />;
    }

    if (activeRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (activeRole === 'manager') {
      return <Navigate to="/admin/providers" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
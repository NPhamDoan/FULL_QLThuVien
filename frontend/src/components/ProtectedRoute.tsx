import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { type VaiTroType } from '../constants';

interface ProtectedRouteProps {
  requiredRole?: VaiTroType;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.vaiTro !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

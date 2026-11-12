import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../common/Loader';

// Protege rutas según el rol
const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireSocio = false,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isAdmin, isSocio, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  // No autenticado → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Requiere admin y no lo es → home
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Requiere socio y no es socio ni admin → login
  if (requireSocio && !isSocio && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
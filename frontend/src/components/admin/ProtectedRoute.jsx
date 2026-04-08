import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../common/Loader';

/**
 * Componente para proteger rutas según rol
 *
 * @param {React.ReactNode} children   - Contenido a renderizar si tiene permiso
 * @param {boolean} requireAdmin       - Requiere rol admin
 * @param {boolean} requireSocio       - Requiere rol socio o superior
 * @param {string}  redirectTo         - Ruta a la que redirigir si no tiene permiso
 */
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

  // Requiere socio y no es ni socio ni admin → login
  // (ya no existe /mejorar-cuenta; el flujo es solicitar membresía desde /registro)
  if (requireSocio && !isSocio && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
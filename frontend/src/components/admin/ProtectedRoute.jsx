import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../common/Loader';

/**
 * Componente para proteger rutas según rol
 * 
 * @param {React.ReactNode} children - Contenido a renderizar si tiene permiso
 * @param {boolean} requireAdmin - Requiere rol admin
 * @param {boolean} requireSocio - Requiere rol socio o superior
 * @param {string} redirectTo - Ruta a la que redirigir si no tiene permiso
 */
const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireSocio = false,
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isAdmin, isSocio, loading, user } = useAuth();

  // Mostrar loader mientras carga
  if (loading) {
    return <Loader fullScreen />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere admin y no lo es, redirigir
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/panel" replace />;
  }

  // Si requiere socio y no es socio ni admin, redirigir
  if (requireSocio && !isSocio && !isAdmin) {
    // Usuario básico intentando acceder a contenido de socios
    return <Navigate to="/mejorar-cuenta" replace />;
  }

  // Tiene los permisos necesarios
  return children;
};

export default ProtectedRoute;

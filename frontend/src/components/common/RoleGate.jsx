import { useAuth } from '../../hooks/useAuth';

/**
 * Componente para mostrar/ocultar elementos según el rol del usuario
 * No redirige, simplemente oculta el contenido
 * 
 * @param {React.ReactNode} children - Contenido a renderizar si tiene permiso
 * @param {string[]} allowedRoles - Array de roles permitidos ['basico', 'socio', 'admin']
 * @param {React.ReactNode} fallback - Contenido alternativo si no tiene permiso
 */
const RoleGate = ({ children, allowedRoles = [], fallback = null }) => {
  const { user } = useAuth();

  // Si no hay usuario, no mostrar nada
  if (!user) {
    return fallback;
  }

  // Si no hay roles especificados, mostrar siempre
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verificar si el rol del usuario está en los permitidos
  const hasPermission = allowedRoles.includes(user.role);

  return hasPermission ? children : fallback;
};

export default RoleGate;

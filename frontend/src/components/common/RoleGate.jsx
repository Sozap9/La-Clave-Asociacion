import { useAuth } from '../../hooks/useAuth';

// Muestra el contenido solo a los roles indicados (no redirige)
const RoleGate = ({ children, allowedRoles = [], fallback = null }) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  // Sin roles indicados, se muestra siempre
  if (allowedRoles.length === 0) {
    return children;
  }

  const hasPermission = allowedRoles.includes(user.role);

  return hasPermission ? children : fallback;
};

export default RoleGate;

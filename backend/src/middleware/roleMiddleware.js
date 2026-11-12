import logger from '../config/logger.js';
// Jerarquía de roles: basico < socio < admin
const ROLES = {
  BASICO: 'basico',
  SOCIO: 'socio',
  ADMIN: 'admin'
};

const ROLE_HIERARCHY = {
  basico: 1,
  socio: 2,
  admin: 3
};

// Uno de los roles indicados
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes estar autenticado para acceder a este recurso'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Al menos ese nivel: 'socio' también deja pasar a 'admin'
export const authorizeMinimum = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes estar autenticado para acceder a este recurso'
      });
    }

    const userRole = req.user.role;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < minimumLevel) {
      return res.status(403).json({
        success: false,
        message: `Se requiere rol de ${minimumRole} o superior`
      });
    }

    next();
  };
};

// Atajos
export const isBasico = authorize(ROLES.BASICO, ROLES.SOCIO, ROLES.ADMIN);

export const isSocio = authorizeMinimum(ROLES.SOCIO);

export const isAdmin = authorize(ROLES.ADMIN);

// El propio usuario o un admin
export const isOwnerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes estar autenticado'
      });
    }

    const resourceUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (resourceUserId !== currentUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Comprobación a medida
export const customAuthorize = (checkPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Debes estar autenticado'
        });
      }

      const hasPermission = await checkPermission(req);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en customAuthorize:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

export const hasRole = (userRole, requiredRole) => {
  return userRole === requiredRole;
};

export const hasMinimumRole = (userRole, minimumRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= minimumLevel;
};

export { ROLES, ROLE_HIERARCHY };

export default {
  authorize,
  authorizeMinimum,
  isBasico,
  isSocio,
  isAdmin,
  isOwnerOrAdmin,
  customAuthorize,
  hasRole,
  hasMinimumRole,
  ROLES,
  ROLE_HIERARCHY
};
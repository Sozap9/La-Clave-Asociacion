/**
 * Jerarquía de roles en La Clave
 * basico < socio < admin
 */
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

/**
 * Middleware para verificar que el usuario tiene un rol específico
 * @param {String|Array} allowedRoles - Rol(es) permitido(s)
 * @returns {Function} Middleware function
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Log temporal para debug
    console.log('🔍 Verificando permisos:');
    console.log('   - Usuario:', req.user?.email || 'NO AUTENTICADO');
    console.log('   - Role actual:', req.user?.role || 'NINGUNO');
    console.log('   - Roles permitidos:', allowedRoles);

    // Verificar que el usuario está autenticado
    if (!req.user) {
      console.log('❌ RECHAZADO: Usuario no autenticado');
      return res.status(401).json({
        success: false,
        message: 'Debes estar autenticado para acceder a este recurso'
      });
    }

    const userRole = req.user.role;

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ RECHAZADO: Role no autorizado');
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    console.log('✅ AUTORIZADO');
    next();
  };
};

/**
 * Middleware para verificar que el usuario tiene al menos un nivel de rol
 * Por ejemplo, si requieres 'socio', también acepta 'admin'
 * @param {String} minimumRole - Rol mínimo requerido
 * @returns {Function} Middleware function
 */
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

/**
 * Middleware solo para usuarios básicos
 */
export const isBasico = authorize(ROLES.BASICO, ROLES.SOCIO, ROLES.ADMIN);

/**
 * Middleware solo para socios (incluye admin)
 */
export const isSocio = authorizeMinimum(ROLES.SOCIO);

/**
 * Middleware solo para administradores
 */
export const isAdmin = authorize(ROLES.ADMIN);

/**
 * Middleware para verificar que el usuario está accediendo a su propio recurso
 * o es un admin
 * @param {String} paramName - Nombre del parámetro en req.params que contiene el ID
 */
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

/**
 * Middleware para verificar permisos personalizados
 * @param {Function} checkPermission - Función que retorna true/false
 */
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
      console.error('Error en customAuthorize:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

/**
 * Helper para verificar si un usuario tiene un rol específico
 * @param {String} userRole - Rol del usuario
 * @param {String} requiredRole - Rol requerido
 * @returns {Boolean}
 */
export const hasRole = (userRole, requiredRole) => {
  return userRole === requiredRole;
};

/**
 * Helper para verificar si un usuario tiene al menos el nivel de rol requerido
 * @param {String} userRole - Rol del usuario
 * @param {String} minimumRole - Rol mínimo requerido
 * @returns {Boolean}
 */
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
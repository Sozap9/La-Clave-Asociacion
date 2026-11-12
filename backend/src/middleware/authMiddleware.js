import { verifyAccessToken } from '../utils/tokenService.js';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Middleware para verificar autenticación
 * Verifica que el token JWT sea válido y el usuario exista
 */
export const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    // Verificar que el usuario existe y está activo
    const sql = `
      SELECT id, email, nombre, role, activo 
      FROM users 
      WHERE id = ? AND activo = true
    `;
    
    const users = await query(sql, [decoded.id]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: users[0].id,
      email: users[0].email,
      nombre: users[0].nombre,
      role: users[0].role  // IMPORTANTE: Asegurar que el role viene de la DB
    };

    // Actualizar último acceso (opcional, en background)
    query('UPDATE users SET ultimo_acceso = NOW() WHERE id = ?', [users[0].id])
      .catch(err => logger.error('Error actualizando último acceso:', err));

    next();
  } catch (error) {
    logger.error('Error en authenticate middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Añade información del usuario si el token es válido, pero no bloquea si no lo es
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);
      
      const sql = `
        SELECT id, email, nombre, role, activo 
        FROM users 
        WHERE id = ? AND activo = true
      `;
      
      const users = await query(sql, [decoded.id]);

      if (users.length > 0) {
        req.user = {
          id: users[0].id,
          email: users[0].email,
          nombre: users[0].nombre,
          role: users[0].role
        };
      }
    } catch (error) {
      // Token inválido, pero continuar sin usuario
      logger.debug('Token inválido en optionalAuthenticate:', { error: error.message });
    }

    next();
  } catch (error) {
    logger.error('Error en optionalAuthenticate middleware:', error);
    next(); // Continuar a pesar del error
  }
};

/**
 * Middleware para verificar que el usuario no esté autenticado
 * Útil para rutas como login/registro
 */
export const isNotAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return res.status(400).json({
      success: false,
      message: 'Ya estás autenticado'
    });
  }

  next();
};

/**
 * Middleware para verificar que el email está verificado
 */
export const requireEmailVerified = async (req, res, next) => {
  try {
    const sql = 'SELECT email_verified FROM users WHERE id = ?';
    const users = await query(sql, [req.user.id]);

    if (users.length === 0 || !users[0].email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Debes verificar tu email antes de acceder a este recurso'
      });
    }

    next();
  } catch (error) {
    logger.error('Error en requireEmailVerified:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verificando el estado del email'
    });
  }
};

/**
 * ✨ NUEVO: Middleware para verificar roles específicos
 * Uso: requireRole('admin') o requireRole(['admin', 'socio'])
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario está autenticado
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Normalizar allowedRoles a array
    const roles = allowedRoles.flat();

    // Verificar que el usuario tiene uno de los roles permitidos
    if (!roles.includes(req.user.role)) {
      logger.warn(`Acceso denegado: usuario ${req.user.id} (${req.user.role}) a ruta que requiere ${roles.join(' o ')}`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

/**
 * ✨ NUEVO: Middleware específico para admin (atajo)
 */
export const requireAdmin = requireRole('admin');

/**
 * ✨ NUEVO: Middleware específico para socio (atajo)
 */
export const requireSocio = requireRole(['admin', 'socio']);

export default {
  authenticate,
  optionalAuthenticate,
  isNotAuthenticated,
  requireEmailVerified,
  requireRole,
  requireAdmin,
  requireSocio
};
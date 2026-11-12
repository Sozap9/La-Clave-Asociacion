import { verifyAccessToken } from '../utils/tokenService.js';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

// JWT válido y usuario activo en la BD
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado'
      });
    }

    const token = authHeader.substring(7); // sin "Bearer "

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

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

    req.user = {
      id: users[0].id,
      email: users[0].email,
      nombre: users[0].nombre,
      role: users[0].role // de la BD, no del token
    };

    // Último acceso, sin esperar
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

// Autenticación opcional: añade req.user si hay token válido, pero no bloquea
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
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
      logger.debug('Token inválido en optionalAuthenticate:', { error: error.message });
    }

    next();
  } catch (error) {
    logger.error('Error en optionalAuthenticate middleware:', error);
    next();
  }
};

// Solo sin sesión (login, registro)
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

// Email verificado
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

// requireRole('admin') o requireRole(['admin', 'socio'])
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    const roles = allowedRoles.flat();

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

// Atajos
export const requireAdmin = requireRole('admin');

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
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

// Comprueba el JWT
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token no proporcionado' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.error('Error al verificar token:', { error: err.message });
        const message = err.name === 'TokenExpiredError'
          ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para continuar.'
          : 'Token inválido';
        return res.status(403).json({ 
          success: false,
          message 
        });
      }

      // Acepta los distintos formatos de payload que ha tenido el token
      req.user = {
        id: decoded.id || decoded.userId || decoded.user_id,
        email: decoded.email,
        role: decoded.role
      };

      next();
    });
  } catch (error) {
    logger.error('Error en authenticateToken:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar el token' 
    });
  }
};

// Solo admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Usuario no autenticado' 
    });
  }

  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.' 
    });
  }
};

// Socio o admin
export const requireSocio = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Usuario no autenticado' 
    });
  }

  if (req.user.role === 'socio' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: 'Acceso denegado. Se requiere ser socio.' 
    });
  }
};
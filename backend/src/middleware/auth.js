import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar el token JWT
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token no proporcionado' 
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Error al verificar token:', err.message);
        const message = err.name === 'TokenExpiredError'
          ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para continuar.'
          : 'Token inválido';
        return res.status(403).json({ 
          success: false,
          message 
        });
      }

      // Añadir información del usuario al request
      // Soporta diferentes formatos de payload JWT
      req.user = {
        id: decoded.id || decoded.userId || decoded.user_id,
        email: decoded.email,
        role: decoded.role
      };

      console.log('✅ Usuario autenticado:', req.user);
      next();
    });
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar el token' 
    });
  }
};

/**
 * Middleware para verificar que el usuario es admin
 */
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

/**
 * Middleware para verificar que el usuario es socio o admin
 */
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
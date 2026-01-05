import logger from '../config/logger.js';

/**
 * Middleware para proteger el registro de administradores
 * Requiere un secret key que debe ser conocido solo por administradores autorizados
 * 
 * USO: Solo para el endpoint de registro de admin
 */
export const validateAdminSecret = (req, res, next) => {
  try {
    const { adminSecret } = req.body;
    
    // Verificar que el secret existe en el request
    if (!adminSecret) {
      logger.warn('Intento de registro de admin sin adminSecret', {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      return res.status(403).json({
        success: false,
        message: 'No autorizado. Se requiere clave de administrador.'
      });
    }
    
    // Verificar que el secret coincide con el configurado
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      logger.warn('Intento de registro de admin con adminSecret inválido', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        attemptedSecret: adminSecret.substring(0, 5) + '***' // Solo primeros 5 chars para el log
      });
      
      return res.status(403).json({
        success: false,
        message: 'Clave de administrador inválida.'
      });
    }
    
    // Secret válido, continuar
    logger.info('Validación de adminSecret exitosa', {
      ip: req.ip
    });
    
    next();
    
  } catch (error) {
    logger.error('Error en validateAdminSecret middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar credenciales de administrador'
    });
  }
};
import logger from '../config/logger.js';

// Registro de admins: exige el ADMIN_SECRET en el body
export const validateAdminSecret = (req, res, next) => {
  try {
    const { adminSecret } = req.body;
    
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
    
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      logger.warn('Intento de registro de admin con adminSecret inválido', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        attemptedSecret: adminSecret.substring(0, 5) + '***' // solo el principio
      });
      
      return res.status(403).json({
        success: false,
        message: 'Clave de administrador inválida.'
      });
    }
    
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
import rateLimit from 'express-rate-limit';

/**
 * ================================================================
 * RATE LIMITERS PARA PROTEGER ENDPOINTS
 * ================================================================
 */

/**
 * Rate limiter para autenticación (login, register)
 * Límite: 10 intentos por 10 minutos
 * Uso: Login, registro, cambio de contraseña
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter general para API
 * Límite: 200 requests por 15 minutos
 * Uso: Endpoints públicos generales
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter estricto para operaciones sensibles
 * Límite: 3 intentos por hora
 * Uso: Operaciones críticas de usuarios
 */
export const strictLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 mins/hora
  max: 3,
  message: {
    success: false,
    message: 'Has excedido el límite de intentos. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para uploads
 * Límite: 10 uploads por media hora
 * Uso: Subida de avatares, DNI, documentos
 */
export const uploadLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 mins/hora
  max: 10,
  message: {
    success: false,
    message: 'Has excedido el límite de subidas. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter EXTRA ESTRICTO para operaciones de administración críticas
 * Límite: 1000 operaciones por hora
 * Uso: Eliminación de usuarios, eliminación de eventos, cancelación de eventos,
 *      dar de baja socios, cancelar reservas como admin
 */
export const adminStrictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 1000,
  message: {
    success: false,
    message: 'Has excedido el límite de operaciones administrativas. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  authLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter,
  adminStrictLimiter
};
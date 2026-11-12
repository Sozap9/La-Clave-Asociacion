import rateLimit from 'express-rate-limit';


// Login, registro y cambio de contraseña
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API general
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Operaciones sensibles de usuarios
export const strictLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Has excedido el límite de intentos. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Subidas de archivos
export const uploadLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Has excedido el límite de subidas. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Borrados y cancelaciones del admin
export const adminStrictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
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
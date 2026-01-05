import express from 'express';
import {
  registerBasic,
  registerSocio,
  login,
  refreshToken,
  logout,
  checkEmail,
  checkUsername,
  registerAdmin,
  forgotPassword,     // ✨ NUEVO
  resetPassword       // ✨ NUEVO
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateAdminSecret } from '../middleware/adminSecretMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { 
  registerBasicValidator,
  registerSocioValidator,
  loginValidator
} from '../validators/authValidator.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * ========================================
 * RUTAS PÚBLICAS DE AUTENTICACIÓN
 * Orden de middlewares: validators → handleValidationErrors → controller
 * ========================================
 */

// 🔒 PROTEGIDO: Registro de administrador
// Requiere adminSecret en el body para poder registrar un admin
// Ejemplo de uso en Postman/Frontend:
// {
//   "username": "admin",
//   "email": "admin@essenzclub.com",
//   "password": "CAMBIAR_PASSWORD",
//   "nombre": "Admin",
//   "apellidos": "Sistema",
//   "adminSecret": "TU_ADMIN_SECRET_KEY"
// }
// POST /api/auth/register/admin
router.post(
  '/register/admin',
  authLimiter,
  validateAdminSecret,        // ✅ Protección con secret key
  registerAdmin
);

// Registro de usuario básico
// POST /api/auth/register/basic
router.post(
  '/register/basic',
  authLimiter,
  registerBasicValidator,      // ← VALIDAR DATOS
  handleValidationErrors,       // ← MANEJAR ERRORES
  registerBasic                 // ← CONTROLLER
);

// Registro directo como socio
// POST /api/auth/register/socio
router.post(
  '/register/socio',
  authLimiter,
  registerSocioValidator,       // ← VALIDAR DATOS
  handleValidationErrors,       // ← MANEJAR ERRORES
  registerSocio                 // ← CONTROLLER
);

// Login de usuarios
// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  loginValidator,               // ← VALIDAR DATOS
  handleValidationErrors,       // ← MANEJAR ERRORES
  login                         // ← CONTROLLER
);

// Renovar access token usando refresh token
// POST /api/auth/refresh-token
// NO lleva validación porque usa el refresh token como seguridad
router.post('/refresh-token', refreshToken);

// Verificar disponibilidad de email
// GET /api/auth/check-email/:email
router.get('/check-email/:email', checkEmail);

// Verificar disponibilidad de username
// GET /api/auth/check-username/:username
router.get('/check-username/:username', checkUsername);

// ========== RECUPERACIÓN DE CONTRASEÑA ========== ✨ NUEVO

// Solicitar reset de contraseña (envía email con token)
// POST /api/auth/forgot-password
// Body: { email }
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail()
  ],
  handleValidationErrors,
  forgotPassword
);

// Confirmar nueva contraseña con token
// POST /api/auth/reset-password
// Body: { token, newPassword }
router.post(
  '/reset-password',
  authLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Token es requerido'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener mayúscula, minúscula y número')
  ],
  handleValidationErrors,
  resetPassword
);

/**
 * ========================================
 * RUTAS PROTEGIDAS (requieren autenticación)
 * ========================================
 */

// Logout
// POST /api/auth/logout
router.post('/logout', authenticate, logout);

export default router;
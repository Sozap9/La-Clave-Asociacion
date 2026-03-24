import express from 'express';
import {
  registerBasic,
  registerSocio,
  crearSolicitud,       // ✨ NUEVO
  login,
  refreshToken,
  logout,
  checkEmail,
  checkUsername,
  registerAdmin,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateAdminSecret } from '../middleware/adminSecretMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerBasicValidator,
  registerSocioValidator,
  loginValidator,
  solicitudSocioValidator  // ✨ NUEVO
} from '../validators/authValidator.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';
import { uploadSolicitudDNI } from '../config/multer.js';  // ✨ NUEVO
import { body } from 'express-validator';

const router = express.Router();

/**
 * ========================================
 * RUTAS PÚBLICAS DE AUTENTICACIÓN
 * ========================================
 */

// 🔒 Registro de administrador (protegido con secret key)
// POST /api/auth/register/admin
router.post(
  '/register/admin',
  authLimiter,
  validateAdminSecret,
  registerAdmin
);

// Registro de usuario básico (flujo antiguo — mantenido)
// POST /api/auth/register/basic
router.post(
  '/register/basic',
  authLimiter,
  registerBasicValidator,
  handleValidationErrors,
  registerBasic
);

// Registro directo como socio (flujo antiguo — mantenido)
// POST /api/auth/register/socio
router.post(
  '/register/socio',
  authLimiter,
  registerSocioValidator,
  handleValidationErrors,
  registerSocio
);

// ✨ NUEVO: Solicitud de socio (nuevo flujo de registro)
// POST /api/auth/solicitud-socio
// FormData: campos de texto + dni_front (imagen) + dni_back (imagen)
router.post(
  '/solicitud-socio',
  authLimiter,
  // Multer procesa las imágenes ANTES de que express-validator lea req.body
  uploadSolicitudDNI.fields([
    { name: 'dni_front', maxCount: 1 },
    { name: 'dni_back',  maxCount: 1 }
  ]),
  solicitudSocioValidator,
  handleValidationErrors,
  crearSolicitud
);

// Login
// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  loginValidator,
  handleValidationErrors,
  login
);

// Renovar access token
// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// Verificar disponibilidad de email
// GET /api/auth/check-email/:email
router.get('/check-email/:email', checkEmail);

// Verificar disponibilidad de username
// GET /api/auth/check-username/:username
router.get('/check-username/:username', checkUsername);

// ─── Recuperación de contraseña ─────────────────────────────────

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail()
  ],
  handleValidationErrors,
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  [
    body('token')
      .notEmpty().withMessage('Token es requerido'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
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
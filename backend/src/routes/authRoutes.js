import express from 'express';
import {
  registerBasic,
  registerSocio,
  crearSolicitud,
  login,
  refreshToken,
  logout,
  checkEmail,
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
  solicitudSocioValidator
} from '../validators/authValidator.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';
import { uploadSolicitudDNI } from '../config/multer.js';
import { body } from 'express-validator';

const router = express.Router();

// Públicas

router.post(
  '/register/admin',
  authLimiter,
  validateAdminSecret,
  registerAdmin
);

router.post(
  '/register/basic',
  authLimiter,
  registerBasicValidator,
  handleValidationErrors,
  registerBasic
);

router.post(
  '/register/socio',
  authLimiter,
  registerSocioValidator,
  handleValidationErrors,
  registerSocio
);

// FormData: campos de texto + dni_front (imagen) + dni_back (imagen)
router.post(
  '/solicitud-socio',
  authLimiter,
  // Multer antes del validador: hasta entonces req.body no tiene los campos
  uploadSolicitudDNI.fields([
    { name: 'dni_front', maxCount: 1 },
    { name: 'dni_back',  maxCount: 1 }
  ]),
  solicitudSocioValidator,
  handleValidationErrors,
  crearSolicitud
);

router.post(
  '/login',
  authLimiter,
  loginValidator,
  handleValidationErrors,
  login
);

router.post('/refresh-token', refreshToken);

router.get('/check-email/:email', checkEmail);

// Recuperar contraseña

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

// Con sesión

router.post('/logout', authenticate, logout);

export default router;
import express from 'express';
import { submitContact } from '../controllers/contactController.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * ================================================================
 * RUTAS DE CONTACTO (públicas)
 * ================================================================
 */

// POST /api/contact
// Enviar mensaje del formulario de contacto público
router.post(
  '/',
  apiLimiter,
  [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('email')
      .trim()
      .notEmpty().withMessage('El email es obligatorio')
      .isEmail().withMessage('Email no válido')
      .normalizeEmail(),

    body('asunto')
      .trim()
      .notEmpty().withMessage('El asunto es obligatorio')
      .isLength({ min: 3, max: 200 }).withMessage('El asunto debe tener entre 3 y 200 caracteres'),

    body('mensaje')
      .trim()
      .notEmpty().withMessage('El mensaje es obligatorio')
      .isLength({ min: 10 }).withMessage('El mensaje debe tener al menos 10 caracteres'),
  ],
  handleValidationErrors,
  submitContact
);

export default router;
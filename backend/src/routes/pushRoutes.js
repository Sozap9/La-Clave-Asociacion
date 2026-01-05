import express from 'express';
import {
  subscribe,
  unsubscribe,
  getVapidKey,
  sendTestNotification
} from '../controllers/pushController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * ========================================
 * RUTAS PÚBLICAS
 * ========================================
 */

// Obtener clave pública VAPID
// El frontend necesita esta clave para solicitar permisos
// GET /api/push/vapid-key
router.get('/vapid-key', getVapidKey);

/**
 * ========================================
 * RUTAS PROTEGIDAS (requieren autenticación)
 * ========================================
 */

// Suscribirse a notificaciones push
// POST /api/push/subscribe
// Body: { subscription: { endpoint, keys: { p256dh, auth } } }
router.post(
  '/subscribe',
  authenticate,
  [
    body('subscription')
      .notEmpty()
      .withMessage('Datos de suscripción requeridos'),
    body('subscription.endpoint')
      .notEmpty()
      .withMessage('Endpoint es requerido'),
    body('subscription.keys')
      .notEmpty()
      .withMessage('Claves de suscripción requeridas'),
    body('subscription.keys.p256dh')
      .notEmpty()
      .withMessage('Clave p256dh requerida'),
    body('subscription.keys.auth')
      .notEmpty()
      .withMessage('Clave auth requerida')
  ],
  handleValidationErrors,
  subscribe
);

// Desuscribirse de notificaciones push
// POST /api/push/unsubscribe
router.post(
  '/unsubscribe',
  authenticate,
  unsubscribe
);

// Enviar notificación de prueba
// POST /api/push/test
router.post(
  '/test',
  authenticate,
  sendTestNotification
);

export default router;
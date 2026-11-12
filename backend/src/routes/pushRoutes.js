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

// Rutas públicas

router.get('/vapid-key', getVapidKey);

// Con sesión

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

router.post(
  '/unsubscribe',
  authenticate,
  unsubscribe
);

router.post(
  '/test',
  authenticate,
  sendTestNotification
);

export default router;
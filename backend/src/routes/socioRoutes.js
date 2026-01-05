import express from 'express';
import {
  upgradeToSocio,
  getMyMembership,
  updatePaymentMethod,
  cancelMembership,
  getMyPayments,
  createPaymentSetup,
  getMyEvents
} from '../controllers/socioController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isSocio } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Todas las rutas requieren autenticación
 */
router.use(authenticate);

/**
 * Setup de pago (disponible para todos los usuarios autenticados)
 */

// Crear setup intent para configurar método de pago
// POST /api/socios/setup-intent
router.post('/setup-intent', createPaymentSetup);

/**
 * Upgrade a socio (solo para usuarios básicos)
 */

// Convertirse en socio
// POST /api/socios/upgrade
router.post('/upgrade', upgradeToSocio);

/**
 * Gestión de membresía (solo para socios)
 */

// Obtener información de mi membresía
// GET /api/socios/me
router.get('/me', isSocio, getMyMembership);

// Actualizar método de pago
// PUT /api/socios/me/payment-method
router.put('/me/payment-method', isSocio, updatePaymentMethod);

// Cancelar membresía
// DELETE /api/socios/me/cancel
router.delete('/me/cancel', isSocio, cancelMembership);

/**
 * Historial y eventos
 */

// Obtener historial de pagos
// GET /api/socios/me/payments
router.get('/me/payments', isSocio, getMyPayments);

// Obtener mis eventos
// GET /api/socios/me/events
router.get('/me/events', isSocio, getMyEvents);

export default router;
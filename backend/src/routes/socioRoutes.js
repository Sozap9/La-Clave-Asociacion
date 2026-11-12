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

router.use(authenticate);

// Método de pago (cualquier usuario)

router.post('/setup-intent', createPaymentSetup);

// Pasar a socio (retirado)

router.post('/upgrade', upgradeToSocio);

// Membresía (solo socios)

router.get('/me', isSocio, getMyMembership);

router.put('/me/payment-method', isSocio, updatePaymentMethod);

router.delete('/me/cancel', isSocio, cancelMembership);

// Historial y eventos

router.get('/me/payments', isSocio, getMyPayments);

router.get('/me/events', isSocio, getMyEvents);

export default router;
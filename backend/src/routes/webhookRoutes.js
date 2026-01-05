import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

/**
 * IMPORTANTE: Los webhooks NO deben tener middleware de autenticación
 * Stripe verifica la firma del webhook
 */

// Webhook de Stripe
// POST /api/webhooks/stripe
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }), // Raw body para verificar firma
  handleStripeWebhook
);

export default router;
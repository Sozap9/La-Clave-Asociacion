import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Sin autenticación: la seguridad es la firma de Stripe

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }), // la firma se comprueba sobre el body sin parsear
  handleStripeWebhook
);

export default router;
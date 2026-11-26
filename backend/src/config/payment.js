import Stripe from 'stripe';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config({ quiet: true });

// Stripe se crea al primer uso: sin STRIPE_SECRET_KEY el servidor arranca
// igual y solo fallan los pagos

let _stripe = null;

const getStripe = () => {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY no está configurada en el .env. ' +
      'Configúrala para activar los pagos con Stripe.'
    );
  }

  _stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  return _stripe;
};

/**
 * Checkout de pago único para una entrada.
 * cancelPath: por defecto /eventos, porque no existe /eventos/:id.
 * precioUnitario: el de la tanda vigente; sin él se usa event.precio_socio.
 */
export const createCheckoutSession = async ({ booking, event, user, numeroEntradas, cancelPath = '/eventos', precioUnitario }) => {
  try {
    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 30 min para pagar
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

    // Solo tarjeta (incluye Apple Pay y Google Pay). PayPal, cuando se active
    // en el Dashboard; pedirlo antes hace que Stripe muestre otros métodos.
    const paymentMethodTypes = ['card'];

    const unitPrice = precioUnitario !== undefined && precioUnitario !== null
      ? precioUnitario
      : event.precio_socio;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: paymentMethodTypes,
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: event.titulo,
              description: `Entrada para el evento del ${new Date(event.fecha_evento).toLocaleDateString('es-ES')}`,
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: numeroEntradas,
        },
      ],
      success_url: `${frontendUrl}/mis-entradas?pago=exitoso&booking_id=${booking.id}`,
      cancel_url: `${frontendUrl}${cancelPath}?pago=cancelado`,
      expires_at: expiresAt,
      metadata: {
        booking_id: booking.id.toString(),
        event_id: event.id.toString(),
        socio_id: booking.socio_id.toString(),
      },
    });

    return session;
  } catch (error) {
    logger.error('Error creando Checkout Session:', error);
    throw error;
  }
};

// Consultar una sesión de Checkout (status: open, complete o expired)
export const getCheckoutSession = async (sessionId) => {
  return await getStripe().checkout.sessions.retrieve(sessionId);
};

// Anular una sesión abierta para que ya no se pueda pagar
export const expireCheckoutSession = async (sessionId) => {
  return await getStripe().checkout.sessions.expire(sessionId);
};

// Cliente de Stripe
export const createStripeCustomer = async (userData) => {
  try {
    const customer = await getStripe().customers.create({
      email: userData.email,
      name: `${userData.nombre} ${userData.apellidos}`,
      phone: userData.telefono,
      metadata: {
        user_id: userData.id.toString(),
      },
    });
    return customer;
  } catch (error) {
    logger.error('Error creando cliente Stripe:', error);
    throw error;
  }
};

// Método de pago predeterminado del cliente
export const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    return paymentMethod;
  } catch (error) {
    logger.error('Error adjuntando método de pago:', error);
    throw error;
  }
};

// Suscripción mensual (cuota)
export const createSubscription = async (customerId, amount = 10.0) => {
  try {
    const stripe = getStripe();
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: 'eur',
      recurring: { interval: 'month' },
      product_data: {
        name: 'Membresía La Clave',
        description: 'Cuota mensual de socio de La Clave',
      },
    });
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    logger.error('Error creando suscripción:', error);
    throw error;
  }
};

// Cancelar suscripción
export const cancelSubscription = async (subscriptionId) => {
  try {
    return await getStripe().subscriptions.cancel(subscriptionId);
  } catch (error) {
    logger.error('Error cancelando suscripción:', error);
    throw error;
  }
};

// Método de pago de la suscripción
export const updatePaymentMethod = async (customerId, paymentMethodId) => {
  try {
    const stripe = getStripe();
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    return await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  } catch (error) {
    logger.error('Error actualizando método de pago:', error);
    throw error;
  }
};

// Obtener suscripción
export const getSubscription = async (subscriptionId) => {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    logger.error('Error obteniendo suscripción:', error);
    throw error;
  }
};

// Obtener facturas de un cliente
export const getInvoices = async (customerId, limit = 10) => {
  try {
    const invoices = await getStripe().invoices.list({ customer: customerId, limit });
    return invoices.data;
  } catch (error) {
    logger.error('Error obteniendo facturas:', error);
    throw error;
  }
};

// Setup Intent: guardar un método de pago sin cobrar
export const createSetupIntent = async (customerId) => {
  try {
    return await getStripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
  } catch (error) {
    logger.error('Error creando setup intent:', error);
    throw error;
  }
};

// Firma del webhook
export const verifyWebhook = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error('Error verificando webhook:', error);
    throw error;
  }
};

// Reembolso. Con idempotencyKey, repetir la llamada no reembolsa dos veces.
export const refundPayment = async (paymentIntentId, idempotencyKey) => {
  try {
    return await getStripe().refunds.create(
      { payment_intent: paymentIntentId },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  } catch (error) {
    logger.error('Error creando reembolso:', error);
    throw error;
  }
};

// Proxy para usar stripe directamente sin crearlo antes de tiempo
export const stripe = new Proxy(
  {},
  { get(_, prop) { return getStripe()[prop]; } }
);

export default {
  stripe,
  createStripeCustomer,
  createCheckoutSession,
  getCheckoutSession,
  expireCheckoutSession,
  attachPaymentMethod,
  createSubscription,
  cancelSubscription,
  updatePaymentMethod,
  getSubscription,
  getInvoices,
  createSetupIntent,
  verifyWebhook,
  refundPayment,
};
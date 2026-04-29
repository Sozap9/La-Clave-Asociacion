import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ================================================================
 * CONFIGURACIÓN DE STRIPE - LA CLAVE ASOCIACIÓN
 * ================================================================
 * Lazy init: Stripe solo se instancia cuando se necesita por primera
 * vez. Si STRIPE_SECRET_KEY no está en el .env, el servidor arranca
 * igualmente y solo falla cuando se intenta usar un endpoint de pago.
 * ================================================================
 */

let _stripe = null;

const getStripe = () => {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      '⚠️  STRIPE_SECRET_KEY no está configurada en el .env. ' +
      'Configúrala para activar los pagos con Stripe.'
    );
  }

  _stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  return _stripe;
};

/**
 * Crear cliente en Stripe
 */
export const createStripeCustomer = async (userData) => {
  try {
    const customer = await getStripe().customers.create({
      email: userData.email,
      name: `${userData.nombre} ${userData.apellidos}`,
      phone: userData.telefono,
      metadata: {
        user_id: userData.id.toString(),
        username: userData.username,
      },
    });
    return customer;
  } catch (error) {
    console.error('Error creando cliente Stripe:', error);
    throw error;
  }
};

/**
 * Adjuntar método de pago a un cliente y establecerlo como predeterminado
 */
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
    console.error('Error adjuntando método de pago:', error);
    throw error;
  }
};

/**
 * Crear suscripción mensual (cuota de membresía)
 */
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
    console.error('Error creando suscripción:', error);
    throw error;
  }
};

/**
 * Cancelar suscripción
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    return await getStripe().subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    throw error;
  }
};

/**
 * Actualizar método de pago de suscripción
 */
export const updatePaymentMethod = async (customerId, paymentMethodId) => {
  try {
    const stripe = getStripe();
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    return await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  } catch (error) {
    console.error('Error actualizando método de pago:', error);
    throw error;
  }
};

/**
 * Obtener suscripción
 */
export const getSubscription = async (subscriptionId) => {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    throw error;
  }
};

/**
 * Obtener facturas de un cliente
 */
export const getInvoices = async (customerId, limit = 10) => {
  try {
    const invoices = await getStripe().invoices.list({ customer: customerId, limit });
    return invoices.data;
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    throw error;
  }
};

/**
 * Crear Setup Intent (guardar método de pago sin cargo inmediato)
 */
export const createSetupIntent = async (customerId) => {
  try {
    return await getStripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
  } catch (error) {
    console.error('Error creando setup intent:', error);
    throw error;
  }
};

/**
 * Verificar firma de webhook de Stripe
 */
export const verifyWebhook = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Error verificando webhook:', error);
    throw error;
  }
};

/**
 * Reembolsar pago
 */
export const refundPayment = async (paymentIntentId) => {
  try {
    return await getStripe().refunds.create({ payment_intent: paymentIntentId });
  } catch (error) {
    console.error('Error creando reembolso:', error);
    throw error;
  }
};

// Exportar instancia como Proxy lazy para acceso directo (usado en webhookController)
export const stripe = new Proxy(
  {},
  { get(_, prop) { return getStripe()[prop]; } }
);

export default {
  stripe,
  createStripeCustomer,
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
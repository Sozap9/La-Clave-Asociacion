import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * Crear cliente en Stripe
 * @param {Object} userData - Datos del usuario
 * @returns {Object} Cliente de Stripe
 */
export const createStripeCustomer = async (userData) => {
  try {
    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.nombre} ${userData.apellidos}`,
      phone: userData.telefono,
      metadata: {
        user_id: userData.id.toString(),
        username: userData.username
      }
    });

    return customer;
  } catch (error) {
    console.error('Error creando cliente Stripe:', error);
    throw error;
  }
};

/**
 * Crear método de pago
 * @param {String} paymentMethodId - ID del método de pago de Stripe
 * @param {String} customerId - ID del cliente en Stripe
 * @returns {Object} Método de pago
 */
export const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    // Adjuntar método de pago al cliente
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Establecer como método de pago predeterminado
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    return paymentMethod;
  } catch (error) {
    console.error('Error adjuntando método de pago:', error);
    throw error;
  }
};

/**
 * Crear suscripción mensual
 * @param {String} customerId - ID del cliente en Stripe
 * @param {Number} amount - Monto en euros
 * @returns {Object} Suscripción creada
 */
export const createSubscription = async (customerId, amount = 10.00) => {
  try {
    // Crear precio (price) en Stripe
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convertir a céntimos
      currency: 'eur',
      recurring: {
        interval: 'month'
      },
      product_data: {
        name: 'Membresía La Clave',
        description: 'Cuota mensual de socio de La Clave'
      }
    });

    // Crear suscripción
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    return subscription;
  } catch (error) {
    console.error('Error creando suscripción:', error);
    throw error;
  }
};

/**
 * Cancelar suscripción
 * @param {String} subscriptionId - ID de la suscripción
 * @returns {Object} Suscripción cancelada
 */
export const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    throw error;
  }
};

/**
 * Actualizar método de pago de suscripción
 * @param {String} customerId - ID del cliente
 * @param {String} paymentMethodId - Nuevo ID del método de pago
 * @returns {Object} Cliente actualizado
 */
export const updatePaymentMethod = async (customerId, paymentMethodId) => {
  try {
    // Adjuntar nuevo método de pago
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Actualizar método predeterminado
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    return customer;
  } catch (error) {
    console.error('Error actualizando método de pago:', error);
    throw error;
  }
};

/**
 * Obtener información de suscripción
 * @param {String} subscriptionId - ID de la suscripción
 * @returns {Object} Información de la suscripción
 */
export const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    throw error;
  }
};

/**
 * Obtener facturas de un cliente
 * @param {String} customerId - ID del cliente
 * @param {Number} limit - Límite de facturas a obtener
 * @returns {Array} Lista de facturas
 */
export const getInvoices = async (customerId, limit = 10) => {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: limit
    });
    return invoices.data;
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    throw error;
  }
};

/**
 * Crear Setup Intent (para guardar método de pago sin cargo inmediato)
 * @param {String} customerId - ID del cliente
 * @returns {Object} Setup Intent
 */
export const createSetupIntent = async (customerId) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card']
    });
    return setupIntent;
  } catch (error) {
    console.error('Error creando setup intent:', error);
    throw error;
  }
};

/**
 * Verificar webhook de Stripe
 * @param {String} payload - Cuerpo de la petición
 * @param {String} signature - Firma del webhook
 * @returns {Object} Evento verificado
 */
export const verifyWebhook = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Error verificando webhook:', error);
    throw error;
  }
};

/**
 * Reembolsar pago
 * @param {String} paymentIntentId - ID del payment intent
 * @returns {Object} Reembolso
 */
export const refundPayment = async (paymentIntentId) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId
    });
    return refund;
  } catch (error) {
    console.error('Error creando reembolso:', error);
    throw error;
  }
};

export { stripe };

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
  refundPayment
};
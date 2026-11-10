import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

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
 * Crear sesión de Stripe Checkout para el pago de una entrada a evento
 * (pago único — mode: 'payment', NO es una suscripción)
 *
 * Se especifica payment_method_types explícitamente para limitar el
 * checkout a tarjeta (Apple Pay/Google Pay se muestran solos en cuanto
 * 'card' está en la lista). Añade 'paypal' a paymentMethodTypes más
 * abajo cuando esté activado en el Dashboard. Si en el futuro se quiere
 * volver a mostrar todo lo que esté activo en el Dashboard (Bizum,
 * Link, etc.), basta con quitar el parámetro payment_method_types.
 *
 * @param {Object} params
 * @param {Object} params.booking - Reserva recién creada (estado esperando_pago)
 * @param {Object} params.event - Evento
 * @param {Object} params.user - Usuario que reserva
 * @param {Number} params.numeroEntradas - Número de entradas
 * @param {String} [params.cancelPath] - Ruta del frontend a la que volver
 *   si el socio cancela/le da atrás en Stripe. Por defecto '/eventos'
 *   (el listado — NO existe una ruta /eventos/:id individual, así que
 *   nunca hay que apuntar ahí o Stripe redirige a un 404).
 * @param {Number} [params.precioUnitario] - Precio por entrada a cobrar.
 *   Si no se pasa, cae a event.precio_socio (compatibilidad con
 *   llamadas antiguas). Con tandas, SIEMPRE debe pasarse ya resuelto
 *   desde el controller (el precio de la tanda vigente al reservar).
 * @returns {Object} Stripe Checkout Session (usar session.url para redirigir)
 */
export const createCheckoutSession = async ({ booking, event, user, numeroEntradas, cancelPath = '/eventos', precioUnitario }) => {
  try {
    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Expira en 30 minutos — tiempo suficiente para pagar, pero corto
    // para no bloquear aforo innecesariamente si alguien abandona el pago
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

    // Restringimos explícitamente a tarjeta.
    // Apple Pay y Google Pay se activan automáticamente en cuanto
    // 'card' está en la lista — no hace falta añadirlos aparte, y como
    // esto es Stripe Checkout hospedado (checkout.stripe.com) tampoco
    // hace falta verificar el dominio para Apple Pay.
    // 'paypal' se añadirá aquí cuando esté activado en el Dashboard
    // (Settings → Payment methods → PayPal → Turn on). Pedirlo antes de
    // activarlo hace que Stripe muestre alternativas no deseadas
    // (ej. Satispay) en su lugar.
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
              description: `Entrada para el evento del ${event.fecha_evento}`,
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
    console.error('Error creando Checkout Session:', error);
    throw error;
  }
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
  createCheckoutSession,
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
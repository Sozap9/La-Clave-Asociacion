import { verifyWebhook } from '../config/payment.js';
import { query } from '../config/database.js';
import Socio from '../models/Socio.js';

/**
 * Webhook de Stripe
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verificar webhook
    event = verifyWebhook(req.body, sig);
  } catch (err) {
    console.error('Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar diferentes tipos de eventos
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
};

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amountPaid = invoice.amount_paid / 100; // Convertir de centavos a euros

    // Buscar socio por customer_id
    const socioSql = 'SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1';
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log('Socio no encontrado para customer:', customerId);
      return;
    }

    const socio = socios[0];

    // Registrar pago exitoso
    await Socio.registrarPagoExitoso(socio.id);

    // Guardar en tabla payments
    await query(`
      INSERT INTO payments (
        socio_id, tipo_pago, amount, currency, 
        stripe_payment_intent_id, stripe_invoice_id,
        estado, fecha_pago
      ) VALUES (?, 'cuota_mensual', ?, 'EUR', ?, ?, 'exitoso', NOW())
    `, [
      socio.id,
      amountPaid,
      invoice.payment_intent,
      invoice.id
    ]);

    console.log(`✅ Pago exitoso procesado para socio ${socio.numero_socio}`);

    // TODO: Enviar email de confirmación de pago

  } catch (error) {
    console.error('Error en handlePaymentSucceeded:', error);
    throw error;
  }
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(invoice) {
  try {
    const customerId = invoice.customer;
    const amountDue = invoice.amount_due / 100;

    // Buscar socio
    const socioSql = 'SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1';
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log('Socio no encontrado para customer:', customerId);
      return;
    }

    const socio = socios[0];

    // Incrementar contador de pagos fallidos
    await Socio.incrementarPagosFallidos(socio.id);

    // Guardar en tabla payments
    await query(`
      INSERT INTO payments (
        socio_id, tipo_pago, amount, currency,
        stripe_invoice_id, estado, error_mensaje, fecha_pago
      ) VALUES (?, 'cuota_mensual', ?, 'EUR', ?, 'fallido', ?, NOW())
    `, [
      socio.id,
      amountDue,
      invoice.id,
      'Pago rechazado'
    ]);

    // Verificar si debe marcarse como moroso (3 intentos fallidos)
    const socioActualizado = await Socio.findById(socio.id);
    
    if (socioActualizado.pagos_fallidos >= 3) {
      console.log(`⚠️ Socio ${socio.numero_socio} marcado como moroso`);
      // TODO: Enviar email notificando suspensión
    } else {
      console.log(`⚠️ Pago fallido #${socioActualizado.pagos_fallidos} para socio ${socio.numero_socio}`);
      // TODO: Enviar email solicitando actualizar método de pago
    }

  } catch (error) {
    console.error('Error en handlePaymentFailed:', error);
    throw error;
  }
}

/**
 * Manejar suscripción cancelada
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const customerId = subscription.customer;

    // Buscar socio
    const socioSql = 'SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1';
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log('Socio no encontrado para customer:', customerId);
      return;
    }

    const socio = socios[0];

    // Dar de baja al socio
    await Socio.darDeBaja(socio.id, 'Suscripción cancelada en Stripe');

    // Cambiar rol a básico
    await query('UPDATE users SET role = ? WHERE id = ?', ['basico', socio.user_id]);

    console.log(`❌ Suscripción cancelada para socio ${socio.numero_socio}`);

    // TODO: Enviar email de confirmación de cancelación

  } catch (error) {
    console.error('Error en handleSubscriptionDeleted:', error);
    throw error;
  }
}

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const customerId = subscription.customer;
    const status = subscription.status;

    // Buscar socio
    const socioSql = 'SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1';
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log('Socio no encontrado para customer:', customerId);
      return;
    }

    const socio = socios[0];

    // Actualizar estado según status de suscripción
    if (status === 'active') {
      await query('UPDATE socios SET estado = ? WHERE id = ?', ['activo', socio.id]);
      console.log(`✅ Suscripción activa para socio ${socio.numero_socio}`);
    } else if (status === 'past_due') {
      await Socio.marcarComoMoroso(socio.id);
      console.log(`⚠️ Suscripción vencida para socio ${socio.numero_socio}`);
    } else if (status === 'canceled' || status === 'unpaid') {
      await Socio.darDeBaja(socio.id, `Suscripción ${status}`);
      console.log(`❌ Suscripción ${status} para socio ${socio.numero_socio}`);
    }

  } catch (error) {
    console.error('Error en handleSubscriptionUpdated:', error);
    throw error;
  }
}

export default {
  handleStripeWebhook
};
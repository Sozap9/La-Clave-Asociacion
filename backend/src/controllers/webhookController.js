import { verifyWebhook } from "../config/payment.js";
import { query } from "../config/database.js";
import Socio from "../models/Socio.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import EmailService from "../services/emailService.js";
import { generateQRCode } from "../utils/qrCodeGenerator.js";
import logger from "../config/logger.js";

/**
 * Webhook de Stripe
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Verificar webhook
    event = verifyWebhook(req.body, sig);
  } catch (err) {
    console.error("Error verificando webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar diferentes tipos de eventos
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error procesando webhook" });
  }
};

/**
 * Pago de entrada a evento completado con éxito (Stripe Checkout)
 * Esto es lo que de verdad confirma una reserva de pago — hasta que
 * esto no llega, la reserva se queda en 'esperando_pago'.
 *
 * Idempotente: Stripe puede reintentar el envío del webhook, así que
 * si la reserva ya está 'confirmada' no se vuelve a procesar.
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) {
      logger.warn(
        "checkout.session.completed sin booking_id en metadata — se ignora (probablemente de otro flujo de Stripe)",
        { sessionId: session.id },
      );
      return;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      logger.error("checkout.session.completed: booking no encontrada", {
        bookingId,
      });
      return;
    }

    // Idempotencia: si ya está confirmada, no hacer nada más
    if (booking.estado === "confirmada") {
      logger.info("Booking ya estaba confirmada, se ignora reintento de webhook", {
        bookingId,
      });
      return;
    }

    // Confirmar la reserva y guardar el importe realmente pagado
    // (antes se quedaba siempre en 0 — el email de confirmación lo
    // necesita para mostrar el coste real, no solo si fue gratis)
    await query(
      `UPDATE bookings SET estado = 'confirmada', precio_pagado = ? WHERE id = ?`,
      [(session.amount_total || 0) / 100, bookingId],
    );

    // Registrar el pago REAL (payment_intent de verdad, no inventado)
    await query(
      `INSERT INTO payments (
        socio_id, stripe_payment_intent_id, amount, currency, tipo_pago,
        descripcion, estado, fecha_pago, metadata, created_at
      ) VALUES (?, ?, ?, 'EUR', 'entrada_evento', ?, 'exitoso', NOW(), ?, NOW())`,
      [
        booking.socio_id,
        session.payment_intent,
        (session.amount_total || 0) / 100,
        `Entrada a evento (booking ${bookingId})`,
        JSON.stringify({
          event_id: session.metadata?.event_id,
          booking_id: bookingId,
          checkout_session_id: session.id,
        }),
      ],
    );

    // Generar QR y enviar confirmación — ahora sí, con el pago ya real
    const event = await Event.findById(session.metadata?.event_id);
    const bookingWithQR = await Booking.findById(bookingId);

    try {
      const qrData = `LACLAVE-${bookingId}-${bookingWithQR.codigo_acceso}`;
      const qrCode = await generateQRCode(qrData, bookingId);
      await Booking.saveQRCode(bookingId, qrCode);
    } catch (qrError) {
      logger.error("❌ Error generando QR tras pago confirmado:", qrError);
    }

    try {
      const socio = await Socio.findById(booking.socio_id);
      const user = socio ? await User.findById(socio.user_id) : null;
      const finalBooking = await Booking.findById(bookingId);
      if (user && event) {
        await EmailService.sendBookingConfirmation(finalBooking, event, user);
      }
    } catch (emailError) {
      logger.error("❌ Error enviando email de confirmación tras pago:", emailError);
    }

    logger.info("✅ Pago de entrada confirmado vía Stripe Checkout:", {
      bookingId,
      sessionId: session.id,
      paymentIntent: session.payment_intent,
    });
  } catch (error) {
    logger.error("Error en handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

/**
 * La sesión de Checkout expiró sin completarse (el usuario no pagó a
 * tiempo). Cancelamos la reserva y liberamos el aforo que tenía
 * bloqueado.
 */
async function handleCheckoutSessionExpired(session) {
  try {
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.estado !== "esperando_pago") {
      // Ya se confirmó, ya se canceló, o no existe — no hay nada que hacer
      return;
    }

    await Booking.cancel(bookingId, "Pago no completado a tiempo");

    // Liberar el aforo que esta reserva pendiente tenía bloqueado
    await query(
      `UPDATE events SET entradas_disponibles = entradas_disponibles + ? WHERE id = ?`,
      [booking.numero_entradas, booking.event_id],
    );

    logger.info("⏱️ Reserva cancelada por Checkout Session expirada:", {
      bookingId,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error("Error en handleCheckoutSessionExpired:", error);
    throw error;
  }
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amountPaid = invoice.amount_paid / 100; // Convertir de centavos a euros

    // Buscar socio por customer_id
    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log("Socio no encontrado para customer:", customerId);
      return;
    }

    const socio = socios[0];

    // Registrar pago exitoso en el socio
    await Socio.registrarPagoExitoso(socio.id);

    // Guardar en tabla payments
    await query(
      `
      INSERT INTO payments (
        socio_id, tipo_pago, amount, currency,
        stripe_payment_intent_id, stripe_invoice_id,
        estado, fecha_pago
      ) VALUES (?, 'cuota_mensual', ?, 'EUR', ?, ?, 'exitoso', NOW())
    `,
      [socio.id, amountPaid, invoice.payment_intent, invoice.id],
    );

    console.log(`✅ Pago exitoso procesado para socio ${socio.numero_socio}`);

    // TODO: Enviar email de confirmación de pago
  } catch (error) {
    console.error("Error en handlePaymentSucceeded:", error);
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
    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log("Socio no encontrado para customer:", customerId);
      return;
    }

    const socio = socios[0];

    // Incrementar contador de pagos fallidos
    await Socio.incrementarPagosFallidos(socio.id);

    // Guardar en tabla payments
    await query(
      `
      INSERT INTO payments (
        socio_id, tipo_pago, amount, currency,
        stripe_invoice_id, estado, error_mensaje, fecha_pago
      ) VALUES (?, 'cuota_mensual', ?, 'EUR', ?, 'fallido', ?, NOW())
    `,
      [socio.id, amountDue, invoice.id, "Pago rechazado"],
    );

    // Verificar si debe marcarse como moroso (3 intentos fallidos)
    const socioActualizado = await Socio.findById(socio.id);

    if (socioActualizado.pagos_fallidos >= 3) {
      await Socio.marcarComoMoroso(socio.id);
      console.log(`⚠️ Socio ${socio.numero_socio} marcado como moroso`);
      // TODO: Enviar email notificando suspensión
    } else {
      console.log(
        `⚠️ Pago fallido #${socioActualizado.pagos_fallidos} para socio ${socio.numero_socio}`,
      );
      // TODO: Enviar email solicitando actualizar método de pago
    }
  } catch (error) {
    console.error("Error en handlePaymentFailed:", error);
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
    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log("Socio no encontrado para customer:", customerId);
      return;
    }

    const socio = socios[0];

    // Dar de baja al socio
    await Socio.darDeBaja(socio.id, "Suscripción cancelada en Stripe");

    // Cambiar rol a básico
    await query("UPDATE users SET role = ? WHERE id = ?", [
      "basico",
      socio.user_id,
    ]);

    console.log(`❌ Suscripción cancelada para socio ${socio.numero_socio}`);

    // TODO: Enviar email de confirmación de cancelación
  } catch (error) {
    console.error("Error en handleSubscriptionDeleted:", error);
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
    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      console.log("Socio no encontrado para customer:", customerId);
      return;
    }

    const socio = socios[0];

    // Actualizar estado según status de suscripción
    if (status === "active") {
      await query("UPDATE socios SET estado = ? WHERE id = ?", [
        "activo",
        socio.id,
      ]);
      console.log(`Suscripción activa para socio ${socio.numero_socio}`);
    } else if (status === "past_due") {
      await Socio.marcarComoMoroso(socio.id);
      console.log(`Suscripción vencida para socio ${socio.numero_socio}`);
    } else if (status === "canceled" || status === "unpaid") {
      await Socio.darDeBaja(socio.id, `Suscripción ${status}`);
      console.log(`Suscripción ${status} para socio ${socio.numero_socio}`);
    }
  } catch (error) {
    console.error("Error en handleSubscriptionUpdated:", error);
    throw error;
  }
}

export default {
  handleStripeWebhook,
};
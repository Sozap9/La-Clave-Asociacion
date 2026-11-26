import { verifyWebhook, refundPayment } from "../config/payment.js";
import { query, transaction } from "../config/database.js";
import Socio from "../models/Socio.js";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import EmailService from "../services/emailService.js";
import { generateQRCodeBase64 } from "../utils/qrCodeGenerator.js";
import logger from "../config/logger.js";
import { registrarActividad } from "../utils/activityLogger.js";

/**
 * Webhook de Stripe
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = verifyWebhook(req.body, sig);
  } catch (err) {
    logger.error("Error verificando webhook:", { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

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

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      default:
        logger.debug(`Evento no manejado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Error procesando webhook:", error);
    return res.status(500).json({ error: "Error procesando webhook" });
  }
};

/**
 * Checkout pagado: confirma la reserva (hasta aquí sigue esperando_pago).
 * Idempotente, porque Stripe reintenta los webhooks. Si la reserva ya estaba
 * cancelada o pagada con otro enlace, no se da otra entrada: se devuelve el dinero.
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    const bookingId = Number(session.metadata?.booking_id);
    if (!bookingId) {
      logger.warn(
        "checkout.session.completed sin booking_id en metadata — se ignora (probablemente de otro flujo de Stripe)",
        { sessionId: session.id },
      );
      return;
    }

    if (session.payment_status !== "paid") {
      logger.warn("checkout.session.completed sin pago completado, se ignora", {
        bookingId,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
      return;
    }

    const importe = (session.amount_total || 0) / 100;
    const paymentIntent = session.payment_intent;

    // Con la reserva bloqueada: si Stripe entrega el mismo aviso dos veces a
    // la vez, el segundo espera y encuentra el pago ya guardado
    const resultado = await transaction(async (conn) => {
      const [reservas] = await conn.execute(
        `SELECT * FROM bookings WHERE id = ? FOR UPDATE`,
        [bookingId],
      );
      const booking = reservas[0];
      if (!booking) return { accion: "no_existe" };

      const [pagos] = await conn.execute(
        `SELECT id FROM payments WHERE stripe_payment_intent_id = ? LIMIT 1`,
        [paymentIntent],
      );
      if (pagos.length > 0) return { accion: "repetido", booking };

      if (booking.estado === "esperando_pago") {
        await conn.execute(
          `UPDATE bookings SET estado = 'confirmada', precio_pagado = ?, stripe_session_id = ? WHERE id = ?`,
          [importe, session.id, bookingId],
        );

        // Aquí se descuenta el aforo público (no al reservar)
        await conn.execute(
          `UPDATE events SET entradas_disponibles = entradas_disponibles - ?,
                              entradas_reservadas = entradas_reservadas + ?
           WHERE id = ?`,
          [booking.numero_entradas, booking.numero_entradas, booking.event_id],
        );

        await conn.execute(
          `INSERT INTO payments (
            socio_id, booking_id, event_id, stripe_payment_intent_id, amount, currency,
            tipo_pago, descripcion, estado, fecha_pago, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, 'EUR', 'entrada_evento', ?, 'exitoso', NOW(), ?, NOW())`,
          [
            booking.socio_id,
            bookingId,
            booking.event_id,
            paymentIntent,
            importe,
            `Entrada a evento (booking ${bookingId})`,
            JSON.stringify({
              event_id: String(booking.event_id),
              booking_id: String(bookingId),
              checkout_session_id: session.id,
            }),
          ],
        );

        return { accion: "confirmada", booking };
      }

      // Se guarda ya como reembolsado: así el aviso charge.refunded no cancela
      // la reserva buena (la que se pagó con el otro enlace)
      const motivo =
        booking.estado === "cancelada"
          ? "la reserva ya estaba cancelada"
          : "la reserva ya estaba pagada";

      await conn.execute(
        `INSERT INTO payments (
          socio_id, booking_id, event_id, stripe_payment_intent_id, amount, currency,
          tipo_pago, descripcion, estado, fecha_pago, fecha_reembolso, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, 'EUR', 'entrada_evento', ?, 'reembolsado', NOW(), NOW(), ?, NOW())`,
        [
          booking.socio_id,
          bookingId,
          booking.event_id,
          paymentIntent,
          importe,
          `Pago devuelto automáticamente: ${motivo} (booking ${bookingId})`,
          JSON.stringify({
            event_id: String(booking.event_id),
            booking_id: String(bookingId),
            checkout_session_id: session.id,
            reembolso_automatico: true,
          }),
        ],
      );

      // Si el reembolso falla, se deshace todo y Stripe reintentará el aviso
      await refundPayment(paymentIntent, `reembolso-${paymentIntent}`);

      return { accion: "reembolsada", booking, motivo };
    });

    if (resultado.accion === "no_existe") {
      logger.error("checkout.session.completed: booking no encontrada", { bookingId });
      return;
    }

    if (resultado.accion === "repetido") {
      logger.info("Pago ya procesado, se ignora reintento de webhook", {
        bookingId,
        paymentIntent,
      });
      return;
    }

    const { booking } = resultado;
    const event = await Event.findById(booking.event_id);

    let purchaserUser = null;
    try {
      const socio = await Socio.findById(booking.socio_id);
      purchaserUser = socio ? await User.findById(socio.user_id) : null;
    } catch (lookupError) {
      logger.warn("No se pudo resolver el usuario del pago", { bookingId });
    }
    const nombreSocio = purchaserUser
      ? `${purchaserUser.nombre} ${purchaserUser.apellidos}`
      : "Un socio";

    if (resultado.accion === "reembolsada") {
      registrarActividad({
        userId: purchaserUser?.id || null,
        accion: "cancelar",
        entidadTipo: "pago",
        entidadId: bookingId,
        descripcion: `Pago de ${importe.toFixed(2)} € de ${nombreSocio} para "${event?.titulo || "un evento"}" devuelto automáticamente: ${resultado.motivo}`,
        ipAddress: null,
      });

      logger.warn("Pago devuelto automáticamente:", {
        bookingId,
        sessionId: session.id,
        paymentIntent,
        motivo: resultado.motivo,
      });
      return;
    }

    try {
      const bookingWithQR = await Booking.findById(bookingId);
      const qrData = `LACLAVE-${bookingId}-${bookingWithQR.codigo_acceso}`;
      // En base64: Railway borra los archivos del disco al reiniciar
      const qrCode = await generateQRCodeBase64(qrData, bookingId);
      await Booking.saveQRCode(bookingId, qrCode);
    } catch (qrError) {
      logger.error("Error generando QR tras pago confirmado:", qrError);
    }

    try {
      const finalBooking = await Booking.findById(bookingId);
      if (purchaserUser && event) {
        await EmailService.sendBookingConfirmation(finalBooking, event, purchaserUser);
      }
    } catch (emailError) {
      logger.error("Error enviando email de confirmación tras pago:", emailError);
    }

    registrarActividad({
      userId: purchaserUser?.id || null,
      accion: "crear",
      entidadTipo: "pago",
      entidadId: bookingId,
      descripcion: `${nombreSocio} compró ${booking.numero_entradas} entrada${booking.numero_entradas !== 1 ? "s" : ""} para "${event?.titulo || "un evento"}" (${importe.toFixed(2)} €)`,
      ipAddress: null, // llamada de Stripe, sin IP de usuario
    });

    logger.info("Pago de entrada confirmado vía Stripe Checkout:", {
      bookingId,
      sessionId: session.id,
      paymentIntent,
    });
  } catch (error) {
    logger.error("Error en handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

/**
 * Checkout caducado sin pagar: se cancela la reserva, salvo que tenga ya
 * otro enlace de pago más reciente (reintento desde Mis entradas)
 */
async function handleCheckoutSessionExpired(session) {
  try {
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.estado !== "esperando_pago") {
      // Ya confirmada, cancelada o inexistente
      return;
    }

    if (booking.stripe_session_id && booking.stripe_session_id !== session.id) {
      return;
    }

    await query(
      `UPDATE bookings
       SET estado = 'cancelada', fecha_cancelacion = NOW(), motivo_cancelacion = ?
       WHERE id = ? AND estado = 'esperando_pago'`,
      ["Pago no completado a tiempo", bookingId],
    );

    // No hay aforo que devolver: solo se descuenta al pagar

    logger.info("Reserva cancelada por Checkout Session expirada:", {
      bookingId,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error("Error en handleCheckoutSessionExpired:", error);
    throw error;
  }
}

/**
 * Cuota pagada
 */
async function handlePaymentSucceeded(invoice) {
  try {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    const amountPaid = invoice.amount_paid / 100; // céntimos a euros

    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      logger.warn("Socio no encontrado para customer de Stripe", { customerId });
      return;
    }

    const socio = socios[0];

    await Socio.registrarPagoExitoso(socio.id);

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

    logger.info(`Pago exitoso procesado para socio ${socio.numero_socio}`);

    // Pendiente: email de confirmación de pago
  } catch (error) {
    logger.error("Error en handlePaymentSucceeded:", error);
    throw error;
  }
}

/**
 * Cuota fallida
 */
async function handlePaymentFailed(invoice) {
  try {
    const customerId = invoice.customer;
    const amountDue = invoice.amount_due / 100;

    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      logger.warn("Socio no encontrado para customer de Stripe", { customerId });
      return;
    }

    const socio = socios[0];

    await Socio.incrementarPagosFallidos(socio.id);

    await query(
      `
      INSERT INTO payments (
        socio_id, tipo_pago, amount, currency,
        stripe_invoice_id, estado, error_mensaje, fecha_pago
      ) VALUES (?, 'cuota_mensual', ?, 'EUR', ?, 'fallido', ?, NOW())
    `,
      [socio.id, amountDue, invoice.id, "Pago rechazado"],
    );

    // Moroso a partir de 3 fallos
    const socioActualizado = await Socio.findById(socio.id);

    if (socioActualizado.pagos_fallidos >= 3) {
      await Socio.marcarComoMoroso(socio.id);
      logger.warn(`Socio ${socio.numero_socio} marcado como moroso`);
      // Pendiente: email de suspensión
    } else {
      logger.warn(
        `Pago fallido #${socioActualizado.pagos_fallidos} para socio ${socio.numero_socio}`,
      );
      // Pendiente: email para actualizar el método de pago
    }
  } catch (error) {
    logger.error("Error en handlePaymentFailed:", error);
    throw error;
  }
}

/**
 * Suscripción cancelada
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const customerId = subscription.customer;

    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      logger.warn("Socio no encontrado para customer de Stripe", { customerId });
      return;
    }

    const socio = socios[0];

    await Socio.darDeBaja(socio.id, "Suscripción cancelada en Stripe");

    // Vuelve a usuario básico
    await query("UPDATE users SET role = ? WHERE id = ?", [
      "basico",
      socio.user_id,
    ]);

    logger.info(`Suscripción cancelada para socio ${socio.numero_socio}`);

    // Pendiente: email de confirmación de baja
  } catch (error) {
    logger.error("Error en handleSubscriptionDeleted:", error);
    throw error;
  }
}

/**
 * Suscripción actualizada
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const customerId = subscription.customer;
    const status = subscription.status;

    const socioSql =
      "SELECT * FROM socios WHERE stripe_customer_id = ? LIMIT 1";
    const socios = await query(socioSql, [customerId]);

    if (socios.length === 0) {
      logger.warn("Socio no encontrado para customer de Stripe", { customerId });
      return;
    }

    const socio = socios[0];

    if (status === "active") {
      await query("UPDATE socios SET estado = ? WHERE id = ?", [
        "activo",
        socio.id,
      ]);
      logger.info(`Suscripción activa para socio ${socio.numero_socio}`);
    } else if (status === "past_due") {
      await Socio.marcarComoMoroso(socio.id);
      logger.warn(`Suscripción vencida para socio ${socio.numero_socio}`);
    } else if (status === "canceled" || status === "unpaid") {
      await Socio.darDeBaja(socio.id, `Suscripción ${status}`);
      logger.info(`Suscripción ${status} para socio ${socio.numero_socio}`);
    }
  } catch (error) {
    logger.error("Error en handleSubscriptionUpdated:", error);
    throw error;
  }
}

/**
 * Reembolso (charge.refunded, total o parcial): marca el pago, cancela la
 * reserva y devuelve el aforo. Idempotente.
 */
async function handleChargeRefunded(charge) {
  try {
    const paymentIntentId = charge.payment_intent;
    if (!paymentIntentId) {
      logger.warn("charge.refunded sin payment_intent asociado — se ignora", {
        chargeId: charge.id,
      });
      return;
    }

    const isFullyRefunded = charge.amount_refunded >= charge.amount;
    const amountRefunded = (charge.amount_refunded || 0) / 100;

    const payments = await query(
      `SELECT * FROM payments WHERE stripe_payment_intent_id = ? LIMIT 1`,
      [paymentIntentId],
    );

    if (payments.length === 0) {
      logger.warn("charge.refunded: no se encontró payment con ese payment_intent", {
        paymentIntentId,
        chargeId: charge.id,
      });
      return;
    }

    const payment = payments[0];

    if (payment.estado === "reembolsado") {
      logger.info("Pago ya estaba marcado como reembolsado, se ignora reintento de webhook", {
        paymentId: payment.id,
      });
      return;
    }

    await query(
      `UPDATE payments SET estado = ?, metadata = JSON_SET(COALESCE(metadata, '{}'), '$.amount_refunded', ?) WHERE id = ?`,
      [isFullyRefunded ? "reembolsado" : "reembolsado_parcial", amountRefunded, payment.id],
    );

    // Si era una entrada, se cancela la reserva y se devuelve la plaza
    let bookingId = null;
    try {
      const metadata = typeof payment.metadata === "string" ? JSON.parse(payment.metadata) : payment.metadata;
      bookingId = metadata?.booking_id || null;
    } catch (parseError) {
      logger.warn("No se pudo parsear metadata del payment al procesar reembolso", {
        paymentId: payment.id,
      });
    }

    if (bookingId && isFullyRefunded) {
      const booking = await Booking.findById(bookingId);

      if (booking && booking.estado === "confirmada") {
        await Booking.cancel(bookingId, "Pago reembolsado en Stripe");

        await query(
          `UPDATE events SET entradas_disponibles = entradas_disponibles + ?,
                              entradas_reservadas = GREATEST(entradas_reservadas - ?, 0)
           WHERE id = ?`,
          [booking.numero_entradas, booking.numero_entradas, booking.event_id],
        );

        logger.info("↩ Reserva cancelada y aforo liberado por reembolso:", {
          bookingId,
          chargeId: charge.id,
          amountRefunded,
        });
      }
    }

    let refundedUser = null;
    try {
      const socio = payment.socio_id ? await Socio.findById(payment.socio_id) : null;
      refundedUser = socio ? await User.findById(socio.user_id) : null;
    } catch (lookupError) {
      logger.warn("No se pudo resolver el usuario del pago reembolsado para el log de actividad", {
        paymentId: payment.id,
      });
    }

    registrarActividad({
      userId: refundedUser?.id || null,
      accion: "cancelar",
      entidadTipo: "pago",
      entidadId: payment.id,
      descripcion: `Reembolso ${isFullyRefunded ? "total" : "parcial"} de ${amountRefunded.toFixed(2)} € a ${refundedUser ? `${refundedUser.nombre} ${refundedUser.apellidos}` : "un socio"}`,
      ipAddress: null,
    });

    logger.info("Reembolso procesado:", {
      paymentId: payment.id,
      chargeId: charge.id,
      amountRefunded,
      isFullyRefunded,
    });
  } catch (error) {
    logger.error("Error en handleChargeRefunded:", error);
    throw error;
  }
}

export default {
  handleStripeWebhook,
};
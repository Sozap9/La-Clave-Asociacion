import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import EventTicketTier from "../models/EventTicketTier.js";
import Socio from "../models/Socio.js";
import User from "../models/User.js";
import EmailService from "../services/emailService.js";
import { generateQRCodeBase64 } from "../utils/qrCodeGenerator.js";
import { createCheckoutSession } from "../config/payment.js";
import { query, transaction, pool } from "../config/database.js";
import logger from "../config/logger.js";
import { registrarActividad, getIpFromRequest } from "../utils/activityLogger.js";

/**
 * Crear reserva de entrada
 * POST /api/bookings
 *
 */
export const createBooking = async (req, res) => {
  try {
    // Interruptor temporal de reservas: pon BOOKINGS_ENABLED=false en las
    // variables de entorno para desactivar la compra de entradas sin tocar
    // código (los eventos se siguen viendo y anunciando con normalidad).
    if (process.env.BOOKINGS_ENABLED === "false") {
      return res.status(503).json({
        success: false,
        message:
          "Las reservas para este evento se abrirán en breve.",
      });
    }

    const userId = req.user.id;
    const { event_id, numero_entradas = 1 } = req.body;

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "El ID del evento es obligatorio",
      });
    }

    // Obtener o crear socio (admins pueden reservar automáticamente)
    let socio = await Socio.findByUserId(userId);

    // Si es admin y no tiene registro de socio, crear uno automáticamente
    if (!socio && req.user.role === "admin") {
      try {
        const [result] = await pool.execute(
          `INSERT INTO socios (user_id, numero_socio, estado, fecha_alta)
           VALUES (?, ?, 'activo', NOW())`,
          [userId, `ADM-${userId.toString().padStart(3, "0")}`],
        );
        socio = await Socio.findById(result.insertId);
        logger.info(
          "Registro de socio creado automáticamente para admin:",
          userId,
        );
      } catch (error) {
        logger.error("Error creando registro de socio para admin:", error);
        return res.status(500).json({
          success: false,
          message: "Error al crear información de socio",
        });
      }
    } else if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    // Verificar que el socio esté activo (admins siempre están activos)
    if (socio.estado !== "activo" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Tu membresía no está activa. Actualiza tu método de pago para continuar",
      });
    }

    // Verificar que el evento existe
    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado",
      });
    }

    // Verificar que el evento está publicado (scheduled en lugar de publicado)
    if (event.estado !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Este evento no está disponible para reservas",
      });
    }

    // Verificar que el evento no haya terminado ya. La venta de entradas
    // sigue abierta con el evento en marcha, y se cierra al llegar
    // hora_fin (no al empezar el evento). Si hora_fin es anterior a
    // hora_evento, el evento cruza la medianoche (ej. empieza 23:30,
    // termina 06:00) y por tanto termina el día siguiente.
    const fechaEvento = new Date(event.fecha_evento);
    const [horaInicioH, horaInicioM] = (event.hora_evento || "00:00:00")
      .split(":")
      .map(Number);
    const [horaFinH, horaFinM] = (event.hora_fin || "23:59:59")
      .split(":")
      .map(Number);
    const cruzaMedianoche =
      horaFinH * 60 + horaFinM < horaInicioH * 60 + horaInicioM;

    const finEvento = new Date(
      fechaEvento.getFullYear(),
      fechaEvento.getMonth(),
      fechaEvento.getDate() + (cruzaMedianoche ? 1 : 0),
      horaFinH || 0,
      horaFinM || 0,
      0,
    );

    if (finEvento <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Las entradas para este evento ya no están disponibles: el evento ha finalizado.",
      });
    }

    // Verificar que no tenga ya una reserva
    const existingBooking = await Booking.findBySocioAndEvent(
      socio.id,
      event_id,
    );
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Ya tienes una reserva para este evento",
      });
    }

    // Verificar disponibilidad (ya cuenta también las reservas en
    // esperando_pago — ver Event.js — para no vender de más mientras
    // alguien más está pagando)
    const available = await Event.checkAvailability(event_id, numero_entradas);

    if (!available) {
      // Agregar a lista de espera
      const inWaitingList = await Booking.checkWaitingList(socio.id, event_id);

      if (inWaitingList) {
        return res.status(409).json({
          success: false,
          message: "Ya estás en la lista de espera para este evento",
          data: {
            position: inWaitingList.posicion,
          },
        });
      }

      const waitingListEntry = await Booking.addToWaitingList(
        socio.id,
        event_id,
      );

      return res.status(200).json({
        success: true,
        message:
          "El aforo está completo. Has sido añadido a la lista de espera",
        data: {
          waiting_list: true,
          position: waitingListEntry.position,
        },
      });
    }

    // Precio vigente ahora mismo (tanda activa, o precio base del evento
    // si no tiene tandas configuradas). Se fija en la propia reserva
    // (precio_unitario/tier_id) para que no cambie después aunque la
    // tanda cambie mientras la reserva sigue esperando_pago.
    const { precio: precioUnitario, tier_id: tierId } =
      await EventTicketTier.resolveActivePrice(event_id, event.precio_socio);

    // Evento/tanda gratuita (precio 0): se confirma directamente, sin
    // pasar por Stripe — no tiene sentido abrir un Checkout para cobrar 0€
    const esGratuito = !precioUnitario || precioUnitario <= 0;

    // Crear reserva con campos correctos de la tabla bookings
    const booking = await transaction(async (conn) => {
      const codigo_acceso = `ACC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codigo_reserva = `LCV-${year}${month}-${randomPart}`;

      const estadoInicial = esGratuito ? "confirmada" : "esperando_pago";

      const [result] = await conn.execute(
        `INSERT INTO bookings (
          socio_id, event_id, tier_id, numero_entradas, estado,
          codigo_reserva, codigo_acceso, precio_pagado, precio_unitario, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, ?, NOW())`,
        [socio.id, event_id, tierId, numero_entradas, estadoInicial, codigo_reserva, codigo_acceso, precioUnitario],
      );

      const bookingId = result.insertId;

      // El aforo PÚBLICO (entradas_disponibles/entradas_reservadas, lo que
      // ve la web) solo se descuenta aquí si la reserva queda confirmada
      // de inmediato (evento gratuito). Si es de pago, la reserva se crea
      // en "esperando_pago" y el aforo público NO se toca todavía — se
      // descuenta al confirmarse el pago de verdad (ver
      // webhookController.handleCheckoutSessionCompleted). Así una
      // reserva sin pagar nunca "llena" el aforo que ve el público.
      //
      // La protección contra sobreventa durante el checkout (que dos
      // personas no puedan pagar a la vez la última entrada) sigue
      // intacta y es independiente de esto: vive en
      // Event.checkAvailability / entradas_reservadas_real, que sí
      // sigue contando las reservas esperando_pago.
      if (estadoInicial === "confirmada") {
        try {
          await conn.execute(
            `UPDATE events
             SET entradas_disponibles = entradas_disponibles - ?,
                 entradas_reservadas = entradas_reservadas + ?
             WHERE id = ?`,
            [numero_entradas, numero_entradas, event_id],
          );
        } catch (updateError) {
          logger.warn(
            "No se pudo actualizar entradas disponibles:",
            updateError.message,
          );
          // No fallar si la columna no existe
        }
      }

      const [rows] = await conn.execute(`SELECT * FROM bookings WHERE id = ?`, [
        bookingId,
      ]);
      return rows[0];
    });

    // ── Caso evento gratuito: confirmar ya mismo, sin Stripe ──────────
    if (esGratuito) {
      let qrCode = null;
      try {
        const qrData = `LACLAVE-${booking.id}-${booking.codigo_acceso}`;

        qrCode = await generateQRCodeBase64(qrData, booking.id);
        await query(`UPDATE bookings SET qr_code_url = ? WHERE id = ?`, [
          qrCode,
          booking.id,
        ]);
      } catch (qrError) {
        logger.error("❌ Error generando QR:", qrError);
      }

      // Registrar como pago de 0€ para que las estadísticas cuadren
      try {
        await query(
          `INSERT INTO payments (
            socio_id, stripe_payment_intent_id, amount, currency, tipo_pago,
            descripcion, estado, fecha_pago, metadata, created_at
          ) VALUES (?, ?, 0.00, 'EUR', 'entrada_evento', ?, 'exitoso', NOW(), ?, NOW())`,
          [
            socio.id,
            `free-${booking.id}-${Date.now()}`,
            `Entrada gratuita a ${event.titulo}`,
            JSON.stringify({ event_id, booking_id: booking.id }),
          ],
        );
      } catch (paymentErr) {
        logger.error("Error al registrar entrada gratuita:", paymentErr);
      }

      const bookingWithQR = await Booking.findById(booking.id);

      try {
        const user = await User.findById(userId);
        if (user) {
          await EmailService.sendBookingConfirmation(bookingWithQR, event, user);
        }
      } catch (emailError) {
        logger.error("❌ Error enviando email de confirmación:", emailError);
      }

      return res.status(201).json({
        success: true,
        message: "Reserva confirmada (entrada gratuita)",
        data: bookingWithQR,
      });
    }

    // ── Caso evento de pago: crear Checkout Session real de Stripe ────
    try {
      const user = await User.findById(userId);
      const session = await createCheckoutSession({
        booking,
        event,
        user,
        numeroEntradas: numero_entradas,
        precioUnitario,
      });

      logger.info("💳 Checkout Session creada:", {
        bookingId: booking.id,
        sessionId: session.id,
      });

      return res.status(201).json({
        success: true,
        message: "Reserva creada, pendiente de pago",
        data: {
          booking,
          checkout_url: session.url,
        },
      });
    } catch (stripeError) {
      // Si falla la creación del Checkout, deshacemos la reserva. El
      // aforo público NO se toca aquí (nunca se llegó a descontar para
      // reservas de pago — solo se descuenta al confirmarse el pago).
      logger.error("Error creando Checkout Session, revirtiendo reserva:", stripeError);

      await query(
        `UPDATE bookings SET estado = 'cancelada', motivo_cancelacion = ? WHERE id = ?`,
        ["Error al iniciar el pago", booking.id],
      );

      return res.status(502).json({
        success: false,
        message:
          "No se pudo iniciar el pago en este momento. Inténtalo de nuevo en unos minutos.",
      });
    }
  } catch (error) {
    logger.error("Error en createBooking:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear reserva",
    });
  }
};

/**
 * POST /api/bookings/:id/pagar
 */
export const retryBookingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    const socio = await Socio.findByUserId(userId);
    if (req.user.role !== "admin" && booking.socio_id !== socio?.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a esta reserva",
      });
    }

    if (booking.estado !== "esperando_pago") {
      return res.status(400).json({
        success: false,
        message:
          booking.estado === "confirmada"
            ? "Esta reserva ya está pagada"
            : "Esta reserva ya no está disponible para pagar",
      });
    }

    const event = await Event.findById(booking.event_id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "El evento de esta reserva ya no existe",
      });
    }

    const user = await User.findById(userId);

    // Se usa el precio ya fijado en la reserva (booking.precio_unitario),
    // NO el precio vigente ahora — si la reserva se creó en la Tanda 1 y
    // mientras seguía sin pagar entró en vigor la Tanda 2, el socio sigue
    // pagando el precio de cuando reservó.
    const precioUnitario =
      booking.precio_unitario !== null && booking.precio_unitario !== undefined
        ? parseFloat(booking.precio_unitario)
        : parseFloat(event.precio_socio || 0); // reservas antiguas, previas a esta columna

    try {
      const session = await createCheckoutSession({
        booking,
        event,
        user,
        numeroEntradas: booking.numero_entradas,
        cancelPath: '/mis-entradas',
        precioUnitario,
      });

      logger.info("💳 Checkout Session de reintento creada:", {
        bookingId: booking.id,
        sessionId: session.id,
      });

      return res.status(200).json({
        success: true,
        message: "Nueva sesión de pago creada",
        data: {
          checkout_url: session.url,
        },
      });
    } catch (stripeError) {
      logger.error("Error creando Checkout Session de reintento:", stripeError);
      return res.status(502).json({
        success: false,
        message:
          "No se pudo iniciar el pago en este momento. Inténtalo de nuevo en unos minutos.",
      });
    }
  } catch (error) {
    logger.error("Error en retryBookingPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Error al reanudar el pago",
    });
  }
};

/**
 * Servir el QR de una reserva como imagen PNG real (no data URI).
 * GET /api/bookings/qr/:id/:codigo
 */
export const getBookingQRImage = async (req, res) => {
  try {
    const { id, codigo } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      logger.warn("getBookingQRImage: booking no encontrada", { id, codigo });
      return res.status(404).send("Not found");
    }

    if (booking.codigo_acceso !== codigo) {
      logger.warn("getBookingQRImage: codigo_acceso no coincide", {
        id,
        codigoRecibido: codigo,
        codigoEsperado: booking.codigo_acceso,
      });
      return res.status(404).send("Not found");
    }

    if (!booking.qr_code_url || !booking.qr_code_url.startsWith("data:")) {
      logger.warn("getBookingQRImage: qr_code_url no es base64 o no existe", {
        id,
        qrCodeUrl: booking.qr_code_url,
      });
      return res.status(404).send("QR no disponible");
    }

    const base64Data = booking.qr_code_url.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(buffer);
  } catch (error) {
    logger.error("Error en getBookingQRImage:", error);
    return res.status(500).send("Error");
  }
};

/**
 * Obtener mis reservas
 * GET /api/bookings/me
 */
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { estado } = req.query;

    const socio = await Socio.findByUserId(userId);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    const bookings = await Booking.getBySocio(socio.id, estado);

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    logger.error("Error en getMyBookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener reservas",
    });
  }
};

/**
 * Obtener detalles de una reserva
 * GET /api/bookings/:id
 */
export const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    // Verificar que la reserva pertenece al usuario (o es admin)
    const socio = await Socio.findByUserId(userId);
    if (req.user.role !== "admin" && booking.socio_id !== socio?.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes acceso a esta reserva",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error("Error en getBooking:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener reserva",
    });
  }
};

/**
 * ✅ CORREGIDO: Cancelar reserva
 * DELETE /api/bookings/:id
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { motivo } = req.body;

    logger.info("📋 Cancelando reserva:", { bookingId: id, userId, motivo });

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    // Verificar que la reserva pertenece al usuario
    const socio = await Socio.findByUserId(userId);
    if (booking.socio_id !== socio?.id) {
      return res.status(403).json({
        success: false,
        message: "No puedes cancelar esta reserva",
      });
    }

    // Se puede cancelar una reserva confirmada, o una pendiente de pago
    // (para poder reintentar sin esperar a que expire sola en 30 min)
    if (!["confirmada", "esperando_pago"].includes(booking.estado)) {
      return res.status(400).json({
        success: false,
        message: "Esta reserva no puede ser cancelada",
      });
    }

    // Verificar que el evento no ha pasado (no aplica si solo estaba
    // pendiente de pago — cancelar una reserva sin pagar nunca depende
    // de la fecha del evento). Este límite es independiente del cierre
    // de venta de entradas (que ahora cierra al empezar el evento, ver
    // createBooking) — cancelar una reserva ya confirmada sigue
    // permitido con un margen algo mayor, hasta esta hora configurable.
    if (booking.estado === "confirmada") {
      const event = await Event.findById(booking.event_id);
      const fechaEvento = new Date(event.fecha_evento);
      const horaLimiteCancelacion = parseInt(
        process.env.HORA_LIMITE_COMPRA_MISMO_DIA || "23",
        10,
      );
      const limiteCancelacion = new Date(
        fechaEvento.getFullYear(),
        fechaEvento.getMonth(),
        fechaEvento.getDate(),
        horaLimiteCancelacion,
        0,
        0,
      );
      if (limiteCancelacion < new Date()) {
        return res.status(400).json({
          success: false,
          message: "No puedes cancelar una reserva de un evento que ya pasó",
        });
      }
    }

    // Cancelar en transacción
    await transaction(async (conn) => {
      // Cancelar reserva
      await conn.execute(
        `UPDATE bookings 
         SET estado = 'cancelada', fecha_cancelacion = NOW(), motivo_cancelacion = ?
         WHERE id = ?`,
        [motivo || "Cancelación voluntaria", id],
      );

      // Liberar entradas del aforo público SOLO si estaba confirmada (ya
      // pagada, así que sí lo tenía descontado). Si estaba esperando_pago,
      // nunca llegó a descontarse — no hay nada que devolver.
      if (booking.estado === "confirmada") {
        await conn.execute(
          `UPDATE events 
           SET entradas_reservadas = GREATEST(entradas_reservadas - ?, 0),
               entradas_disponibles = entradas_disponibles + ?
           WHERE id = ?`,
          [booking.numero_entradas, booking.numero_entradas, booking.event_id],
        );
      }
    });

    logger.info("✅ Reserva cancelada:", { bookingId: id });

    registrarActividad({
      userId,
      accion: "cancelar",
      entidadTipo: "reserva",
      entidadId: Number(id),
      descripcion: `Reserva #${id} cancelada${motivo ? `: ${motivo}` : ""}`,
      ipAddress: getIpFromRequest(req),
    });

    // TODO: Notificar a persona en lista de espera si hay

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada exitosamente",
    });
  } catch (error) {
    logger.error("❌ Error en cancelBooking:", error);
    return res.status(500).json({
      success: false,
      message: "Error al cancelar reserva",
      error: error.message,
    });
  }
};

/**
 * Obtener reservas de un evento (solo admin)
 * GET /api/bookings/event/:eventId
 */
export const getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { estado } = req.query;

    const bookings = await Booking.getByEvent(eventId, estado);

    // Para cada reserva, traer pagos asociados (pago de entrada)
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payments = await query(
          `SELECT
             id,
             socio_id,
             amount,
             COALESCE(currency, 'EUR') as currency,
             estado,
             tipo_pago,
             descripcion,
             fecha_pago,
             metadata
           FROM payments
           WHERE socio_id = ?
             AND JSON_EXTRACT(metadata, '$.booking_id') = ?
           ORDER BY fecha_pago DESC`,
          [booking.socio_id, booking.id],
        );

        return {
          ...booking,
          pagos: payments,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: bookingsWithPayments,
    });
  } catch (error) {
    logger.error("Error en getEventBookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener reservas del evento",
    });
  }
};

/**
 * Verificar código QR y marcar asistencia (solo admin)
 * POST /api/bookings/verify-qr
 */
export const verifyQRAndCheckIn = async (req, res) => {
  try {
    const { codigo_reserva } = req.body;

    if (!codigo_reserva) {
      return res.status(400).json({
        success: false,
        message: "Código de reserva es obligatorio",
      });
    }

    const raw = codigo_reserva.trim();

    // El QR real codifica "LACLAVE-{bookingId}-{codigo_acceso}" (ver
    // webhookController.handleCheckoutSessionCompleted), NO el
    // codigo_reserva. Si el texto escaneado tiene ese formato, lo
    // interpretamos así; si no, se trata como código manual
    // (codigo_reserva) introducido a mano por el admin.
    const qrMatch = raw.match(/^LACLAVE-(\d+)-(.+)$/);

    const booking = qrMatch
      ? await Booking.findByAccessCode(qrMatch[1], qrMatch[2])
      : await Booking.findByCode(raw);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    if (booking.estado !== "confirmada") {
      return res.status(400).json({
        success: false,
        message: `Esta reserva está ${booking.estado}`,
      });
    }

    // Marcar como asistida
    await Booking.markAsAttended(booking.id);

    registrarActividad({
      userId: req.user?.id || null,
      accion: "verificar",
      entidadTipo: "reserva",
      entidadId: booking.id,
      descripcion: `Check-in de ${booking.socio_nombre} ${booking.socio_apellidos} en "${booking.evento_titulo}" (${booking.numero_entradas} entrada${booking.numero_entradas !== 1 ? "s" : ""})`,
      ipAddress: getIpFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: "Asistencia registrada exitosamente",
      data: {
        socio_nombre: booking.socio_nombre,
        socio_apellidos: booking.socio_apellidos,
        evento_titulo: booking.evento_titulo,
        numero_entradas: booking.numero_entradas,
      },
    });
  } catch (error) {
    logger.error("Error en verifyQRAndCheckIn:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar código",
    });
  }
};

/**
 * Obtener estadísticas de reservas del socio
 * GET /api/bookings/me/stats
 */
export const getMyBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const socio = await Socio.findByUserId(userId);
    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    const stats = await Booking.getSocioStats(socio.id);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error en getMyBookingStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
    });
  }
};

export default {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getEventBookings,
  verifyQRAndCheckIn,
  getMyBookingStats,
};
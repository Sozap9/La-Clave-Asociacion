import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import EventTicketTier from "../models/EventTicketTier.js";
import Socio from "../models/Socio.js";
import User from "../models/User.js";
import EmailService from "../services/emailService.js";
import { generateQRCodeBase64 } from "../utils/qrCodeGenerator.js";
import {
  createCheckoutSession,
  getCheckoutSession,
  expireCheckoutSession,
} from "../config/payment.js";
import { query, transaction, pool } from "../config/database.js";
import logger from "../config/logger.js";
import { registrarActividad, getIpFromRequest } from "../utils/activityLogger.js";
import {
  ahoraEnMadrid,
  inicioEvento,
  finEvento,
  horaDelDiaEvento,
} from "../utils/horaMadrid.js";

// Enlace de pago vigente de la reserva: el reintento lo reutiliza y la
// limpieza automática espera a que caduque
const guardarSesionPago = (bookingId, session) =>
  query(
    `UPDATE bookings SET stripe_session_id = ?, pago_expira_en = FROM_UNIXTIME(?) WHERE id = ?`,
    [session.id, session.expires_at, bookingId],
  );

/**
 * Crear reserva
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  try {
    // BOOKINGS_ENABLED=false cierra la venta sin ocultar los eventos
    if (process.env.BOOKINGS_ENABLED === "false") {
      return res.status(503).json({
        success: false,
        message:
          "Las reservas para este evento se abrirán en breve.",
      });
    }

    const userId = req.user.id;
    const { event_id } = req.body;
    // Una entrada por socio
    const numero_entradas = 1;

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "El ID del evento es obligatorio",
      });
    }

    let socio = await Socio.findByUserId(userId);

    // Un admin sin fila en socios la obtiene al reservar
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

    // Los admins cuentan siempre como activos
    if (socio.estado !== "activo" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Tu membresía no está activa. Actualiza tu método de pago para continuar",
      });
    }

    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado",
      });
    }

    // Publicado = estado scheduled
    if (event.estado !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Este evento no está disponible para reservas",
      });
    }

    // La venta cierra en hora_fin (hora de Madrid), no al empezar
    if (finEvento(event) <= ahoraEnMadrid()) {
      return res.status(400).json({
        success: false,
        message: "Las entradas para este evento ya no están disponibles: el evento ha finalizado.",
      });
    }

    // El precio vigente se fija en la reserva (precio_unitario, tier_id) para
    // que no cambie si entra otra tanda antes de pagar
    const { precio: precioUnitario, tier_id: tierId } =
      await EventTicketTier.resolveActivePrice(event_id, event.precio_socio);

    // Gratis: se confirma sin pasar por Stripe
    const esGratuito = !precioUnitario || precioUnitario <= 0;

    // Con el evento bloqueado, dos peticiones a la vez (doble clic, dos
    // pestañas, dos socios por la última plaza) no pueden pasar las dos
    const resultado = await transaction(async (conn) => {
      await conn.execute(`SELECT id FROM events WHERE id = ? FOR UPDATE`, [event_id]);

      const [existentes] = await conn.execute(
        `SELECT id FROM bookings
         WHERE socio_id = ? AND event_id = ? AND estado IN ('confirmada', 'asistida', 'esperando_pago')
         LIMIT 1`,
        [socio.id, event_id],
      );
      if (existentes.length > 0) return { tipo: "existe" };

      // Cuenta también las esperando_pago, para no vender de más
      const libres = await Event.plazasLibres(conn, event_id);
      if (libres < numero_entradas) return { tipo: "lleno" };

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

      // Si venía de la lista de espera, sale de ella
      await conn.execute(
        `UPDATE waiting_list SET estado = 'convertido'
         WHERE socio_id = ? AND event_id = ? AND estado IN ('esperando', 'notificado')`,
        [socio.id, event_id],
      );

      // El aforo público solo baja aquí si la reserva se confirma ya (gratis).
      // Las de pago lo descuentan en el webhook al pagarse.
      if (estadoInicial === "confirmada") {
        await conn.execute(
          `UPDATE events
           SET entradas_disponibles = entradas_disponibles - ?,
               entradas_reservadas = entradas_reservadas + ?
           WHERE id = ?`,
          [numero_entradas, numero_entradas, event_id],
        );
      }

      const [rows] = await conn.execute(`SELECT * FROM bookings WHERE id = ?`, [
        bookingId,
      ]);
      return { tipo: "creada", booking: rows[0] };
    });

    if (resultado.tipo === "existe") {
      return res.status(409).json({
        success: false,
        message: "Ya tienes una reserva para este evento",
      });
    }

    if (resultado.tipo === "lleno") {
      // Sin plazas: lista de espera
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
          "El aforo está completo. Te hemos apuntado a la lista de espera y te avisaremos por correo si se libera una plaza.",
        data: {
          waiting_list: true,
          position: waitingListEntry.position,
        },
      });
    }

    const booking = resultado.booking;

    // Gratis: confirmar ya
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
        logger.error("Error generando QR:", qrError);
      }

      // Pago de 0 € para que cuadren las estadísticas
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
        logger.error("Error enviando email de confirmación:", emailError);
      }

      return res.status(201).json({
        success: true,
        message: "Reserva confirmada (entrada gratuita)",
        data: bookingWithQR,
      });
    }

    // De pago: sesión de Checkout de Stripe
    try {
      const user = await User.findById(userId);
      const session = await createCheckoutSession({
        booking,
        event,
        user,
        numeroEntradas: numero_entradas,
        precioUnitario,
      });

      await guardarSesionPago(booking.id, session);

      logger.info("Checkout Session creada:", {
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
      // Si falla el Checkout se borra la reserva; el aforo no se había tocado
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
 * Reintentar el pago de una reserva esperando_pago
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

    if (finEvento(event) <= ahoraEnMadrid()) {
      return res.status(400).json({
        success: false,
        message: "Este evento ya ha finalizado",
      });
    }

    // Si el enlace anterior sigue abierto se reutiliza: así nunca hay dos
    // enlaces pagables para la misma reserva
    if (booking.stripe_session_id) {
      try {
        const anterior = await getCheckoutSession(booking.stripe_session_id);
        if (anterior.status === "open" && anterior.url) {
          return res.status(200).json({
            success: true,
            message: "Sesión de pago en curso",
            data: { checkout_url: anterior.url },
          });
        }
        if (anterior.status === "complete") {
          return res.status(409).json({
            success: false,
            message:
              "Este pago ya se ha completado. La entrada aparecerá confirmada en unos segundos.",
          });
        }
      } catch (stripeError) {
        logger.warn("No se pudo consultar la sesión de pago anterior:", {
          bookingId: booking.id,
          error: stripeError.message,
        });
      }
    }

    const user = await User.findById(userId);

    // Se cobra el precio fijado al reservar, aunque haya cambiado la tanda
    const precioUnitario =
      booking.precio_unitario !== null && booking.precio_unitario !== undefined
        ? parseFloat(booking.precio_unitario)
        : parseFloat(event.precio_socio || 0); // reservas anteriores a precio_unitario

    try {
      const session = await createCheckoutSession({
        booking,
        event,
        user,
        numeroEntradas: booking.numero_entradas,
        cancelPath: '/mis-entradas',
        precioUnitario,
      });

      await guardarSesionPago(booking.id, session);

      logger.info("Checkout Session de reintento creada:", {
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
 * QR de una reserva como imagen PNG (no data URI)
 * GET /api/bookings/qr/:id/:codigo.png
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
 * Mis reservas
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
 * Detalle de una reserva
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

    // Solo el dueño o un admin
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
 * Cancelar reserva
 * DELETE /api/bookings/:id
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { motivo } = req.body;

    logger.info("Cancelando reserva:", { bookingId: id, userId, motivo });

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    const socio = await Socio.findByUserId(userId);
    if (booking.socio_id !== socio?.id) {
      return res.status(403).json({
        success: false,
        message: "No puedes cancelar esta reserva",
      });
    }

    // También las esperando_pago, para reintentar sin esperar los 30 min
    if (!["confirmada", "esperando_pago"].includes(booking.estado)) {
      return res.status(400).json({
        success: false,
        message: "Esta reserva no puede ser cancelada",
      });
    }

    // Las confirmadas tienen hora límite (HORA_LIMITE_COMPRA_MISMO_DIA);
    // las esperando_pago se pueden cancelar siempre
    if (booking.estado === "confirmada") {
      const event = await Event.findById(booking.event_id);
      const horaLimiteCancelacion = parseInt(
        process.env.HORA_LIMITE_COMPRA_MISMO_DIA || "23",
        10,
      );
      const limiteCancelacion = horaDelDiaEvento(event.fecha_evento, horaLimiteCancelacion);
      if (limiteCancelacion < ahoraEnMadrid()) {
        return res.status(400).json({
          success: false,
          message: "No puedes cancelar una reserva de un evento que ya pasó",
        });
      }
    }

    // Solo cancela si la reserva sigue como se leyó: si el pago se completa
    // justo a la vez, el webhook la habrá confirmado y no se toca
    const cancelada = await transaction(async (conn) => {
      const [result] = await conn.execute(
        `UPDATE bookings
         SET estado = 'cancelada', fecha_cancelacion = NOW(), motivo_cancelacion = ?
         WHERE id = ? AND estado = ?`,
        [motivo || "Cancelación voluntaria", id, booking.estado],
      );
      if (result.affectedRows === 0) return false;

      // Solo se devuelven plazas si estaba confirmada. Las invitaciones no
      // ocupaban plaza: solo se corrige entradas_reservadas.
      if (booking.estado === "confirmada") {
        if (booking.es_invitacion) {
          await conn.execute(
            `UPDATE events
             SET entradas_reservadas = GREATEST(entradas_reservadas - ?, 0)
             WHERE id = ?`,
            [booking.numero_entradas, booking.event_id],
          );
        } else {
          await conn.execute(
            `UPDATE events 
             SET entradas_reservadas = GREATEST(entradas_reservadas - ?, 0),
                 entradas_disponibles = entradas_disponibles + ?
             WHERE id = ?`,
            [booking.numero_entradas, booking.numero_entradas, booking.event_id],
          );
        }
      }
      return true;
    });

    if (!cancelada) {
      return res.status(409).json({
        success: false,
        message: "El estado de la reserva acaba de cambiar. Recarga la página.",
      });
    }

    // El enlace de pago pendiente se anula para que no se pueda pagar después
    if (booking.estado === "esperando_pago" && booking.stripe_session_id) {
      try {
        await expireCheckoutSession(booking.stripe_session_id);
      } catch (stripeError) {
        logger.warn("No se pudo anular la sesión de pago:", {
          bookingId: booking.id,
          error: stripeError.message,
        });
      }
    }

    logger.info("Reserva cancelada:", { bookingId: id });

    registrarActividad({
      userId,
      accion: "cancelar",
      entidadTipo: "reserva",
      entidadId: Number(id),
      descripcion: `Reserva #${id} cancelada${motivo ? `: ${motivo}` : ""}`,
      ipAddress: getIpFromRequest(req),
    });

    // La lista de espera la avisa la tarea programada (listaEsperaService)

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada exitosamente",
    });
  } catch (error) {
    logger.error("Error en cancelBooking:", error);
    return res.status(500).json({
      success: false,
      message: "Error al cancelar reserva",
    });
  }
};

/**
 * Reservas de un evento (admin)
 * GET /api/bookings/event/:eventId
 */
export const getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { estado } = req.query;

    const bookings = await Booking.getByEvent(eventId, estado);

    // Pagos de cada reserva
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

// Escaneo permitido desde 3 h antes del inicio hasta hora_fin (con cruce de medianoche)
const ventanaCheckIn = (booking) => {
  const datos = {
    fecha_evento: booking.fecha_evento_dia,
    hora_evento: booking.hora_evento,
    hora_fin: booking.hora_fin,
  };
  return { desde: inicioEvento(datos) - 3 * 60 * 60 * 1000, hasta: finEvento(datos) };
};

const mensajeEstadoNoValido = (booking) => {
  switch (booking.estado) {
    case "asistida": {
      if (!booking.fecha_asistencia) return "Esta entrada ya se ha usado";
      const hora = new Date(booking.fecha_asistencia).toLocaleTimeString("es-ES", {
        timeZone: "Europe/Madrid",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `Esta entrada ya se ha usado (a las ${hora})`;
    }
    case "cancelada":
      return "Esta entrada está cancelada";
    case "esperando_pago":
      return "Pago pendiente: esta entrada no es válida";
    default:
      return "Esta entrada no es válida";
  }
};

/**
 * Validar un QR y marcar asistencia (admin)
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

    // El QR lleva LACLAVE-{bookingId}-{codigo_acceso}; cualquier otro texto se
    // trata como codigo_reserva escrito a mano
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
        message: mensajeEstadoNoValido(booking),
      });
    }

    const ventana = ventanaCheckIn(booking);
    const ahora = ahoraEnMadrid();
    if (ahora < ventana.desde || ahora > ventana.hasta) {
      const fecha = booking.fecha_evento_dia.split("-").reverse().join("/");
      return res.status(400).json({
        success: false,
        message:
          ahora < ventana.desde
            ? `Esta entrada es de otro evento: "${booking.evento_titulo}" (${fecha}). Se puede escanear desde 3 horas antes de que empiece.`
            : `Esta entrada es de otro evento: "${booking.evento_titulo}" (${fecha}), que ya ha terminado.`,
      });
    }

    const marcada = await Booking.markAsAttended(booking.id);
    if (!marcada) {
      return res.status(400).json({
        success: false,
        message: "Esta entrada se acaba de escanear en otro dispositivo",
      });
    }

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
 * Estadísticas de reservas del socio
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
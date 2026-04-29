import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Socio from "../models/Socio.js";
import User from "../models/User.js";
import EmailService from "../services/emailService.js";
import { generateQRCode } from "../utils/qrCodeGenerator.js";
import { query, transaction, pool } from "../config/database.js";
import logger from "../config/logger.js";

/**
 * Crear reserva de entrada
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  try {
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

    // Verificar que el evento no ha pasado
    const fechaEvento = new Date(event.fecha_evento);
    if (fechaEvento < new Date()) {
      return res.status(400).json({
        success: false,
        message: "No puedes reservar para un evento que ya pasó",
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

    // Verificar disponibilidad
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

    // Crear reserva con campos correctos de la tabla bookings
     const booking = await transaction(async (conn) => {
      // Calcular precio total
      const monto_total = event.precio_socio * numero_entradas;
 
      // codigo_acceso — referencia interna corta (ACC-XXXXX)
      const codigo_acceso = `ACC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
 
      // codigo_reserva — código visible para el socio (LCV-YYYYMM-XXXX)
      // Mismo formato que Booking.js para consistencia
      const now = new Date();
      const year  = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codigo_reserva = `LCV-${year}${month}-${randomPart}`;
 
      const [result] = await conn.execute(
        `INSERT INTO bookings (
          socio_id, event_id, numero_entradas, estado,
          codigo_reserva, codigo_acceso, created_at
        ) VALUES (?, ?, ?, 'confirmada', ?, ?, NOW())`,
        [socio.id, event_id, numero_entradas, codigo_reserva, codigo_acceso],
      );
 
      const bookingId = result.insertId;
 
      // Actualizar entradas disponibles del evento (si la columna existe)
      try {
        await conn.execute(
          `UPDATE events
           SET entradas_disponibles = entradas_disponibles - ?
           WHERE id = ?`,
          [numero_entradas, event_id],
        );
      } catch (updateError) {
        logger.warn(
          "No se pudo actualizar entradas disponibles:",
          updateError.message,
        );
        // No fallar si la columna no existe
      }
 
      // Obtener la reserva creada
      const [rows] = await conn.execute(`SELECT * FROM bookings WHERE id = ?`, [
        bookingId,
      ]);
      return rows[0];
    });

    // Generar QR code asociado a la reserva
    let qrCode = null;
    try {
      const qrData = `LACLAVE-${booking.id}-${booking.codigo_acceso}`;
      qrCode = await generateQRCode(qrData, booking.id);

      // Guardar QR en la booking
      await query(`UPDATE bookings SET qr_code_url = ? WHERE id = ?`, [
        qrCode,
        booking.id,
      ]);
      logger.info(" QR Code generado para booking:", {
        bookingId: booking.id,
      });
    } catch (qrError) {
      logger.error("❌ Error generando QR:", qrError);
      // No falla la reserva si el QR falla
    }

    // Recargar booking con QR actualizado
    const bookingWithQR = await Booking.findById(booking.id);

    // Registrar pago por la entrada al evento
    try {
      const monto_total = event.precio_socio * numero_entradas;
      const paymentDescription = `Entrada a ${event.titulo} (${numero_entradas} entrada${numero_entradas !== 1 ? "s" : ""})`;

      await query(
        `INSERT INTO payments (
          socio_id, stripe_payment_intent_id, amount, currency, tipo_pago, descripcion, 
          estado, fecha_pago, metadata, created_at
        ) VALUES (?, ?, ?, 'EUR', 'entrada_evento', ?, 'exitoso', NOW(), ?, NOW())`,
        [
          socio.id,
          `booking-${booking.id}-${Date.now()}`,
          monto_total,
          paymentDescription,
          JSON.stringify({ event_id, booking_id: booking.id }),
        ],
      );
      logger.info("✅ Pago registrado para booking:", {
        bookingId: booking.id,
        monto: monto_total,
      });
    } catch (paymentErr) {
      logger.error("Error al registrar pago de la reserva:", paymentErr);
      // No interrumpir la reserva, pero reportar
    }

    // ========== ENVIAR EMAIL DE CONFIRMACIÓN ==========
    try {
      // Obtener datos del usuario
      const user = await User.findById(userId);

      if (user) {
        // Enviar email de confirmación con QR
        await EmailService.sendBookingConfirmation(bookingWithQR, event, user);
        logger.info("✅ Email de confirmación enviado:", {
          userId: user.id,
          bookingId: bookingWithQR.id,
          eventId: event.id,
          hasQR: !!bookingWithQR.qr_code_url,
        });
      }
    } catch (emailError) {
      // No fallar la reserva si el email falla
      logger.error("❌ Error enviando email de confirmación:", emailError);
    }
    // ==================================================

    return res.status(201).json({
      success: true,
      message: "Reserva creada exitosamente",
      data: bookingWithQR,
    });
  } catch (error) {
    logger.error("Error en createBooking:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear reserva",
    });
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

    // Verificar que la reserva está confirmada
    if (booking.estado !== "confirmada") {
      return res.status(400).json({
        success: false,
        message: "Esta reserva no puede ser cancelada",
      });
    }

    // Verificar que el evento no ha pasado
    const event = await Event.findById(booking.event_id);
    const fechaEvento = new Date(event.fecha_evento);
    if (fechaEvento < new Date()) {
      return res.status(400).json({
        success: false,
        message: "No puedes cancelar una reserva de un evento que ya pasó",
      });
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

      // Liberar entradas
      await conn.execute(
        `UPDATE events 
         SET entradas_reservadas = entradas_reservadas - ?,
             entradas_disponibles = entradas_disponibles + ?
         WHERE id = ?`,
        [booking.numero_entradas, booking.numero_entradas, booking.event_id],
      );
    });

    logger.info("✅ Reserva cancelada:", { bookingId: id });

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

    const booking = await Booking.findByCode(codigo_reserva);

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
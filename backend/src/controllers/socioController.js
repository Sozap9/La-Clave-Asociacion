import Socio from "../models/Socio.js";
import User from "../models/User.js";
import { query } from "../config/database.js";
import {
  createStripeCustomer,
  attachPaymentMethod,
  createSubscription,
  cancelSubscription,
  updatePaymentMethod as updateStripePaymentMethod,
  getInvoices,
  createSetupIntent,
} from "../config/payment.js";

/**
 * Upgrade de usuario básico a socio (DEPRECATED)
 * POST /api/socios/upgrade
 */
export const upgradeToSocio = async (req, res) => {
  return res.status(410).json({
    success: false,
    message:
      "Este endpoint está obsoleto. Ahora la afiliación de socios se realiza mediante solicitud al admin y pago por evento.",
  });
};

/**
 * Obtener información de mi membresía
 * GET /api/socios/me
 */
export const getMyMembership = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "socio") {
      return res.status(403).json({
        success: false,
        message: "No eres socio",
      });
    }

    const socio = await Socio.findByUserId(userId);

    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de membresía",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: socio.id,
        numero_socio: socio.numero_socio,
        fecha_alta: socio.fecha_alta,
        fecha_baja: socio.fecha_baja,
        cuota_mensual: socio.cuota_mensual,
        ultimo_pago: socio.ultimo_pago,
        proximo_pago: socio.proximo_pago,
        estado: socio.estado,
        pagos_fallidos: socio.pagos_fallidos,
      },
    });
  } catch (error) {
    console.error("Error en getMyMembership:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener información de membresía",
    });
  }
};

/**
 * Actualizar método de pago
 * PUT /api/socios/me/payment-method
 */
export const updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "El método de pago es obligatorio",
      });
    }

    if (req.user.role !== "socio") {
      return res.status(403).json({
        success: false,
        message: "No eres socio",
      });
    }

    const socio = await Socio.findByUserId(userId);

    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    // Actualizar en Stripe
    await updateStripePaymentMethod(socio.stripe_customer_id, paymentMethodId);

    // Actualizar en base de datos
    await Socio.update(socio.id, { payment_method_id: paymentMethodId });

    return res.status(200).json({
      success: true,
      message: "Método de pago actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error en updatePaymentMethod:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar método de pago",
    });
  }
};

/**
 * Cancelar membresía
 * DELETE /api/socios/me/cancel
 */
export const cancelMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmacion } = req.body;

    if (confirmacion !== "CANCELAR") {
      return res.status(400).json({
        success: false,
        message: 'Debes confirmar escribiendo "CANCELAR"',
      });
    }

    if (req.user.role !== "socio") {
      return res.status(403).json({
        success: false,
        message: "No eres socio",
      });
    }

    const socio = await Socio.findByUserId(userId);

    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    // Cancelar suscripción en Stripe
    await cancelSubscription(socio.stripe_subscription_id);

    // Dar de baja en base de datos
    await Socio.darDeBaja(socio.id, "Cancelación voluntaria");

    // Actualizar rol de usuario a básico
    await query("UPDATE users SET role = ? WHERE id = ?", ["basico", userId]);

    // Cancelar reservas futuras
    await query(
      `
      UPDATE bookings 
      SET estado = 'cancelada', motivo_cancelacion = 'Membresía cancelada'
      WHERE socio_id = ? AND estado = 'confirmada'
      AND event_id IN (SELECT id FROM events WHERE fecha_evento > CURDATE())
    `,
      [socio.id],
    );

    return res.status(200).json({
      success: true,
      message: "Membresía cancelada exitosamente. Lamentamos verte partir",
    });
  } catch (error) {
    console.error("Error en cancelMembership:", error);
    return res.status(500).json({
      success: false,
      message: "Error al cancelar membresía",
    });
  }
};

/**
 * Obtener historial de pagos
 * GET /api/socios/me/payments
 */
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "socio") {
      return res.status(403).json({
        success: false,
        message: "No eres socio",
      });
    }

    const socio = await Socio.findByUserId(userId);

    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    // Obtener pagos de la base de datos
    const sql = `
      SELECT 
        id, tipo_pago, amount, currency, estado, 
        descripcion, fecha_pago, created_at
      FROM payments
      WHERE socio_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const payments = await query(sql, [socio.id]);

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error en getMyPayments:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener historial de pagos",
    });
  }
};

/**
 * Crear Setup Intent para configurar método de pago
 * POST /api/socios/setup-intent
 */
export const createPaymentSetup = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Verificar si ya tiene customer en Stripe
    let customerId;
    const existingSocio = await Socio.findByUserId(userId);

    if (existingSocio && existingSocio.stripe_customer_id) {
      customerId = existingSocio.stripe_customer_id;
    } else {
      // Crear nuevo cliente si no existe
      const customer = await createStripeCustomer({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos,
        telefono: user.telefono,
      });
      customerId = customer.id;
    }

    // Crear setup intent
    const setupIntent = await createSetupIntent(customerId);

    return res.status(200).json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId: customerId,
      },
    });
  } catch (error) {
    console.error("Error en createPaymentSetup:", error);
    return res.status(500).json({
      success: false,
      message: "Error al configurar método de pago",
    });
  }
};

/**
 * Obtener mis eventos (reservados y asistidos)
 * GET /api/socios/me/events
 */
export const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = "proximos" } = req.query; // proximos, pasados, todos

    if (req.user.role !== "socio") {
      return res.status(403).json({
        success: false,
        message: "No eres socio",
      });
    }

    const socio = await Socio.findByUserId(userId);

    if (!socio) {
      return res.status(404).json({
        success: false,
        message: "No se encontró información de socio",
      });
    }

    let sql = `
      SELECT 
        e.id, e.titulo, e.descripcion_corta, e.fecha_evento, 
        e.hora_evento, e.ubicacion, e.imagen_cartel_url,
        b.id as reserva_id, b.codigo_reserva, b.estado as reserva_estado,
        b.fecha_reserva, b.fecha_asistencia
      FROM bookings b
      INNER JOIN events e ON b.event_id = e.id
      WHERE b.socio_id = ?
    `;

    if (filter === "proximos") {
      sql += " AND e.fecha_evento >= CURDATE() AND b.estado IN ('confirmada')";
    } else if (filter === "pasados") {
      sql += " AND e.fecha_evento < CURDATE()";
    }

    sql += " ORDER BY e.fecha_evento DESC";

    const events = await query(sql, [socio.id]);

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error en getMyEvents:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener eventos",
    });
  }
};

export default {
  upgradeToSocio,
  getMyMembership,
  updatePaymentMethod,
  cancelMembership,
  getMyPayments,
  createPaymentSetup,
  getMyEvents,
};
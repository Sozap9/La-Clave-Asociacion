import { query } from '../config/database.js';
import EmailService from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * ================================================================
 * CONTROLADOR DE CONTACTO
 * ================================================================
 * Gestiona el formulario público de contacto.
 * Guarda el mensaje en la tabla `contacts` y notifica por email.
 * ================================================================
 */

/**
 * Enviar mensaje de contacto
 * POST /api/contact
 * Body: { nombre, email, asunto, mensaje }
 */
export const submitContact = async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    // ── Validación básica ────────────────────────────────────────
    if (!nombre?.trim() || !email?.trim() || !asunto?.trim() || !mensaje?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: nombre, email, asunto y mensaje.',
      });
    }

    if (nombre.trim().length < 2 || nombre.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener entre 2 y 100 caracteres.',
      });
    }

    if (asunto.trim().length < 3 || asunto.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'El asunto debe tener entre 3 y 200 caracteres.',
      });
    }

    if (mensaje.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje debe tener al menos 10 caracteres.',
      });
    }

    // ── Guardar en BD ────────────────────────────────────────────
    const sql = `
      INSERT INTO contacts (nombre, email, asunto, mensaje, estado, created_at)
      VALUES (?, ?, ?, ?, 'nuevo', NOW())
    `;

    const result = await query(sql, [
      nombre.trim(),
      email.trim().toLowerCase(),
      asunto.trim(),
      mensaje.trim(),
    ]);

    logger.info('Nuevo mensaje de contacto recibido', {
      contactId: result.insertId,
      email: email.trim().toLowerCase(),
      asunto: asunto.trim(),
    });

    // ── Notificar a admins por email (no bloqueante) ─────────────
    const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (adminEmails.length > 0) {
      try {
        await EmailService.sendContactNotificationAdmin({
          id: result.insertId,
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          asunto: asunto.trim(),
          mensaje: mensaje.trim(),
        }, adminEmails);
      } catch (emailError) {
        logger.warn('No se pudo enviar notificación de contacto a admins:', emailError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente. Te responderemos lo antes posible.',
    });

  } catch (error) {
    logger.error('Error en submitContact:', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al enviar el mensaje. Inténtalo de nuevo.',
    });
  }
};
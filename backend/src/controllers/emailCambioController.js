import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import logger from '../config/logger.js';
import { registrarActividad, getIpFromRequest } from '../utils/activityLogger.js';
import {
  enviarConfirmacionNuevoEmail,
  enviarAvisoCambioEmail,
} from '../services/emailCambioService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HORAS_VALIDEZ = 24;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * @desc    Pedir el cambio de email. Hace falta la contraseña; el cambio no se
 *          aplica hasta confirmarlo desde el nuevo correo.
 * @route   PUT /api/users/profile/email
 * @access  Private
 */
export const solicitarCambioEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const nuevoEmail = String(req.body.nuevoEmail || '').trim().toLowerCase();
    const { password } = req.body;

    if (!nuevoEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo email y tu contraseña son obligatorios',
      });
    }

    if (!EMAIL_REGEX.test(nuevoEmail) || nuevoEmail.length > 100) {
      return res.status(400).json({ success: false, message: 'El email no es válido' });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, nombre, password_hash FROM users WHERE id = ?',
      [userId],
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // 400 y no 401: el frontend cierra la sesión con cualquier 401
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(400).json({ success: false, message: 'La contraseña no es correcta' });
    }

    if (nuevoEmail === user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Ese ya es tu email actual' });
    }

    const [enUso] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
      [nuevoEmail, userId],
    );
    if (enUso.length > 0) {
      return res.status(409).json({ success: false, message: 'Ese email ya está en uso' });
    }

    // En la base solo va el hash; el enlace lleva el token
    const token = crypto.randomBytes(32).toString('hex');
    await pool.execute(
      `UPDATE users
       SET email_pendiente = ?, email_cambio_token = ?,
           email_cambio_expira = DATE_ADD(NOW(), INTERVAL ${HORAS_VALIDEZ} HOUR)
       WHERE id = ?`,
      [nuevoEmail, hashToken(token), userId],
    );

    try {
      await enviarConfirmacionNuevoEmail(user, nuevoEmail, token);
    } catch (emailError) {
      logger.error('Error enviando la confirmación del nuevo email:', emailError);
      await pool.execute(
        `UPDATE users SET email_pendiente = NULL, email_cambio_token = NULL, email_cambio_expira = NULL WHERE id = ?`,
        [userId],
      );
      return res.status(502).json({
        success: false,
        message: 'No se pudo enviar el correo de confirmación. Inténtalo más tarde.',
      });
    }

    // El aviso al email actual no debe impedir el cambio si falla
    enviarAvisoCambioEmail(user, nuevoEmail).catch((avisoError) =>
      logger.error('Error enviando el aviso de cambio de email:', avisoError),
    );

    logger.info('Cambio de email solicitado', { userId });

    return res.json({
      success: true,
      message: `Te hemos enviado un enlace a ${nuevoEmail}. El cambio se aplicará cuando lo confirmes (tienes ${HORAS_VALIDEZ} horas).`,
    });
  } catch (error) {
    logger.error('Error en solicitarCambioEmail:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al solicitar el cambio de email',
    });
  }
};

/**
 * @desc    Confirmar el nuevo email con el enlace del correo (sin sesión)
 * @route   POST /api/auth/confirmar-email
 * @access  Public
 */
export const confirmarCambioEmail = async (req, res) => {
  try {
    const token = String(req.body.token || '');
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ success: false, message: 'El enlace no es válido o ha caducado' });
    }

    const [rows] = await pool.execute(
      `SELECT id, email, email_pendiente FROM users
       WHERE email_cambio_token = ? AND email_cambio_expira > NOW() AND activo = 1
       LIMIT 1`,
      [hashToken(token)],
    );
    const user = rows[0];
    if (!user || !user.email_pendiente) {
      return res.status(400).json({ success: false, message: 'El enlace no es válido o ha caducado' });
    }

    // Puede que otra cuenta haya cogido ese email mientras tanto
    const [enUso] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(email) = ? AND id != ?',
      [user.email_pendiente, user.id],
    );
    if (enUso.length > 0) {
      await pool.execute(
        `UPDATE users SET email_pendiente = NULL, email_cambio_token = NULL, email_cambio_expira = NULL WHERE id = ?`,
        [user.id],
      );
      return res.status(409).json({ success: false, message: 'Ese email ya está en uso por otra cuenta' });
    }

    await pool.execute(
      `UPDATE users
       SET email = email_pendiente, email_verified = 1, email_pendiente = NULL,
           email_cambio_token = NULL, email_cambio_expira = NULL, updated_at = NOW()
       WHERE id = ?`,
      [user.id],
    );

    registrarActividad({
      userId: user.id,
      accion: 'actualizar',
      entidadTipo: 'usuario',
      entidadId: user.id,
      descripcion: 'Email de la cuenta cambiado y confirmado desde el nuevo correo',
      ipAddress: getIpFromRequest(req),
    });

    logger.info('Cambio de email confirmado', { userId: user.id });

    return res.json({
      success: true,
      message: 'Email confirmado. A partir de ahora entra con tu nuevo correo.',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Ese email ya está en uso por otra cuenta' });
    }
    logger.error('Error en confirmarCambioEmail:', error);
    return res.status(500).json({ success: false, message: 'Error al confirmar el email' });
  }
};

export default { solicitarCambioEmail, confirmarCambioEmail };

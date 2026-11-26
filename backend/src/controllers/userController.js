import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { deleteFile } from '../config/multer.js';
import { enviarDocumento } from '../utils/documentos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '../..');

/**
 * @desc    Mi perfil
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT 
        id, email, email_pendiente, nombre, apellidos, telefono, 
        fecha_nacimiento, dni, avatar_url, dni_front_url, dni_back_url,
        role, activo, email_verified, created_at, updated_at
      FROM users 
      WHERE id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    logger.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el perfil del usuario' 
    });
  }
};

/**
 * @desc    Imagen de mi DNI
 * @route   GET /api/users/profile/dni
 * @access  Private
 */
export const getMyDni = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT dni_front_url FROM users WHERE id = ?',
      [req.user.id]
    );
    return enviarDocumento(res, rows[0]?.dni_front_url);
  } catch (error) {
    logger.error('Error al obtener el DNI del perfil:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el documento' });
  }
};

/**
 * @desc    Actualizar mi perfil: solo foto y teléfono. Nombre, apellidos,
 *          fecha de nacimiento y DNI los verificó la asociación al aprobar el
 *          alta y solo los cambia un admin; el email tiene su propio flujo con
 *          confirmación (PUT /api/users/profile/email).
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  // Las imágenes solo llegan como archivo (multer); en la base va la ruta
  const avatarFile = req.files?.avatar?.[0];

  // Si la petición no llega a guardarse, el archivo recién subido sobra
  const descartarSubida = () => {
    if (avatarFile) deleteFile(avatarFile.path);
  };

  try {
    const userId = req.user.id;
    const { telefono } = req.body;

    const avatar_url = avatarFile ? `uploads/avatars/${avatarFile.filename}` : undefined;

    const fieldsToUpdate = [];
    const values = [];

    if (telefono !== undefined) {
      const tel = String(telefono).trim();
      if (tel && !/^[0-9+\s()-]{6,20}$/.test(tel)) {
        descartarSubida();
        return res.status(400).json({
          success: false,
          message: 'El teléfono no es válido',
        });
      }
      fieldsToUpdate.push('telefono = ?');
      values.push(tel || null);
    }
    if (avatar_url) {
      fieldsToUpdate.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (fieldsToUpdate.length === 0) {
      descartarSubida();
      return res.status(400).json({
        success: false,
        message: 'No hay cambios para guardar',
      });
    }

    const [current] = await pool.execute(
      'SELECT avatar_url FROM users WHERE id = ?',
      [userId]
    );

    fieldsToUpdate.push('updated_at = NOW()');
    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedUser] = await pool.execute(
      `SELECT 
        id, email, email_pendiente, nombre, apellidos, telefono, 
        fecha_nacimiento, dni, avatar_url, dni_front_url, dni_back_url,
        role, activo, email_verified, created_at, updated_at
      FROM users 
      WHERE id = ?`,
      [userId]
    );

    // Fuera el avatar sustituido (solo rutas de uploads/, no base64 antiguo)
    const anterior = avatar_url && current[0]?.avatar_url;
    if (anterior && anterior.startsWith('uploads/')) {
      deleteFile(path.join(backendRoot, anterior));
    }

    logger.info('Perfil de usuario actualizado', { userId });

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: updatedUser[0]
    });
  } catch (error) {
    descartarSubida();
    logger.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el perfil' 
    });
  }
};

/**
 * @desc    Cambiar mi contraseña (reglas en changePasswordValidator)
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash);

    // 400 y no 401: el frontend cierra la sesión con cualquier 401
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'La contraseña actual no es correcta' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Los enlaces de recuperación pendientes dejan de valer
    await pool.execute(
      `UPDATE users
       SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL,
           password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
       WHERE id = ?`,
      [hashedPassword, userId]
    );

    logger.info('Contraseña cambiada', { userId });

    res.json({ 
      success: true,
      message: 'Contraseña cambiada correctamente' 
    });
  } catch (error) {
    logger.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al cambiar la contraseña' 
    });
  }
};

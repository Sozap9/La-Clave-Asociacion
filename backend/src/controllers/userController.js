import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

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
        id, email, nombre, apellidos, telefono, 
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
 * @desc    Editar mi perfil
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      nombre, 
      apellidos, 
      email, 
      telefono, 
      fecha_nacimiento, 
      dni, 
      avatar_url, 
      dni_front_url, 
      dni_back_url 
    } = req.body;

    // Solo se actualizan los campos que llegan
    const fieldsToUpdate = [];
    const values = [];

    if (nombre !== undefined && nombre !== '') {
      fieldsToUpdate.push('nombre = ?');
      values.push(nombre);
    }
    if (apellidos !== undefined && apellidos !== '') {
      fieldsToUpdate.push('apellidos = ?');
      values.push(apellidos);
    }
    if (email !== undefined && email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          message: 'Email inválido' 
        });
      }

      const [existingEmail] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'El email ya está en uso' 
        });
      }

      fieldsToUpdate.push('email = ?');
      values.push(email);
    }
    if (telefono !== undefined) {
      fieldsToUpdate.push('telefono = ?');
      values.push(telefono || null);
    }
    if (fecha_nacimiento !== undefined) {
      fieldsToUpdate.push('fecha_nacimiento = ?');
      values.push(fecha_nacimiento || null);
    }
    if (dni !== undefined) {
      fieldsToUpdate.push('dni = ?');
      values.push(dni || null);
    }
    if (avatar_url !== undefined) {
      fieldsToUpdate.push('avatar_url = ?');
      values.push(avatar_url || null);
    }
    if (dni_front_url !== undefined) {
      fieldsToUpdate.push('dni_front_url = ?');
      values.push(dni_front_url || null);
    }
    if (dni_back_url !== undefined) {
      fieldsToUpdate.push('dni_back_url = ?');
      values.push(dni_back_url || null);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No hay campos para actualizar' 
      });
    }

    fieldsToUpdate.push('updated_at = NOW()');
    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedUser] = await pool.execute(
      `SELECT 
        id, email, nombre, apellidos, telefono, 
        fecha_nacimiento, dni, avatar_url, dni_front_url, dni_back_url,
        role, activo, email_verified, created_at, updated_at
      FROM users 
      WHERE id = ?`,
      [userId]
    );

    logger.info('Perfil de usuario actualizado', { userId });

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: updatedUser[0]
    });
  } catch (error) {
    logger.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al actualizar el perfil' 
    });
  }
};

/**
 * @desc    Cambiar mi contraseña
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Contraseña actual y nueva contraseña son obligatorias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual' 
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Contraseña actual incorrecta' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

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
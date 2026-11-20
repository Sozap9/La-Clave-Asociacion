import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { deleteFile } from '../config/multer.js';

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
  // Las imágenes solo llegan como archivo (multer); en la base va la ruta
  const avatarFile = req.files?.avatar?.[0];
  const dniFrontFile = req.files?.dni_front?.[0];

  // Si la petición no llega a guardarse, los archivos recién subidos sobran
  const descartarSubidas = () => {
    [avatarFile, dniFrontFile]
      .filter(Boolean)
      .forEach((file) => deleteFile(file.path));
  };

  try {
    const userId = req.user.id;
    const { 
      nombre, 
      apellidos, 
      email, 
      telefono, 
      fecha_nacimiento, 
      dni
    } = req.body;

    const avatar_url = avatarFile ? `uploads/avatars/${avatarFile.filename}` : undefined;
    const dni_front_url = dniFrontFile ? `uploads/dni/${dniFrontFile.filename}` : undefined;

    const [current] = await pool.execute(
      'SELECT avatar_url, dni_front_url FROM users WHERE id = ?',
      [userId]
    );

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
        descartarSubidas();
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
        descartarSubidas();
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
    if (avatar_url) {
      fieldsToUpdate.push('avatar_url = ?');
      values.push(avatar_url);
    }
    if (dni_front_url) {
      fieldsToUpdate.push('dni_front_url = ?');
      values.push(dni_front_url);
    }

    if (fieldsToUpdate.length === 0) {
      descartarSubidas();
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

    // Fuera los archivos sustituidos (solo rutas de uploads/, no base64 antiguo)
    const anteriores = [
      avatar_url && current[0]?.avatar_url,
      dni_front_url && current[0]?.dni_front_url,
    ];
    anteriores
      .filter((ruta) => ruta && ruta.startsWith('uploads/'))
      .forEach((ruta) => deleteFile(path.join(backendRoot, ruta)));

    logger.info('Perfil de usuario actualizado', { userId });

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: updatedUser[0]
    });
  } catch (error) {
    descartarSubidas();
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
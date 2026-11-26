import { query } from "../config/database.js";
import bcrypt from "bcryptjs";
import logger from '../config/logger.js';

// Tabla users
class User {
  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
      const results = await query(sql, [email]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findByEmail:", error);
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const sql = "SELECT * FROM users WHERE id = ? LIMIT 1";
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findById:", error);
      throw error;
    }
  }

  /**
   * Listar usuarios (selector de alta manual de socios y gestión del admin).
   * No devuelve password_hash ni las fotos del DNI.
   * @param {Object} options - { page, limit, role, search }
   * @returns {Object} { users, total, page, pages }
   */
  static async list({ page = 1, limit = 20, role = null, search = null } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      const conditions = ["activo = TRUE"];
      const params = [];

      if (role) {
        conditions.push("role = ?");
        params.push(role);
      }

      if (search && search.trim().length >= 2) {
        conditions.push(
          "(nombre LIKE ? OR apellidos LIKE ? OR email LIKE ?)",
        );
        const like = `%${search.trim()}%`;
        params.push(like, like, like);
      }

      const where = `WHERE ${conditions.join(" AND ")}`;

      const sql = `
        SELECT id, email, nombre, apellidos, telefono,
               fecha_nacimiento, role, activo, created_at
        FROM users
        ${where}
        ORDER BY created_at DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      const users = await query(sql, params);

      const countSql = `SELECT COUNT(*) as total FROM users ${where}`;
      const countResult = await query(countSql, params);
      const total = countResult[0].total;

      return {
        users,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      logger.error("Error en User.list:", error);
      throw error;
    }
  }

  // Crear usuario
  static async create(userData) {
    try {
      const {
        email,
        password,
        nombre,
        apellidos,
        telefono = null,
        fecha_nacimiento = null,
        dni = null,
        dni_front_url = null,
        dni_back_url = null,
        firma_url = null,
        role = "basico",
        idioma_preferido = "es",
        ip_registro = null,
      } = userData;

      // username es NOT NULL UNIQUE pero la app no lo pide: se saca del email
      const username =
        userData.username ||
        `${email.split("@")[0]}_${Date.now().toString(36)}`;

      const password_hash = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (
          username, email, password_hash, nombre, apellidos, 
          telefono, fecha_nacimiento, dni, dni_front_url, 
          dni_back_url, firma_url, role, idioma_preferido, ip_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        username,
        email,
        password_hash,
        nombre,
        apellidos,
        telefono,
        fecha_nacimiento,
        dni,
        dni_front_url,
        dni_back_url,
        firma_url,
        role,
        idioma_preferido,
        ip_registro,
      ];

      const result = await query(sql, values);

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error("Error en create:", error);
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, updateData) {
    try {
      const allowedFields = [
        "nombre",
        "apellidos",
        "telefono",
        "fecha_nacimiento",
        "dni",
        "dni_front_url",
        "dni_back_url",
        "firma_url",
        "avatar_url",
        "idioma_preferido",
      ];

      const updates = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No hay campos válidos para actualizar");
      }

      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates);
      values.push(id);

      const sql = `UPDATE users SET ${fields} WHERE id = ?`;
      await query(sql, values);

      return true;
    } catch (error) {
      logger.error("Error en update:", error);
      throw error;
    }
  }

  // Actualizar contraseña
  static async updatePassword(id, newPassword) {
    try {
      const password_hash = await bcrypt.hash(newPassword, 10);
      const sql = "UPDATE users SET password_hash = ? WHERE id = ?";
      await query(sql, [password_hash, id]);
      return true;
    } catch (error) {
      logger.error("Error en updatePassword:", error);
      throw error;
    }
  }

  // Comprobar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error("Error en verifyPassword:", error);
      throw error;
    }
  }

  // ¿Existe el email?
  static async emailExists(email) {
    try {
      const sql = "SELECT id FROM users WHERE email = ? LIMIT 1";
      const results = await query(sql, [email]);
      return results.length > 0;
    } catch (error) {
      logger.error("Error en emailExists:", error);
      throw error;
    }
  }

  // ¿Existe el DNI?
  static async dniExists(dni) {
    try {
      const sql = "SELECT id FROM users WHERE dni = ? LIMIT 1";
      const results = await query(sql, [dni.toUpperCase()]);
      return results.length > 0;
    } catch (error) {
      logger.error("Error en dniExists:", error);
      throw error;
    }
  }

  // Desactivar usuario (soft delete)
  static async deactivate(id) {
    try {
      const sql = "UPDATE users SET activo = false WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en deactivate:", error);
      throw error;
    }
  }

  // Soft delete: inactivo y deleted_at
  static async softDelete(id) {
    try {
      const sql =
        "UPDATE users SET activo = false, deleted_at = NOW() WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en softDelete:", error);
      throw error;
    }
  }

  // Borrar usuario de la base de datos
  static async delete(id) {
    try {
      const sql = "DELETE FROM users WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en delete:", error);
      throw error;
    }
  }

  // Activar usuario
  static async activate(id) {
    try {
      const sql = "UPDATE users SET activo = true WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en activate:", error);
      throw error;
    }
  }

  // Marcar el email como verificado
  static async verifyEmail(id) {
    try {
      const sql = `
        UPDATE users 
        SET email_verified = true, email_verification_token = NULL 
        WHERE id = ?
      `;
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en verifyEmail:", error);
      throw error;
    }
  }

  // Guardar token de verificación de email
  static async saveEmailVerificationToken(id, token) {
    try {
      const sql = "UPDATE users SET email_verification_token = ? WHERE id = ?";
      await query(sql, [token, id]);
      return true;
    } catch (error) {
      logger.error("Error en saveEmailVerificationToken:", error);
      throw error;
    }
  }

  // Guardar token de reset de contraseña
  static async savePasswordResetToken(userId, hashedToken, expiresAt) {
    try {
      const sql = `
        UPDATE users 
        SET reset_password_token = ?, 
            reset_password_expires = ?
        WHERE id = ?
      `;
      await query(sql, [hashedToken, expiresAt, userId]);
      return true;
    } catch (error) {
      logger.error("Error en savePasswordResetToken:", error);
      throw error;
    }
  }

  // Buscar por token de reset no caducado
  static async findByValidResetToken(hashedToken) {
    try {
      const sql = `
        SELECT id, email, nombre, apellidos, reset_password_expires
        FROM users
        WHERE reset_password_token = ?
          AND reset_password_expires > NOW()
          AND activo = true
      `;

      const results = await query(sql, [hashedToken]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findByValidResetToken:", error);
      throw error;
    }
  }

  // Borrar el token de reset
  static async clearPasswordResetToken(userId) {
    try {
      const sql = `
        UPDATE users 
        SET reset_password_token = NULL, 
            reset_password_expires = NULL 
        WHERE id = ?
      `;
      await query(sql, [userId]);
      return true;
    } catch (error) {
      logger.error("Error en clearPasswordResetToken:", error);
      throw error;
    }
  }

  // Usuario sin datos sensibles
  static sanitizeUser(user) {
    if (!user) return null;

    const {
      password_hash,
      email_verification_token,
      reset_password_token,
      reset_password_expires,
      password_reset_token,
      password_reset_expires,
      email_cambio_token,
      email_cambio_expira,
      ...sanitizedUser
    } = user;

    return sanitizedUser;
  }
}

export default User;
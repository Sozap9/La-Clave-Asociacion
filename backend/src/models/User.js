import { query } from "../config/database.js";
import bcrypt from "bcryptjs";

/**
 * Modelo User - Manejo de la tabla users
 */
class User {
  /**
   * Buscar usuario por email
   * @param {String} email - Email del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  static async findByEmail(email) {
    try {
      const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
      const results = await query(sql, [email]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en findByEmail:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   * @param {Number} id - ID del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  static async findById(id) {
    try {
      const sql = "SELECT * FROM users WHERE id = ? LIMIT 1";
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en findById:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por username
   * @param {String} username - Username del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  static async findByUsername(username) {
    try {
      const sql = "SELECT * FROM users WHERE username = ? LIMIT 1";
      const results = await query(sql, [username]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en findByUsername:", error);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Usuario creado con su ID
   */
  static async create(userData) {
    try {
      const {
        username,
        email,
        password,
        nombre,
        apellidos,
        telefono,
        fecha_nacimiento,
        dni,
        dni_front_url = null,
        dni_back_url = null,
        firma_url = null,
        role = "basico",
        idioma_preferido = "es",
        ip_registro = null,
      } = userData;

      // Hash de la contraseña
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

      // Retornar el usuario creado (sin contraseña)
      return await this.findById(result.insertId);
    } catch (error) {
      console.error("Error en create:", error);
      throw error;
    }
  }

  /**
   * Actualizar usuario
   * @param {Number} id - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Boolean} true si se actualizó correctamente
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        "username",
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

      // Filtrar solo campos permitidos
      const updates = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No hay campos válidos para actualizar");
      }

      // Construir query dinámicamente
      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates);
      values.push(id);

      const sql = `UPDATE users SET ${fields} WHERE id = ?`;
      await query(sql, values);

      return true;
    } catch (error) {
      console.error("Error en update:", error);
      throw error;
    }
  }

  /**
   * Actualizar contraseña
   * @param {Number} id - ID del usuario
   * @param {String} newPassword - Nueva contraseña
   * @returns {Boolean} true si se actualizó correctamente
   */
  static async updatePassword(id, newPassword) {
    try {
      const password_hash = await bcrypt.hash(newPassword, 10);
      const sql = "UPDATE users SET password_hash = ? WHERE id = ?";
      await query(sql, [password_hash, id]);
      return true;
    } catch (error) {
      console.error("Error en updatePassword:", error);
      throw error;
    }
  }

  /**
   * Verificar contraseña
   * @param {String} plainPassword - Contraseña en texto plano
   * @param {String} hashedPassword - Contraseña hasheada
   * @returns {Boolean} true si coinciden
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error("Error en verifyPassword:", error);
      throw error;
    }
  }

  /**
   * Verificar si un email ya existe
   * @param {String} email - Email a verificar
   * @returns {Boolean} true si existe
   */
  static async emailExists(email) {
    try {
      const sql = "SELECT id FROM users WHERE email = ? LIMIT 1";
      const results = await query(sql, [email]);
      return results.length > 0;
    } catch (error) {
      console.error("Error en emailExists:", error);
      throw error;
    }
  }

  /**
   * Verificar si un username ya existe
   * @param {String} username - Username a verificar
   * @returns {Boolean} true si existe
   */
  static async usernameExists(username) {
    try {
      const sql = "SELECT id FROM users WHERE username = ? LIMIT 1";
      const results = await query(sql, [username]);
      return results.length > 0;
    } catch (error) {
      console.error("Error en usernameExists:", error);
      throw error;
    }
  }


  /**
   * Verificar si un DNI ya existe
   * @param {String} dni - DNI a verificar (se compara en mayúsculas)
   * @returns {Boolean} true si existe
   */
  static async dniExists(dni) {
    try {
      const sql = "SELECT id FROM users WHERE dni = ? LIMIT 1";
      const results = await query(sql, [dni.toUpperCase()]);
      return results.length > 0;
    } catch (error) {
      console.error("Error en dniExists:", error);
      throw error;
    }
  }

  /**
   * Desactivar usuario (soft delete)
   * @param {Number} id - ID del usuario
   * @returns {Boolean} true si se desactivó correctamente
   */
  static async deactivate(id) {
    try {
      const sql = "UPDATE users SET activo = false WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error("Error en deactivate:", error);
      throw error;
    }
  }

  /**
   * Soft delete del usuario (marca como inactivo y añade deleted_at)
   * @param {Number} id - ID del usuario
   * @returns {Boolean} true si se marcó correctamente
   */
  static async softDelete(id) {
    try {
      const sql =
        "UPDATE users SET activo = false, deleted_at = NOW() WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error("Error en softDelete:", error);
      throw error;
    }
  }

  /**
   * Eliminar usuario de la base de datos
   * @param {Number} id - ID del usuario
   * @returns {Boolean} true si se eliminó correctamente
   */
  static async delete(id) {
    try {
      const sql = "DELETE FROM users WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error("Error en delete:", error);
      throw error;
    }
  }

  /**
   * Activar usuario
   * @param {Number} id - ID del usuario
   * @returns {Boolean} true si se activó correctamente
   */
  static async activate(id) {
    try {
      const sql = "UPDATE users SET activo = true WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error("Error en activate:", error);
      throw error;
    }
  }

  /**
   * Verificar email del usuario
   * @param {Number} id - ID del usuario
   * @returns {Boolean} true si se verificó correctamente
   */
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
      console.error("Error en verifyEmail:", error);
      throw error;
    }
  }

  /**
   * Guardar token de verificación de email
   * @param {Number} id - ID del usuario
   * @param {String} token - Token de verificación
   * @returns {Boolean} true si se guardó correctamente
   */
  static async saveEmailVerificationToken(id, token) {
    try {
      const sql = "UPDATE users SET email_verification_token = ? WHERE id = ?";
      await query(sql, [token, id]);
      return true;
    } catch (error) {
      console.error("Error en saveEmailVerificationToken:", error);
      throw error;
    }
  }

  /**
   * Guardar token de reset de contraseña
   * @param {Number} userId - ID del usuario
   * @param {String} hashedToken - Token hasheado
   * @param {Date} expiresAt - Fecha de expiración
   * @returns {Boolean} true si se guardó correctamente
   */
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
      console.error("Error en savePasswordResetToken:", error);
      throw error;
    }
  }

  /**
   * Buscar usuario por token de reset válido
   * @param {String} hashedToken - Token hasheado
   * @returns {Object|null} Usuario o null
   */
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
      console.error("Error en findByValidResetToken:", error);
      throw error;
    }
  }

  /**
   * Limpiar token de reset de contraseña
   * @param {Number} userId - ID del usuario
   * @returns {Boolean} true si se limpió correctamente
   */
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
      console.error("Error en clearPasswordResetToken:", error);
      throw error;
    }
  }

  /**
   * Obtener usuario sin datos sensibles
   * @param {Object} user - Usuario completo
   * @returns {Object} Usuario sin contraseña ni tokens
   */
  static sanitizeUser(user) {
    if (!user) return null;

    const {
      password_hash,
      email_verification_token,
      reset_password_token,
      reset_password_expires,
      ...sanitizedUser
    } = user;

    return sanitizedUser;
  }
}

export default User;
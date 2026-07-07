import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Modelo SolicitudSocio - Manejo de la tabla solicitudes_socios
 * Las solicitudes son registros pendientes de aprobación admin.
 * El usuario NO existe en 'users' hasta que el admin aprueba.
 */
class SolicitudSocio {

  /**
   * Buscar solicitud por ID
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT s.*, 
               u.nombre   AS admin_nombre
        FROM solicitudes_socios s
        LEFT JOIN users u ON s.revisado_por = u.id
        WHERE s.id = ?
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en SolicitudSocio.findById:', error);
      throw error;
    }
  }

  /**
   * Buscar solicitudes con filtros y paginación
   */
  static async findAll({ estado, search, page = 1, limit = 20 } = {}) {
    try {
      // Asegurar que page y limit son integers seguros para interpolar en SQL
      const safePage  = Math.max(1, parseInt(page)  || 1);
      const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset    = (safePage - 1) * safeLimit;

      const conditions = [];
      const values = [];

      if (estado && estado !== 'all') {
        conditions.push('s.estado = ?');
        values.push(estado);
      }

      if (search && search.trim().length >= 2) {
        conditions.push('(s.nombre LIKE ? OR s.apellidos LIKE ? OR s.email LIKE ? OR s.dni LIKE ?)');
        const like = `%${search.trim()}%`;
        values.push(like, like, like, like);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Total para paginación
      const countSql = `SELECT COUNT(*) AS total FROM solicitudes_socios s ${where}`;
      const countResult = await query(countSql, values);
      const total = Number(countResult[0].total);

      // Datos paginados — LIMIT y OFFSET se interpolan directamente (integers validados)
      // ya que MySQL2 execute() puede tener problemas con placeholders en LIMIT/OFFSET
      const dataSql = `
        SELECT 
          s.id, s.nombre, s.apellidos, s.email,
          s.telefono, s.fecha_nacimiento, s.dni,
          s.dni_front_url, s.dni_back_url, s.motivacion,
          s.estado, s.motivo_rechazo, s.fecha_revision,
          s.ip_solicitud, s.created_at, s.updated_at,
          u.nombre   AS admin_nombre
        FROM solicitudes_socios s
        LEFT JOIN users u ON s.revisado_por = u.id
        ${where}
        ORDER BY s.created_at DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `;
      const solicitudes = await query(dataSql, values);

      return {
        solicitudes,
        pagination: {
          total,
          page:  safePage,
          limit: safeLimit,
          pages: Math.ceil(total / safeLimit), // "pages" en lugar de "totalPages" — coincide con el frontend
        }
      };
    } catch (error) {
      console.error('Error en SolicitudSocio.findAll:', error);
      throw error;
    }
  }

  /**
   * Contar solicitudes pendientes (para badge en sidebar admin)
   */
  static async countPendientes() {
    try {
      const sql = `SELECT COUNT(*) AS total FROM solicitudes_socios WHERE estado = 'pendiente'`;
      const results = await query(sql);
      return Number(results[0].total);
    } catch (error) {
      console.error('Error en SolicitudSocio.countPendientes:', error);
      throw error;
    }
  }

  /**
   * Verificar si ya existe una solicitud pendiente para ese email o DNI
   */
  static async existePendiente(email, dni) {
    try {
      const sql = `
        SELECT id FROM solicitudes_socios
        WHERE (email = ? OR dni = ?) AND estado = 'pendiente'
        LIMIT 1
      `;
      const results = await query(sql, [email, dni.toUpperCase()]);
      return results.length > 0;
    } catch (error) {
      console.error('Error en SolicitudSocio.existePendiente:', error);
      throw error;
    }
  }

  /**
   * Crear nueva solicitud
   * La contraseña se hashea aquí para guardarla lista para insertar en users al aprobar
   */
  static async create(solicitudData) {
    try {
      const {
        nombre,
        apellidos,
        email,
        password,
        telefono,
        fecha_nacimiento,
        dni,
        dni_front_url = null,
        dni_back_url  = null,
        motivacion    = null,
        ip_solicitud  = null
      } = solicitudData;

      // Hashear contraseña ya aquí — al aprobar se inserta directamente
      const password_hash = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO solicitudes_socios (
          nombre, apellidos, email, password_hash,
          telefono, fecha_nacimiento, dni,
          dni_front_url, dni_back_url, motivacion,
          ip_solicitud
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        nombre,
        apellidos,
        email.toLowerCase().trim(),
        password_hash,
        telefono,
        fecha_nacimiento,
        dni.toUpperCase(),
        dni_front_url,
        dni_back_url,
        motivacion,
        ip_solicitud
      ];

      const result = await query(sql, values);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error en SolicitudSocio.create:', error);
      throw error;
    }
  }

  /**
   * Marcar solicitud como aprobada
   */
  static async aprobar(id, adminId) {
    try {
      const sql = `
        UPDATE solicitudes_socios
        SET estado = 'aprobada',
            revisado_por = ?,
            fecha_revision = NOW()
        WHERE id = ?
      `;
      await query(sql, [adminId, id]);
      return await this.findById(id);
    } catch (error) {
      console.error('Error en SolicitudSocio.aprobar:', error);
      throw error;
    }
  }

  /**
   * Marcar solicitud como rechazada
   */
  static async rechazar(id, adminId, motivoRechazo) {
    try {
      const sql = `
        UPDATE solicitudes_socios
        SET estado = 'rechazada',
            revisado_por = ?,
            motivo_rechazo = ?,
            fecha_revision = NOW()
        WHERE id = ?
      `;
      await query(sql, [adminId, motivoRechazo, id]);
      return await this.findById(id);
    } catch (error) {
      console.error('Error en SolicitudSocio.rechazar:', error);
      throw error;
    }
  }

  /**
   * Eliminar solicitud (solo para limpieza de datos — uso admin)
   */
  static async delete(id) {
    try {
      const sql = `DELETE FROM solicitudes_socios WHERE id = ?`;
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en SolicitudSocio.delete:', error);
      throw error;
    }
  }
}

export default SolicitudSocio;
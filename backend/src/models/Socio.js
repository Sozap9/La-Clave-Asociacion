import { query } from "../config/database.js";
import logger from '../config/logger.js';

// Tabla socios
class Socio {
  // Buscar socio por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT s.*, u.email, u.nombre, u.apellidos, u.role
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findById:", error);
      throw error;
    }
  }

  // Buscar socio por user_id
  static async findByUserId(userId) {
    try {
      const sql = `
        SELECT s.*, u.email, u.nombre, u.apellidos, u.role
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        LIMIT 1
      `;
      const results = await query(sql, [userId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findByUserId:", error);
      throw error;
    }
  }

  // Buscar por numero_socio
  static async findByNumeroSocio(numeroSocio) {
    try {
      const sql = "SELECT * FROM socios WHERE numero_socio = ? LIMIT 1";
      const results = await query(sql, [numeroSocio]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findByNumeroSocio:", error);
      throw error;
    }
  }

  /**
   * Siguiente numero_socio libre (LC-YYYY-NNNN), con MAX + 1.
   * El trigger before_socio_insert (fuera de las migraciones) usa COUNT(*) y
   * repetía números tras bajas; solo actúa si numero_socio llega vacío.
   */
  static async generarNumeroSocio() {
    const year = new Date().getFullYear();
    const sql = `
      SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_socio, '-', -1) AS UNSIGNED)), 0) + 1 as siguiente
      FROM socios
      WHERE numero_socio LIKE CONCAT('LC-', ?, '-%')
    `;
    const result = await query(sql, [year]);
    const siguiente = result[0].siguiente;
    return `LC-${year}-${String(siguiente).padStart(4, "0")}`;
  }

  // Crear socio
  static async create(socioData) {
    try {
      const {
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        payment_method_id,
        cuota_mensual = 10.0,
      } = socioData;

      // numero_socio se genera aquí, no en el trigger (ver generarNumeroSocio)
      const numero_socio = await this.generarNumeroSocio();

      const sql = `
        INSERT INTO socios (
          user_id, 
          numero_socio,
          stripe_customer_id, 
          stripe_subscription_id, 
          payment_method_id,
          cuota_mensual,
          estado
        ) VALUES (?, ?, ?, ?, ?, ?, 'activo')
      `;

      const values = [
        user_id,
        numero_socio,
        stripe_customer_id,
        stripe_subscription_id,
        payment_method_id,
        cuota_mensual,
      ];

      const result = await query(sql, values);

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error("Error en create:", error);
      throw error;
    }
  }

  // Actualizar socio
  static async update(id, updateData) {
    try {
      const allowedFields = [
        "cuota_mensual",
        "estado",
        "dias_morosidad",
        "notas",
        "stripe_subscription_id",
        "payment_method_id",
      ];

      const fields = [];
      const values = [];

      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error("No hay campos válidos para actualizar");
      }

      values.push(id);

      const sql = `UPDATE socios SET ${fields.join(", ")} WHERE id = ?`;
      await query(sql, values);

      return await this.findById(id);
    } catch (error) {
      logger.error("Error en update:", error);
      throw error;
    }
  }

  // Cancelar socio
  static async cancel(id) {
    try {
      const sql = `
        UPDATE socios 
        SET estado = 'inactivo', fecha_baja = CURDATE()
        WHERE id = ?
      `;
      await query(sql, [id]);
      return await this.findById(id);
    } catch (error) {
      logger.error("Error en cancel:", error);
      throw error;
    }
  }

  // Baja de un socio: estado cancelado, motivo y usuario inactivo
  static async darDeBaja(id, motivo = null) {
    try {
      const socio = await this.findById(id);
      if (!socio) {
        throw new Error("Socio no encontrado");
      }

      let sql = `
        UPDATE socios
        SET estado = 'inactivo',
            fecha_baja = CURDATE()
      `;
      const params = [];

      if (motivo) {
        sql += `, motivo_baja = ?`;
        sql += `, notas_admin = CONCAT(IFNULL(notas_admin, ''), '\n', ?)`;
        params.push(motivo, motivo);
      }

      sql += ` WHERE id = ?`;
      params.push(id);

      await query(sql, params);

      const userSql = `UPDATE users SET activo = false WHERE id = ?`;
      await query(userSql, [socio.user_id]);

      return await this.findById(id);
    } catch (error) {
      logger.error("Error en darDeBaja:", error);
      throw error;
    }
  }

  // Reactivar socio y su usuario
  static async reactivar(id) {
    try {
      const socio = await this.findById(id);
      if (!socio) {
        throw new Error("Socio no encontrado");
      }

      const sql = `
        UPDATE socios
        SET estado = 'activo',
            fecha_baja = NULL,
            dias_morosidad = 0,
            motivo_baja = NULL
        WHERE id = ?
      `;
      await query(sql, [id]);

      const userSql = `UPDATE users SET activo = true WHERE id = ?`;
      await query(userSql, [socio.user_id]);

      return await this.findById(id);
    } catch (error) {
      logger.error("Error en reactivar:", error);
      throw error;
    }
  }

  // Eliminar socio (soft delete)
  static async delete(id) {
    try {
      await this.cancel(id);
      // No se borra la fila, solo se cancela
      return true;
    } catch (error) {
      logger.error("Error en delete:", error);
      throw error;
    }
  }

  // Socios activos con su email, para los envíos del cron
  static async getAllActive() {
    try {
      const sql = `
        SELECT s.*, u.email, u.nombre, u.apellidos
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.estado = 'activo' AND u.activo = TRUE
      `;
      return await query(sql);
    } catch (error) {
      logger.error('Error en getAllActive:', error);
      throw error;
    }
  }

  // Listado paginado del admin. Se filtra en SQL para que total y páginas
  // sean correctos
  static async list({ page = 1, limit = 20, filtro = null, estado = null, search = null } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Desde users con LEFT JOIN: así salen también los admins sin fila de socio
      const where = ["u.role IN ('socio', 'admin')"];
      const params = [];

      switch (filtro) {
        case "socio":
          // Un admin sin fila de socio queda fuera (s.estado es NULL)
          where.push("s.estado = 'activo'");
          break;
        case "inactivo":
          where.push("u.activo = 0");
          break;
        case "admin":
          where.push("u.role = 'admin'");
          break;
        default:
          if (estado) {
            where.push("s.estado = ?");
            params.push(estado);
          }
      }

      const termino = typeof search === "string" ? search.trim() : "";
      if (termino) {
        const like = `%${termino}%`;
        where.push(`(
          u.email LIKE ? OR
          u.nombre LIKE ? OR
          u.apellidos LIKE ? OR
          CONCAT_WS(' ', u.nombre, u.apellidos) LIKE ? OR
          u.telefono LIKE ? OR
          CAST(s.numero_socio AS CHAR) LIKE ?
        )`);
        params.push(like, like, like, like, like, like);
      }

      const whereSql = where.join(" AND ");

      const socios = await query(
        `
        SELECT
          u.id AS user_id, u.email, u.nombre, u.apellidos,
          u.telefono, u.role, u.activo,
          s.id, s.numero_socio, s.estado, s.cuota_mensual, s.fecha_alta,
          s.fecha_baja, s.dias_morosidad, s.notas_admin,
          s.created_at, s.updated_at
        FROM users u
        LEFT JOIN socios s ON s.user_id = u.id
        WHERE ${whereSql}
        ORDER BY COALESCE(s.fecha_alta, u.created_at) DESC, u.id DESC
        LIMIT ${limitNum} OFFSET ${offset}
        `,
        params,
      );

      const countResult = await query(
        `
        SELECT COUNT(*) AS total
        FROM users u
        LEFT JOIN socios s ON s.user_id = u.id
        WHERE ${whereSql}
        `,
        params,
      );
      const total = Number(countResult[0]?.total) || 0;

      return {
        socios,
        total,
        page: pageNum,
        pages: Math.max(1, Math.ceil(total / limitNum)),
        limit: limitNum,
      };
    } catch (error) {
      logger.error("Error en list:", error);
      throw error;
    }
  }

  // Buscar socios (y admins sin fila de socio, como list()), con su rol
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT 
          u.id AS user_id, u.email, u.nombre, u.apellidos,
          u.telefono, u.role, u.activo,
          s.id, s.numero_socio, s.estado, s.cuota_mensual, s.fecha_alta,
          s.fecha_baja, s.dias_morosidad, s.notas_admin,
          s.created_at, s.updated_at
        FROM users u
        LEFT JOIN socios s ON s.user_id = u.id
        WHERE 
          u.role IN ('socio', 'admin') AND (
            u.email LIKE ? OR 
            u.nombre LIKE ? OR 
            u.apellidos LIKE ? OR
            s.numero_socio LIKE ?
          )
        ORDER BY COALESCE(s.fecha_alta, u.created_at) DESC
        LIMIT 50
      `;

      const searchPattern = `%${searchTerm}%`;
      const results = await query(sql, [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      ]);

      return results;
    } catch (error) {
      logger.error("Error en search:", error);
      throw error;
    }
  }

  // Socios morosos, con su rol
  static async getMorosos() {
    try {
      const sql = `
        SELECT 
          s.*, 
          u.email, u.nombre, u.apellidos, u.telefono, u.role, u.activo
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.estado = 'moroso' OR s.dias_morosidad > 0
        ORDER BY s.dias_morosidad DESC, s.fecha_alta DESC
      `;

      const results = await query(sql);
      return results;
    } catch (error) {
      logger.error("Error en getMorosos:", error);
      throw error;
    }
  }

  // ¿Cabe otro socio? (límite configurable)
  static async puedeCrearNuevoSocio(
    limite = parseInt(process.env.MAX_SOCIOS_ACTIVOS || "10000", 10),
  ) {
    try {
      const sql = `SELECT COUNT(*) as total FROM socios WHERE estado = 'activo'`;
      const result = await query(sql);
      const total = result[0]?.total || 0;
      return total < limite;
    } catch (error) {
      logger.error("Error en puedeCrearNuevoSocio:", error);
      throw error;
    }
  }

  // Anotar un pago correcto
  static async registrarPagoExitoso(id) {
    try {
      await query(
        `
        UPDATE socios
        SET pagos_fallidos = 0,
            dias_morosidad = 0,
            ultimo_pago = NOW(),
            estado = 'activo'
        WHERE id = ?
      `,
        [id],
      );

      return this.findById(id);
    } catch (error) {
      logger.error("Error en registrarPagoExitoso:", error);
      throw error;
    }
  }

  // Sumar un pago fallido
  static async incrementarPagosFallidos(id) {
    try {
      const socio = await this.findById(id);
      if (!socio) {
        throw new Error("Socio no encontrado");
      }

      const pagosFail = (socio.pagos_fallidos || 0) + 1;
      const nuevoEstado = pagosFail >= 3 ? "moroso" : socio.estado || "activo";
      const diasMorosidad =
        nuevoEstado === "moroso"
          ? Math.max(socio.dias_morosidad || 0, 1)
          : socio.dias_morosidad || 0;

      await query(
        `
        UPDATE socios 
        SET pagos_fallidos = ?,
            estado = ?,
            dias_morosidad = ?
        WHERE id = ?
      `,
        [pagosFail, nuevoEstado, diasMorosidad, id],
      );

      return this.findById(id);
    } catch (error) {
      logger.error("Error en incrementarPagosFallidos:", error);
      throw error;
    }
  }

  // Marcar socio como moroso
  static async marcarComoMoroso(id) {
    try {
      await query(
        `
        UPDATE socios
        SET estado = 'moroso',
            dias_morosidad = GREATEST(COALESCE(dias_morosidad, 0), 1)
        WHERE id = ?
      `,
        [id],
      );

      return this.findById(id);
    } catch (error) {
      logger.error("Error en marcarComoMoroso:", error);
      throw error;
    }
  }

  // Recalcula los días de morosidad (cron diario)
  static async updateMorosidad() {
    try {
      const sql = `
        UPDATE socios s
        INNER JOIN (
          SELECT socio_id, 
          DATEDIFF(CURDATE(), MAX(fecha_pago)) as dias_sin_pago
          FROM payments
          WHERE estado IN ('exitoso', 'completado')
          GROUP BY socio_id
        ) p ON s.id = p.socio_id
        SET s.dias_morosidad = GREATEST(0, p.dias_sin_pago - 30),
            s.estado = CASE 
              WHEN p.dias_sin_pago > 30 THEN 'moroso'
              ELSE s.estado
            END
        WHERE s.estado IN ('activo', 'moroso')
      `;

      const result = await query(sql);

      return {
        updated: result.affectedRows,
        message: `Actualizado estado de morosidad de ${result.affectedRows} socios`,
      };
    } catch (error) {
      logger.error("Error en updateMorosidad:", error);
      throw error;
    }
  }
}

export default Socio;
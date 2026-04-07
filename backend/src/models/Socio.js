import { query } from "../config/database.js";

/**
 * Modelo Socio - Manejo de la tabla socios
 */
class Socio {
  /**
   * Buscar socio por ID
   * @param {Number} id - ID del socio
   * @returns {Object|null} Socio encontrado o null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT s.*, u.username, u.email, u.nombre, u.apellidos, u.role
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en findById:", error);
      throw error;
    }
  }

  /**
   * Buscar socio por user_id
   * @param {Number} userId - ID del usuario
   * @returns {Object|null} Socio encontrado o null
   */
  static async findByUserId(userId) {
    try {
      const sql = `
        SELECT s.*, u.username, u.email, u.nombre, u.apellidos, u.role
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        LIMIT 1
      `;
      const results = await query(sql, [userId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en findByUserId:", error);
      throw error;
    }
  }

  /**
   * Buscar socio por número de socio
   * @param {String} numeroSocio - Número de socio (LC-YYYY-NNNN)
   * @returns {Object|null} Socio encontrado o null
   */
  static async findByNumeroSocio(numeroSocio) {
    try {
      const sql = "SELECT * FROM socios WHERE numero_socio = ? LIMIT 1";
      const results = await query(sql, [numeroSocio]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en findByNumeroSocio:", error);
      throw error;
    }
  }

  /**
   * Crear nuevo socio
   * @param {Object} socioData - Datos del socio
   * @returns {Object} Socio creado
   */
  static async create(socioData) {
    try {
      const {
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        payment_method_id,
        cuota_mensual = 10.0,
      } = socioData;

      // El número de socio y fechas se generan automáticamente por triggers
      const sql = `
        INSERT INTO socios (
          user_id, 
          stripe_customer_id, 
          stripe_subscription_id, 
          payment_method_id,
          cuota_mensual,
          estado
        ) VALUES (?, ?, ?, ?, ?, 'activo')
      `;

      const values = [
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        payment_method_id,
        cuota_mensual,
      ];

      const result = await query(sql, values);

      // Obtener el socio recién creado
      return await this.findById(result.insertId);
    } catch (error) {
      console.error("Error en create:", error);
      throw error;
    }
  }

  /**
   * Actualizar socio
   * @param {Number} id - ID del socio
   * @param {Object} updateData - Datos a actualizar
   * @returns {Object} Socio actualizado
   */
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
      console.error("Error en update:", error);
      throw error;
    }
  }

  /**
   * Cancelar socio (cambiar estado y fecha)
   * @param {Number} id - ID del socio
   * @returns {Object} Socio actualizado
   */
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
      console.error("Error en cancel:", error);
      throw error;
    }
  }

  /**
   * Dar de baja a un socio (marcar como cancelado y anotar motivo)
   * @param {Number} id - ID del socio
   * @param {String} motivo - Motivo de la baja
   * @returns {Object} Socio actualizado
   */
  static async darDeBaja(id, motivo = null) {
    try {
      // Primero obtener el socio para tener el user_id
      const socio = await this.findById(id);
      if (!socio) {
        throw new Error("Socio no encontrado");
      }

      // Actualizar tabla socios
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

      // Actualizar tabla users para marcar como inactivo
      const userSql = `UPDATE users SET activo = false WHERE id = ?`;
      await query(userSql, [socio.user_id]);

      return await this.findById(id);
    } catch (error) {
      console.error("Error en darDeBaja:", error);
      throw error;
    }
  }

  /**
   * Reactivar a un socio (volver a activo)
   * @param {Number} id - ID del socio
   * @returns {Object} Socio actualizado
   */
  static async reactivar(id) {
    try {
      // Primero obtener el socio para tener el user_id
      const socio = await this.findById(id);
      if (!socio) {
        throw new Error("Socio no encontrado");
      }

      // Actualizar tabla socios
      const sql = `
        UPDATE socios
        SET estado = 'activo',
            fecha_baja = NULL,
            dias_morosidad = 0,
            motivo_baja = NULL
        WHERE id = ?
      `;
      await query(sql, [id]);

      // Actualizar tabla users para marcar como activo
      const userSql = `UPDATE users SET activo = true WHERE id = ?`;
      await query(userSql, [socio.user_id]);

      return await this.findById(id);
    } catch (error) {
      console.error("Error en reactivar:", error);
      throw error;
    }
  }

  /**
   * Eliminar socio (soft delete)
   * @param {Number} id - ID del socio
   * @returns {Boolean} true si se eliminó correctamente
   */
  static async delete(id) {
    try {
      // Primero cambiar estado a inactivo
      await this.cancel(id);
      // En este caso, no eliminamos físicamente, solo cancelamos
      return true;
    } catch (error) {
      console.error("Error en delete:", error);
      throw error;
    }
  }

  /**
   * Listar todos los socios con paginación
   *  Usa interpolación directa en LIMIT/OFFSET (sin placeholders)
   * @param {Number} page - Página actual
   * @param {Number} limit - Límite de resultados por página
   * @param {String} estado - Filtro por estado (opcional)
   * @returns {Object} { socios, total, page, pages }
   */
  static async list(page = 1, limit = 20, estado = null) {
    try {
      // Validar y sanitizar parámetros
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      let sql = `
        SELECT 
          s.*, 
          u.username, u.email, u.nombre, u.apellidos, u.telefono, u.role, u.activo
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
      `;

      const params = [];

      if (estado) {
        sql += " WHERE s.estado = ?";
        params.push(estado);
      }

      // Usar interpolación directa en lugar de placeholders
      sql += ` ORDER BY s.fecha_alta DESC LIMIT ${limitNum} OFFSET ${offset}`;

      const socios = await query(sql, params);

      // Contar total
      let countSql = "SELECT COUNT(*) as total FROM socios";
      if (estado) {
        countSql += " WHERE estado = ?";
      }
      const countParams = estado ? [estado] : [];
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;

      return {
        socios,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      console.error("Error en list:", error);
      throw error;
    }
  }

  /**
   * Buscar socios
   * Incluye el campo 'role' del usuario
   * @param {String} searchTerm - Término de búsqueda
   * @returns {Array} Socios encontrados
   */
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT 
          s.*, 
          u.username, u.email, u.nombre, u.apellidos, u.telefono, u.role, u.activo
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE 
          u.username LIKE ? OR 
          u.email LIKE ? OR 
          u.nombre LIKE ? OR 
          u.apellidos LIKE ? OR
          s.numero_socio LIKE ?
        ORDER BY s.fecha_alta DESC
        LIMIT 50
      `;

      const searchPattern = `%${searchTerm}%`;
      const results = await query(sql, [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      ]);

      return results;
    } catch (error) {
      console.error("Error en search:", error);
      throw error;
    }
  }

  /**
   * Obtener socios morosos
   * Incluye el campo 'role' del usuario
   * @returns {Array} Lista de socios morosos
   */
  static async getMorosos() {
    try {
      const sql = `
        SELECT 
          s.*, 
          u.username, u.email, u.nombre, u.apellidos, u.telefono, u.role, u.activo
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.estado = 'moroso' OR s.dias_morosidad > 0
        ORDER BY s.dias_morosidad DESC, s.fecha_alta DESC
      `;

      const results = await query(sql);
      return results;
    } catch (error) {
      console.error("Error en getMorosos:", error);
      throw error;
    }
  }

  /**
   * Verificar si se puede crear un nuevo socio (límite configurable)
   * @param {Number} limite - Máximo de socios activos permitidos
   * @returns {Boolean}
   */
  static async puedeCrearNuevoSocio(
    limite = parseInt(process.env.MAX_SOCIOS_ACTIVOS || "10000", 10),
  ) {
    try {
      const sql = `SELECT COUNT(*) as total FROM socios WHERE estado = 'activo'`;
      const result = await query(sql);
      const total = result[0]?.total || 0;
      return total < limite;
    } catch (error) {
      console.error("Error en puedeCrearNuevoSocio:", error);
      throw error;
    }
  }

  /**
   * Registrar pago exitoso para un socio
   * @param {Number} id - ID del socio
   * @returns {Object} Socio actualizado
   */
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
      console.error("Error en registrarPagoExitoso:", error);
      throw error;
    }
  }

  /**
   * Incrementar contador de pagos fallidos para un socio
   * @param {Number} id - ID del socio
   * @returns {Object} Socio actualizado
   */
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
      console.error("Error en incrementarPagosFallidos:", error);
      throw error;
    }
  }

  /**
   * Marcar socio como moroso
   * @param {Number} id - ID del socio
   * @returns {Object} Socio actualizado
   */
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
      console.error("Error en marcarComoMoroso:", error);
      throw error;
    }
  }

  /**
   * Actualizar días de morosidad de todos los socios
   * Llamado por el cron job diario
   * @returns {Object} Resumen de la actualización
   */
  static async updateMorosidad() {
    try {
      // Esta lógica puede ser más compleja según tus reglas de negocio
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
      console.error("Error en updateMorosidad:", error);
      throw error;
    }
  }
}

export default Socio;

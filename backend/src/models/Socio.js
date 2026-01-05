import { query } from '../config/database.js';

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
        SELECT s.*, u.username, u.email, u.nombre, u.apellidos
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findById:', error);
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
        SELECT s.*, u.username, u.email, u.nombre, u.apellidos
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        LIMIT 1
      `;
      const results = await query(sql, [userId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findByUserId:', error);
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
      const sql = 'SELECT * FROM socios WHERE numero_socio = ? LIMIT 1';
      const results = await query(sql, [numeroSocio]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findByNumeroSocio:', error);
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
        cuota_mensual = 10.00
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
        cuota_mensual
      ];

      const result = await query(sql, values);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  /**
   * Actualizar socio
   * @param {Number} id - ID del socio
   * @param {Object} updateData - Datos a actualizar
   * @returns {Boolean} true si se actualizó
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'stripe_customer_id',
        'stripe_subscription_id',
        'payment_method_id',
        'cuota_mensual',
        'ultimo_pago',
        'proximo_pago',
        'pagos_fallidos',
        'estado',
        'motivo_baja',
        'notas_admin'
      ];

      const updates = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      const sql = `UPDATE socios SET ${fields} WHERE id = ?`;
      await query(sql, values);
      return true;
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  /**
   * Dar de baja a un socio
   * @param {Number} id - ID del socio
   * @param {String} motivo - Motivo de la baja
   * @returns {Boolean} true si se dio de baja
   */
  static async darDeBaja(id, motivo = null) {
    try {
      const sql = `
        UPDATE socios 
        SET estado = 'inactivo', fecha_baja = NOW(), motivo_baja = ?
        WHERE id = ?
      `;
      await query(sql, [motivo, id]);
      return true;
    } catch (error) {
      console.error('Error en darDeBaja:', error);
      throw error;
    }
  }

  /**
   * Reactivar socio
   * @param {Number} id - ID del socio
   * @returns {Boolean} true si se reactivó
   */
  static async reactivar(id) {
    try {
      const sql = `
        UPDATE socios 
        SET estado = 'activo', fecha_baja = NULL, motivo_baja = NULL
        WHERE id = ?
      `;
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en reactivar:', error);
      throw error;
    }
  }

  /**
   * Marcar socio como moroso
   * @param {Number} id - ID del socio
   * @returns {Boolean} true si se marcó
   */
  static async marcarComoMoroso(id) {
    try {
      const sql = 'UPDATE socios SET estado = \'moroso\' WHERE id = ?';
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en marcarComoMoroso:', error);
      throw error;
    }
  }

  /**
   * Incrementar contador de pagos fallidos
   * @param {Number} id - ID del socio
   * @returns {Boolean} true si se incrementó
   */
  static async incrementarPagosFallidos(id) {
    try {
      const sql = 'UPDATE socios SET pagos_fallidos = pagos_fallidos + 1 WHERE id = ?';
      await query(sql, [id]);
      
      // Si tiene 3 o más pagos fallidos, marcar como moroso
      const socio = await this.findById(id);
      if (socio && socio.pagos_fallidos >= 3) {
        await this.marcarComoMoroso(id);
      }
      
      return true;
    } catch (error) {
      console.error('Error en incrementarPagosFallidos:', error);
      throw error;
    }
  }

  /**
   * Resetear contador de pagos fallidos
   * @param {Number} id - ID del socio
   * @returns {Boolean} true si se reseteó
   */
  static async resetearPagosFallidos(id) {
    try {
      const sql = 'UPDATE socios SET pagos_fallidos = 0 WHERE id = ?';
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en resetearPagosFallidos:', error);
      throw error;
    }
  }

  /**
   * Registrar pago exitoso
   * @param {Number} id - ID del socio
   * @returns {Boolean} true si se registró
   */
  static async registrarPagoExitoso(id) {
    try {
      const sql = `
        UPDATE socios 
        SET 
          ultimo_pago = NOW(),
          proximo_pago = DATE_ADD(NOW(), INTERVAL 1 MONTH),
          pagos_fallidos = 0,
          estado = CASE 
            WHEN estado = 'moroso' THEN 'activo'
            ELSE estado
          END
        WHERE id = ?
      `;
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en registrarPagoExitoso:', error);
      throw error;
    }
  }

  /**
   * Obtener total de socios activos
   * @returns {Number} Total de socios activos
   */
  static async getTotalActivos() {
    try {
      const sql = 'SELECT COUNT(*) as total FROM socios WHERE estado = \'activo\'';
      const results = await query(sql);
      return results[0].total;
    } catch (error) {
      console.error('Error en getTotalActivos:', error);
      throw error;
    }
  }

  /**
   * Verificar si se puede crear un nuevo socio (límite de 1000)
   * @returns {Boolean} true si se puede crear
   */
  static async puedeCrearNuevoSocio() {
    try {
      const maxSocios = parseInt(process.env.MAX_SOCIOS) || 1000;
      const totalActivos = await this.getTotalActivos();
      return totalActivos < maxSocios;
    } catch (error) {
      console.error('Error en puedeCrearNuevoSocio:', error);
      throw error;
    }
  }

  /**
   * Listar todos los socios con paginación
   * @param {Number} page - Página actual
   * @param {Number} limit - Límite por página
   * @param {String} estado - Filtrar por estado (opcional)
   * @returns {Object} { socios, total, pages }
   */
  static async list(page = 1, limit = 20, estado = null) {
    try {
      const offset = (page - 1) * limit;
      
      let sql = `
        SELECT 
          s.*, 
          u.username, u.email, u.nombre, u.apellidos, u.telefono
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
      `;
      
      const params = [];
      
      if (estado) {
        sql += ' WHERE s.estado = ?';
        params.push(estado);
      }
      
      sql += ' ORDER BY s.fecha_alta DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const socios = await query(sql, params);
      
      // Contar total
      let countSql = 'SELECT COUNT(*) as total FROM socios';
      if (estado) {
        countSql += ' WHERE estado = ?';
      }
      const countParams = estado ? [estado] : [];
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;
      
      return {
        socios,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error en list:', error);
      throw error;
    }
  }

  /**
   * Buscar socios
   * @param {String} searchTerm - Término de búsqueda
   * @returns {Array} Socios encontrados
   */
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT 
          s.*, 
          u.username, u.email, u.nombre, u.apellidos
        FROM socios s
        INNER JOIN users u ON s.user_id = u.id
        WHERE 
          s.numero_socio LIKE ? OR
          u.username LIKE ? OR
          u.email LIKE ? OR
          u.nombre LIKE ? OR
          u.apellidos LIKE ?
        LIMIT 50
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const params = Array(5).fill(searchPattern);
      
      return await query(sql, params);
    } catch (error) {
      console.error('Error en search:', error);
      throw error;
    }
  }
}

export default Socio;
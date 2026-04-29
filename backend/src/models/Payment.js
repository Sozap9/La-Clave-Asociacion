import { query, transaction } from "../config/database.js";

/**
 * Modelo Payment - Gestión de pagos
 */
class Payment {
  /**
   * Crear un nuevo pago
   * @param {Object} paymentData - Datos del pago
   * @returns {Object} Pago creado con ID
   */
  static async create(paymentData) {
    try {
      const {
        socio_id,
        stripe_payment_intent_id,
        stripe_invoice_id,
        amount,
        currency = "EUR",
        estado = "pendiente",
        tipo_pago = "cuota_mensual",
        descripcion,
        metadata = {},
      } = paymentData;

      const sql = `
        INSERT INTO payments (
          socio_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency,
          estado, tipo_pago, descripcion, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const metadataJson =
        typeof metadata === "string" ? metadata : JSON.stringify(metadata);

      const results = await query(sql, [
        socio_id,
        stripe_payment_intent_id,
        stripe_invoice_id,
        amount,
        currency,
        estado,
        tipo_pago,
        descripcion,
        metadataJson,
      ]);

      return {
        id: results.insertId,
        ...paymentData,
      };
    } catch (error) {
      console.error("Error en Payment.create:", error);
      throw error;
    }
  }

  /**
   * Buscar pago por ID
   * @param {Number} id - ID del pago
   * @returns {Object|null} Pago encontrado
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT * FROM payments WHERE id = ? LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en Payment.findById:", error);
      throw error;
    }
  }

  /**
   * Buscar pago por ID de Stripe
   * @param {String} stripePaymentId - ID del pago en Stripe
   * @returns {Object|null} Pago encontrado
   */
  static async findByStripePaymentId(stripePaymentId) {
    try {
      const sql = `
        SELECT * FROM payments WHERE stripe_payment_intent_id = ? LIMIT 1
      `;
      const results = await query(sql, [stripePaymentId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error en Payment.findByStripePaymentId:", error);
      throw error;
    }
  }

  /**
   * Listar pagos de un socio
   * @param {Number} socioId - ID del socio
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} Lista de pagos
   */
  static async findBySocio(socioId, filters = {}) {
    try {
      const {
        estado,
        tipo_pago,
        page = 1,
        limit = 20,
        orderBy = "fecha_pago",
        orderDir = "DESC",
      } = filters;

      const offset = (page - 1) * limit;
      let sql = "SELECT * FROM payments WHERE socio_id = ?";
      const params = [socioId];

      if (estado) {
        sql += " AND estado = ?";
        params.push(estado);
      }

      if (tipo_pago) {
        sql += " AND tipo_pago = ?";
        params.push(tipo_pago);
      }

      sql += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);

      const results = await query(sql, params);

      // Contar total
      let countSql =
        "SELECT COUNT(*) as total FROM payments WHERE socio_id = ?";
      const countParams = [socioId];

      if (estado) {
        countSql += " AND estado = ?";
        countParams.push(estado);
      }
      if (tipo_pago) {
        countSql += " AND tipo_pago = ?";
        countParams.push(tipo_pago);
      }

      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;

      return {
        data: results,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error en Payment.findBySocio:", error);
      throw error;
    }
  }

  /**
   * Actualizar estado de un pago
   * @param {Number} id - ID del pago
   * @param {String} estado - Nuevo estado
   * @param {Object} datos - Datos adicionales a actualizar
   * @returns {Object} Pago actualizado
   */
  static async updateStatus(id, estado, datos = {}) {
    try {
      const updates = ["estado = ?"];
      const params = [estado];

      // Agregar fecha_pago si cambia a completado o exitoso
      if (estado === "completado" || estado === "exitoso") {
        updates.push("fecha_pago = NOW()");
      }

      // Agregar otros datos si se proporcionan
      for (const [key, value] of Object.entries(datos)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }

      params.push(id);

      const sql = `
        UPDATE payments 
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = ?
      `;

      await query(sql, params);

      return this.findById(id);
    } catch (error) {
      console.error("Error en Payment.updateStatus:", error);
      throw error;
    }
  }

  /**
   * Listar pagos pendientes o fallidos
   * @returns {Array} Pagos que requieren atención
   */
  static async findPending() {
    try {
      const sql = `
        SELECT p.*, s.numero_socio, u.email, u.nombre, u.apellidos
        FROM payments p
        JOIN socios s ON p.socio_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE p.estado IN ('pendiente', 'fallido')
        AND (p.proximo_reintento IS NULL OR p.proximo_reintento <= NOW())
        ORDER BY p.created_at ASC
        LIMIT 100
      `;

      const results = await query(sql);
      return results;
    } catch (error) {
      console.error("Error en Payment.findPending:", error);
      throw error;
    }
  }

  /**
   * Obtener ingresos mensuales
   * @param {Number} meses - Cuántos meses atrás incluir
   * @returns {Array} Ingresos por mes
   */
  static async getMonthlySummary(meses = 12) {
    try {
      const sql = `
        SELECT
          DATE_FORMAT(fecha_pago, '%Y-%m') as mes,
          COUNT(*) as total_transacciones,
          SUM(COALESCE(amount, 0)) as total_ingresos,
          COUNT(DISTINCT socio_id) as socios_pagaron
        FROM payments
        WHERE estado = 'exitoso'
        AND fecha_pago >= DATE_SUB(NOW(), INTERVAL ? MONTH)
        GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m')
        ORDER BY mes DESC
      `;

      const results = await query(sql, [meses]);
      return results;
    } catch (error) {
      console.error("Error en Payment.getMonthlySummary:", error);
      throw error;
    }
  }

  /**
   * Obtener ingresos totales en período
   * @param {Date} desde - Fecha inicio
   * @param {Date} hasta - Fecha fin
   * @returns {Object} Resumen de ingresos
   */
  static async getIncomeSummary(desde, hasta) {
    try {
      const sql = `
        SELECT
          COUNT(*) as total_pagos,
          SUM(amount) as total_ingresos,
          COUNT(DISTINCT socio_id) as socios_unicos,
          tipo_pago,
          estado
        FROM payments
        WHERE fecha_pago BETWEEN ? AND ?
        GROUP BY tipo_pago, estado
      `;

      const results = await query(sql, [desde, hasta]);

      const summary = {
        total_pagos: 0,
        total_ingresos: 0,
        socios_unicos: new Set(),
        por_tipo: {},
        por_estado: {},
      };

      results.forEach((row) => {
        summary.total_pagos += row.total_pagos;
        summary.total_ingresos += parseFloat(row.total_ingresos) || 0;

        if (!summary.por_tipo[row.tipo_pago]) {
          summary.por_tipo[row.tipo_pago] = 0;
        }
        summary.por_tipo[row.tipo_pago] += parseFloat(row.total_ingresos) || 0;

        if (!summary.por_estado[row.estado]) {
          summary.por_estado[row.estado] = 0;
        }
        summary.por_estado[row.estado] += parseFloat(row.total_ingresos) || 0;
      });

      return summary;
    } catch (error) {
      console.error("Error en Payment.getIncomeSummary:", error);
      throw error;
    }
  }

  /**
   * Obtener pagos fallidos para reintentos
   * @returns {Array} Pagos que necesitan reintentos
   */
  static async getFailedForRetry() {
    try {
      const sql = `
        SELECT p.*, s.stripe_customer_id
        FROM payments p
        JOIN socios s ON p.socio_id = s.id
        WHERE p.estado = 'fallido'
        AND p.intento_reintento < 3
        AND (p.proximo_reintento IS NULL OR p.proximo_reintento <= NOW())
        ORDER BY p.intento_reintento ASC, p.created_at ASC
        LIMIT 50
      `;

      const results = await query(sql);
      return results;
    } catch (error) {
      console.error("Error en Payment.getFailedForRetry:", error);
      throw error;
    }
  }

  /**
   * Incrementar contador de reintentos
   * @param {Number} id - ID del pago
   * @param {Number} minutosDelay - Minutos para probar de nuevo
   * @returns {Object} Pago actualizado
   */
  static async incrementRetry(id, minutosDelay = 30) {
    try {
      const sql = `
        UPDATE payments
        SET intento_reintento = intento_reintento + 1,
            proximo_reintento = DATE_ADD(NOW(), INTERVAL ? MINUTE),
            updated_at = NOW()
        WHERE id = ?
      `;

      await query(sql, [minutosDelay, id]);
      return this.findById(id);
    } catch (error) {
      console.error("Error en Payment.incrementRetry:", error);
      throw error;
    }
  }

  /**
   * Eliminar (soft delete) un pago
   * @param {Number} id - ID del pago
   * @returns {Boolean} Éxito de la operación
   */
  static async delete(id) {
    try {
      const sql = "DELETE FROM payments WHERE id = ?";
      const results = await query(sql, [id]);
      return results.affectedRows > 0;
    } catch (error) {
      console.error("Error en Payment.delete:", error);
      throw error;
    }
  }

  /**
   * Obtener pagos completados de un socio en un período
   * @param {Number} socioId - ID del socio
   * @param {Date} desde - Fecha inicio
   * @param {Date} hasta - Fecha fin
   * @returns {Array} Pagos completados
   */
  static async getCompletedByPeriod(socioId, desde, hasta) {
    try {
      const sql = `
        SELECT * FROM payments
        WHERE socio_id = ?
        AND estado = 'exitoso'
        AND fecha_pago BETWEEN ? AND ?
        ORDER BY fecha_pago DESC
      `;

      const results = await query(sql, [socioId, desde, hasta]);
      return results;
    } catch (error) {
      console.error("Error en Payment.getCompletedByPeriod:", error);
      throw error;
    }
  }
}

export default Payment;
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Modelo Booking - Manejo de la tabla bookings
 */
class Booking {
  /**
   * Buscar reserva por ID
   * @param {Number} id - ID de la reserva
   * @returns {Object|null} Reserva encontrada o null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          b.*,
          e.titulo as evento_titulo,
          e.fecha_evento,
          e.hora_evento,
          e.ubicacion,
          s.numero_socio,
          u.nombre as socio_nombre,
          u.apellidos as socio_apellidos,
          u.email as socio_email
        FROM bookings b
        INNER JOIN events e ON b.event_id = e.id
        INNER JOIN socios s ON b.socio_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        WHERE b.id = ?
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
   * Buscar reserva por código de acceso (el que realmente codifica
   * el QR: "LACLAVE-{id}-{codigo_acceso}"), validando también el id
   * como comprobación extra de integridad.
   * @param {Number} bookingId
   * @param {String} codigoAcceso
   * @returns {Object|null} Reserva encontrada o null
   */
  static async findByAccessCode(bookingId, codigoAcceso) {
    try {
      const sql = `
        SELECT 
          b.*,
          e.titulo as evento_titulo,
          e.fecha_evento,
          e.hora_evento,
          e.ubicacion,
          s.numero_socio,
          u.nombre as socio_nombre,
          u.apellidos as socio_apellidos
        FROM bookings b
        INNER JOIN events e ON b.event_id = e.id
        INNER JOIN socios s ON b.socio_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        WHERE b.id = ? AND b.codigo_acceso = ?
        LIMIT 1
      `;
      const results = await query(sql, [bookingId, codigoAcceso]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findByAccessCode:', error);
      throw error;
    }
  }


  /**
   * Buscar reserva por código
   * @param {String} codigoReserva - Código de reserva
   * @returns {Object|null} Reserva encontrada o null
   */
  static async findByCode(codigoReserva) {
    try {
      const sql = `
        SELECT 
          b.*,
          e.titulo as evento_titulo,
          e.fecha_evento,
          e.hora_evento,
          e.ubicacion,
          s.numero_socio,
          u.nombre as socio_nombre,
          u.apellidos as socio_apellidos
        FROM bookings b
        INNER JOIN events e ON b.event_id = e.id
        INNER JOIN socios s ON b.socio_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        WHERE b.codigo_reserva = ?
        LIMIT 1
      `;
      const results = await query(sql, [codigoReserva]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findByCode:', error);
      throw error;
    }
  }

  /**
   * Verificar si un socio ya tiene reserva para un evento
   * @param {Number} socioId - ID del socio
   * @param {Number} eventId - ID del evento
   * @returns {Object|null} Reserva si existe
   */
  static async findBySocioAndEvent(socioId, eventId) {
    try {
      // Incluye 'esperando_pago': mientras una reserva para este evento
      // siga pendiente de pago (hasta 30 min, ver config/payment.js),
      // no se puede abrir una segunda para el mismo evento — si no, se
      // podrían acumular varias reservas del mismo socio al mismo evento
      // mientras la primera sigue sin resolverse.
      const sql = `
        SELECT * FROM bookings 
        WHERE socio_id = ? AND event_id = ? AND estado IN ('confirmada', 'esperando_pago')
        LIMIT 1
      `;
      const results = await query(sql, [socioId, eventId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en findBySocioAndEvent:', error);
      throw error;
    }
  }

  /**
   * Crear nueva reserva
   * @param {Object} bookingData - Datos de la reserva
   * @returns {Object} Reserva creada
   */
  static async create(bookingData) {
    try {
      const {
        socio_id,
        event_id,
        numero_entradas = 1,
        tipo_entrada = 'socio',
        precio_pagado = 0.00
      } = bookingData;

      // Generar código único de reserva (formato: LCV-YYYYMM-XXXXXXXX)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const randomPart = uuidv4().substring(0, 8).toUpperCase();
      const codigo_reserva = `LCV-${year}${month}-${randomPart}`;

      const sql = `
        INSERT INTO bookings (
          socio_id, event_id, codigo_reserva, numero_entradas,
          tipo_entrada, precio_pagado, estado
        ) VALUES (?, ?, ?, ?, ?, ?, 'confirmada')
      `;

      const values = [
        socio_id,
        event_id,
        codigo_reserva,
        numero_entradas,
        tipo_entrada,
        precio_pagado
      ];

      const result = await query(sql, values);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  /**
   * Cancelar reserva
   * @param {Number} id - ID de la reserva
   * @param {String} motivo - Motivo de cancelación
   * @returns {Boolean} true si se canceló
   */
  static async cancel(id, motivo = null) {
    try {
      const sql = `
        UPDATE bookings 
        SET estado = 'cancelada', 
            fecha_cancelacion = NOW(),
            motivo_cancelacion = ?
        WHERE id = ?
      `;
      await query(sql, [motivo, id]);
      return true;
    } catch (error) {
      console.error('Error en cancel:', error);
      throw error;
    }
  }

  /**
   * Marcar reserva como asistida
   * @param {Number} id - ID de la reserva
   * @returns {Boolean} true si se marcó
   */
  static async markAsAttended(id) {
  try {
    const sql = `
      UPDATE bookings 
      SET fecha_asistencia = NOW(), asistencia = 1
      WHERE id = ?
    `;
    await query(sql, [id]);
    return true;
  } catch (error) {
    console.error('Error en markAsAttended:', error);
    throw error;
  }
}

  /**
   * Guardar URL del código QR
   * @param {Number} id - ID de la reserva
   * @param {String} qrUrl - URL del QR
   * @returns {Boolean} true si se guardó
   */
  static async saveQRCode(id, qrUrl) {
    try {
      const sql = 'UPDATE bookings SET qr_code_url = ? WHERE id = ?';
      await query(sql, [qrUrl, id]);
      return true;
    } catch (error) {
      console.error('Error en saveQRCode:', error);
      throw error;
    }
  }

   /**
   * Obtener reservas de un socio CON TODOS LOS DATOS DEL EVENTO
   * @param {Number} socioId - ID del socio
   * @param {String} estado - Filtrar por estado (opcional)
   * @returns {Array} Lista de reservas
   */
  static async getBySocio(socioId, estado = null) {
    try {
      let sql = `
        SELECT 
          b.*,
          e.id as event_id,
          e.titulo as evento_titulo,
          e.descripcion,
          e.fecha_evento,
          e.hora_evento,
          e.ubicacion,
          e.aforo_maximo,
          e.entradas_disponibles,
          e.imagen_cartel_url,
          e.precio_socio,
          e.precio_invitado,
          e.permite_invitados,
          e.destacado
        FROM bookings b
        INNER JOIN events e ON b.event_id = e.id
        WHERE b.socio_id = ?
      `;

      const params = [socioId];

      if (estado) {
        sql += ' AND b.estado = ?';
        params.push(estado);
      }

      sql += ' ORDER BY e.fecha_evento DESC';

      return await query(sql, params);
    } catch (error) {
      console.error('Error en getBySocio:', error);
      throw error;
    }
  }

  /**
   * Obtener reservas de un evento
   * @param {Number} eventId - ID del evento
   * @param {String} estado - Filtrar por estado (opcional)
   * @returns {Array} Lista de reservas
   */
  static async getByEvent(eventId, estado = null) {
    try {
      let sql = `
        SELECT 
          b.*,
          s.numero_socio,
          u.nombre as socio_nombre,
          u.apellidos as socio_apellidos,
          u.email as socio_email,
          u.telefono as socio_telefono
        FROM bookings b
        INNER JOIN socios s ON b.socio_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        WHERE b.event_id = ?
      `;

      const params = [eventId];

      if (estado) {
        sql += ' AND b.estado = ?';
        params.push(estado);
      }

      sql += ' ORDER BY b.created_at DESC';

      return await query(sql, params);
    } catch (error) {
      console.error('Error en getByEvent:', error);
      throw error;
    }
  }

  /**
   * Contar reservas confirmadas de un evento
   * @param {Number} eventId - ID del evento
   * @returns {Number} Total de reservas confirmadas
   */
  static async countConfirmedByEvent(eventId) {
    try {
      const sql = `
        SELECT COUNT(*) as total 
        FROM bookings 
        WHERE event_id = ? AND estado = 'confirmada'
      `;
      const results = await query(sql, [eventId]);
      return results[0].total;
    } catch (error) {
      console.error('Error en countConfirmedByEvent:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de reservas de un socio
   * @param {Number} socioId - ID del socio
   * @returns {Object} Estadísticas
   */
  static async getSocioStats(socioId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_reservas,
          COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as reservas_activas,
          COUNT(CASE WHEN estado = 'asistida' THEN 1 END) as eventos_asistidos,
          COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as reservas_canceladas,
          COUNT(CASE WHEN estado = 'no_asistida' THEN 1 END) as no_asistencias
        FROM bookings
        WHERE socio_id = ?
      `;
      const results = await query(sql, [socioId]);
      return results[0];
    } catch (error) {
      console.error('Error en getSocioStats:', error);
      throw error;
    }
  }

  /**
   * Lista de espera - Agregar a lista
   * @param {Number} socioId - ID del socio
   * @param {Number} eventId - ID del evento
   * @returns {Object} Registro de lista de espera
   */
  static async addToWaitingList(socioId, eventId) {
    try {
      // Obtener posición
      const positionSql = `
        SELECT COALESCE(MAX(posicion), 0) + 1 as next_position
        FROM waiting_list
        WHERE event_id = ?
      `;
      const positionResult = await query(positionSql, [eventId]);
      const position = positionResult[0].next_position;

      const sql = `
        INSERT INTO waiting_list (socio_id, event_id, posicion, estado)
        VALUES (?, ?, ?, 'esperando')
      `;
      const result = await query(sql, [socioId, eventId, position]);

      return {
        id: result.insertId,
        position,
        socio_id: socioId,
        event_id: eventId
      };
    } catch (error) {
      console.error('Error en addToWaitingList:', error);
      throw error;
    }
  }

  /**
   * Verificar si socio está en lista de espera
   * @param {Number} socioId - ID del socio
   * @param {Number} eventId - ID del evento
   * @returns {Object|null} Registro si existe
   */
  static async checkWaitingList(socioId, eventId) {
    try {
      const sql = `
        SELECT * FROM waiting_list
        WHERE socio_id = ? AND event_id = ? AND estado = 'esperando'
        LIMIT 1
      `;
      const results = await query(sql, [socioId, eventId]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error en checkWaitingList:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de espera de un evento
   * @param {Number} eventId - ID del evento
   * @returns {Array} Lista de espera
   */
  static async getWaitingListByEvent(eventId) {
    try {
      const sql = `
        SELECT 
          w.*,
          s.numero_socio,
          u.nombre,
          u.apellidos,
          u.email
        FROM waiting_list w
        INNER JOIN socios s ON w.socio_id = s.id
        INNER JOIN users u ON s.user_id = u.id
        WHERE w.event_id = ? AND w.estado = 'esperando'
        ORDER BY w.posicion ASC
      `;
      return await query(sql, [eventId]);
    } catch (error) {
      console.error('Error en getWaitingListByEvent:', error);
      throw error;
    }
  }

  /**
   * Remover de lista de espera
   * @param {Number} socioId - ID del socio
   * @param {Number} eventId - ID del evento
   * @returns {Boolean} true si se removió
   */
  static async removeFromWaitingList(socioId, eventId) {
    try {
      const sql = `
        DELETE FROM waiting_list
        WHERE socio_id = ? AND event_id = ?
      `;
      await query(sql, [socioId, eventId]);
      return true;
    } catch (error) {
      console.error('Error en removeFromWaitingList:', error);
      throw error;
    }
  }
}

export default Booking;
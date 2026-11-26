import { query } from '../config/database.js';
import logger from '../config/logger.js';

// Tabla events
class Event {
  // Buscar evento por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          e.*,
          u.nombre as creado_por_nombre,
          SUM(CASE 
            WHEN b.estado IN ('confirmada', 'asistida', 'esperando_pago') AND ub.role != 'admin' AND b.es_invitacion = 0
            THEN b.numero_entradas 
            ELSE 0 
          END) as entradas_reservadas_real
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN bookings b ON e.id = b.event_id
        LEFT JOIN socios s ON b.socio_id = s.id
        LEFT JOIN users ub ON s.user_id = ub.id
        WHERE e.id = ?
        GROUP BY e.id
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      
      if (results.length > 0) {
        const event = results[0];
        // Disponibles reales a partir de las reservas. Las asistidas siguen
        // ocupando plaza: escanear una entrada no libera aforo.
        const reservadas = parseInt(event.entradas_reservadas_real) || 0;
        event.entradas_disponibles_real = event.aforo_maximo - reservadas;
        return event;
      }
      
      return null;
    } catch (error) {
      logger.error('Error en findById:', error);
      throw error;
    }
  }

  /**
   * Listar eventos con filtros y paginación
   * @returns {Object} { events, total, page, pages }
   */
  static async list(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        estado = null,
        destacado = null,
        fechaDesde = null,
        fechaHasta = null,
        orderBy = 'fecha_evento',
        orderDir = 'ASC'
      } = options;

      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = (validPage - 1) * validLimit;

      // orderBy contra lista blanca (inyección SQL)
      const allowedOrderBy = [
        'fecha_evento', 'titulo', 'created_at', 
        'precio_socio', 'aforo_maximo', 'estado'
      ];
      const validOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'fecha_evento';
      
      const validOrderDir = ['ASC', 'DESC'].includes(orderDir.toUpperCase()) 
        ? orderDir.toUpperCase() 
        : 'ASC';

      const conditions = [];
      const params = [];

      if (estado) {
        conditions.push('e.estado = ?');
        params.push(estado);
      }

      if (destacado !== null) {
        conditions.push('e.destacado = ?');
        params.push(destacado ? 1 : 0);
      }

      if (fechaDesde) {
        conditions.push('e.fecha_evento >= ?');
        params.push(fechaDesde);
      }

      if (fechaHasta) {
        conditions.push('e.fecha_evento <= ?');
        params.push(fechaHasta);
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ') 
        : '';

      // Ocupan aforo las confirmadas y las esperando_pago (para no vender de
      // más durante el pago); no cuentan las de admins
      const sql = `
        SELECT 
          e.*,
          SUM(CASE 
            WHEN b.estado IN ('confirmada', 'asistida', 'esperando_pago') AND ub.role != 'admin' AND b.es_invitacion = 0
            THEN b.numero_entradas 
            ELSE 0 
          END) as entradas_reservadas_real
        FROM events e
        LEFT JOIN bookings b ON e.id = b.event_id
        LEFT JOIN socios s ON b.socio_id = s.id
        LEFT JOIN users ub ON s.user_id = ub.id
        ${whereClause}
        GROUP BY e.id
        ORDER BY e.${validOrderBy} ${validOrderDir}
        LIMIT ? OFFSET ?
      `;

      const queryParams = [...params, validLimit, offset];
      const events = await query(sql, queryParams);
      
      events.forEach(event => {
        const reservadas = parseInt(event.entradas_reservadas_real) || 0;
        event.entradas_disponibles_real = event.aforo_maximo - reservadas;
      });

      const countSql = `SELECT COUNT(*) as total FROM events e ${whereClause}`;
      const countParams = [...params];
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;

      return {
        events,
        total,
        page: validPage,
        pages: Math.ceil(total / validLimit)
      };
    } catch (error) {
      logger.error('Error en list:', error);
      throw error;
    }
  }

  // Crear evento
  static async create(eventData) {
    try {
      const {
        titulo,
        descripcion,
        descripcion_corta = null,
        fecha_evento,
        hora_evento,
        ubicacion,
        direccion = null,
        aforo_maximo = 300,
        imagen_cartel_url = null,
        precio_socio = 0.00,
        precio_invitado = 0.00,
        permite_invitados = false,
        destacado = false,
        estado = 'borrador',
        visible_desde = null,
        visible_hasta = null,
        tags = null,
        artistas = null,
        edad_minima = 18,
        created_by
      } = eventData;

      const sql = `
        INSERT INTO events (
          titulo, descripcion, descripcion_corta, fecha_evento, hora_evento,
          ubicacion, direccion, aforo_maximo, entradas_disponibles,
          imagen_cartel_url, precio_socio, precio_invitado, permite_invitados,
          destacado, estado, visible_desde, visible_hasta, tags, artistas,
          edad_minima, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        titulo,
        descripcion,
        descripcion_corta,
        fecha_evento,
        hora_evento,
        ubicacion,
        direccion,
        aforo_maximo,
        aforo_maximo,
        imagen_cartel_url,
        precio_socio,
        precio_invitado,
        permite_invitados,
        destacado,
        estado,
        visible_desde,
        visible_hasta,
        tags,
        artistas,
        edad_minima,
        created_by
      ];

      const result = await query(sql, values);
      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Error en create:', error);
      throw error;
    }
  }

  // Actualizar evento
  static async update(id, eventData) {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'titulo', 'descripcion', 'descripcion_corta', 'fecha_evento', 'hora_evento',
        'ubicacion', 'direccion', 'aforo_maximo', 'imagen_cartel_url',
        'precio_socio', 'precio_invitado', 'permite_invitados', 'destacado',
        'estado', 'visible_desde', 'visible_hasta', 'tags', 'artistas', 'edad_minima'
      ];

      for (const field of allowedFields) {
        if (eventData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(eventData[field]);
        }
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
      await query(sql, values);

      return await this.findById(id);
    } catch (error) {
      logger.error('Error en update:', error);
      throw error;
    }
  }

  // Eliminar evento
  static async delete(id) {
    try {
      const sql = 'DELETE FROM events WHERE id = ?';
      await query(sql, [id]);
      return { success: true };
    } catch (error) {
      logger.error('Error en delete:', error);
      throw error;
    }
  }

  // ¿Quedan entradas?
  static async checkAvailability(eventId, numeroEntradas = 1) {
    try {
      const event = await this.findById(eventId);
      if (!event) {
        return false;
      }

      const disponibles = event.entradas_disponibles_real || 0;
      return disponibles >= numeroEntradas;
    } catch (error) {
      logger.error('Error en checkAvailability:', error);
      throw error;
    }
  }

  // Eventos destacados
  static async getFeatured(limit = 6) {
    try {
      return await this.list({
        destacado: true,
        estado: 'scheduled',
        limit,
        orderBy: 'fecha_evento',
        orderDir: 'ASC'
      });
    } catch (error) {
      logger.error('Error en getFeatured:', error);
      throw error;
    }
  }

  // Buscar eventos
  static async search(searchTerm, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        estado = 'scheduled'
      } = options;

      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = (validPage - 1) * validLimit;

      const sql = `
        SELECT 
          e.*,
          SUM(CASE 
            WHEN b.estado IN ('confirmada', 'asistida', 'esperando_pago') AND ub.role != 'admin' AND b.es_invitacion = 0
            THEN b.numero_entradas 
            ELSE 0 
          END) as entradas_reservadas_real
        FROM events e
        LEFT JOIN bookings b ON e.id = b.event_id
        LEFT JOIN socios s ON b.socio_id = s.id
        LEFT JOIN users ub ON s.user_id = ub.id
        WHERE e.estado = ?
        AND (
          e.titulo LIKE ? OR
          e.descripcion LIKE ? OR
          e.artistas LIKE ? OR
          e.tags LIKE ?
        )
        GROUP BY e.id
        ORDER BY e.fecha_evento ASC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const params = [estado, searchPattern, searchPattern, searchPattern, searchPattern, validLimit, offset];
      
      const events = await query(sql, params);
      
      events.forEach(event => {
        const reservadas = parseInt(event.entradas_reservadas_real) || 0;
        event.entradas_disponibles_real = event.aforo_maximo - reservadas;
      });

      const countSql = `
        SELECT COUNT(*) as total
        FROM events e
        WHERE e.estado = ?
        AND (
          e.titulo LIKE ? OR
          e.descripcion LIKE ? OR
          e.artistas LIKE ? OR
          e.tags LIKE ?
        )
      `;
      const countParams = [estado, searchPattern, searchPattern, searchPattern, searchPattern];
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;

      return {
        events,
        total,
        page: validPage,
        pages: Math.ceil(total / validLimit)
      };
    } catch (error) {
      logger.error('Error en search:', error);
      throw error;
    }
  }
}

export default Event;
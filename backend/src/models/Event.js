import { query } from '../config/database.js';

/**
 * Modelo Event - Manejo de la tabla events
 */
class Event {
  /**
   * Buscar evento por ID
   * @param {Number} id - ID del evento
   * @returns {Object|null} Evento encontrado o null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          e.*,
          u.username as creado_por_username,
          u.nombre as creado_por_nombre,
          COUNT(DISTINCT b.id) as total_reservas,
          COUNT(DISTINCT CASE WHEN b.estado = 'confirmada' THEN b.id END) as reservas_confirmadas
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        LEFT JOIN bookings b ON e.id = b.event_id
        WHERE e.id = ?
        GROUP BY e.id
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
   * Listar eventos con filtros y paginación
   * @param {Object} options - Opciones de filtrado
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

      // Validar y sanitizar valores numéricos
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const offset = (validPage - 1) * validLimit;

      // Validar orderBy (prevenir SQL injection)
      const allowedOrderBy = [
        'fecha_evento', 'titulo', 'created_at', 
        'precio_socio', 'aforo_maximo', 'estado'
      ];
      const validOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'fecha_evento';
      
      // Validar orderDir
      const validOrderDir = ['ASC', 'DESC'].includes(orderDir.toUpperCase()) 
        ? orderDir.toUpperCase() 
        : 'ASC';

      const conditions = [];
      const params = [];

      // Filtros
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

      // Query principal
      const sql = `
        SELECT 
          e.*,
          COUNT(DISTINCT b.id) as total_reservas,
          COUNT(DISTINCT CASE WHEN b.estado = 'confirmada' THEN b.id END) as reservas_confirmadas
        FROM events e
        LEFT JOIN bookings b ON e.id = b.event_id
        ${whereClause}
        GROUP BY e.id
        ORDER BY e.${validOrderBy} ${validOrderDir}
        LIMIT ? OFFSET ?
      `;

      // Añadir limit y offset a params
      const queryParams = [...params, validLimit, offset];
      const events = await query(sql, queryParams);

      // Contar total
      const countSql = `SELECT COUNT(*) as total FROM events e ${whereClause}`;
      const countParams = [...params]; // Solo los parámetros del WHERE, sin limit/offset
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total;

      return {
        events,
        total,
        page: validPage,
        pages: Math.ceil(total / validLimit)
      };
    } catch (error) {
      console.error('Error en list:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo evento
   * @param {Object} eventData - Datos del evento
   * @returns {Object} Evento creado
   */
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
        aforo_maximo, // entradas_disponibles = aforo_maximo inicialmente
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
      console.error('Error en create:', error);
      throw error;
    }
  }

  /**
   * Actualizar evento
   * @param {Number} id - ID del evento
   * @param {Object} updateData - Datos a actualizar
   * @returns {Boolean} true si se actualizó
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'titulo', 'descripcion', 'descripcion_corta', 'fecha_evento',
        'hora_evento', 'ubicacion', 'direccion', 'aforo_maximo',
        'imagen_cartel_url', 'precio_socio', 'precio_invitado',
        'permite_invitados', 'destacado', 'estado', 'motivo_cancelacion',
        'visible_desde', 'visible_hasta', 'tags', 'artistas', 'edad_minima'
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

      // Si se actualiza el aforo, recalcular entradas disponibles
      if (updates.aforo_maximo !== undefined) {
        const event = await this.findById(id);
        const reservadas = event.entradas_reservadas || 0;
        updates.entradas_disponibles = updates.aforo_maximo - reservadas;
      }

      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      const sql = `UPDATE events SET ${fields} WHERE id = ?`;
      await query(sql, values);
      return true;
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }

  /**
   * Eliminar evento (solo si no tiene reservas)
   * @param {Number} id - ID del evento
   * @returns {Boolean} true si se eliminó
   */
  static async delete(id) {
    try {
      // Verificar que no tenga reservas
      const checkSql = 'SELECT COUNT(*) as total FROM bookings WHERE event_id = ?';
      const checkResult = await query(checkSql, [id]);
      
      if (checkResult[0].total > 0) {
        throw new Error('No se puede eliminar un evento con reservas');
      }

      const sql = 'DELETE FROM events WHERE id = ?';
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en delete:', error);
      throw error;
    }
  }

  /**
   * Cancelar evento
   * @param {Number} id - ID del evento
   * @param {String} motivo - Motivo de cancelación
   * @returns {Boolean} true si se canceló
   */
  static async cancel(id, motivo) {
    try {
      const sql = `
        UPDATE events 
        SET estado = 'cancelado', motivo_cancelacion = ?
        WHERE id = ?
      `;
      await query(sql, [motivo, id]);

      // Cancelar todas las reservas
      await query(`
        UPDATE bookings 
        SET estado = 'cancelada', motivo_cancelacion = 'Evento cancelado'
        WHERE event_id = ? AND estado = 'confirmada'
      `, [id]);

      return true;
    } catch (error) {
      console.error('Error en cancel:', error);
      throw error;
    }
  }

  /**
   * Publicar evento
   * @param {Number} id - ID del evento
   * @returns {Boolean} true si se publicó
   */
  static async publish(id) {
    try {
      const sql = 'UPDATE events SET estado = \'publicado\' WHERE id = ?';
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en publish:', error);
      throw error;
    }
  }

  /**
   * Obtener próximos eventos públicos
   * @param {Number} limit - Cantidad de eventos
   * @returns {Array} Lista de eventos
   */
  static async getUpcoming(limit = 10) {
    try {
      const sql = `
        SELECT 
          e.*,
          COUNT(DISTINCT b.id) as total_reservas
        FROM events e
        LEFT JOIN bookings b ON e.id = b.event_id AND b.estado = 'confirmada'
        WHERE e.estado = 'publicado'
          AND e.fecha_evento >= CURDATE()
          AND (e.visible_desde IS NULL OR e.visible_desde <= NOW())
          AND (e.visible_hasta IS NULL OR e.visible_hasta >= NOW())
        GROUP BY e.id
        ORDER BY e.fecha_evento ASC, e.hora_evento ASC
        LIMIT ?
      `;
      return await query(sql, [limit]);
    } catch (error) {
      console.error('Error en getUpcoming:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos destacados
   * @param {Number} limit - Cantidad de eventos
   * @returns {Array} Lista de eventos destacados
   */
  static async getFeatured(limit = 3) {
    try {
      const sql = `
        SELECT e.*
        FROM events e
        WHERE e.estado = 'publicado'
          AND e.destacado = true
          AND e.fecha_evento >= CURDATE()
        ORDER BY e.fecha_evento ASC
        LIMIT ?
      `;
      return await query(sql, [limit]);
    } catch (error) {
      console.error('Error en getFeatured:', error);
      throw error;
    }
  }

  /**
   * Buscar eventos
   * @param {String} searchTerm - Término de búsqueda
   * @returns {Array} Eventos encontrados
   */
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT e.*
        FROM events e
        WHERE (
          e.titulo LIKE ? OR
          e.descripcion LIKE ? OR
          e.tags LIKE ? OR
          e.artistas LIKE ?
        ) AND e.estado = 'publicado'
        LIMIT 50
      `;
      
      const searchPattern = `%${searchTerm}%`;
      const params = Array(4).fill(searchPattern);
      
      return await query(sql, params);
    } catch (error) {
      console.error('Error en search:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de entradas
   * @param {Number} id - ID del evento
   * @param {Number} cantidad - Cantidad de entradas
   * @returns {Boolean} true si hay disponibilidad
   */
  static async checkAvailability(id, cantidad = 1) {
    try {
      const event = await this.findById(id);
      if (!event) return false;
      return event.entradas_disponibles >= cantidad;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      throw error;
    }
  }

  /**
   * Actualizar estadísticas de entradas
   * @param {Number} id - ID del evento
   * @returns {Boolean} true si se actualizó
   */
  static async updateEntryStats(id) {
    try {
      const sql = `
        UPDATE events e
        SET 
          entradas_reservadas = (
            SELECT COUNT(*) 
            FROM bookings 
            WHERE event_id = e.id AND estado = 'confirmada'
          ),
          entradas_disponibles = e.aforo_maximo - (
            SELECT COUNT(*) 
            FROM bookings 
            WHERE event_id = e.id AND estado = 'confirmada'
          )
        WHERE e.id = ?
      `;
      await query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Error en updateEntryStats:', error);
      throw error;
    }
  }
}

export default Event;
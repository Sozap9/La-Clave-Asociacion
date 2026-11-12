import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Modelo Artist - Manejo de la tabla artists
 */
class Artist {
  /**
   * Buscar artista por ID
   * @param {Number} id - ID del artista
   * @returns {Object|null} Artista encontrado o null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          a.*,
          COUNT(DISTINCT ea.id) as total_eventos,
          COUNT(DISTINCT CASE WHEN e.fecha_evento >= CURDATE() THEN ea.id END) as eventos_proximos
        FROM artists a
        LEFT JOIN event_artists ea ON a.id = ea.artist_id
        LEFT JOIN events e ON ea.event_id = e.id
        WHERE a.id = ?
        GROUP BY a.id
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Error en findById:', error);
      throw error;
    }
  }

  /**
   * Listar artistas con filtros y búsqueda avanzada
   * @param {Object} options - Opciones de filtrado
   * @returns {Object} { artists, total, page, pages, filters }
   */
  static async list(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = null,           // Búsqueda general en múltiples campos
        genero = null,           // Filtro específico de género
        sello = null,            // Filtro por sello/label
        ciudad = null,           // Filtro por ciudad
        pais_origen = null,      // Filtro por país
        activo = null,
        verificado = null,
        destacado = null,
        orderBy = 'nombre_artistico',
        orderDir = 'ASC'
      } = options;

      // Convertir y validar números
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      
      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error('Page debe ser un número mayor a 0');
      }
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new Error('Limit debe ser un número entre 1 y 100');
      }
      
      const offset = (pageNum - 1) * limitNum;

      // ========================================
      // CONSTRUIR CONDICIONES CON SISTEMA MEJORADO
      // ========================================
      
      const conditions = [];
      const params = [];

      // BÚSQUEDA GENERAL (busca en nombre, géneros y sello)
      if (search && search.trim().length > 0) {
        conditions.push(
          '(a.nombre_artistico LIKE ? OR a.nombre_real LIKE ? OR a.generos LIKE ? OR a.sello LIKE ?)'
        );
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // FILTROS ESPECÍFICOS (se pueden combinar con search)
      
      if (genero && genero.trim().length > 0) {
        conditions.push('a.generos LIKE ?');
        params.push(`%${genero.trim()}%`);
      }

      if (sello && sello.trim().length > 0) {
        conditions.push('a.sello LIKE ?');
        params.push(`%${sello.trim()}%`);
      }

      if (ciudad && ciudad.trim().length > 0) {
        conditions.push('a.ciudad LIKE ?');
        params.push(`%${ciudad.trim()}%`);
      }

      if (pais_origen && pais_origen.trim().length > 0) {
        conditions.push('a.pais_origen LIKE ?');
        params.push(`%${pais_origen.trim()}%`);
      }

      // FILTROS BOOLEANOS (convertir a 0/1)
      
      if (activo !== null && activo !== undefined) {
        conditions.push('a.activo = ?');
        const activoValue = (activo === true || activo === 'true' || activo === 1 || activo === '1') ? 1 : 0;
        params.push(activoValue);
      }

      if (verificado !== null && verificado !== undefined) {
        conditions.push('a.verificado = ?');
        const verificadoValue = (verificado === true || verificado === 'true' || verificado === 1 || verificado === '1') ? 1 : 0;
        params.push(verificadoValue);
      }

      if (destacado !== null && destacado !== undefined) {
        conditions.push('a.destacado = ?');
        const destacadoValue = (destacado === true || destacado === 'true' || destacado === 1 || destacado === '1') ? 1 : 0;
        params.push(destacadoValue);
      }

      const whereClause = conditions.length > 0 
        ? 'WHERE ' + conditions.join(' AND ') 
        : '';

      // Validar orderBy para evitar SQL injection
      const validOrderFields = ['nombre_artistico', 'nombre_real', 'pais_origen', 'ciudad', 'sello', 'created_at', 'id'];
      const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'nombre_artistico';
      const safeOrderDir = (orderDir && orderDir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

      // SQL con LIMIT/OFFSET directos (lección de Venues)
      const sql = 
        'SELECT a.*, ' +
        'COUNT(DISTINCT ea.id) as total_eventos, ' +
        'COUNT(DISTINCT CASE WHEN e.fecha_evento >= CURDATE() THEN ea.id END) as eventos_proximos ' +
        'FROM artists a ' +
        'LEFT JOIN event_artists ea ON a.id = ea.artist_id ' +
        'LEFT JOIN events e ON ea.event_id = e.id ' +
        whereClause + ' ' +
        'GROUP BY a.id ' +
        'ORDER BY a.' + safeOrderBy + ' ' + safeOrderDir + ' ' +
        'LIMIT ' + limitNum + ' OFFSET ' + offset;
      
      const artists = await query(sql, params);

      // Contar total
      const countSql = 'SELECT COUNT(*) as total FROM artists a ' + whereClause;
      const countResult = await query(countSql, params);
      const total = countResult[0].total;

      return {
        artists,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        // Info de filtros aplicados para debugging
        filters: {
          search,
          genero,
          sello,
          ciudad,
          pais_origen,
          activo,
          verificado,
          destacado
        }
      };
      
    } catch (error) {
      logger.error('Error en list:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo artista
   * @param {Object} artistData - Datos del artista
   * @returns {Object} Artista creado
   */
  static async create(artistData) {
    try {
      const {
        nombre_artistico,
        nombre_real = null,
        biografia = null,
        pais_origen = null,
        generos = null,
        sello = null,            // ← NUEVO
        ciudad = null,           // ← NUEVO
        imagen_url = null,
        website = null,
        spotify_url = null,
        soundcloud_url = null,
        instagram_handle = null,
        facebook_url = null,
        verificado = false,
        destacado = false,
        activo = true
      } = artistData;

      const sql = `
        INSERT INTO artists (
          nombre_artistico, nombre_real, biografia, pais_origen, generos, 
          sello, ciudad, imagen_url, website, spotify_url, soundcloud_url, 
          instagram_handle, facebook_url, verificado, destacado, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        nombre_artistico, nombre_real, biografia, pais_origen, generos,
        sello, ciudad, imagen_url, website, spotify_url, soundcloud_url,
        instagram_handle, facebook_url, verificado, destacado, activo
      ];

      const result = await query(sql, values);
      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Error en create:', error);
      throw error;
    }
  }

  /**
   * Actualizar artista
   * @param {Number} id - ID del artista
   * @param {Object} updateData - Datos a actualizar
   * @returns {Boolean} true si se actualizó
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'nombre_artistico', 'nombre_real', 'biografia', 'pais_origen', 'generos',
        'sello', 'ciudad',  // ← NUEVO
        'imagen_url', 'website', 'spotify_url', 'soundcloud_url',
        'instagram_handle', 'facebook_url', 'verificado', 'destacado', 'activo'
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

      const sql = `UPDATE artists SET ${fields} WHERE id = ?`;
      await query(sql, values);
      return true;
    } catch (error) {
      logger.error('Error en update:', error);
      throw error;
    }
  }

  /**
   * Eliminar artista (solo si no tiene eventos)
   * @param {Number} id - ID del artista
   * @returns {Boolean} true si se eliminó
   */
  static async delete(id) {
    try {
      // Verificar que no tenga eventos
      const checkSql = 'SELECT COUNT(*) as total FROM event_artists WHERE artist_id = ?';
      const checkResult = await query(checkSql, [id]);
      
      if (checkResult[0].total > 0) {
        throw new Error('No se puede eliminar un artista con eventos asociados');
      }

      const sql = 'DELETE FROM artists WHERE id = ?';
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error('Error en delete:', error);
      throw error;
    }
  }

  /**
   * Desactivar artista
   * @param {Number} id - ID del artista
   * @returns {Boolean} true si se desactivó
   */
  static async deactivate(id) {
    try {
      const sql = 'UPDATE artists SET activo = false WHERE id = ?';
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error('Error en deactivate:', error);
      throw error;
    }
  }

  /**
 * Reactivar un artista (cambiar activo a true)
 * @param {Number} id - ID del artista
 * @returns {Object} Artista reactivado
 */
static async activate(id) {
  try {
    const sql = 'UPDATE artists SET activo = true WHERE id = ?';
    await query(sql, [id]);
    return this.findById(id);
  } catch (error) {
    logger.error('Error en Artist.activate:', error);
    throw error;
  }
}

  /**
   * Marcar/desmarcar como destacado
   * @param {Number} id - ID del artista
   * @param {Boolean} featured - true/false
   * @returns {Boolean} true si se actualizó
   */
  static async setFeatured(id, featured = true) {
    try {
      const featuredValue = featured ? 1 : 0;
      const sql = 'UPDATE artists SET destacado = ? WHERE id = ?';
      await query(sql, [featuredValue, id]);
      return true;
    } catch (error) {
      logger.error('Error en setFeatured:', error);
      throw error;
    }
  }

  /**
   * Obtener artistas activos (para selects)
   * @returns {Array} Lista de artistas activos
   */
  static async getActive() {
    try {
      const sql = `
        SELECT 
          a.*,
          COUNT(DISTINCT ea.id) as total_eventos
        FROM artists a
        LEFT JOIN event_artists ea ON a.id = ea.artist_id
        WHERE a.activo = true
        GROUP BY a.id
        ORDER BY a.nombre_artistico ASC
      `;
      return await query(sql);
    } catch (error) {
      logger.error('Error en getActive:', error);
      throw error;
    }
  }

  /**
   * Obtener artistas destacados
   * @param {Number} limit - Límite de resultados
   * @returns {Array} Lista de artistas destacados
   */
  static async getFeatured(limit = 10) {
    try {
      const limitNum = parseInt(limit, 10);
      const sql = `
        SELECT 
          a.*,
          COUNT(DISTINCT ea.id) as total_eventos
        FROM artists a
        LEFT JOIN event_artists ea ON a.id = ea.artist_id
        WHERE a.activo = true AND a.destacado = true
        GROUP BY a.id
        ORDER BY a.nombre_artistico ASC
        LIMIT ` + limitNum;
      
      return await query(sql);
    } catch (error) {
      logger.error('Error en getFeatured:', error);
      throw error;
    }
  }

  /**
   * Buscar artistas por nombre
   * @param {String} searchTerm - Término de búsqueda
   * @returns {Array} Artistas encontrados
   */
  static async search(searchTerm) {
    try {
      const sql = `
        SELECT a.*
        FROM artists a
        WHERE (a.nombre_artistico LIKE ? OR a.nombre_real LIKE ? OR a.generos LIKE ? OR a.sello LIKE ?)
          AND a.activo = true
        ORDER BY a.nombre_artistico ASC
        LIMIT 50
      `;
      
      const searchPattern = `%${searchTerm}%`;
      return await query(sql, [searchPattern, searchPattern, searchPattern, searchPattern]);
    } catch (error) {
      logger.error('Error en search:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos de un artista
   * @param {Number} id - ID del artista
   * @param {Boolean} soloProximos - Solo eventos futuros
   * @returns {Array} Eventos del artista
   */
  static async getEventos(id, soloProximos = false) {
    try {
      let dateCondition = '';
      if (soloProximos) {
        dateCondition = 'AND e.fecha_evento >= CURDATE()';
      }

      const sql = `
        SELECT 
          e.*,
          ea.es_headliner,
          ea.orden_aparicion,
          ea.hora_inicio,
          ea.hora_fin
        FROM events e
        INNER JOIN event_artists ea ON e.id = ea.event_id
        WHERE ea.artist_id = ? ${dateCondition}
        ORDER BY e.fecha_evento DESC
      `;
      
      return await query(sql, [id]);
    } catch (error) {
      logger.error('Error en getEventos:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un artista
   * @param {Number} id - ID del artista
   * @returns {Object} Estadísticas del artista
   */
  static async getStats(id) {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT ea.id) as total_eventos,
          COUNT(DISTINCT CASE WHEN e.fecha_evento >= CURDATE() THEN ea.id END) as eventos_proximos,
          COUNT(DISTINCT CASE WHEN e.fecha_evento < CURDATE() THEN ea.id END) as eventos_pasados,
          COUNT(DISTINCT CASE WHEN ea.es_headliner = true THEN ea.id END) as veces_headliner
        FROM event_artists ea
        LEFT JOIN events e ON ea.event_id = e.id
        WHERE ea.artist_id = ?
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error('Error en getStats:', error);
      throw error;
    }
  }
}

export default Artist;
import { query } from "../config/database.js";
import logger from '../config/logger.js';

// Tabla venues (salas)
class Venue {
  // Buscar sala por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          v.*,
          COUNT(DISTINCT e.id) as total_eventos,
          COUNT(DISTINCT CASE WHEN e.fecha_evento >= CURDATE() THEN e.id END) as eventos_proximos
        FROM venues v
        LEFT JOIN events e ON v.id = e.venue_id
        WHERE v.id = ?
        GROUP BY v.id
        LIMIT 1
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en findById:", error);
      throw error;
    }
  }

  /**
   * Listar salas con filtros y paginación
   * @returns {Object} { venues, total, page, pages }
   */
  static async list(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        activo = null,
        tipo_local = null,
        ciudad = null,
        orderBy = "nombre",
        orderDir = "ASC",
      } = options;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error("Page debe ser un número mayor a 0");
      }
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new Error("Limit debe ser un número entre 1 y 100");
      }

      const offset = (pageNum - 1) * limitNum;

      const conditions = [];
      const params = [];

      if (activo !== null && activo !== undefined) {
        conditions.push("v.activo = ?");
        const activoValue =
          activo === true || activo === "true" || activo === 1 || activo === "1"
            ? 1
            : 0;
        params.push(activoValue);
      }

      if (tipo_local) {
        conditions.push("v.tipo_local = ?");
        params.push(String(tipo_local));
      }

      if (ciudad) {
        conditions.push("v.ciudad LIKE ?");
        params.push(`%${String(ciudad)}%`);
      }

      const whereClause =
        conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

      // orderBy contra lista blanca (inyección SQL)
      const validOrderFields = [
        "nombre",
        "ciudad",
        "capacidad_maxima",
        "created_at",
        "id",
      ];
      const safeOrderBy = validOrderFields.includes(orderBy)
        ? orderBy
        : "nombre";
      const safeOrderDir =
        orderDir && orderDir.toUpperCase() === "DESC" ? "DESC" : "ASC";

      // LIMIT y OFFSET en el SQL (ya validados): con placeholders mysql2 falla

      const sql =
        "SELECT v.*, " +
        "COUNT(DISTINCT e.id) as total_eventos, " +
        "COUNT(DISTINCT CASE WHEN e.fecha_evento >= CURDATE() THEN e.id END) as eventos_proximos " +
        "FROM venues v " +
        "LEFT JOIN events e ON v.id = e.venue_id " +
        whereClause +
        " " +
        "GROUP BY v.id " +
        "ORDER BY v." +
        safeOrderBy +
        " " +
        safeOrderDir +
        " " +
        "LIMIT " +
        limitNum +
        " OFFSET " +
        offset;

      const venues = await query(sql, params);

      const countSql = "SELECT COUNT(*) as total FROM venues v " + whereClause;
      const countResult = await query(countSql, params);
      const total = countResult[0].total;

      return {
        venues,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      };
    } catch (error) {
      logger.error("Error en list:", error);
      throw error;
    }
  }

  // Crear sala
  static async create(venueData) {
    try {
      const {
        nombre,
        direccion,
        ciudad,
        codigo_postal = null,
        pais = "España",
        latitud = null,
        longitud = null,
        capacidad_maxima = 300,
        descripcion = null,
        imagen_url = null,
        website = null,
        telefono = null,
        email = null,
        tipo_local = "club",
        accesibilidad = null,
        transporte_publico = null,
        parking = false,
        activo = true,
      } = venueData;

      const sql = `
        INSERT INTO venues (
          nombre, direccion, ciudad, codigo_postal, pais,
          latitud, longitud, capacidad_maxima, descripcion,
          imagen_url, website, telefono, email, tipo_local,
          accesibilidad, transporte_publico, parking, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        nombre,
        direccion,
        ciudad,
        codigo_postal,
        pais,
        latitud,
        longitud,
        capacidad_maxima,
        descripcion,
        imagen_url,
        website,
        telefono,
        email,
        tipo_local,
        accesibilidad,
        transporte_publico,
        parking,
        activo,
      ];

      const result = await query(sql, values);
      return await this.findById(result.insertId);
    } catch (error) {
      logger.error("Error en create:", error);
      throw error;
    }
  }

  // Editar sala
  static async update(id, updateData) {
    try {
      const allowedFields = [
        "nombre",
        "direccion",
        "ciudad",
        "codigo_postal",
        "pais",
        "latitud",
        "longitud",
        "capacidad_maxima",
        "descripcion",
        "imagen_url",
        "website",
        "telefono",
        "email",
        "tipo_local",
        "accesibilidad",
        "transporte_publico",
        "parking",
        "activo",
      ];

      const updates = {};
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No hay campos válidos para actualizar");
      }

      const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates);
      values.push(id);

      const sql = `UPDATE venues SET ${fields} WHERE id = ?`;
      await query(sql, values);
      return true;
    } catch (error) {
      logger.error("Error en update:", error);
      throw error;
    }
  }

  // Borrar sala; no se puede si tiene eventos
  static async delete(id) {
    try {
      const checkSql =
        "SELECT COUNT(*) as total FROM events WHERE venue_id = ?";
      const checkResult = await query(checkSql, [id]);

      if (checkResult[0].total > 0) {
        throw new Error("No se puede eliminar un venue con eventos asociados");
      }

      const sql = "DELETE FROM venues WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en delete:", error);
      throw error;
    }
  }

  // Desactivar sala
  static async deactivate(id) {
    try {
      const sql = "UPDATE venues SET activo = false WHERE id = ?";
      await query(sql, [id]);
      return true;
    } catch (error) {
      logger.error("Error en deactivate:", error);
      throw error;
    }
  }

  // Reactivar sala
static async activate(id) {
  try {
    const sql = 'UPDATE venues SET activo = true WHERE id = ?';
    await query(sql, [id]);
    return this.findById(id);
  } catch (error) {
    logger.error('Error en Venue.activate:', error);
    throw error;
  }
}

  // Salas activas
  static async getActive() {
    try {
      const sql = `
        SELECT 
          v.*,
          COUNT(DISTINCT e.id) as total_eventos
        FROM venues v
        LEFT JOIN events e ON v.id = e.venue_id
        WHERE v.activo = true
        GROUP BY v.id
        ORDER BY v.nombre ASC
      `;
      return await query(sql);
    } catch (error) {
      logger.error("Error en getActive:", error);
      throw error;
    }
  }

  // Salas de una ciudad
  static async findByCiudad(ciudad) {
    try {
      const sql = `
        SELECT v.*
        FROM venues v
        WHERE v.ciudad LIKE ? AND v.activo = true
        ORDER BY v.nombre ASC
      `;
      return await query(sql, [`%${ciudad}%`]);
    } catch (error) {
      logger.error("Error en findByCiudad:", error);
      throw error;
    }
  }

  // Estadísticas de una sala
  static async getStats(id) {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT e.id) as total_eventos,
          COUNT(DISTINCT CASE WHEN e.fecha_evento >= CURDATE() THEN e.id END) as eventos_proximos,
          COUNT(DISTINCT CASE WHEN e.fecha_evento < CURDATE() THEN e.id END) as eventos_pasados,
          COUNT(DISTINCT b.id) as total_reservas,
          SUM(CASE WHEN b.estado = 'confirmada' THEN 1 ELSE 0 END) as reservas_confirmadas
        FROM venues v
        LEFT JOIN events e ON v.id = e.venue_id
        LEFT JOIN bookings b ON e.id = b.event_id
        WHERE v.id = ?
        GROUP BY v.id
      `;
      const results = await query(sql, [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error("Error en getStats:", error);
      throw error;
    }
  }
}

export default Venue;

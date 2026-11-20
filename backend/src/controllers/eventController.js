import { pool } from '../config/database.js';
import { registrarActividad, getIpFromRequest } from '../utils/activityLogger.js';
import EventTicketTier from '../models/EventTicketTier.js';
import logger from '../config/logger.js';

// Las tandas llegan del FormData como JSON en texto. Si faltan o no se pueden
// leer, el evento se guarda sin tandas en vez de fallar.
const parseTandas = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    logger.warn('No se pudieron parsear las tandas recibidas, se ignoran:', { error: err.message });
    return [];
  }
};

// Estados de un evento: draft, scheduled (publicado), active (en curso),
// completed y cancelled.

/**
 * @desc    Crear evento
 * @route   POST /api/admin/events
 * @access  Admin
 */
export const createEvent = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      logger.error('req.body is undefined');
      return res.status(400).json({
        success: false,
        message: 'Error: Form data not received'
      });
    }

    const {
      titulo,
      descripcion,
      fecha_evento,
      hora_evento,
      hora_fin,
      ubicacion,
      aforo_maximo,
      precio_socio,
      precio_invitado,
      permite_invitados
    } = req.body;

    if (!titulo || !descripcion || !fecha_evento || !hora_evento || !hora_fin || !ubicacion || !aforo_maximo) {
      logger.error('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const imagen_cartel_url = req.file ? `/uploads/events/${req.file.filename}` : null;

    const [result] = await pool.execute(
      `INSERT INTO events (
        titulo, descripcion, fecha_evento, hora_evento, hora_fin,
        ubicacion, aforo_maximo, precio_socio, precio_invitado, 
        imagen_cartel_url, permite_invitados, estado, destacado, 
        entradas_disponibles, entradas_reservadas, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?, 0, ?)`,
      [
        titulo,
        descripcion,
        fecha_evento,
        hora_evento,
        hora_fin || null,
        ubicacion,
        parseInt(aforo_maximo),
        precio_socio ? parseFloat(precio_socio) : 0,
        precio_invitado ? parseFloat(precio_invitado) : 0,
        imagen_cartel_url,
        permite_invitados === 'true' || permite_invitados === true ? 1 : 0,
        parseInt(aforo_maximo),
        req.user.id
      ]
    );

    logger.info('Evento creado', { eventId: result.insertId });

    // Sin tandas en el formulario, syncForEvent no crea ninguna
    const tandas = parseTandas(req.body.tandas);
    if (tandas.length > 0) {
      await EventTicketTier.syncForEvent(result.insertId, tandas);
      logger.debug('Tandas guardadas', { total: tandas.length });
    }

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'crear',
      entidadTipo: 'evento',
      entidadId: result.insertId,
      descripcion: `Evento "${titulo}" creado`,
      ipAddress: getIpFromRequest(req),
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: result.insertId,
        titulo,
        imagen_cartel_url
      }
    });
  } catch (error) {
    logger.error('Error in createEvent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating event'
    });
  }
};

/**
 * @desc    Editar evento
 * @route   PUT /api/admin/events/:id
 * @access  Admin
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Error: Data not received'
      });
    }

    const {
      titulo, descripcion, fecha_evento, hora_evento, hora_fin,
      ubicacion, aforo_maximo, precio_socio, precio_invitado, permite_invitados
    } = req.body;

    const [events] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const imagen_cartel_url = req.file 
      ? `/uploads/events/${req.file.filename}` 
      : events[0].imagen_cartel_url;

    // Ocupadas desde las reservas reales, no desde los contadores guardados,
    // para no arrastrar descuadres. Las invitaciones no ocupan aforo público
    // pero sí cuentan en entradas_reservadas.
    const [ocupacion] = await pool.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN es_invitacion = 0 THEN numero_entradas END), 0) AS ocupadas,
         COALESCE(SUM(numero_entradas), 0) AS reservadas
       FROM bookings
       WHERE event_id = ? AND estado IN ('confirmada', 'asistida')`,
      [id],
    );
    const entradasOcupadas = parseInt(ocupacion[0].ocupadas) || 0;
    const entradasReservadas = parseInt(ocupacion[0].reservadas) || 0;
    const nuevas_entradas_disponibles = Math.max(parseInt(aforo_maximo) - entradasOcupadas, 0);

    await pool.execute(
      `UPDATE events SET 
        titulo = ?, descripcion = ?, fecha_evento = ?, hora_evento = ?, hora_fin = ?,
        ubicacion = ?, aforo_maximo = ?, entradas_disponibles = ?, entradas_reservadas = ?,
        precio_socio = ?, precio_invitado = ?, imagen_cartel_url = ?,
        permite_invitados = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        titulo, descripcion, fecha_evento, hora_evento, hora_fin || null,
        ubicacion, parseInt(aforo_maximo), nuevas_entradas_disponibles, entradasReservadas,
        precio_socio ? parseFloat(precio_socio) : 0,
        precio_invitado ? parseFloat(precio_invitado) : 0,
        imagen_cartel_url,
        permite_invitados === 'true' || permite_invitados === true ? 1 : 0,
        id
      ]
    );

    logger.info('Evento actualizado', { eventId: id });

    // Las tandas guardadas nunca se borran; solo se actualizan o se añaden
    if (req.body.tandas !== undefined) {
      const tandas = parseTandas(req.body.tandas);
      await EventTicketTier.syncForEvent(id, tandas);
      logger.debug('Tandas actualizadas', { total: tandas.length });
    }

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'editar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Evento "${titulo}" editado`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { id, titulo, imagen_cartel_url }
    });
  } catch (error) {
    logger.error('Error in updateEvent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Listar eventos (admin)
 * @route   GET /api/admin/events
 * @access  Admin
 */
export const getAllEventsAdmin = async (req, res) => {
  try {
    const { page = '1', limit = '10', search = '', estado, destacado } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const validPage = (!isNaN(parsedPage) && parsedPage > 0) ? parsedPage : 1;
    const validLimit = (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) ? parsedLimit : 10;
    const offset = (validPage - 1) * validLimit;

    let query = `
      SELECT 
        e.*,
        COUNT(DISTINCT b.id) as bookings_count,
        SUM(CASE WHEN b.estado IN ('confirmada','asistida') THEN b.numero_entradas ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.estado = 'asistida' THEN b.numero_entradas ELSE 0 END) as entradas_asistidas
      FROM events e 
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) { 
      query += ` AND (e.titulo LIKE ? OR e.ubicacion LIKE ?)`; 
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm); 
    }
    if (estado) { 
      query += ` AND e.estado = ?`; 
      params.push(estado); 
    }
    if (destacado !== undefined) { 
      query += ` AND e.destacado = ?`; 
      params.push(destacado === 'true' ? 1 : 0); 
    }

    // LIMIT y OFFSET van en el SQL, no como placeholders: mysql2 da errno 1210
    query += ` GROUP BY e.id ORDER BY e.created_at DESC LIMIT ${validLimit} OFFSET ${offset}`;

    const [events] = params.length > 0
      ? await pool.execute(query, params)
      : await pool.query(query);

    let countQuery = 'SELECT COUNT(DISTINCT e.id) as total FROM events e WHERE 1=1';
    const countParams = [];
    
    if (search && search.trim()) { 
      countQuery += ` AND (e.titulo LIKE ? OR e.ubicacion LIKE ?)`; 
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm); 
    }
    if (estado) { 
      countQuery += ` AND e.estado = ?`; 
      countParams.push(estado); 
    }
    if (destacado !== undefined) { 
      countQuery += ` AND e.destacado = ?`; 
      countParams.push(destacado === 'true' ? 1 : 0); 
    }

    const [countResult] = countParams.length > 0
      ? await pool.execute(countQuery, countParams)
      : await pool.query(countQuery);
      
    const total = countResult[0].total;

    res.json({
      success: true,
      data: events,
      pagination: { 
        page: validPage, 
        limit: validLimit, 
        total, 
        totalPages: Math.ceil(total / validLimit) 
      }
    });
  } catch (error) {
    logger.error('Error in getAllEventsAdmin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching events',
      error: error.message 
    });
  }
};

/**
 * @desc    Borrar evento
 * @route   DELETE /api/admin/events/:id
 * @access  Admin
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Con cualquier reserva no se borra: la FK borraría en cascada las
    // reservas y su rastro con los pagos. Para eso están cancelar u ocultar.
    const [bookings] = await pool.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE event_id = ?',
      [id]
    );

    if (bookings[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un evento con reservas. Puedes cancelarlo u ocultarlo.'
      });
    }

    const [eventRows] = await pool.execute('SELECT titulo FROM events WHERE id = ?', [id]);
    const eventTitle = eventRows[0]?.titulo || `#${id}`;

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    
    logger.info('Evento eliminado', { eventId: id });

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'eliminar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Evento "${eventTitle}" eliminado`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteEvent:', error);
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
};

/**
 * @desc    Detalle de un evento
 * @route   GET /api/admin/events/:id
 * @access  Admin
 */
export const getEventDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await pool.execute(
      `SELECT 
        e.*, 
        COUNT(DISTINCT b.id) as bookings_count, 
        SUM(CASE WHEN b.estado IN ('confirmada','asistida') THEN b.numero_entradas ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN b.estado = 'asistida' THEN b.numero_entradas ELSE 0 END) as entradas_asistidas
       FROM events e 
       LEFT JOIN bookings b ON e.id = b.event_id 
       WHERE e.id = ? 
       GROUP BY e.id`, 
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const tandas = await EventTicketTier.getByEvent(id);

    res.json({ success: true, data: { ...events[0], tandas } });
  } catch (error) {
    logger.error('Error in getEventDetails:', error);
    res.status(500).json({ success: false, message: 'Error fetching event details' });
  }
};

/**
 * @desc    Forzar una tanda como vigente, sin mirar su fecha de inicio
 * @route   PATCH /api/admin/events/:id/tandas/:tierId/activar
 * @access  Admin
 */
export const activateTanda = async (req, res) => {
  try {
    const { id, tierId } = req.params;
    const tandas = await EventTicketTier.activateManually(id, tierId);

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'actualizar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Tanda #${tierId} activada manualmente en evento #${id}`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ success: true, message: 'Tramo activado', data: tandas });
  } catch (error) {
    logger.error('Error in activateTanda:', error);
    res.status(500).json({ success: false, message: error.message || 'Error activando el tramo' });
  }
};

/**
 * @desc    Quitar el forzado: las tandas vuelven a ir por fecha
 * @route   PATCH /api/admin/events/:id/tandas/desactivar
 * @access  Admin
 */
export const deactivateTanda = async (req, res) => {
  try {
    const { id } = req.params;
    const tandas = await EventTicketTier.deactivateManual(id);

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'actualizar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Forzado manual de tanda desactivado en evento #${id}`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ success: true, message: 'Modo automático restaurado', data: tandas });
  } catch (error) {
    logger.error('Error in deactivateTanda:', error);
    res.status(500).json({ success: false, message: 'Error desactivando el forzado manual' });
  }
};

/**
 * @desc    Publicar evento
 * @route   PATCH /api/admin/events/:id/publish
 * @access  Admin
 */
export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE events SET estado = "scheduled", visible_desde = NOW(), updated_at = NOW() WHERE id = ?', 
      [id]
    );
    
    logger.info('Evento publicado', { eventId: id });

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'actualizar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Evento #${id} publicado`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ success: true, message: 'Event published successfully' });
  } catch (error) {
    logger.error('Error in publishEvent:', error);
    res.status(500).json({ success: false, message: 'Error publishing event' });
  }
};

/**
 * @desc    Despublicar evento
 * @route   PATCH /api/admin/events/:id/unpublish
 * @access  Admin
 */
export const unpublishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE events SET estado = "draft", visible_desde = NULL, updated_at = NOW() WHERE id = ?', 
      [id]
    );
    
    logger.info('Evento despublicado', { eventId: id });

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'actualizar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Evento #${id} despublicado`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ success: true, message: 'Event unpublished successfully' });
  } catch (error) {
    logger.error('Error in unpublishEvent:', error);
    res.status(500).json({ success: false, message: 'Error unpublishing event' });
  }
};

/**
 * @desc    Publicar o despublicar
 * @route   PATCH /api/admin/events/:id/toggle-publish
 * @access  Admin
 */
export const togglePublishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await pool.execute('SELECT estado, visible_desde FROM events WHERE id = ?', [id]);
    
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Publicado = tiene visible_desde (mismo criterio que AdminEvents.jsx)
    const isPublished = events[0].visible_desde !== null;
    const newStatus = isPublished ? 'draft' : 'scheduled';
    
    await pool.execute(
      'UPDATE events SET estado = ?, visible_desde = ?, updated_at = NOW() WHERE id = ?', 
      [newStatus, isPublished ? null : new Date(), id]
    );
    
    logger.info(`Evento ${isPublished ? 'despublicado' : 'publicado'}`, { eventId: id });

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'actualizar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Evento #${id} ${isPublished ? 'despublicado' : 'publicado'}`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ 
      success: true, 
      message: isPublished ? 'Event unpublished' : 'Event published',
      isPublished: !isPublished
    });
  } catch (error) {
    logger.error('Error in togglePublishEvent:', error);
    res.status(500).json({ success: false, message: 'Error toggling publish status' });
  }
};

/**
 * @desc    Cancelar evento
 * @route   PATCH /api/admin/events/:id/cancel
 * @access  Admin
 */
export const cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    await pool.execute(
      'UPDATE events SET estado = "cancelled", motivo_cancelacion = ?, updated_at = NOW() WHERE id = ?', 
      [motivo || 'Cancelled by administration', id]
    );
    
    // También se cancelan sus reservas confirmadas
    await pool.execute(
      'UPDATE bookings SET estado = "cancelada", motivo_cancelacion = ? WHERE event_id = ? AND estado = "confirmada"', 
      [motivo || 'Event cancelled', id]
    );
    
    logger.info('Evento cancelado', { eventId: id });

    registrarActividad({
      userId: req.user?.id || null,
      accion: 'cancelar',
      entidadTipo: 'evento',
      entidadId: Number(id),
      descripcion: `Evento #${id} cancelado${motivo ? `: ${motivo}` : ''}`,
      ipAddress: getIpFromRequest(req),
    });

    res.json({ success: true, message: 'Event cancelled successfully' });
  } catch (error) {
    logger.error('Error in cancelEvent:', error);
    res.status(500).json({ success: false, message: 'Error cancelling event' });
  }
};

/**
 * @desc    Destacar evento
 * @route   PATCH /api/admin/events/:id/feature
 * @access  Admin
 */
export const featureEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('UPDATE events SET destacado = 1, updated_at = NOW() WHERE id = ?', [id]);
    
    logger.info('Evento destacado', { eventId: id });
    
    res.json({ success: true, message: 'Event featured successfully' });
  } catch (error) {
    logger.error('Error in featureEvent:', error);
    res.status(500).json({ success: false, message: 'Error featuring event' });
  }
};

/**
 * @desc    Quitar destacado
 * @route   PATCH /api/admin/events/:id/unfeature
 * @access  Admin
 */
export const unfeatureEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('UPDATE events SET destacado = 0, updated_at = NOW() WHERE id = ?', [id]);
    
    logger.info('Evento sin destacar', { eventId: id });
    
    res.json({ success: true, message: 'Event unfeatured successfully' });
  } catch (error) {
    logger.error('Error in unfeatureEvent:', error);
    res.status(500).json({ success: false, message: 'Error unfeaturing event' });
  }
};

/**
 * @desc    Destacar o quitar destacado
 * @route   PATCH /api/admin/events/:id/toggle-feature
 * @access  Admin
 */
export const toggleFeatureEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await pool.execute('SELECT destacado FROM events WHERE id = ?', [id]);
    
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const newState = events[0].destacado === 1 ? 0 : 1;
    
    await pool.execute(
      'UPDATE events SET destacado = ?, updated_at = NOW() WHERE id = ?', 
      [newState, id]
    );
    
    logger.info(`Evento ${newState === 1 ? 'destacado' : 'sin destacar'}`, { eventId: id });
    
    res.json({ 
      success: true, 
      message: newState === 1 ? 'Event featured' : 'Event unfeatured',
      isFeatured: newState === 1
    });
  } catch (error) {
    logger.error('Error in toggleFeatureEvent:', error);
    res.status(500).json({ success: false, message: 'Error toggling featured status' });
  }
};

/**
 * @desc    Estadísticas de eventos
 * @route   GET /api/admin/events/stats
 * @access  Admin
 */
export const getEventsStats = async (req, res) => {
  try {

    const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM events');
    
    const [statusResult] = await pool.execute('SELECT estado as status, COUNT(*) as count FROM events GROUP BY estado');
    
    const [publishedResult] = await pool.execute('SELECT COUNT(*) as count FROM events WHERE visible_desde IS NOT NULL');
    
    const [upcomingResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM events 
       WHERE fecha_evento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
       AND estado = 'scheduled'`
    );
    
    const [topEvents] = await pool.execute(
      `SELECT 
        e.id, 
        e.titulo as title, 
        e.fecha_evento as event_date, 
        COUNT(DISTINCT b.id) as bookings_count 
       FROM events e 
       LEFT JOIN bookings b ON e.id = b.event_id AND b.estado = 'confirmada' 
       GROUP BY e.id 
       ORDER BY bookings_count DESC 
       LIMIT 5`
    );

    const stats = {
      total: totalResult[0].total,
      by_status: statusResult,
      published: publishedResult[0].count,
      upcoming: upcomingResult[0].count,
      top_events: topEvents
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getEventsStats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
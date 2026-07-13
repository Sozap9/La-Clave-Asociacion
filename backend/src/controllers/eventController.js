import { pool } from '../config/database.js';
import { registrarActividad, getIpFromRequest } from '../utils/activityLogger.js';

/**
 * VALID STATUS VALUES:
 * - 'draft': Draft (not published)
 * - 'scheduled': Scheduled/Published
 * - 'active': Currently happening
 * - 'completed': Finished
 * - 'cancelled': Cancelled
 */

/**
 * @desc    Create new event
 * @route   POST /api/admin/events
 * @access  Admin
 */
export const createEvent = async (req, res) => {
  try {
    console.log('📥 ========== CREATING EVENT ==========');
    console.log('🔍 req.body:', req.body);
    console.log('🔍 req.file:', req.file);

    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ req.body is undefined');
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
      ubicacion,
      aforo_maximo,
      precio_socio,
      precio_invitado,
      permite_invitados
    } = req.body;

    if (!titulo || !descripcion || !fecha_evento || !hora_evento || !ubicacion || !aforo_maximo) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const imagen_cartel_url = req.file ? `/uploads/events/${req.file.filename}` : null;

    const [result] = await pool.execute(
      `INSERT INTO events (
        titulo, descripcion, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, precio_socio, precio_invitado, 
        imagen_cartel_url, permite_invitados, estado, destacado, 
        entradas_disponibles, entradas_reservadas, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?, 0, ?)`,
      [
        titulo,
        descripcion,
        fecha_evento,
        hora_evento,
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

    console.log('✅ Event created with ID:', result.insertId);
    console.log('========================================');

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
    console.error('❌ Error in createEvent:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating event'
    });
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/admin/events/:id
 * @access  Admin
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating event:', id);

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Error: Data not received'
      });
    }

    const {
      titulo, descripcion, fecha_evento, hora_evento,
      ubicacion, aforo_maximo, precio_socio, precio_invitado, permite_invitados
    } = req.body;

    const [events] = await pool.execute('SELECT * FROM events WHERE id = ?', [id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const imagen_cartel_url = req.file 
      ? `/uploads/events/${req.file.filename}` 
      : events[0].imagen_cartel_url;

    // Calculamos cuántas entradas están realmente ocupadas a partir de
    // entradas_disponibles (que sí se mantiene bien sincronizado en todo
    // el flujo de reservas), en vez de la columna entradas_reservadas
    // que históricamente no se incrementaba nunca y podía estar mal.
    const aforoAnterior = events[0].aforo_maximo || 0;
    const disponiblesAnterior = events[0].entradas_disponibles ?? aforoAnterior;
    const entradasOcupadas = Math.max(aforoAnterior - disponiblesAnterior, 0);
    const nuevas_entradas_disponibles = Math.max(parseInt(aforo_maximo) - entradasOcupadas, 0);

    await pool.execute(
      `UPDATE events SET 
        titulo = ?, descripcion = ?, fecha_evento = ?, hora_evento = ?,
        ubicacion = ?, aforo_maximo = ?, entradas_disponibles = ?, entradas_reservadas = ?,
        precio_socio = ?, precio_invitado = ?, imagen_cartel_url = ?,
        permite_invitados = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        titulo, descripcion, fecha_evento, hora_evento,
        ubicacion, parseInt(aforo_maximo), nuevas_entradas_disponibles, entradasOcupadas,
        precio_socio ? parseFloat(precio_socio) : 0,
        precio_invitado ? parseFloat(precio_invitado) : 0,
        imagen_cartel_url,
        permite_invitados === 'true' || permite_invitados === true ? 1 : 0,
        id
      ]
    );

    console.log('✅ Event updated:', id);

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
    console.error('❌ Error in updateEvent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all events (admin)
 * @route   GET /api/admin/events
 * @access  Admin
 * 
 * ✅ CORREGIDO: No usa placeholders para LIMIT/OFFSET (evita errno 1210)
 */
export const getAllEventsAdmin = async (req, res) => {
  try {
    const { page = '1', limit = '10', search = '', estado, destacado } = req.query;

    // Validate and parse pagination parameters
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const validPage = (!isNaN(parsedPage) && parsedPage > 0) ? parsedPage : 1;
    const validLimit = (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) ? parsedLimit : 10;
    const offset = (validPage - 1) * validLimit;

    console.log('📥 getAllEventsAdmin - Params:', { page: validPage, limit: validLimit, search, estado, destacado });

    let query = `
      SELECT 
        e.*,
        COUNT(DISTINCT b.id) as bookings_count,
        SUM(CASE WHEN b.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmed_bookings
      FROM events e 
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE 1=1
    `;
    const params = [];

    // Filters with proper validation
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

    // ✅ CRITICAL FIX: Insert LIMIT and OFFSET directly (NOT as placeholders)
    query += ` GROUP BY e.id ORDER BY e.created_at DESC LIMIT ${validLimit} OFFSET ${offset}`;

    console.log('🔍 SQL Query:', query);
    console.log('🔍 Params:', params);
    console.log('🔍 LIMIT:', validLimit, 'OFFSET:', offset);

    // Execute query - usar pool.execute si hay params, pool.query si no
    const [events] = params.length > 0
      ? await pool.execute(query, params)
      : await pool.query(query);

    // Count total events
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

    console.log('✅ Admin events fetched:', events.length, '/ Total:', total);

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
    console.error('❌ Error in getAllEventsAdmin:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching events',
      error: error.message 
    });
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/admin/events/:id
 * @access  Admin
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check for confirmed bookings
    const [bookings] = await pool.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE event_id = ? AND estado = "confirmada"', 
      [id]
    );
    
    if (bookings[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete event with confirmed bookings' 
      });
    }

    const [eventRows] = await pool.execute('SELECT titulo FROM events WHERE id = ?', [id]);
    const eventTitle = eventRows[0]?.titulo || `#${id}`;

    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    
    console.log('✅ Event deleted:', id);

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
    console.error('❌ Error in deleteEvent:', error);
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
};

/**
 * @desc    Get event details
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
        SUM(CASE WHEN b.estado = 'confirmada' THEN 1 ELSE 0 END) as confirmed_bookings
       FROM events e 
       LEFT JOIN bookings b ON e.id = b.event_id 
       WHERE e.id = ? 
       GROUP BY e.id`, 
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    console.log('✅ Event details fetched:', events[0].titulo);
    
    res.json({ success: true, data: events[0] });
  } catch (error) {
    console.error('❌ Error in getEventDetails:', error);
    res.status(500).json({ success: false, message: 'Error fetching event details' });
  }
};

/**
 * @desc    Publish event
 * @route   PATCH /api/admin/events/:id/publish
 * @access  Admin
 */
export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE events SET estado = "scheduled", updated_at = NOW() WHERE id = ?', 
      [id]
    );
    
    console.log('✅ Event published:', id);

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
    console.error('❌ Error in publishEvent:', error);
    res.status(500).json({ success: false, message: 'Error publishing event' });
  }
};

/**
 * @desc    Unpublish event
 * @route   PATCH /api/admin/events/:id/unpublish
 * @access  Admin
 */
export const unpublishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE events SET estado = "draft", updated_at = NOW() WHERE id = ?', 
      [id]
    );
    
    console.log('✅ Event unpublished:', id);

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
    console.error('❌ Error in unpublishEvent:', error);
    res.status(500).json({ success: false, message: 'Error unpublishing event' });
  }
};

/**
 * @desc    Toggle publish status
 * @route   PATCH /api/admin/events/:id/toggle-publish
 * @access  Admin
 */
export const togglePublishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await pool.execute('SELECT estado FROM events WHERE id = ?', [id]);
    
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const isPublished = events[0].estado === 'scheduled';
    const newStatus = isPublished ? 'draft' : 'scheduled';
    
    await pool.execute(
      'UPDATE events SET estado = ?, updated_at = NOW() WHERE id = ?', 
      [newStatus, id]
    );
    
    console.log(`✅ Event ${isPublished ? 'unpublished' : 'published'}:`, id);

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
    console.error('❌ Error in togglePublishEvent:', error);
    res.status(500).json({ success: false, message: 'Error toggling publish status' });
  }
};

/**
 * @desc    Cancel event
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
    
    // Cancel all confirmed bookings
    await pool.execute(
      'UPDATE bookings SET estado = "cancelada", motivo_cancelacion = ? WHERE event_id = ? AND estado = "confirmada"', 
      [motivo || 'Event cancelled', id]
    );
    
    console.log('✅ Event cancelled:', id);

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
    console.error('❌ Error in cancelEvent:', error);
    res.status(500).json({ success: false, message: 'Error cancelling event' });
  }
};

/**
 * @desc    Feature event
 * @route   PATCH /api/admin/events/:id/feature
 * @access  Admin
 */
export const featureEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('UPDATE events SET destacado = 1, updated_at = NOW() WHERE id = ?', [id]);
    
    console.log('✅ Event featured:', id);
    
    res.json({ success: true, message: 'Event featured successfully' });
  } catch (error) {
    console.error('❌ Error in featureEvent:', error);
    res.status(500).json({ success: false, message: 'Error featuring event' });
  }
};

/**
 * @desc    Unfeature event
 * @route   PATCH /api/admin/events/:id/unfeature
 * @access  Admin
 */
export const unfeatureEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('UPDATE events SET destacado = 0, updated_at = NOW() WHERE id = ?', [id]);
    
    console.log('✅ Event unfeatured:', id);
    
    res.json({ success: true, message: 'Event unfeatured successfully' });
  } catch (error) {
    console.error('❌ Error in unfeatureEvent:', error);
    res.status(500).json({ success: false, message: 'Error unfeaturing event' });
  }
};

/**
 * @desc    Toggle featured status
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
    
    console.log(`✅ Event ${newState === 1 ? 'featured' : 'unfeatured'}:`, id);
    
    res.json({ 
      success: true, 
      message: newState === 1 ? 'Event featured' : 'Event unfeatured',
      isFeatured: newState === 1
    });
  } catch (error) {
    console.error('❌ Error in toggleFeatureEvent:', error);
    res.status(500).json({ success: false, message: 'Error toggling featured status' });
  }
};

/**
 * @desc    Get events statistics
 * @route   GET /api/admin/events/stats
 * @access  Admin
 */
export const getEventsStats = async (req, res) => {
  try {
    console.log('📊 Fetching events statistics...');

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

    console.log('✅ Statistics fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error in getEventsStats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Compatibility aliases
export const getEventById = getEventDetails;
export const getEvents = getAllEventsAdmin;
export const removeEvent = deleteEvent;
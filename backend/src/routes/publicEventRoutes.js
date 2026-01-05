import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

/**
 * @desc    Get all public events
 * @route   GET /api/events
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    let { status = 'upcoming', search = '', limit = '20', featured } = req.query;

    console.log('📥 GET /api/events - Public route');
    console.log('   Params:', { status, search, limit, featured });

    // Normalize status (accept both Spanish and English)
    const statusMap = {
      'proximo': 'upcoming',
      'proximos': 'upcoming',
      'pasado': 'past',
      'pasados': 'past'
    };
    status = statusMap[status] || status;

    // Validate limit
    const parsedLimit = parseInt(limit, 10);
    const validLimit = (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) ? parsedLimit : 20;

    // Base query
    let query = `
      SELECT 
        id, titulo, descripcion, descripcion_corta, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, entradas_disponibles, imagen_cartel_url,
        precio_socio, precio_invitado, permite_invitados, destacado,
        artistas, tags, edad_minima
      FROM events
      WHERE visible_desde IS NOT NULL
        AND visible_desde <= NOW()
        AND estado = 'scheduled'
    `;
    const params = [];

    // Filter by featured
    if (featured === 'true') {
      query += ` AND destacado = 1`;
    }

    // Filter by status
    if (status === 'upcoming') {
      query += ` AND fecha_evento >= CURDATE()`;
    } else if (status === 'past') {
      query += ` AND fecha_evento < CURDATE()`;
    }

    // Search filter
    if (search && search.trim()) {
      query += ` AND (titulo LIKE ? OR ubicacion LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    // Order and limit
    query += ` ORDER BY fecha_evento DESC, hora_evento DESC LIMIT ${validLimit}`;

    console.log('🔍 SQL Query:', query);
    console.log('🔍 Params:', params);
    console.log('🔍 Limit:', validLimit);

    // Execute query
    const [events] = params.length > 0
      ? await pool.execute(query, params)
      : await pool.query(query);

    console.log('✅ Events found:', events.length);

    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('❌ Error in GET /api/events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

/**
 * @desc    Get featured events
 * @route   GET /api/events/featured
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    console.log('📥 GET /api/events/featured - Public route');

    const query = `
      SELECT 
        id, titulo, descripcion, descripcion_corta, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, entradas_disponibles, imagen_cartel_url,
        precio_socio, precio_invitado, permite_invitados, destacado,
        artistas, tags, edad_minima
      FROM events
      WHERE visible_desde IS NOT NULL
        AND visible_desde <= NOW()
        AND estado = 'scheduled'
        AND destacado = 1
        AND fecha_evento >= CURDATE()
      ORDER BY fecha_evento ASC, hora_evento ASC
      LIMIT 6
    `;

    console.log('🔍 SQL Query:', query);

    const [events] = await pool.query(query);

    console.log('✅ Featured events found:', events.length);

    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('❌ Error in GET /api/events/featured:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured events',
      error: error.message
    });
  }
});

/**
 * @desc    Get event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📥 GET /api/events/:id - Public route');
    console.log('   Event ID:', id);

    // Validate ID
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const query = `
      SELECT 
        id, titulo, descripcion, descripcion_corta, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, entradas_disponibles, imagen_cartel_url,
        precio_socio, precio_invitado, permite_invitados, destacado,
        artistas, tags, edad_minima
      FROM events
      WHERE id = ?
        AND visible_desde IS NOT NULL
        AND visible_desde <= NOW()
        AND estado = 'scheduled'
    `;

    const [events] = await pool.execute(query, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.log('✅ Event found:', events[0].titulo);

    res.json({
      success: true,
      data: events[0]
    });
  } catch (error) {
    console.error('❌ Error in GET /api/events/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

export default router;

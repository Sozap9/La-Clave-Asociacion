import express from 'express';
import { pool } from '../config/database.js';
import EventTicketTier from '../models/EventTicketTier.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * Sustituye precio_socio/precio_invitado por el precio de la tanda
 * vigente en cada evento, SIN exponer nada de tandas al público — de
 * cara al frontend público sigue siendo "un precio" normal, igual que
 * antes de que existieran las tandas.
 */
const applyActivePricing = async (events) => {
  return Promise.all(
    events.map(async (event) => {
      const { precio } = await EventTicketTier.resolveActivePrice(event.id, event.precio_socio);
      return { ...event, precio_socio: precio, precio_invitado: precio };
    }),
  );
};

/**
 * @desc    Get all public events
 * @route   GET /api/events
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    let { status = 'upcoming', search = '', limit = '20', featured } = req.query;

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

    // Base query — solo columnas que existen realmente en la tabla `events`.
    // Un evento es público cuando su estado es 'scheduled' (publicado).
    let query = `
      SELECT 
        id, titulo, descripcion, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, entradas_disponibles, imagen_cartel_url,
        precio_socio, precio_invitado, permite_invitados, destacado
      FROM events
      WHERE estado = 'scheduled'
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

    // Execute query
    const [events] = params.length > 0
      ? await pool.execute(query, params)
      : await pool.query(query);

    const eventsWithPricing = await applyActivePricing(events);

    res.json({
      success: true,
      data: eventsWithPricing,
      count: eventsWithPricing.length
    });
  } catch (error) {
    logger.error('❌ Error in GET /api/events:', error);
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

    const query = `
      SELECT 
        id, titulo, descripcion, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, entradas_disponibles, imagen_cartel_url,
        precio_socio, precio_invitado, permite_invitados, destacado
      FROM events
      WHERE estado = 'scheduled'
        AND destacado = 1
        AND fecha_evento >= CURDATE()
      ORDER BY fecha_evento ASC, hora_evento ASC
      LIMIT 6
    `;

    const [events] = await pool.query(query);

    const eventsWithPricing = await applyActivePricing(events);

    res.json({
      success: true,
      data: eventsWithPricing,
      count: eventsWithPricing.length
    });
  } catch (error) {
    logger.error('❌ Error in GET /api/events/featured:', error);
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
        id, titulo, descripcion, fecha_evento, hora_evento,
        ubicacion, aforo_maximo, entradas_disponibles, imagen_cartel_url,
        precio_socio, precio_invitado, permite_invitados, destacado
      FROM events
      WHERE id = ?
        AND estado = 'scheduled'
    `;

    const [events] = await pool.execute(query, [eventId]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const { precio } = await EventTicketTier.resolveActivePrice(events[0].id, events[0].precio_socio);

    res.json({
      success: true,
      data: { ...events[0], precio_socio: precio, precio_invitado: precio }
    });
  } catch (error) {
    logger.error('❌ Error in GET /api/events/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

export default router;
import express from 'express';
import {
  // Dashboard y menú
  getAdminMenu,
  getDashboardStats,
  getGeneralStats,
  
  // Usuarios
  listUsers,
  getUserDetails,
  deleteUser,
  
  // Socios
  listSocios,
  getSocioDetails,
  createSocio,
  updateSocio,
  deleteSocio,
  listMorosos,
  
  // Eventos
  listAllEvents,
  getEventDetailsAdmin,
  getEventsStats,
  
  // Reservas
  listAllBookings,
  getBookingDetails,
  cancelBookingAdmin,
  getBookingsStats,
  
  // Pagos
  listPayments,
  getMonthlyRevenue,
  getPaymentsStats,
  
  // Galería
  getGalleryStats,
  
  // Actividad
  getRecentActivity,
  
  // Exportaciones
  exportSocios,
  exportReservas,
  exportUsuarios
} from '../controllers/adminController.js';

// Controllers de otros módulos (para rutas de gestión)
import {
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  publishEvent
} from '../controllers/eventController.js';

import {
  getEventBookings,
  verifyQRAndCheckIn
} from '../controllers/bookingController.js';

import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';
import { adminStrictLimiter } from '../middleware/rateLimiter.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

// Validators
import { verifyQRValidator } from '../validators/bookingValidator.js';
import {
  createSocioValidator,
  updateSocioValidator,
  deleteSocioValidator,
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  idParamValidator,
  yearQueryValidator
} from '../validators/adminValidator.js';
import { param } from 'express-validator';

const router = express.Router();

/**
 * ========================================
 * MIDDLEWARE GLOBAL
 * Todas las rutas requieren autenticación y rol admin
 * ========================================
 */
router.use(authenticate);
router.use(isAdmin);

/**
 * ========================================
 * 📊 MÓDULO: DASHBOARD Y MENÚ
 * ========================================
 */

// Obtener estructura del menú del panel admin
// GET /api/admin/menu
router.get('/menu', getAdminMenu);

// Obtener estadísticas completas del dashboard
// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', getDashboardStats);

// Obtener estadísticas generales (legacy - compatibilidad)
// GET /api/admin/stats
router.get('/stats', getGeneralStats);

/**
 * ========================================
 * 👥 MÓDULO: GESTIÓN DE USUARIOS
 * ========================================
 */

// Listar usuarios con filtros
// Query params: search, role, activo, email_verified, page, limit
// GET /api/admin/users
router.get(
  '/users',
  paginationValidator,        // ← VALIDAR PAGINACIÓN
  searchQueryValidator,        // ← VALIDAR BÚSQUEDA
  handleValidationErrors,      // ← MANEJAR ERRORES
  listUsers
);

// Obtener detalles de un usuario específico
// Incluye: datos de usuario, info de socio (si aplica), estadísticas de reservas
// GET /api/admin/users/:id
router.get(
  '/users/:id',
  idParamValidator,            // ← VALIDAR ID
  handleValidationErrors,      // ← MANEJAR ERRORES
  getUserDetails
);

// Desactivar usuario básico (OPERACIÓN CRÍTICA - 20 ops/hora)
// Solo permite desactivar usuarios con role='basico'
// DELETE /api/admin/users/:id
router.delete(
  '/users/:id',
  adminStrictLimiter,          // ← RATE LIMITING
  idParamValidator,            // ← VALIDAR ID
  handleValidationErrors,      // ← MANEJAR ERRORES
  deleteUser
);

/**
 * ========================================
 * 🎫 MÓDULO: GESTIÓN DE SOCIOS
 * ========================================
 */

// Listar socios con filtros
// Query params: search, estado, page, limit
// GET /api/admin/socios
router.get(
  '/socios',
  paginationValidator,         // ← VALIDAR PAGINACIÓN
  searchQueryValidator,         // ← VALIDAR BÚSQUEDA
  statusFilterValidator,        // ← VALIDAR ESTADO
  handleValidationErrors,       // ← MANEJAR ERRORES
  listSocios
);

// Obtener socios morosos
// Incluye todos los socios con estado='moroso' o dias_morosidad > 0
// GET /api/admin/socios/morosos
router.get('/socios/morosos', listMorosos);

// Obtener detalles de un socio específico
// Incluye: datos de socio, usuario asociado, últimos 10 pagos, últimas 10 reservas
// GET /api/admin/socios/:id
router.get(
  '/socios/:id',
  idParamValidator,            // ← VALIDAR ID
  handleValidationErrors,      // ← MANEJAR ERRORES
  getSocioDetails
);

// Crear socio manualmente (sin Stripe)
// Body requerido: { user_id }
// Body opcional: { cuota_mensual, notas_admin }
// POST /api/admin/socios
router.post(
  '/socios',
  createSocioValidator,        // ← VALIDAR DATOS
  handleValidationErrors,      // ← MANEJAR ERRORES
  createSocio
);

// Actualizar datos de un socio
// Body opcional: { cuota_mensual, notas_admin }
// PUT /api/admin/socios/:id
router.put(
  '/socios/:id',
  updateSocioValidator,        // ← VALIDAR DATOS
  handleValidationErrors,      // ← MANEJAR ERRORES
  updateSocio
);

// Dar de baja a un socio (OPERACIÓN CRÍTICA - 20 ops/hora)
// Body opcional: { motivo }
// Cambia estado a 'baja', actualiza role del usuario a 'basico', cancela reservas futuras
// DELETE /api/admin/socios/:id
router.delete(
  '/socios/:id',
  adminStrictLimiter,          // ← RATE LIMITING
  deleteSocioValidator,        // ← VALIDAR DATOS
  handleValidationErrors,      // ← MANEJAR ERRORES
  deleteSocio
);

/**
 * ========================================
 * 🎉 MÓDULO: GESTIÓN DE EVENTOS
 * ========================================
 */

// Listar TODOS los eventos (admin ve todos los estados)
// Query params: search, estado, destacado, dateFrom, dateTo, page, limit
// GET /api/admin/events
router.get(
  '/events',
  paginationValidator,         // ← VALIDAR PAGINACIÓN
  searchQueryValidator,         // ← VALIDAR BÚSQUEDA
  statusFilterValidator,        // ← VALIDAR ESTADO
  dateRangeValidator,           // ← VALIDAR FECHAS
  handleValidationErrors,       // ← MANEJAR ERRORES
  listAllEvents
);

// Obtener estadísticas de eventos
// Incluye: total, por estado, próximos, pasados, ocupación promedio
// GET /api/admin/events/stats
router.get('/events/stats', getEventsStats);

// Obtener detalles completos de un evento
// Incluye: datos del evento, estadísticas de reservas, lista de artistas
// GET /api/admin/events/:id
router.get(
  '/events/:id',
  idParamValidator,            // ← VALIDAR ID
  handleValidationErrors,      // ← MANEJAR ERRORES
  getEventDetailsAdmin
);

// Crear nuevo evento
// Body: ver EventController para campos requeridos
// POST /api/admin/events
router.post('/events', createEvent);

// Actualizar evento existente
// Body: campos a actualizar (ver EventController)
// PUT /api/admin/events/:id
router.put('/events/:id', updateEvent);

// Eliminar evento (OPERACIÓN CRÍTICA - 20 ops/hora)
// Solo permite eliminar si no tiene reservas asociadas
// DELETE /api/admin/events/:id
router.delete('/events/:id', adminStrictLimiter, deleteEvent);

// Cancelar evento (OPERACIÓN CRÍTICA - 20 ops/hora)
// Cambia estado a 'cancelado', mantiene reservas con estado 'cancelada'
// PATCH /api/admin/events/:id/cancel
router.patch('/events/:id/cancel', adminStrictLimiter, cancelEvent);

// Publicar evento
// Cambia estado de 'borrador' a 'publicado'
// PATCH /api/admin/events/:id/publish
router.patch('/events/:id/publish', publishEvent);

/**
 * ========================================
 * 📦 MÓDULO: GESTIÓN DE RESERVAS
 * ========================================
 */

// Listar TODAS las reservas del sistema
// Query params: search, estado, event_id, dateFrom, dateTo, page, limit
// GET /api/admin/bookings
router.get(
  '/bookings',
  paginationValidator,         // ← VALIDAR PAGINACIÓN
  searchQueryValidator,         // ← VALIDAR BÚSQUEDA
  statusFilterValidator,        // ← VALIDAR ESTADO
  dateRangeValidator,           // ← VALIDAR FECHAS
  handleValidationErrors,       // ← MANEJAR ERRORES
  listAllBookings
);

// Obtener estadísticas generales de reservas
// Incluye: total, por estado, esta semana, este mes, top 5 eventos
// GET /api/admin/bookings/stats
router.get('/bookings/stats', getBookingsStats);

// Obtener reservas de un evento específico
// Incluye detalles de cada reserva y del socio
// GET /api/admin/bookings/event/:eventId
router.get(
  '/bookings/event/:eventId',
  param('eventId')
    .isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero positivo')
    .toInt(),
  statusFilterValidator,        // ← VALIDAR ESTADO (opcional)
  handleValidationErrors,       // ← MANEJAR ERRORES
  getEventBookings
);

// Obtener detalles completos de una reserva
// Incluye: datos de reserva, socio, usuario, evento
// GET /api/admin/bookings/:id
router.get(
  '/bookings/:id',
  idParamValidator,            // ← VALIDAR ID
  handleValidationErrors,      // ← MANEJAR ERRORES
  getBookingDetails
);

// Cancelar reserva (OPERACIÓN CRÍTICA - 20 ops/hora)
// Admin puede cancelar cualquier reserva
// Body opcional: { motivo }
// PATCH /api/admin/bookings/:id/cancel
router.patch('/bookings/:id/cancel', adminStrictLimiter, cancelBookingAdmin);

// Verificar QR y registrar asistencia
// Body: { codigo_reserva }
// POST /api/admin/bookings/verify-qr
router.post(
  '/bookings/verify-qr',
  verifyQRValidator,          // ← VALIDAR CÓDIGO QR
  handleValidationErrors,     // ← MANEJAR ERRORES
  verifyQRAndCheckIn          // ← CONTROLLER
);

/**
 * ========================================
 * 📸 MÓDULO: GESTIÓN DE GALERÍA
 * ========================================
 */

// Obtener estadísticas de galería
// Incluye: total folders, imágenes, espacio usado, visibles, destacados
// GET /api/admin/gallery/stats
router.get('/gallery/stats', getGalleryStats);

// NOTA: Las rutas CRUD de galería (crear folders, subir imágenes, etc.)
// están en /api/gallery (galleryRoutes.js) con middleware de admin

/**
 * ========================================
 * 🎤 MÓDULO: GESTIÓN DE ARTISTAS
 * ========================================
 */

// NOTA: Las rutas CRUD de artistas están en /api/artists (artistRoutes.js)
// Incluyen: POST, PUT, DELETE, PATCH con middleware de admin
// Filtros: search, genero, sello, ciudad, pais_origen, verificado, destacado

/**
 * ========================================
 * 🏢 MÓDULO: GESTIÓN DE VENUES
 * ========================================
 */

// NOTA: Las rutas CRUD de venues están en /api/venues (venueRoutes.js)
// Incluyen: POST, PUT, DELETE, PATCH con middleware de admin
// Filtros: search, ciudad, tipo_local, activo

/**
 * ========================================
 * 💰 MÓDULO: GESTIÓN DE PAGOS
 * ========================================
 */

// Listar todos los pagos del sistema
// Query params: search, estado, tipo_pago, dateFrom, dateTo, page, limit
// GET /api/admin/payments
router.get(
  '/payments',
  paginationValidator,         // ← VALIDAR PAGINACIÓN
  searchQueryValidator,         // ← VALIDAR BÚSQUEDA
  statusFilterValidator,        // ← VALIDAR ESTADO
  dateRangeValidator,           // ← VALIDAR FECHAS
  handleValidationErrors,       // ← MANEJAR ERRORES
  listPayments
);

// Obtener ingresos mensuales por año
// Query param: ?year=2024
// GET /api/admin/payments/monthly
router.get(
  '/payments/monthly',
  yearQueryValidator,          // ← VALIDAR AÑO
  handleValidationErrors,      // ← MANEJAR ERRORES
  getMonthlyRevenue
);

// Obtener estadísticas de pagos
// Incluye: ingresos mensuales últimos 12 meses, resumen anual
// GET /api/admin/payments/stats
router.get('/payments/stats', getPaymentsStats);

/**
 * ========================================
 * 📋 MÓDULO: ACTIVIDAD Y LOGS
 * ========================================
 */

// Obtener actividad reciente del sistema
// Query param: ?limit=50 (default: 50, max: 200)
// Incluye: acción, entidad, usuario, timestamp
// GET /api/admin/activity
router.get('/activity', getRecentActivity);

/**
 * ========================================
 * 📤 MÓDULO: EXPORTACIONES
 * ========================================
 */

// Exportar lista completa de socios en formato CSV
// Query param: ?format=csv
// GET /api/admin/export/socios
router.get('/export/socios', exportSocios);

// Exportar lista completa de reservas en formato CSV
// Query param: ?format=csv
// GET /api/admin/export/reservas
router.get('/export/reservas', exportReservas);

// Exportar lista completa de usuarios en formato CSV
// Query param: ?format=csv
// GET /api/admin/export/usuarios
router.get('/export/usuarios', exportUsuarios);


export default router;
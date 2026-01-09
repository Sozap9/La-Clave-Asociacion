import express from "express";
import {
  // Dashboard y menú
  getAdminMenu,
  getDashboardStats,
  getGeneralStats,

  // Usuarios
  listUsers,
  getUserDetails,
  deleteUser,
  updateUserRole,
  approveUser,
  rejectUser,

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
  exportUsuarios,
  exportEventos,
} from "../controllers/adminController.js";

// Controllers de otros módulos (para rutas de gestión)
import {
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  publishEvent,
} from "../controllers/eventController.js";

import {
  getEventBookings,
  verifyQRAndCheckIn,
} from "../controllers/bookingController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import { adminStrictLimiter } from "../middleware/rateLimiter.js";
import { handleValidationErrors } from "../middleware/validationMiddleware.js";

// Validators
import { verifyQRValidator } from "../validators/bookingValidator.js";
import {
  createSocioValidator,
  updateSocioValidator,
  deleteSocioValidator,
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  idParamValidator,
  yearQueryValidator,
} from "../validators/adminValidator.js";
import { param } from "express-validator";

const router = express.Router();

/**
 * MIDDLEWARE GLOBAL
 * Todas las rutas requieren autenticación y rol admin
 */
router.use(authenticate);
router.use(isAdmin);

/**
 * RUTAS: DASHBOARD Y MENÚ
 */
// Obtener estructura del menú del panel admin
router.get("/menu", getAdminMenu);

// Estadísticas completas del dashboard
router.get("/dashboard/stats", getDashboardStats);

// Estadísticas generales resumidas
router.get("/stats", getGeneralStats);

/**
 * MÓDULO: GESTIÓN DE USUARIOS
 */

// Listar usuarios con filtros
// Query params: search, role, activo, email_verified, page, limit

router.get(
  "/users",
  paginationValidator,
  searchQueryValidator,
  handleValidationErrors,
  listUsers
);

// Obtener detalles de un usuario específico
// Incluye: datos de usuario, info de socio (si aplica), estadísticas de reservas
router.get(
  "/users/:id",
  idParamValidator,
  handleValidationErrors,
  getUserDetails
);

// Desactivar usuario básico (OPERACIÓN CRÍTICA - 20 ops/hora)
// Solo permite desactivar usuarios con role='basico'
router.delete(
  "/users/:id",
  adminStrictLimiter,
  idParamValidator,
  handleValidationErrors,
  deleteUser
);

/**
 * NUEVAS RUTAS: GESTIÓN DE ROLES
 */

// Cambiar rol de un usuario
// Body: { role: 'basico' | 'socio' | 'admin' }
router.patch(
  "/users/:id/role",
  idParamValidator,
  handleValidationErrors,
  updateUserRole
);

// Aprobar usuario como socio
router.patch(
  "/users/:id/approve",
  idParamValidator,
  handleValidationErrors,
  approveUser
);

// Rechazar solicitud de usuario
router.patch(
  "/users/:id/reject",
  idParamValidator,
  handleValidationErrors,
  rejectUser
);

/**
 * MÓDULO: GESTIÓN DE SOCIOS
 */

// Listar socios con filtros
router.get(
  "/socios",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  handleValidationErrors,
  listSocios
);

// Obtener socios morosos
router.get("/socios/morosos", listMorosos);

// Obtener detalles de un socio específico
router.get(
  "/socios/:id",
  idParamValidator,
  handleValidationErrors,
  getSocioDetails
);

// Crear socio manualmente (sin Stripe)
router.post(
  "/socios",
  createSocioValidator,
  handleValidationErrors,
  createSocio
);

// Actualizar datos de un socio
router.put(
  "/socios/:id",
  updateSocioValidator,
  handleValidationErrors,
  updateSocio
);

// Dar de baja a un socio (OPERACIÓN CRÍTICA - 20 ops/hora)
router.delete(
  "/socios/:id",
  adminStrictLimiter,
  deleteSocioValidator,
  handleValidationErrors,
  deleteSocio
);

/**
 * ========================================
 * GESTIÓN DE EVENTOS
 * ========================================
 */

// Listar TODOS los eventos (admin ve todos los estados)
router.get(
  "/events",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  handleValidationErrors,
  listAllEvents
);

// Obtener estadísticas de eventos
router.get("/events/stats", getEventsStats);

// Obtener detalles completos de un evento
router.get(
  "/events/:id",
  idParamValidator,
  handleValidationErrors,
  getEventDetailsAdmin
);

// Crear nuevo evento
router.post("/events", createEvent);

// Actualizar evento existente
router.put("/events/:id", updateEvent);

// Eliminar evento (OPERACIÓN CRÍTICA - 20 ops/hora)
router.delete("/events/:id", adminStrictLimiter, deleteEvent);

// Cancelar evento (OPERACIÓN CRÍTICA - 20 ops/hora)
router.patch("/events/:id/cancel", adminStrictLimiter, cancelEvent);

// Publicar evento
router.patch("/events/:id/publish", publishEvent);

/**
 * ========================================
 * GESTIÓN DE RESERVAS
 * ========================================
 */

// Listar TODAS las reservas del sistema
router.get(
  "/bookings",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  handleValidationErrors,
  listAllBookings
);

// Obtener estadísticas generales de reservas
router.get("/bookings/stats", getBookingsStats);

// Obtener reservas de un evento específico
router.get(
  "/bookings/event/:eventId",
  param("eventId")
    .isInt({ min: 1 })
    .withMessage("El ID del evento debe ser un número entero positivo")
    .toInt(),
  statusFilterValidator,
  handleValidationErrors,
  getEventBookings
);

// Obtener detalles completos de una reserva
router.get(
  "/bookings/:id",
  idParamValidator,
  handleValidationErrors,
  getBookingDetails
);

// Cancelar reserva (OPERACIÓN CRÍTICA - 20 ops/hora)
router.patch("/bookings/:id/cancel", adminStrictLimiter, cancelBookingAdmin);

// Verificar QR y registrar asistencia
router.post(
  "/bookings/verify-qr",
  verifyQRValidator,
  handleValidationErrors,
  verifyQRAndCheckIn
);

/**
 * ========================================
 * GESTIÓN DE GALERÍA
 * ========================================
 */

// Obtener estadísticas de galería
// Incluye: total folders, imágenes, espacio usado, visibles, destacados
// GET /api/admin/gallery/stats
router.get("/gallery/stats", getGalleryStats);

// NOTA: Las rutas CRUD de galería (crear folders, subir imágenes, etc.)
// están en /api/gallery (galleryRoutes.js) con middleware de admin

/**
 * ========================================
 * GESTIÓN DE ARTISTAS
 * ========================================
 */

// NOTA: Las rutas CRUD de artistas están en /api/artists (artistRoutes.js)
// Incluyen: POST, PUT, DELETE, PATCH con middleware de admin
// Filtros: search, genero, sello, ciudad, pais_origen, verificado, destacado

/**
 * ========================================
 * GESTIÓN DE VENUES
 * ========================================
 */

// NOTA: Las rutas CRUD de venues están en /api/venues (venueRoutes.js)
// Incluyen: POST, PUT, DELETE, PATCH con middleware de admin
// Filtros: search, ciudad, tipo_local, activo

/**
 * ========================================
 * GESTIÓN DE PAGOS
 * ========================================
 */

// Listar todos los pagos del sistema
router.get(
  "/payments",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  handleValidationErrors,
  listPayments
);

// Obtener ingresos mensuales por año
router.get(
  "/payments/monthly",
  yearQueryValidator,
  handleValidationErrors,
  getMonthlyRevenue
);

// Obtener estadísticas de pagos
router.get("/payments/stats", getPaymentsStats);

/**
 * ========================================
 * ACTIVIDAD Y LOGS
 * ========================================
 */

// Obtener actividad reciente del sistema
router.get("/activity", getRecentActivity);

/**
 * ========================================
 * EXPORTACIONES
 * ========================================
 */

// Exportar lista completa de socios en formato PDF
// GET /api/admin/export/socios
router.get("/export/socios", exportSocios);

// Exportar lista completa de reservas en formato PDF
// GET /api/admin/export/reservas
router.get("/export/reservas", exportReservas);

// Exportar lista completa de usuarios en formato PDF
// GET /api/admin/export/usuarios
router.get("/export/usuarios", exportUsuarios);

// Exportar lista completa de eventos en formato PDF
// GET /api/admin/export/eventos
router.get("/export/eventos", exportEventos);

export default router;

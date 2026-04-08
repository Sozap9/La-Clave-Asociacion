import express from "express";
import {
  // Dashboard y menú
  getAdminMenu,
  getDashboardStats,
  getGeneralStats,

  // Usuarios
  getUserDetails,
  updateUserRole,

  // Socios
  listSocios,
  getSocioDetails,
  updateSocio,
  deleteSocio,
  deleteSocioPermanent,
  reactivateSocio,
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
  getEventPayments,

  // Galería
  getGalleryStats,

  // Actividad
  getRecentActivity,

  // Exportaciones
  exportSocios,
  exportReservas,
  exportUsuarios,
  exportEventos,

  // Solicitudes ✨ NUEVO
  listSolicitudes,
  getSolicitudDetails,
  aprobarSolicitud,
  rechazarSolicitud,
  deleteSolicitud,
  getPendientesCount,
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
 * MÓDULO: GESTIÓN DE SOCIOS
 */

// Listar socios con filtros
router.get(
  "/socios",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  handleValidationErrors,
  listSocios,
);

// Obtener socios morosos
router.get("/socios/morosos", listMorosos);

// Obtener detalles de un socio específico
router.get(
  "/socios/:id",
  idParamValidator,
  handleValidationErrors,
  getSocioDetails,
);

// Actualizar datos de un socio
router.put(
  "/socios/:id",
  updateSocioValidator,
  handleValidationErrors,
  updateSocio,
);

// Dar de baja a un socio (soft, estado inactivo)
router.patch(
  "/socios/:id/deactivate",
  adminStrictLimiter,
  deleteSocioValidator,
  handleValidationErrors,
  deleteSocio,
);

// Alias para compatibilidad antigua: DELETE /socios/:id también hace soft delete
router.delete(
  "/socios/:id",
  adminStrictLimiter,
  deleteSocioValidator,
  handleValidationErrors,
  deleteSocio,
);

// Eliminar permanentemente un socio (OPERACIÓN CRÍTICA - 20 ops/hora)
router.delete(
  "/socios/:id/permanent",
  adminStrictLimiter,
  idParamValidator,
  handleValidationErrors,
  deleteSocioPermanent,
);

// Reactivar un socio dado de baja
router.patch(
  "/socios/:id/reactivate",
  idParamValidator,
  handleValidationErrors,
  reactivateSocio,
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
  listAllEvents,
);

// Obtener estadísticas de eventos
router.get("/events/stats", getEventsStats);

// Obtener detalles completos de un evento
router.get(
  "/events/:id",
  idParamValidator,
  handleValidationErrors,
  getEventDetailsAdmin,
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
  listAllBookings,
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
  getEventBookings,
);

// Obtener detalles completos de una reserva
router.get(
  "/bookings/:id",
  idParamValidator,
  handleValidationErrors,
  getBookingDetails,
);

// Cancelar reserva (OPERACIÓN CRÍTICA - 20 ops/hora)
router.patch("/bookings/:id/cancel", adminStrictLimiter, cancelBookingAdmin);

// Verificar QR y registrar asistencia
router.post(
  "/bookings/verify-qr",
  verifyQRValidator,
  handleValidationErrors,
  verifyQRAndCheckIn,
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
  listPayments,
);

// Obtener pagos por evento
router.get(
  "/events/:eventId/payments",
  param("eventId")
    .isInt({ min: 1 })
    .withMessage("El ID del evento debe ser un número entero positivo")
    .toInt(),
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  handleValidationErrors,
  getEventPayments,
);

// Obtener ingresos mensuales por año
router.get(
  "/payments/monthly",
  yearQueryValidator,
  handleValidationErrors,
  getMonthlyRevenue,
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

/**
 * ========================================
 * GESTIÓN DE SOLICITUDES DE SOCIO  ✨ NUEVO
 * ========================================
 */

// Contar pendientes (badge sidebar)
// ⚠️ Debe ir ANTES de /:id para no ser capturada por el parámetro
// GET /api/admin/solicitudes/pendientes/count
router.get("/solicitudes/pendientes/count", getPendientesCount);

// Listar solicitudes con filtros
// GET /api/admin/solicitudes?estado=pendiente&search=&page=1&limit=20
router.get(
  "/solicitudes",
  paginationValidator,
  searchQueryValidator,
  handleValidationErrors,
  listSolicitudes,
);

// Detalle de una solicitud
// GET /api/admin/solicitudes/:id
router.get("/solicitudes/:id", getSolicitudDetails);

// Aprobar → crea usuario socio
// PUT /api/admin/solicitudes/:id/aprobar
router.put("/solicitudes/:id/aprobar", aprobarSolicitud);

// Rechazar — Body: { motivo_rechazo }
// PUT /api/admin/solicitudes/:id/rechazar
router.put("/solicitudes/:id/rechazar", rechazarSolicitud);

// Eliminar solicitud definitivamente
// DELETE /api/admin/solicitudes/:id
router.delete("/solicitudes/:id", adminStrictLimiter, deleteSolicitud);

/**
 * ========================================
 * GESTIÓN DE ROLES DE USUARIO
 * ========================================
 */

// Cambiar el rol de un usuario (admin <-> socio)
// PATCH /api/admin/users/:id/role
router.patch(
  "/users/:id/role",
  idParamValidator,
  handleValidationErrors,
  updateUserRole
);

export default router;
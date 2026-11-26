import express from "express";
import {
  // Dashboard y menú
  getAdminMenu,
  getDashboardStats,
  getGeneralStats,

  // Usuarios
  getUserDetails,
  updateUserRole,
  listUsers,

  // Socios
  listSocios,
  getSocioDetails,
  updateSocio,
  deleteSocio,
  deleteSocioPermanent,
  reactivateSocio,
  listMorosos,
  createSocioManual,

  // Eventos
  listAllEvents,
  getEventDetailsAdmin,
  getEventsStats,

  // Reservas
  listAllBookings,
  getBookingDetails,
  cancelBookingAdmin,
  sendBookingInvitation,
  getBookingsStats,
  resendBookingTicket,

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
  getEventsForExportSelector,
  exportSocios,
  exportReservas,
  exportUsuarios,
  exportEventos,
  exportIngresosMensuales,

  // Solicitudes
  listSolicitudes,
  getSolicitudDetails,
  getSolicitudDni,
  getSocioDni,
  aprobarSolicitud,
  rechazarSolicitud,
  deleteSolicitud,
  getPendientesCount,
  actualizarDatosSocio,
} from "../controllers/adminController.js";

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
import { uploadDNI } from "../config/multer.js";
import { handleValidationErrors } from "../middleware/validationMiddleware.js";

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
import { param, body } from "express-validator";

const router = express.Router();

// Todo requiere sesión de admin
router.use(authenticate);
router.use(isAdmin);

// Dashboard y menú
router.get("/menu", getAdminMenu);

router.get("/dashboard/stats", getDashboardStats);

router.get("/stats", getGeneralStats);

// Socios

router.get("/users", listUsers);

router.post(
  "/socios",
  createSocioValidator,
  handleValidationErrors,
  createSocioManual,
);

router.get(
  "/socios",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  handleValidationErrors,
  listSocios,
);

router.get("/socios/morosos", listMorosos);

router.get(
  "/socios/:id",
  idParamValidator,
  handleValidationErrors,
  getSocioDetails,
);

router.get(
  "/socios/:id/dni",
  idParamValidator,
  handleValidationErrors,
  getSocioDni,
);

router.put(
  "/socios/:id",
  updateSocioValidator,
  handleValidationErrors,
  updateSocio,
);

// Datos personales verificados (nombre, DNI...): solo los cambia un admin.
// Los errores de multer (tamaño, formato) se devuelven como 400
const dniUpload = (req, res, next) => {
  uploadDNI.single("dni_front")(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "La imagen no puede superar los 5 MB"
      : err.message;
    return res.status(400).json({ success: false, message });
  });
};

router.put(
  "/socios/:id/datos",
  idParamValidator,
  handleValidationErrors,
  dniUpload,
  actualizarDatosSocio,
);

router.patch(
  "/socios/:id/deactivate",
  adminStrictLimiter,
  deleteSocioValidator,
  handleValidationErrors,
  deleteSocio,
);

// Alias antiguo: también hace soft delete
router.delete(
  "/socios/:id",
  adminStrictLimiter,
  deleteSocioValidator,
  handleValidationErrors,
  deleteSocio,
);

router.delete(
  "/socios/:id/permanent",
  adminStrictLimiter,
  idParamValidator,
  handleValidationErrors,
  deleteSocioPermanent,
);

router.patch(
  "/socios/:id/reactivate",
  idParamValidator,
  handleValidationErrors,
  reactivateSocio,
);

// Eventos

router.get(
  "/events",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  handleValidationErrors,
  listAllEvents,
);

router.get("/events/stats", getEventsStats);

router.get(
  "/events/:id",
  idParamValidator,
  handleValidationErrors,
  getEventDetailsAdmin,
);

router.post("/events", createEvent);

router.put("/events/:id", updateEvent);

router.delete("/events/:id", adminStrictLimiter, deleteEvent);

router.patch("/events/:id/cancel", adminStrictLimiter, cancelEvent);

router.patch("/events/:id/publish", publishEvent);

// Reservas

router.get(
  "/bookings",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  handleValidationErrors,
  listAllBookings,
);

router.get("/bookings/stats", getBookingsStats);

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

router.get(
  "/bookings/:id",
  idParamValidator,
  handleValidationErrors,
  getBookingDetails,
);

router.patch("/bookings/:id/cancel", adminStrictLimiter, cancelBookingAdmin);

router.post(
  "/bookings/:id/reenviar",
  idParamValidator,
  handleValidationErrors,
  resendBookingTicket,
);

router.post(
  "/bookings/invitacion",
  adminStrictLimiter,
  body("socio_id").isInt({ min: 1 }).withMessage("socio_id debe ser un número entero positivo").toInt(),
  body("event_id").isInt({ min: 1 }).withMessage("event_id debe ser un número entero positivo").toInt(),
  body("numero_entradas").optional().isInt({ min: 1, max: 10 }).withMessage("numero_entradas debe ser un número entre 1 y 10").toInt(),
  handleValidationErrors,
  sendBookingInvitation,
);

router.post(
  "/bookings/verify-qr",
  verifyQRValidator,
  handleValidationErrors,
  verifyQRAndCheckIn,
);

// Galería (el resto de rutas, en galleryRoutes.js)

router.get("/gallery/stats", getGalleryStats);

// Artistas y salas tienen sus rutas en artistRoutes.js y venueRoutes.js

// Pagos

router.get(
  "/payments",
  paginationValidator,
  searchQueryValidator,
  statusFilterValidator,
  dateRangeValidator,
  handleValidationErrors,
  listPayments,
);

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

router.get(
  "/payments/monthly",
  yearQueryValidator,
  handleValidationErrors,
  getMonthlyRevenue,
);

router.get("/payments/stats", getPaymentsStats);

// Actividad

router.get("/activity", getRecentActivity);

// Exportaciones

router.get("/export/events-selector", getEventsForExportSelector);

router.get("/export/socios", exportSocios);

router.get("/export/reservas", exportReservas);

router.get("/export/usuarios", exportUsuarios);

router.get("/export/eventos", exportEventos);

router.get("/export/ingresos-mensuales", exportIngresosMensuales);

// Solicitudes de socio

// Antes de /:id para que no la capture el parámetro
router.get("/solicitudes/pendientes/count", getPendientesCount);

router.get(
  "/solicitudes",
  paginationValidator,
  searchQueryValidator,
  handleValidationErrors,
  listSolicitudes,
);

router.get("/solicitudes/:id", getSolicitudDetails);
router.get("/solicitudes/:id/dni", getSolicitudDni);

router.put("/solicitudes/:id/aprobar", aprobarSolicitud);

router.put("/solicitudes/:id/rechazar", rechazarSolicitud);

router.delete("/solicitudes/:id", adminStrictLimiter, deleteSolicitud);

// Roles

router.patch(
  "/users/:id/role",
  idParamValidator,
  handleValidationErrors,
  updateUserRole
);

export default router;
import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getMyBookingStats
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { isSocio } from '../middleware/roleMiddleware.js';
import {
  createBookingValidator,
  bookingIdValidator,
  cancelBookingValidator
} from '../validators/bookingValidator.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * ========================================
 * MIDDLEWARE GLOBAL
 * Todas las rutas requieren autenticación
 * ========================================
 */
router.use(authenticate);

/**
 * ========================================
 * RUTAS PARA SOCIOS
 * Gestión de reservas propias
 * ========================================
 */

// Crear reserva para un evento
// Body: { event_id, numero_entradas }
// Requiere: socio activo con membresía al día
// POST /api/bookings
router.post(
  '/',
  isSocio,                    // ← MIDDLEWARE: Solo socios
  createBookingValidator,     // ← VALIDAR DATOS
  handleValidationErrors,     // ← MANEJAR ERRORES
  createBooking               // ← CONTROLLER
);

// Obtener mis reservas
// Muestra todas las reservas del socio autenticado
// Query params: ?estado=confirmada (opcional)
// GET /api/bookings/me
router.get('/me', isSocio, getMyBookings);

// Obtener estadísticas de mis reservas
// Incluye: total, confirmadas, canceladas, asistencias
// GET /api/bookings/me/stats
router.get('/me/stats', isSocio, getMyBookingStats);

// Obtener detalles de una de mis reservas
// Solo muestra reservas del socio autenticado
// GET /api/bookings/:id
router.get(
  '/:id',
  isSocio,                    // ← MIDDLEWARE: Solo socios
  bookingIdValidator,         // ← VALIDAR ID
  handleValidationErrors,     // ← MANEJAR ERRORES
  getBooking                  // ← CONTROLLER
);

// Cancelar mi reserva
// Solo permite cancelar reservas propias con estado='confirmada'
// DELETE /api/bookings/:id
router.delete(
  '/:id',
  isSocio,                    // ← MIDDLEWARE: Solo socios
  cancelBookingValidator,     // ← VALIDAR ID Y MOTIVO
  handleValidationErrors,     // ← MANEJAR ERRORES
  cancelBooking               // ← CONTROLLER
);

/**
 * ========================================
 * NOTA: RUTAS DE ADMINISTRACIÓN
 * Las rutas de gestión de reservas para admin (listar todas, cancelar cualquiera, verify QR)
 * están en /api/admin/bookings (adminRoutes.js)
 * ========================================
 */

export default router;
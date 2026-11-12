import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getMyBookingStats,
  retryBookingPayment,
  getBookingQRImage
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

// Imagen del QR para los emails: sin sesión, la protege el codigo_acceso de la URL
router.get('/qr/:id/:codigo.png', getBookingQRImage);

// Desde aquí, todo requiere sesión
router.use(authenticate);

// Reservas del propio socio

router.post(
  '/',
  isSocio,
  createBookingValidator,
  handleValidationErrors,
  createBooking
);

router.get('/me', isSocio, getMyBookings);

router.get('/me/stats', isSocio, getMyBookingStats);

router.get(
  '/:id',
  isSocio,
  bookingIdValidator,
  handleValidationErrors,
  getBooking
);

router.post(
  '/:id/pagar',
  isSocio,
  bookingIdValidator,
  handleValidationErrors,
  retryBookingPayment
);

router.delete(
  '/:id',
  isSocio,
  cancelBookingValidator,
  handleValidationErrors,
  cancelBooking
);

// Las rutas de reservas del admin están en adminRoutes.js

export default router;
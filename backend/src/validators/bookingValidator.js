import { body, param } from 'express-validator';

/**
 * ========================================
 * VALIDATORS PARA GESTIÓN DE RESERVAS
 * ========================================
 */

/**
 * Validación para CREAR RESERVA
 * Endpoint: POST /api/bookings
 * 
 * Usado por: Socios
 */
export const createBookingValidator = [
  // EVENT ID
  body('event_id')
    .notEmpty().withMessage('El ID del evento es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero positivo')
    .toInt(),

  // NÚMERO DE ENTRADAS
  body('numero_entradas')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 10 }).withMessage('El número de entradas debe estar entre 1 y 10')
    .toInt()
    .custom((value) => {
      // Validación adicional: números razonables
      if (value > 10) {
        throw new Error('No puedes reservar más de 10 entradas por reserva. Contacta con el administrador para grupos grandes');
      }
      return true;
    })
];

/**
 * Validación para ID de reserva en params
 * Usado en: GET /api/bookings/:id, DELETE /api/bookings/:id
 */
export const bookingIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la reserva debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para CANCELAR RESERVA
 * Endpoint: DELETE /api/bookings/:id
 * 
 * Usado por: Socios (sus propias reservas)
 */
export const cancelBookingValidator = [
  // ID en params
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la reserva debe ser un número entero positivo')
    .toInt(),

  // MOTIVO (opcional)
  body('motivo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres')
    .escape()
];

/**
 * Validación para VERIFICAR QR CODE
 * Endpoint: POST /api/bookings/verify-qr
 * 
 * Usado por: Admin (en puerta del evento)
 */
export const verifyQRValidator = [
  // CÓDIGO DE RESERVA
  body('codigo_reserva')
    .notEmpty().withMessage('El código de reserva es obligatorio')
    .trim()
    .matches(/^LCV-[0-9]+-[A-Z0-9]{8}$/).withMessage('El código de reserva no tiene un formato válido (debe ser LCV-XXXXX-XXXXXXXX)')
    .isLength({ min: 10, max: 50 }).withMessage('El código de reserva debe tener entre 10 y 50 caracteres')
];

/**
 * Validación para query params de estado
 * Usado en: GET /api/bookings/me?estado=confirmada
 */
export const bookingStatusQueryValidator = [
  // ESTADO (query param, opcional)
  body('estado')
    .optional({ nullable: true })
    .isIn(['confirmada', 'cancelada', 'asistida', 'no_asistida']).withMessage('El estado debe ser: confirmada, cancelada, asistida o no_asistida')
];
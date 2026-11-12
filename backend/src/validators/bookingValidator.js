import { body, param } from 'express-validator';


// Crear reserva
export const createBookingValidator = [
  body('event_id')
    .notEmpty().withMessage('El ID del evento es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero positivo')
    .toInt(),

  body('numero_entradas')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 10 }).withMessage('El número de entradas debe estar entre 1 y 10')
    .toInt()
    .custom((value) => {
      if (value > 10) {
        throw new Error('No puedes reservar más de 10 entradas por reserva. Contacta con el administrador para grupos grandes');
      }
      return true;
    })
];

// ID de reserva en params
export const bookingIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la reserva debe ser un número entero positivo')
    .toInt()
];

// Cancelar reserva
export const cancelBookingValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID de la reserva debe ser un número entero positivo')
    .toInt(),

  body('motivo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres')
    .escape()
];

// Validar QR
export const verifyQRValidator = [
  // El texto del QR (LACLAVE-{bookingId}-{codigo_acceso}) o el codigo_reserva escrito a mano
  body('codigo_reserva')
    .notEmpty().withMessage('El código de reserva es obligatorio')
    .trim()
    .matches(/^(LACLAVE-\d+-[A-Z0-9-]{4,40}|LCV-[0-9]+-[A-Z0-9]{4,10})$/)
    .withMessage('El código escaneado no tiene un formato válido')
    .isLength({ min: 10, max: 80 }).withMessage('El código de reserva debe tener entre 10 y 80 caracteres')
];

// Estado en query
export const bookingStatusQueryValidator = [
  body('estado')
    .optional({ nullable: true })
    .isIn(['confirmada', 'cancelada', 'asistida', 'no_asistida']).withMessage('El estado debe ser: confirmada, cancelada, asistida o no_asistida')
];
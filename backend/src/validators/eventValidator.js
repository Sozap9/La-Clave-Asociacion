import { body, param } from 'express-validator';

/**
 * ========================================
 * VALIDATORS PARA GESTIÓN DE EVENTOS
 * ========================================
 */

/**
 * Validación para CREAR EVENTO
 * Endpoint: POST /api/events
 * 
 * Usado por: Admin
 */
export const createEventValidator = [
  // TÍTULO
  body('titulo')
    .notEmpty().withMessage('El título es obligatorio')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres')
    .escape(),

  // DESCRIPCIÓN (opcional)
  body('descripcion')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('La descripción no puede superar 2000 caracteres')
    .escape(),

  // FECHA Y HORA
  body('fecha_hora')
    .notEmpty().withMessage('La fecha y hora son obligatorias')
    .isISO8601().withMessage('La fecha debe estar en formato ISO 8601 (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)')
    .custom((value) => {
      const eventDate = new Date(value);
      const now = new Date();
      
      // Verificar que la fecha sea futura
      if (eventDate <= now) {
        throw new Error('La fecha del evento debe ser futura');
      }
      
      // Verificar que no sea más de 2 años en el futuro
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      
      if (eventDate > twoYearsFromNow) {
        throw new Error('La fecha del evento no puede ser más de 2 años en el futuro');
      }
      
      return true;
    }),

  // VENUE ID
  body('venue_id')
    .notEmpty().withMessage('El venue es obligatorio')
    .isInt({ min: 1 }).withMessage('El venue ID debe ser un número entero positivo')
    .toInt(),

  // PRECIO (opcional, puede ser evento gratuito)
  body('precio')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999999.99 }).withMessage('El precio debe ser un número entre 0 y 999999.99')
    .custom((value) => {
      // Verificar máximo 2 decimales
      const decimals = (value.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        throw new Error('El precio solo puede tener 2 decimales');
      }
      return true;
    })
    .toFloat(),

  // CAPACIDAD MÁXIMA
  body('capacidad_maxima')
    .notEmpty().withMessage('La capacidad máxima es obligatoria')
    .isInt({ min: 1, max: 100000 }).withMessage('La capacidad debe ser un número entre 1 y 100000')
    .toInt(),

  // IMAGEN URL (opcional)
  body('imagen_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL().withMessage('La imagen debe ser una URL válida')
    .isLength({ max: 500 }).withMessage('La URL de la imagen no puede superar 500 caracteres'),

  // ESTADO (opcional, por defecto será 'borrador')
  body('estado')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['borrador', 'publicado', 'cancelado', 'finalizado']).withMessage('El estado debe ser: borrador, publicado, cancelado o finalizado'),

  // DESTACADO (opcional)
  body('destacado')
    .optional({ nullable: true })
    .isBoolean().withMessage('Destacado debe ser true o false')
    .toBoolean(),

  // AFORO MINIMO (opcional)
  body('aforo_minimo')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 }).withMessage('El aforo mínimo debe ser un número positivo')
    .toInt()
    .custom((value, { req }) => {
      if (req.body.capacidad_maxima && value > req.body.capacidad_maxima) {
        throw new Error('El aforo mínimo no puede ser mayor que la capacidad máxima');
      }
      return true;
    }),

  // TAGS (opcional)
  body('tags')
    .optional({ nullable: true })
    .isString().withMessage('Los tags deben ser un string')
    .trim()
    .isLength({ max: 500 }).withMessage('Los tags no pueden superar 500 caracteres'),

  // EDAD MINIMA (opcional)
  body('edad_minima')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 99 }).withMessage('La edad mínima debe ser un número entre 0 y 99')
    .toInt()
];

/**
 * Validación para ACTUALIZAR EVENTO
 * Endpoint: PUT /api/events/:id
 * 
 * Usado por: Admin
 * Similar a crear pero todos los campos son opcionales
 */
export const updateEventValidator = [
  // ID del evento (en params)
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero positivo')
    .toInt(),

  // TÍTULO (opcional en actualización)
  body('titulo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres')
    .escape(),

  // DESCRIPCIÓN (opcional)
  body('descripcion')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('La descripción no puede superar 2000 caracteres')
    .escape(),

  // FECHA Y HORA (opcional)
  body('fecha_hora')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha debe estar en formato ISO 8601')
    .custom((value) => {
      const eventDate = new Date(value);
      const now = new Date();
      
      if (eventDate <= now) {
        throw new Error('La fecha del evento debe ser futura');
      }
      
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      
      if (eventDate > twoYearsFromNow) {
        throw new Error('La fecha del evento no puede ser más de 2 años en el futuro');
      }
      
      return true;
    }),

  // VENUE ID (opcional)
  body('venue_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('El venue ID debe ser un número entero positivo')
    .toInt(),

  // PRECIO (opcional)
  body('precio')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999999.99 }).withMessage('El precio debe ser un número entre 0 y 999999.99')
    .custom((value) => {
      const decimals = (value.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        throw new Error('El precio solo puede tener 2 decimales');
      }
      return true;
    })
    .toFloat(),

  // CAPACIDAD MÁXIMA (opcional)
  body('capacidad_maxima')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 100000 }).withMessage('La capacidad debe ser un número entre 1 y 100000')
    .toInt(),

  // IMAGEN URL (opcional)
  body('imagen_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL().withMessage('La imagen debe ser una URL válida')
    .isLength({ max: 500 }).withMessage('La URL de la imagen no puede superar 500 caracteres'),

  // ESTADO (opcional)
  body('estado')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['borrador', 'publicado', 'cancelado', 'finalizado']).withMessage('El estado debe ser: borrador, publicado, cancelado o finalizado'),

  // DESTACADO (opcional)
  body('destacado')
    .optional({ nullable: true })
    .isBoolean().withMessage('Destacado debe ser true o false')
    .toBoolean(),

  // AFORO MINIMO (opcional)
  body('aforo_minimo')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 }).withMessage('El aforo mínimo debe ser un número positivo')
    .toInt()
    .custom((value, { req }) => {
      if (req.body.capacidad_maxima && value > req.body.capacidad_maxima) {
        throw new Error('El aforo mínimo no puede ser mayor que la capacidad máxima');
      }
      return true;
    }),

  // TAGS (opcional)
  body('tags')
    .optional({ nullable: true })
    .isString().withMessage('Los tags deben ser un string')
    .trim()
    .isLength({ max: 500 }).withMessage('Los tags no pueden superar 500 caracteres'),

  // EDAD MINIMA (opcional)
  body('edad_minima')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0, max: 99 }).withMessage('La edad mínima debe ser un número entre 0 y 99')
    .toInt()
];

/**
 * Validación para ID en params
 * Usado en: GET /api/events/:id, DELETE /api/events/:id, etc.
 */
export const eventIdValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para CANCELAR EVENTO
 * Endpoint: PATCH /api/events/:id/cancel
 */
export const cancelEventValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero positivo')
    .toInt(),

  body('motivo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres')
    .escape()
];
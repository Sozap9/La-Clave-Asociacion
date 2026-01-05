import { body, query, param } from 'express-validator';

/**
 * ========================================
 * VALIDATORS PARA PANEL DE ADMINISTRACIÓN
 * ========================================
 */

/**
 * Validación para CREAR SOCIO MANUALMENTE
 * Endpoint: POST /api/admin/socios
 * 
 * Usado por: Admin
 */
export const createSocioValidator = [
  // USER ID
  body('user_id')
    .notEmpty().withMessage('El ID del usuario es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del usuario debe ser un número entero positivo')
    .toInt(),

  // CUOTA MENSUAL (opcional, tiene default)
  body('cuota_mensual')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999.99 }).withMessage('La cuota mensual debe ser un número entre 0 y 999.99')
    .custom((value) => {
      // Verificar máximo 2 decimales
      const decimals = (value.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        throw new Error('La cuota mensual solo puede tener 2 decimales');
      }
      return true;
    })
    .toFloat(),

  // NOTAS ADMIN (opcional)
  body('notas_admin')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden superar 1000 caracteres')
    .escape()
];

/**
 * Validación para ACTUALIZAR SOCIO
 * Endpoint: PUT /api/admin/socios/:id
 * 
 * Usado por: Admin
 */
export const updateSocioValidator = [
  // ID del socio (en params)
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del socio debe ser un número entero positivo')
    .toInt(),

  // CUOTA MENSUAL (opcional)
  body('cuota_mensual')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999.99 }).withMessage('La cuota mensual debe ser un número entre 0 y 999.99')
    .custom((value) => {
      const decimals = (value.toString().split('.')[1] || '').length;
      if (decimals > 2) {
        throw new Error('La cuota mensual solo puede tener 2 decimales');
      }
      return true;
    })
    .toFloat(),

  // NOTAS ADMIN (opcional)
  body('notas_admin')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Las notas no pueden superar 1000 caracteres')
    .escape()
];

/**
 * Validación para ELIMINAR SOCIO
 * Endpoint: DELETE /api/admin/socios/:id
 */
export const deleteSocioValidator = [
  // ID del socio (en params)
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del socio debe ser un número entero positivo')
    .toInt(),

  // MOTIVO (opcional)
  body('motivo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('El motivo no puede superar 500 caracteres')
    .escape()
];

/**
 * Validación para PAGINACIÓN (query params)
 * Usado en: Todos los listados con paginación
 */
export const paginationValidator = [
  // PAGE
  query('page')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 9999 }).withMessage('La página debe ser un número entre 1 y 9999')
    .toInt(),

  // LIMIT
  query('limit')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
    .toInt()
    .custom((value) => {
      // Advertencia si pide demasiados resultados
      if (value > 50) {
        console.warn(`⚠️  Límite alto solicitado: ${value} resultados`);
      }
      return true;
    })
];

/**
 * Validación para BÚSQUEDA (query params)
 * Usado en: Endpoints con búsqueda de texto
 */
export const searchQueryValidator = [
  // SEARCH
  query('search')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres')
    .escape()
];

/**
 * Validación para FILTRO DE ESTADO
 * Usado en: Listados con filtro de estado
 */
export const statusFilterValidator = [
  // ESTADO
  query('estado')
    .optional({ nullable: true })
    .isString().withMessage('El estado debe ser un texto')
    .trim()
    .isIn(['activo', 'inactivo', 'moroso', 'baja', 'confirmada', 'cancelada', 'asistida', 'no_asistida', 'publicado', 'borrador', 'finalizado'])
    .withMessage('Estado no válido')
];

/**
 * Validación para FILTRO DE FECHAS
 * Usado en: Listados con filtro de rango de fechas
 */
export const dateRangeValidator = [
  // FECHA DESDE
  query('dateFrom')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha desde debe estar en formato ISO 8601 (YYYY-MM-DD)'),

  // FECHA HASTA
  query('dateTo')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha hasta debe estar en formato ISO 8601 (YYYY-MM-DD)')
    .custom((value, { req }) => {
      // Verificar que dateTo no sea anterior a dateFrom
      if (req.query.dateFrom && value) {
        const from = new Date(req.query.dateFrom);
        const to = new Date(value);
        if (to < from) {
          throw new Error('La fecha hasta no puede ser anterior a la fecha desde');
        }
      }
      return true;
    })
];

/**
 * Validación para ID en params
 * Usado en: GET, PUT, DELETE con :id
 */
export const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para YEAR en query
 * Usado en: Estadísticas por año
 */
export const yearQueryValidator = [
  query('year')
    .optional({ nullable: true })
    .isInt({ min: 2020, max: 2100 }).withMessage('El año debe estar entre 2020 y 2100')
    .toInt()
    .custom((value) => {
      const currentYear = new Date().getFullYear();
      if (value > currentYear + 1) {
        throw new Error('No puedes consultar datos de años futuros');
      }
      return true;
    })
];
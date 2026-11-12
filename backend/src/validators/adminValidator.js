import { body, query, param } from "express-validator";
import logger from '../config/logger.js';


// Crear socio manualmente
export const createSocioValidator = [
  body("user_id")
    .notEmpty()
    .withMessage("El ID del usuario es obligatorio")
    .isInt({ min: 1 })
    .withMessage("El ID del usuario debe ser un número entero positivo")
    .toInt(),

  body("cuota_mensual")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999.99 })
    .withMessage("La cuota mensual debe ser un número entre 0 y 999.99")
    .custom((value) => {
      // Máximo 2 decimales
      const decimals = (value.toString().split(".")[1] || "").length;
      if (decimals > 2) {
        throw new Error("La cuota mensual solo puede tener 2 decimales");
      }
      return true;
    })
    .toFloat(),

  body("notas_admin")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden superar 1000 caracteres")
    .escape(),
];

// Actualizar socio
export const updateSocioValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID del socio debe ser un número entero positivo")
    .toInt(),

  body("cuota_mensual")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 999.99 })
    .withMessage("La cuota mensual debe ser un número entre 0 y 999.99")
    .custom((value) => {
      const decimals = (value.toString().split(".")[1] || "").length;
      if (decimals > 2) {
        throw new Error("La cuota mensual solo puede tener 2 decimales");
      }
      return true;
    })
    .toFloat(),

  body("notas_admin")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden superar 1000 caracteres")
    .escape(),
];

// Eliminar socio
export const deleteSocioValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID del socio debe ser un número entero positivo")
    .toInt(),

  body("motivo")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("El motivo no puede superar 500 caracteres")
    .escape(),
];

// Paginación (query params)
export const paginationValidator = [
  query("page")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 9999 })
    .withMessage("La página debe ser un número entre 1 y 9999")
    .toInt(),

  query("limit")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100")
    .toInt()
    .custom((value) => {
      if (value > 50) {
        logger.warn(`Límite alto solicitado: ${value} resultados`);
      }
      return true;
    }),
];

// Búsqueda (query params)
export const searchQueryValidator = [
  query("search")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El término de búsqueda debe tener entre 2 y 100 caracteres")
    .escape(),
];

// Filtro de estado
export const statusFilterValidator = [
  query("estado")
    .optional({ nullable: true })
    .isString()
    .withMessage("El estado debe ser un texto")
    .trim()
    .isIn([
      "activo",
      "inactivo",
      "moroso",
      "baja",
      "confirmada",
      "cancelada",
      "asistida",
      "no_asistida",
      "publicado",
      "borrador",
      "finalizado",
      "exitoso",
      "completado",
      "fallido",
      "pendiente",
      "reembolsado",
    ])
    .withMessage("Estado no válido"),
];

// Filtro de fechas
export const dateRangeValidator = [
  query("dateFrom")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("La fecha desde debe estar en formato ISO 8601 (YYYY-MM-DD)"),

  query("dateTo")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("La fecha hasta debe estar en formato ISO 8601 (YYYY-MM-DD)")
    .custom((value, { req }) => {
      // dateTo no puede ser anterior a dateFrom
      if (req.query.dateFrom && value) {
        const from = new Date(req.query.dateFrom);
        const to = new Date(value);
        if (to < from) {
          throw new Error(
            "La fecha hasta no puede ser anterior a la fecha desde",
          );
        }
      }
      return true;
    }),
];

// ID en params
export const idParamValidator = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El ID debe ser un número entero positivo")
    .toInt(),
];

// Año en query
export const yearQueryValidator = [
  query("year")
    .optional({ nullable: true })
    .isInt({ min: 2020, max: 2100 })
    .withMessage("El año debe estar entre 2020 y 2100")
    .toInt()
    .custom((value) => {
      const currentYear = new Date().getFullYear();
      if (value > currentYear + 1) {
        throw new Error("No puedes consultar datos de años futuros");
      }
      return true;
    }),
];

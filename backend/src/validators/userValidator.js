import { body } from 'express-validator';

/**
 * ========================================
 * VALIDATORS PARA GESTIÓN DE USUARIOS
 * ========================================
 */

/**
 * Validación para ACTUALIZAR PERFIL
 * Endpoint: PUT /api/users/me
 * 
 * Campos opcionales: username, nombre, apellidos, telefono, idioma_preferido
 */
export const updateProfileValidator = [
  // USERNAME (opcional)
  body('username')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('El username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, números y guiones bajos')
    .escape(),

  // NOMBRE (opcional)
  body('nombre')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
    .escape(),

  // APELLIDOS (opcional)
  body('apellidos')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los apellidos solo pueden contener letras y espacios')
    .escape(),

  // TELÉFONO (opcional)
  body('telefono')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[+]?[0-9\s()-]{9,20}$/).withMessage('El teléfono debe tener entre 9 y 20 caracteres y solo puede contener números, espacios, paréntesis y guiones')
    .customSanitizer(value => value.replace(/\s/g, '')), // Eliminar espacios

  // IDIOMA PREFERIDO (opcional)
  body('idioma_preferido')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['es', 'en']).withMessage('El idioma debe ser "es" o "en"')
];

/**
 * Validación para CAMBIAR CONTRASEÑA
 * Endpoint: PUT /api/users/me/password
 * 
 * Campos obligatorios: currentPassword, newPassword
 */
export const changePasswordValidator = [
  // CONTRASEÑA ACTUAL
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es obligatoria')
    .isString().withMessage('La contraseña actual debe ser un texto'),

  // NUEVA CONTRASEÑA
  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => {
      // Validar que la nueva contraseña sea diferente a la actual
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    })
];

/**
 * Validación para DESACTIVAR CUENTA
 * Endpoint: DELETE /api/users/me
 * 
 * Campos obligatorios: password, confirmacion
 */
export const deactivateAccountValidator = [
  // CONTRASEÑA
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isString().withMessage('La contraseña debe ser un texto'),

  // CONFIRMACIÓN
  body('confirmacion')
    .notEmpty().withMessage('La confirmación es obligatoria')
    .equals('ELIMINAR').withMessage('Debes escribir exactamente "ELIMINAR" para confirmar')
];
import { body } from 'express-validator';
import { isValidSpanishDocument } from '../utils/validators.js';

/**
 * ========================================
 * VALIDATORS PARA AUTENTICACIÓN
 * ========================================
 */

/**
 * Validación para REGISTRO BÁSICO
 * Endpoint: POST /api/auth/register/basic
 */
export const registerBasicValidator = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email no puede superar 100 caracteres'),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
    .escape(),

  body('apellidos')
    .notEmpty().withMessage('Los apellidos son obligatorios')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los apellidos solo pueden contener letras y espacios')
    .escape(),

  body('telefono')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[0-9+\s()-]+$/).withMessage('El teléfono no es válido')
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),

  body('fecha_nacimiento')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('La fecha de nacimiento debe estar en formato válido (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 18) throw new Error('Debes ser mayor de 18 años para registrarte');
      if (age > 120) throw new Error('La fecha de nacimiento no es válida');
      return true;
    })
];

/**
 * Validación para REGISTRO DE SOCIO (flujo antiguo - mantenido por retrocompatibilidad)
 * Endpoint: POST /api/auth/register/socio
 */
export const registerSocioValidator = [
  ...registerBasicValidator,

  body('dni')
    .notEmpty().withMessage('El documento de identidad es obligatorio para socios')
    .trim()
    .custom((value) => {
      if (!isValidSpanishDocument(value)) {
        throw new Error('El documento debe ser un DNI o NIE español válido');
      }
      return true;
    }),

  body('direccion')
    .notEmpty().withMessage('La dirección es obligatoria para socios')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('La dirección debe tener entre 5 y 200 caracteres')
    .escape(),

  body('ciudad')
    .notEmpty().withMessage('La ciudad es obligatoria para socios')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('La ciudad debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('La ciudad solo puede contener letras y espacios')
    .escape(),

  body('codigo_postal')
    .notEmpty().withMessage('El código postal es obligatorio para socios')
    .trim()
    .matches(/^[0-9]{5}$/).withMessage('El código postal debe tener 5 dígitos'),

  body('payment_method_id')
    .optional({ nullable: true })
    .trim()
    .matches(/^pm_[a-zA-Z0-9]+$/).withMessage('El payment method ID de Stripe no es válido')
];

/**
 * Validación para SOLICITUD DE SOCIO
 * Endpoint: POST /api/auth/solicitud-socio
 * Las imágenes del documento se validan por multer (no por express-validator)
 */
export const solicitudSocioValidator = [
  // EMAIL
  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email no puede superar 100 caracteres'),

  // PASSWORD
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  // NOMBRE
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
    .escape(),

  // APELLIDOS
  body('apellidos')
    .notEmpty().withMessage('Los apellidos son obligatorios')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los apellidos solo pueden contener letras y espacios')
    .escape(),

  // TELÉFONO
  body('telefono')
    .notEmpty().withMessage('El teléfono es obligatorio')
    .trim()
    .matches(/^[0-9+\s()-]+$/).withMessage('El teléfono no es válido')
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),

  // FECHA DE NACIMIENTO
  body('fecha_nacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 18) throw new Error('Debes ser mayor de 18 años para registrarte');
      if (age > 120) throw new Error('La fecha de nacimiento no es válida');
      return true;
    }),

  // DNI / NIE
  // Acepta DNI español (12345678A) o NIE (X1234567A), ambos con letra
  // de control validada mediante el algoritmo oficial.
  body('dni')
    .notEmpty().withMessage('El documento de identidad es obligatorio')
    .trim()
    .custom((value) => {
      if (!isValidSpanishDocument(value)) {
        throw new Error('El documento debe ser un DNI o NIE español válido (ej. 12345678A o X1234567A)');
      }
      return true;
    }),

  // PREGUNTAS DEL REGISTRO (las tres obligatorias)
  // ¿Tienes un proyecto artístico o cultural? ¿Formas parte de algún colectivo?
  // Llega como "pregunta + Sí. detalle" o "pregunta + No".
  body('motivacion')
    .trim()
    .notEmpty().withMessage('Responde si tienes un proyecto artístico o cultural o formas parte de algún colectivo')
    .isLength({ max: 500 }).withMessage('La respuesta sobre tu proyecto no puede superar 500 caracteres')
    .escape(),

  // ¿Qué socio te ha invitado?
  body('invitado_por')
    .trim()
    .notEmpty().withMessage('Indica qué socio te ha invitado')
    .isLength({ max: 150 }).withMessage('El socio que te ha invitado no puede superar 150 caracteres')
    .escape(),

  // ¿A qué evento deseas venir?
  body('evento_interes')
    .trim()
    .notEmpty().withMessage('Indica a qué evento deseas venir')
    .isLength({ max: 150 }).withMessage('El evento no puede superar 150 caracteres')
    .escape()
];

/**
 * Validación para LOGIN
 * Endpoint: POST /api/auth/login
 */
export const loginValidator = [
  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isString().withMessage('La contraseña debe ser un texto')
];

/**
 * Validación para CAMBIO DE CONTRASEÑA
 * Endpoint: PUT /api/users/me/password
 */
export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es obligatoria')
    .isString().withMessage('La contraseña actual debe ser un texto'),

  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    })
];
import { body } from 'express-validator';

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

  body('username')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('El username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, números y guiones bajos')
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
    .notEmpty().withMessage('El DNI es obligatorio para socios')
    .trim()
    .matches(/^[0-9]{8}[A-Za-z]$/).withMessage('El DNI debe tener 8 números seguidos de una letra')
    .custom((value) => {
      const dni = value.toUpperCase();
      const numero = parseInt(dni.substr(0, 8));
      const letra = dni.substr(8, 1);
      const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const letraCorrecta = letras.charAt(numero % 23);
      if (letra !== letraCorrecta) throw new Error('La letra del DNI no es correcta');
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
 * Las imágenes del DNI se validan por multer (no por express-validator)
 */
export const solicitudSocioValidator = [
  // USERNAME
  body('username')
    .notEmpty().withMessage('El username es obligatorio')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('El username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, números y guiones bajos')
    .escape(),

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

  // DNI
  body('dni')
    .notEmpty().withMessage('El DNI es obligatorio')
    .trim()
    .matches(/^[0-9]{8}[A-Za-z]$/).withMessage('El DNI debe tener 8 números seguidos de una letra')
    .custom((value) => {
      const dni = value.toUpperCase();
      const numero = parseInt(dni.substr(0, 8));
      const letra = dni.substr(8, 1);
      const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const letraCorrecta = letras.charAt(numero % 23);
      if (letra !== letraCorrecta) throw new Error('La letra del DNI no es correcta');
      return true;
    }),

  // MOTIVACIÓN (opcional)
  body('motivacion')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('La motivación no puede superar 500 caracteres')
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
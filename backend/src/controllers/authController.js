import User from '../models/User.js';
import { generateTokens, verifyRefreshToken } from '../utils/tokenService.js';
import {
  isValidEmail,
  isValidSpanishDocument,
  isValidPhone,
  isOldEnough,
  isStrongPassword,
  sanitizeString
} from '../utils/validators.js';
import logger from '../config/logger.js';
import EmailService from '../services/emailService.js';
import SolicitudSocio from '../models/SolicitudSocio.js';

/**
 * Controlador de Autenticación
 * Maneja registro, login, refresh tokens y logout
 */

/**
 * Registro de usuario básico
 * POST /api/auth/register/basic
 */
export const registerBasic = async (req, res) => {
  try {
    const {
      email,
      password,
      nombre,
      apellidos,
      telefono,
      fecha_nacimiento,
      dni
    } = req.body;

    // Validaciones
    if (!email || !password || !nombre || !apellidos || !telefono || !fecha_nacimiento || !dni) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Validar email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar contraseña
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    // Validar DNI/NIE
    if (!isValidSpanishDocument(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI o NIE inválido'
      });
    }

    // Validar teléfono
    if (!isValidPhone(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono inválido'
      });
    }

    // Validar edad mínima (18 años)
    const edadMinima = parseInt(process.env.EDAD_MINIMA) || 18;
    if (!isOldEnough(fecha_nacimiento, edadMinima)) {
      return res.status(400).json({
        success: false,
        message: `Debes tener al menos ${edadMinima} años para registrarte`
      });
    }

    // Verificar si el email ya existe
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar si el DNI ya está registrado
    const dniExists = await User.dniExists(dni);
    if (dniExists) {
      return res.status(409).json({
        success: false,
        message: 'El DNI ya está registrado en el sistema'
      });
    }

    // Obtener IP del cliente
    const ip_registro = req.ip || req.connection.remoteAddress;

    // Crear usuario
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      nombre: sanitizeString(nombre),
      apellidos: sanitizeString(apellidos),
      telefono: telefono.replace(/\s/g, ''),
      fecha_nacimiento,
      dni: dni.toUpperCase(),
      role: 'basico',
      ip_registro
    };

    const user = await User.create(userData);

    // 📧 Enviar email de bienvenida (no bloquea la respuesta)
    EmailService.sendWelcomeEmail(user).catch((emailError) => {
      logger.error('Error al enviar email de bienvenida:', emailError);
    });

    // Generar tokens
    const tokens = generateTokens(user);

    // Respuesta sin datos sensibles
    const sanitizedUser = User.sanitizeUser(user);

    logger.info('Usuario básico registrado', {
      userId: user.id,
      email: user.email
    });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: sanitizedUser,
        ...tokens
      }
    });

  } catch (error) {
    logger.error('Error en registerBasic:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Registro directo como socio
 * POST /api/auth/register/socio
 * TODO: Implementar cuando tengamos el modelo Socio y Stripe
 */
export const registerSocio = async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      message: 'Funcionalidad en desarrollo. Por ahora regístrate como usuario básico y actualiza a socio desde tu perfil'
    });
  } catch (error) {
    logger.error('Error en registerSocio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar socio'
    });
  }
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario por email
    const user = await User.findByEmail(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta con soporte'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar tokens
    const tokens = generateTokens(user);

    // Respuesta sin datos sensibles
    const sanitizedUser = User.sanitizeUser(user);

    logger.info('Login exitoso', {
      userId: user.id,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: sanitizedUser,
        ...tokens
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Renovar access token usando refresh token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token es obligatorio'
      });
    }

    // Verificar refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    // Buscar usuario
    const user = await User.findById(decoded.id);

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Generar nuevos tokens
    const tokens = generateTokens(user);

    return res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      data: tokens
    });

  } catch (error) {
    logger.error('Error en refreshToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al renovar token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout de usuario
 * POST /api/auth/logout
 * TODO: Implementar blacklist de tokens cuando tengamos Redis o tabla sessions
 */
export const logout = async (req, res) => {
  try {
    // Por ahora, el logout se maneja en el cliente eliminando los tokens
    // En el futuro, implementaremos una blacklist de tokens

    return res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    logger.error('Error en logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

/**
 * Verificar si un email existe (útil para validación en frontend)
 * GET /api/auth/check-email/:email
 */
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    const exists = await User.emailExists(email.toLowerCase().trim());

    return res.status(200).json({
      success: true,
      data: {
        exists,
        available: !exists
      }
    });

  } catch (error) {
    logger.error('Error en checkEmail:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar email'
    });
  }
};

/**
 * ================================================================
 * REGISTRO DE ADMINISTRADOR (PROTEGIDO CON adminSecret)
 * ================================================================
 * POST /api/auth/register/admin
 * 
 * Requiere adminSecret en el body para poder crear un admin.
 * El middleware validateAdminSecret verifica el secret antes de llegar aquí.
 */
export const registerAdmin = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      nombre, 
      apellidos,
      telefono,
      fecha_nacimiento,
      dni
    } = req.body;

    // Validaciones básicas - solo campos obligatorios
    if (!email || !password || !nombre || !apellidos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: email, password, nombre, apellidos'
      });
    }

    // Validar email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar contraseña
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    // Verificar que el email no exista
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Obtener IP del cliente
    const ip_registro = req.ip || req.connection.remoteAddress;

    // Crear usuario admin
    // ✅ IMPORTANTE: Convertir undefined a null para MySQL
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      nombre: sanitizeString(nombre),
      apellidos: sanitizeString(apellidos),
      telefono: telefono ? telefono.replace(/\s/g, '') : null,           // ✅ undefined → null
      fecha_nacimiento: fecha_nacimiento || null,                        // ✅ undefined → null
      dni: dni ? dni.toUpperCase() : null,                               // ✅ undefined → null
      role: 'admin',                                                     // ✅ ROL DE ADMIN
      idioma_preferido: 'es',
      ip_registro
    };

    const user = await User.create(userData);

    // Respuesta sin datos sensibles
    const sanitizedUser = User.sanitizeUser(user);

    logger.info('Administrador registrado exitosamente', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Administrador registrado exitosamente',
      data: {
        user: sanitizedUser
      }
    });

  } catch (error) {
    logger.error('Error en registerAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar administrador',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ================================================================
 * FORGOT PASSWORD - Solicitar reset de contraseña
 * ================================================================
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
 
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }
 
    const user = await User.findByEmail(email);
 
    // Por seguridad, siempre responder lo mismo independientemente
    // de si el email existe o no
    const genericMessage = 'Si el email existe, recibirás instrucciones para recuperar tu contraseña';
 
    if (!user) {
      logger.info('Intento de reset para email no existente:', { email });
      return res.status(200).json({ success: true, message: genericMessage });
    }
 
    // Generar token aleatorio
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
 
    // Hashear el token para guardarlo en BD
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
 
    // Expiración en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
 
    // Guardar token hasheado en BD
    await User.savePasswordResetToken(user.id, hashedToken, expiresAt);
 
    // Intentar enviar email — no bloqueante:
    // si falla, el token ya está guardado y el usuario puede reintentar
    EmailService.sendPasswordReset(user, resetToken)
      .then((emailResult) => {
        if (!emailResult.success) {
          logger.warn('Email de reset no enviado (mock o error SMTP):', { userId: user.id });
        } else {
          logger.info('Email de reset enviado:', { userId: user.id, email: user.email });
        }
      })
      .catch((emailError) => {
        logger.error('Error inesperado enviando email de reset:', {
          userId: user.id,
          error: emailError.message
        });
        // No interrumpimos el flujo — el token está guardado
      });
 
    return res.status(200).json({ success: true, message: genericMessage });
 
  } catch (error) {
    logger.error('Error en forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de recuperación'
    });
  }
};

/**
 * ================================================================
 * RESET PASSWORD - Confirmar nueva contraseña con token
 * ================================================================
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y contraseña son requeridos'
      });
    }

    // Validar fortaleza de la contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      });
    }

    // Hashear el token recibido
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con ese token válido
    const user = await User.findByValidResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Actualizar la contraseña
    await User.updatePassword(user.id, newPassword);

    // Limpiar el token
    await User.clearPasswordResetToken(user.id);

    logger.info('Contraseña reseteada exitosamente:', { userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    logger.error('Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resetear la contraseña'
    });
  }
};

/**
 * Crear solicitud de socio (nuevo flujo de registro)
 * POST /api/auth/solicitud-socio
 *
 * Recibe FormData con campos de texto + imágenes DNI (multer)
 * No crea el usuario — crea una solicitud pendiente de aprobación admin
 */
export const crearSolicitud = async (req, res) => {
  try {
    const {
      nombre,
      apellidos,
      email,
      password,
      telefono,
      fecha_nacimiento,
      dni,
      motivacion
    } = req.body;

    // ── Validar que llegó al menos la cara delantera del DNI ──────
    if (!req.files?.dni_front?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir la cara delantera del DNI'
      });
    }

    // ── Comprobar que el email no está ya en users ────────────────
    const emailEnUsers = await User.emailExists(email);
    if (emailEnUsers) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // ── Comprobar que el DNI no está ya registrado en users ──────
    const dniEnUsers = await User.dniExists(dni);
    if (dniEnUsers) {
      return res.status(409).json({
        success: false,
        message: 'El DNI ya está registrado en el sistema'
      });
    }

    // ── Comprobar que no hay solicitud pendiente ya enviada ───────
    const solicitudPendiente = await SolicitudSocio.existePendiente(
      email.toLowerCase().trim(),
      dni
    );
    if (solicitudPendiente) {
      return res.status(409).json({
        success: false,
        message: 'Ya tienes una solicitud pendiente con ese email o DNI. Espera a que sea revisada.'
      });
    }

    // ── Rutas relativas de los archivos subidos ───────────────────
    const dniBasePath = 'uploads/solicitudes/';
    const dni_front_url = dniBasePath + req.files.dni_front[0].filename;
    const dni_back_url  = req.files?.dni_back?.[0]
      ? dniBasePath + req.files.dni_back[0].filename
      : null;

    // ── Crear la solicitud ────────────────────────────────────────
    const solicitud = await SolicitudSocio.create({
      nombre:          sanitizeString(nombre),
      apellidos:       sanitizeString(apellidos),
      email:           email.toLowerCase().trim(),
      password,                                    // SolicitudSocio.create hashea aquí
      telefono:        telefono.replace(/\s/g, ''),
      fecha_nacimiento,
      dni:             dni.toUpperCase(),
      dni_front_url,
      dni_back_url,
      motivacion:      motivacion || null,
      ip_solicitud:    req.ip || req.connection?.remoteAddress
    });

    // ── Emails ────────────────────────────────────────────────────
    // No usamos await aquí a propósito: si Brevo tarda o falla, no
    // queremos que el usuario se quede esperando la respuesta HTTP.
    // El error (si lo hay) solo se registra en el log.
    EmailService.sendSolicitudRecibida(solicitud).catch((emailError) => {
      logger.error('Error al enviar email solicitud-recibida:', emailError);
    });

    EmailService.sendAvisoNuevaSolicitudAdmins(solicitud).catch((emailError) => {
      logger.error('Error al enviar email aviso-admins:', emailError);
    });

    logger.info('Nueva solicitud de socio creada', {
      solicitudId: solicitud.id,
      email: solicitud.email,
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Solicitud enviada correctamente. Recibirás un email cuando sea revisada por nuestro equipo.',
      data: {
        solicitudId: solicitud.id,
        email:       solicitud.email
      }
    });

  } catch (error) {
    logger.error('Error en crearSolicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al enviar la solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  registerBasic,
  registerSocio,
  crearSolicitud,
  login,
  refreshToken,
  logout,
  checkEmail,
  registerAdmin,
  forgotPassword,
  resetPassword
};
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
import { registrarActividad, getIpFromRequest } from '../utils/activityLogger.js';

// Registro, login, tokens y recuperación de contraseña

/**
 * Registro de usuario básico
 * POST /api/auth/register/basic
 */
export const registerBasic = async (req, res) => {
  // Desactivado: creaba cuentas sin aprobación del admin. El alta va por
  // POST /api/auth/solicitud-socio.
  return res.status(410).json({
    success: false,
    message: 'Este método de registro ya no está disponible. Usa el formulario de solicitud de socio.'
  });
};

/**
 * Registro directo como socio (sin implementar)
 * POST /api/auth/register/socio
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    const user = await User.findByEmail(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta con soporte'
      });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const tokens = generateTokens(user);

    // Respuesta sin datos sensibles
    const sanitizedUser = User.sanitizeUser(user);

    logger.info('Login exitoso', {
      userId: user.id
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

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

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
 * Logout
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // El cliente borra los tokens; no hay lista negra en el servidor

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
 * Comprobar si un email ya existe
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
 * Registro de administrador (validateAdminSecret comprueba adminSecret antes)
 * POST /api/auth/register/admin
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

    if (!email || !password || !nombre || !apellidos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: email, password, nombre, apellidos'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const ip_registro = req.ip || req.connection.remoteAddress;

    // mysql2 no acepta undefined: los opcionales van como null
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      nombre: sanitizeString(nombre),
      apellidos: sanitizeString(apellidos),
      telefono: telefono ? telefono.replace(/\s/g, '') : null,
      fecha_nacimiento: fecha_nacimiento || null,
      dni: dni ? dni.toUpperCase() : null,
      role: 'admin',
      idioma_preferido: 'es',
      ip_registro
    };

    const user = await User.create(userData);

    // Respuesta sin datos sensibles
    const sanitizedUser = User.sanitizeUser(user);

    logger.info('Administrador registrado exitosamente', {
      userId: user.id,
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
 * Solicitar el reset de contraseña
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
 
    // Misma respuesta exista o no el email, para no revelar cuentas
    const genericMessage = 'Si el email existe, recibirás instrucciones para recuperar tu contraseña';
 
    if (!user) {
      logger.info('Intento de reset de contraseña para un email no registrado');
      return res.status(200).json({ success: true, message: genericMessage });
    }
 
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
 
    // En la BD solo se guarda el hash del token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
 
    // Caduca en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
 
    await User.savePasswordResetToken(user.id, hashedToken, expiresAt);
 
    // Si el email falla, el token ya está guardado y se puede reintentar
    EmailService.sendPasswordReset(user, resetToken)
      .then((emailResult) => {
        if (!emailResult.success) {
          logger.warn('Email de reset no enviado (mock o error SMTP):', { userId: user.id });
        } else {
          logger.info('Email de reset enviado', { userId: user.id });
        }
      })
      .catch((emailError) => {
        logger.error('Error inesperado enviando email de reset:', {
          userId: user.id,
          error: emailError.message
        });
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
 * Cambiar la contraseña con el token del email
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

    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findByValidResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    await User.updatePassword(user.id, newPassword);

    // El token solo sirve una vez
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
 * Solicitud de socio con fotos del DNI. Queda pendiente de aprobar; el
 * usuario se crea al aprobarla.
 * POST /api/auth/solicitud-socio
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
      motivacion,
      invitado_por,
      evento_interes
    } = req.body;

    // Al menos la cara delantera del DNI
    if (!req.files?.dni_front?.[0]) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir la cara delantera del DNI'
      });
    }

    const emailEnUsers = await User.emailExists(email);
    if (emailEnUsers) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const dniEnUsers = await User.dniExists(dni);
    if (dniEnUsers) {
      return res.status(409).json({
        success: false,
        message: 'El DNI ya está registrado en el sistema'
      });
    }

    // Una sola solicitud pendiente por email o DNI
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

    const dniBasePath = 'uploads/solicitudes/';
    const dni_front_url = dniBasePath + req.files.dni_front[0].filename;
    const dni_back_url  = req.files?.dni_back?.[0]
      ? dniBasePath + req.files.dni_back[0].filename
      : null;

    const solicitud = await SolicitudSocio.create({
      nombre:          sanitizeString(nombre),
      apellidos:       sanitizeString(apellidos),
      email:           email.toLowerCase().trim(),
      password, // se hashea en SolicitudSocio.create
      telefono:        telefono.replace(/\s/g, ''),
      fecha_nacimiento,
      dni:             dni.toUpperCase(),
      dni_front_url,
      dni_back_url,
      motivacion:      motivacion || null,
      invitado_por:    invitado_por ? sanitizeString(invitado_por) : null,
      evento_interes:  evento_interes ? sanitizeString(evento_interes) : null,
      ip_solicitud:    req.ip || req.connection?.remoteAddress
    });

    // Sin await: si Brevo tarda o falla, la respuesta no espera
    EmailService.sendSolicitudRecibida(solicitud).catch((emailError) => {
      logger.error('Error al enviar email solicitud-recibida:', emailError);
    });

    EmailService.sendAvisoNuevaSolicitudAdmins(solicitud).catch((emailError) => {
      logger.error('Error al enviar email aviso-admins:', emailError);
    });

    logger.info('Nueva solicitud de socio creada', {
      solicitudId: solicitud.id,
      ip: req.ip
    });

    registrarActividad({
      userId: null,
      accion: 'crear',
      entidadTipo: 'socio',
      entidadId: solicitud.id,
      descripcion: `${sanitizeString(nombre)} ${sanitizeString(apellidos)} envió una solicitud de registro`,
      ipAddress: getIpFromRequest(req),
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
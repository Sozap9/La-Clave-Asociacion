import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * ================================================================
 * CONFIGURACIÓN DE TRANSPORTERS — BREVO SMTP
 * ================================================================
 *
 * Tres remitentes con propósito diferente:
 *
 *   noreply  → emails automáticos sin necesidad de respuesta
 *              (confirmaciones, recordatorios, recuperar contraseña)
 *
 *   support  → emails donde el usuario puede necesitar responder
 *              (solicitud recibida, aprobación, rechazo)
 *
 *   admin    → notificaciones internas para el equipo admin
 *              (nueva solicitud pendiente, avisos de contacto)
 *
 * En desarrollo / pruebas: los tres usan el mismo correo configurado
 * en EMAIL_NOREPLY / EMAIL_SUPPORT / EMAIL_ADMIN (pueden ser iguales).
 * En producción: cada uno apunta a su dirección real del dominio.
 *
 * Variables de entorno necesarias:
 *   BREVO_SMTP_HOST   smtp-relay.brevo.com
 *   BREVO_SMTP_PORT   587
 *   BREVO_SMTP_USER   tu email de login en Brevo
 *   BREVO_SMTP_KEY    xsmtpsib-xxxxxxxxxxxx
 *   EMAIL_FROM_NAME   La Clave Asociación
 *   EMAIL_NOREPLY     noreply@tudominio.com  (o tu correo en pruebas)
 *   EMAIL_SUPPORT     support@tudominio.com
 *   EMAIL_ADMIN       admin@tudominio.com
 * ================================================================
 */

// ─── Detección de modo mock (sin credenciales configuradas) ──────────────────
const isConfigured = () =>
  !!(
    process.env.BREVO_SMTP_HOST &&
    process.env.BREVO_SMTP_USER &&
    process.env.BREVO_SMTP_KEY
  );

// ─── Transporter mock para desarrollo ───────────────────────────────────────
const createMockTransporter = (label) => ({
  sendMail: async (mailOptions) => {
    logger.info(`[MOCK — ${label}] Email que se enviaría:`, {
      from:    mailOptions.from,
      to:      mailOptions.to,
      subject: mailOptions.subject,
    });
    return { messageId: `mock-${label}-${Date.now()}` };
  },
  verify: async () => true,
});

// ─── Transporter real Brevo ──────────────────────────────────────────────────
const createBrevoTransporter = (fromAddress) => {
  const port = parseInt(process.env.BREVO_SMTP_PORT || '587');
  // Puerto 465 = SSL directo (secure: true). Puerto 587/25 = STARTTLS (secure: false).
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host:   process.env.BREVO_SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
    tls: {
      rejectUnauthorized: true,
    },
    // Forzar IPv4: en algunas plataformas (Railway incluido) el contenedor
    // intenta primero IPv6 y, si no hay ruta, se cuelga hasta hacer
    // timeout en vez de caer a IPv4. Esto evita ese problema.
    family: 4,
    // Timeouts cortos: si Brevo no responde, fallamos rápido en vez de
    // dejar la petición colgada esperando indefinidamente (ver ETIMEDOUT).
    connectionTimeout: 10000, // 10s para establecer conexión TCP
    greetingTimeout: 10000,   // 10s para el saludo SMTP inicial
    socketTimeout: 15000,     // 15s de inactividad en el socket
  });

  return transporter;
};

// ─── Verificar conexión SMTP al arrancar ─────────────────────────────────────
const verifyTransporter = async (transporter, label) => {
  if (!isConfigured()) return;

  try {
    await transporter.verify();
    logger.info(`SMTP [${label}] conectado — ${process.env.BREVO_SMTP_HOST}`);
  } catch (error) {
    // ── Línea modificada: muestra el error completo para diagnóstico ──
    logger.error(`SMTP [${label}] error de conexión:`, {
      message: error.message,
      code:    error.code,
      command: error.command,
    });
  }
};

// ─── Crear los tres transporters ─────────────────────────────────────────────
let noreplyTransporter;
let supportTransporter;
let adminTransporter;

if (isConfigured()) {
  noreplyTransporter = createBrevoTransporter(process.env.EMAIL_NOREPLY);
  supportTransporter = createBrevoTransporter(process.env.EMAIL_SUPPORT);
  adminTransporter   = createBrevoTransporter(process.env.EMAIL_ADMIN);

  // Verificar solo el noreply al arrancar (los tres usan las mismas credenciales)
  verifyTransporter(noreplyTransporter, 'noreply');
} else {
  logger.warn(' BREVO_SMTP_KEY no configurada — los emails se mostrarán en consola (modo mock)');
  logger.warn('   Configura BREVO_SMTP_HOST, BREVO_SMTP_USER y BREVO_SMTP_KEY en el .env');

  noreplyTransporter = createMockTransporter('noreply');
  supportTransporter = createMockTransporter('support');
  adminTransporter   = createMockTransporter('admin');
}

// ─── Helpers para FROM ────────────────────────────────────
const fromName = () => process.env.EMAIL_FROM_NAME || 'La Clave Asociación';

export const fromNoreply = () =>
  `"${fromName()}" <${process.env.EMAIL_NOREPLY || 'noreply@laclave.com'}>`;

export const fromSupport = () =>
  `"${fromName()}" <${process.env.EMAIL_SUPPORT || 'support@laclave.com'}>`;

export const fromAdmin = () =>
  `"${fromName()} — Admin" <${process.env.EMAIL_ADMIN || 'admin@laclave.com'}>`;

// ─── Exportaciones ────────────────────────────────────────────────────────────
export {
  noreplyTransporter,
  supportTransporter,
  adminTransporter,
};

export default noreplyTransporter;
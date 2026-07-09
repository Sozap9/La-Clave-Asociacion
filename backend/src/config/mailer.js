import logger from './logger.js';

/**
 * ================================================================
 * CONFIGURACIÓN DE ENVÍO DE EMAILS — BREVO API HTTP
 * ================================================================
 * Cambiado de SMTP a la API HTTP de Brevo (https://api.brevo.com) porque
 * Railway no consigue completar la conexión SMTP saliente (ETIMEDOUT
 * persistente en los puertos 587 y 465, incluso forzando IPv4). La API
 * HTTP va por HTTPS (puerto 443), que nunca se bloquea, y es el método
 * que Brevo recomienda para plataformas cloud/serverless.
 *
 * Mantiene la misma interfaz que antes (transporter.sendMail(mailOptions))
 * para no tener que tocar emailService.js ni ningún controlador.
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
 * Variables de entorno necesarias:
 *   BREVO_API_KEY     xkeysib-xxxxxxxxxxxx  (API Key, NO la clave SMTP)
 *   EMAIL_FROM_NAME   La Clave Asociación
 *   EMAIL_NOREPLY     noreply@tudominio.com
 *   EMAIL_SUPPORT     support@tudominio.com
 *   EMAIL_ADMIN       admin@tudominio.com
 *
 * La API Key se genera en Brevo → Settings (icono engranaje) → SMTP & API
 * → pestaña "API Keys" → "Generate a new API key". Es distinta de la
 * BREVO_SMTP_KEY que usábamos antes.
 * ================================================================
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ─── Detección de modo mock (sin API key configurada) ────────────────────────
const isConfigured = () => !!process.env.BREVO_API_KEY;

// ─── Parsear el formato '"Nombre" <email@dominio.com>' a {name, email} ───────
const parseFromAddress = (fromAddress) => {
  const match = /^"?([^"<]*)"?\s*<(.+)>$/.exec(fromAddress || '');
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: process.env.EMAIL_FROM_NAME || 'La Clave Asociación', email: fromAddress };
};

// ─── Parsear el campo 'to' (string simple o 'a@x.com, b@x.com') a array ──────
const parseToAddresses = (to) => {
  if (Array.isArray(to)) return to.map((email) => ({ email: email.trim() }));
  return to
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
};

// ─── Transporter mock para desarrollo (sin API key configurada) ─────────────
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

// ─── Convertir attachments estilo nodemailer al formato de Brevo API ────────
// Brevo no tiene un campo "cid" separado: para imágenes inline, el "name"
// del adjunto tiene que coincidir exactamente con lo que se usa después de
// "cid:" en el HTML (ej. <img src="cid:qr-123">  →  name: "qr-123").
const convertAttachments = (attachments) => {
  if (!attachments || attachments.length === 0) return undefined;

  return attachments.map((att) => {
    let base64Content;
    if (Buffer.isBuffer(att.content)) {
      base64Content = att.content.toString('base64');
    } else if (typeof att.content === 'string') {
      // Puede venir ya en base64, o como texto plano
      base64Content = Buffer.from(att.content).toString('base64');
    } else {
      base64Content = '';
    }

    return {
      name: att.cid || att.filename || 'adjunto',
      content: base64Content,
    };
  });
};

// ─── Transporter real vía API HTTP de Brevo ──────────────────────────────────
const createBrevoApiTransporter = (label) => ({
  sendMail: async (mailOptions) => {
    const sender = parseFromAddress(mailOptions.from);
    const recipients = parseToAddresses(mailOptions.to);
    const attachment = convertAttachments(mailOptions.attachments);

    const body = {
      sender,
      to: recipients,
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
      ...(attachment ? { attachment } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `Brevo API [${label}] respondió ${response.status}: ${data?.message || JSON.stringify(data)}`,
        );
      }

      return { messageId: data.messageId || `brevo-${Date.now()}` };
    } finally {
      clearTimeout(timeout);
    }
  },
  verify: async () => {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY, Accept: 'application/json' },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        `Brevo API key inválida o sin permisos (status ${response.status}): ${data?.message || JSON.stringify(data)}`,
      );
    }
    return true;
  },
});

// ─── Verificar conexión con Brevo al arrancar ────────────────────────────────
const verifyTransporter = async (transporter, label) => {
  if (!isConfigured()) return;

  try {
    await transporter.verify();
    logger.info(`Brevo API [${label}] conectado correctamente`);
  } catch (error) {
    logger.error(`Brevo API [${label}] error de conexión:`, {
      message: error.message,
    });
  }
};

// ─── Crear los tres transporters ─────────────────────────────────────────────
let noreplyTransporter;
let supportTransporter;
let adminTransporter;

if (isConfigured()) {
  noreplyTransporter = createBrevoApiTransporter('noreply');
  supportTransporter = createBrevoApiTransporter('support');
  adminTransporter   = createBrevoApiTransporter('admin');

  verifyTransporter(noreplyTransporter, 'noreply');
} else {
  logger.warn(' BREVO_API_KEY no configurada — los emails se mostrarán en consola (modo mock)');
  logger.warn('   Genera una API Key en Brevo → Settings → SMTP & API → API Keys, y añádela como BREVO_API_KEY');

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
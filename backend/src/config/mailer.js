import logger from './logger.js';

/**
 * Emails por la API HTTP de Brevo: Railway bloquea el SMTP saliente (587/465).
 * Mantiene la interfaz transporter.sendMail(mailOptions).
 * Remitentes: noreply (automáticos), support (el usuario puede responder) y
 * admin (avisos internos). BREVO_API_KEY es la API key, no la clave SMTP.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Detección de modo mock (sin API key configurada)
const isConfigured = () => !!process.env.BREVO_API_KEY;

// Parsear el formato '"Nombre" <email@dominio.com>' a {name, email}
const parseFromAddress = (fromAddress) => {
  const match = /^"?([^"<]*)"?\s*<(.+)>$/.exec(fromAddress || '');
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: process.env.EMAIL_FROM_NAME || 'La Clave Asociación', email: fromAddress };
};

// Parsear el campo 'to' (string simple o 'a@x.com, b@x.com') a array
const parseToAddresses = (to) => {
  if (Array.isArray(to)) return to.map((email) => ({ email: email.trim() }));
  return to
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }));
};

// Transporter mock para desarrollo (sin API key configurada)
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

// Transporter real vía API HTTP de Brevo
const createBrevoApiTransporter = (label) => ({
  sendMail: async (mailOptions) => {
    const sender = parseFromAddress(mailOptions.from);
    const recipients = parseToAddresses(mailOptions.to);

    const body = {
      sender,
      to: recipients,
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
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

// Verificar conexión con Brevo al arrancar
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

// Crear los tres transporters
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

// Helpers para FROM
const fromName = () => process.env.EMAIL_FROM_NAME || 'La Clave Asociación';

export const fromNoreply = () =>
  `"${fromName()}" <${process.env.EMAIL_NOREPLY || 'noreply@laclave.com'}>`;

export const fromSupport = () =>
  `"${fromName()}" <${process.env.EMAIL_SUPPORT || 'support@laclave.com'}>`;

export const fromAdmin = () =>
  `"${fromName()} — Admin" <${process.env.EMAIL_ADMIN || 'admin@laclave.com'}>`;

// Exportaciones
export {
  noreplyTransporter,
  supportTransporter,
  adminTransporter,
};

export default noreplyTransporter;
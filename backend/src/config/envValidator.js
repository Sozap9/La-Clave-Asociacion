// Comprueba las variables de entorno al arrancar

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
  'FRONTEND_URL'
];

const optionalEnvVars = [
  'DB_PORT',
  'JWT_EXPIRE',
  'JWT_REFRESH_EXPIRE',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  // Brevo
  'BREVO_SMTP_HOST',
  'BREVO_SMTP_PORT',
  'BREVO_SMTP_USER',
  'BREVO_SMTP_KEY',
  'EMAIL_FROM_NAME',
  'EMAIL_NOREPLY',
  'EMAIL_SUPPORT',
  'EMAIL_ADMIN',
  'ADMIN_NOTIFICATION_EMAILS',
  // App
  'MAX_FILE_SIZE',
  'UPLOAD_PATH',
  'MAX_SOCIOS',
  'CUOTA_MENSUAL_SOCIO',
  'EDAD_MINIMA'
];

/**
 * Valida que todas las variables obligatorias estén definidas
 * @throws {Error} Si falta alguna variable obligatoria
 */
export const validateEnv = () => {
  const missingVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error('\nERROR: Faltan variables de entorno obligatorias:\n');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n Copia .env.example a .env y configura los valores\n');
    process.exit(1);
  }

  // Opcionales pero recomendadas
  const warnings = [];

  // Sin clave de Brevo los emails no salen
  const brevoVars = ['BREVO_SMTP_HOST', 'BREVO_SMTP_USER', 'BREVO_SMTP_KEY'];
  const missingBrevoVars = brevoVars.filter(v => !process.env[v]);

  if (missingBrevoVars.length > 0) {
    warnings.push(
      `Brevo SMTP (modo mock activo) — faltan: ${missingBrevoVars.join(', ')} — los emails se loguearán en consola pero NO se enviarán`
    );
  }

  if (!process.env.ADMIN_NOTIFICATION_EMAILS) {
    warnings.push(
      'ADMIN_NOTIFICATION_EMAILS no configurado — los admins NO recibirán aviso de nuevas solicitudes de socio'
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET — los webhooks de Stripe no se procesarán');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n  ADVERTENCIA: Variables opcionales no configuradas:\n');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('\n');
  }

  validateJWTSecrets();
  validateStripeKeys();
  validateURLs();

  console.log('Variables de entorno validadas correctamente\n');
};

// Secretos JWT suficientemente largos
const validateJWTSecrets = () => {
  const minLength = 32;

  if (process.env.JWT_SECRET.length < minLength) {
    console.warn(`JWT_SECRET debería tener al menos ${minLength} caracteres para mayor seguridad`);
  }

  if (process.env.JWT_REFRESH_SECRET.length < minLength) {
    console.warn(`JWT_REFRESH_SECRET debería tener al menos ${minLength} caracteres para mayor seguridad`);
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error('ERROR: JWT_SECRET y JWT_REFRESH_SECRET NO deben ser iguales');
    process.exit(1);
  }
};

// Claves de Stripe acordes al entorno
const validateStripeKeys = () => {
  const { NODE_ENV, STRIPE_SECRET_KEY } = process.env;

  if (NODE_ENV === 'production' && STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.warn('ADVERTENCIA: Estás usando claves de TEST de Stripe en producción.');
    console.warn('   Los pagos NO serán reales hasta que cambies a claves LIVE (sk_live_...).');
    console.warn('   Esto es intencional mientras completas la verificación de tu cuenta en Stripe.');
  }

  if (NODE_ENV === 'development' && STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.warn('ADVERTENCIA: Estás usando claves de LIVE de Stripe en desarrollo');
    console.warn('   Se recomienda usar claves de TEST (sk_test_...)');
  }
};

// URLs bien formadas
const validateURLs = () => {
  const { FRONTEND_URL, BACKEND_URL } = process.env;

  const urlRegex = /^https?:\/\/.+/;

  if (FRONTEND_URL && !urlRegex.test(FRONTEND_URL)) {
    console.error(`ERROR: FRONTEND_URL tiene formato inválido: ${FRONTEND_URL}`);
    console.error('   Debe comenzar con http:// o https://');
    process.exit(1);
  }

  if (BACKEND_URL && !urlRegex.test(BACKEND_URL)) {
    console.error(`ERROR: BACKEND_URL tiene formato inválido: ${BACKEND_URL}`);
    console.error('   Debe comenzar con http:// o https://');
    process.exit(1);
  }
};

export default { validateEnv };
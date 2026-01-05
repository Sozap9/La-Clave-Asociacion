/**
 * Validador de Variables de Entorno
 * Verifica que todas las variables obligatorias estén definidas al iniciar el servidor
 */

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
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
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

  // Verificar variables obligatorias
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error('\n❌ ERROR: Faltan variables de entorno obligatorias:\n');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📋 Copia .env.example a .env y configura los valores\n');
    process.exit(1);
  }

  // Advertencias sobre variables opcionales pero recomendadas
  const warnings = [];
  
  if (!process.env.EMAIL_HOST) {
    warnings.push('EMAIL_HOST - El sistema de notificaciones por email no funcionará');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET - Los webhooks de Stripe no se procesarán');
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n⚠️  ADVERTENCIA: Variables opcionales no configuradas:\n');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
    console.warn('\n');
  }

  // Validaciones adicionales
  validateJWTSecrets();
  validateStripeKeys();
  validateURLs();
  
  console.log('✅ Variables de entorno validadas correctamente\n');
};

/**
 * Valida que los secrets JWT sean seguros
 */
const validateJWTSecrets = () => {
  const minLength = 32;
  
  if (process.env.JWT_SECRET.length < minLength) {
    console.warn(`⚠️  JWT_SECRET debería tener al menos ${minLength} caracteres para mayor seguridad`);
  }
  
  if (process.env.JWT_REFRESH_SECRET.length < minLength) {
    console.warn(`⚠️  JWT_REFRESH_SECRET debería tener al menos ${minLength} caracteres para mayor seguridad`);
  }
  
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error('❌ ERROR: JWT_SECRET y JWT_REFRESH_SECRET NO deben ser iguales');
    process.exit(1);
  }
};

/**
 * Valida las claves de Stripe según el entorno
 */
const validateStripeKeys = () => {
  const { NODE_ENV, STRIPE_SECRET_KEY } = process.env;
  
  if (NODE_ENV === 'production' && STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.error('❌ ERROR: Estás usando claves de TEST de Stripe en PRODUCCIÓN');
    console.error('   Cambia a claves de LIVE (sk_live_...)');
    process.exit(1);
  }
  
  if (NODE_ENV === 'development' && STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.warn('⚠️  ADVERTENCIA: Estás usando claves de LIVE de Stripe en desarrollo');
    console.warn('   Se recomienda usar claves de TEST (sk_test_...)');
  }
};

/**
 * Valida que las URLs tengan formato correcto
 */
const validateURLs = () => {
  const { FRONTEND_URL, BACKEND_URL } = process.env;
  
  const urlRegex = /^https?:\/\/.+/;
  
  if (FRONTEND_URL && !urlRegex.test(FRONTEND_URL)) {
    console.error(`❌ ERROR: FRONTEND_URL tiene formato inválido: ${FRONTEND_URL}`);
    console.error('   Debe comenzar con http:// o https://');
    process.exit(1);
  }
  
  if (BACKEND_URL && !urlRegex.test(BACKEND_URL)) {
    console.error(`❌ ERROR: BACKEND_URL tiene formato inválido: ${BACKEND_URL}`);
    console.error('   Debe comenzar con http:// o https://');
    process.exit(1);
  }
};

export default { validateEnv };
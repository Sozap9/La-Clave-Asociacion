import morgan from 'morgan';
import logger from '../config/logger.js';

/**
 * Campos que nunca se escriben en los logs: contraseñas, tokens y
 * datos personales de socios y solicitudes.
 */
const CAMPOS_PRIVADOS = new Set([
  'password', 'confirmpassword', 'currentpassword', 'newpassword', 'password_hash',
  'token', 'refreshtoken', 'accesstoken',
  'nombre', 'apellidos', 'email', 'telefono', 'dni', 'fecha_nacimiento',
  'motivacion', 'invitado_por', 'evento_interes', 'direccion', 'mensaje',
]);

/**
 * Cuerpo de la petición para el log HTTP.
 * - En producción no se escribe nunca (solo método, URL, estado y tiempo).
 * - En desarrollo se escribe ocultando los campos privados.
 */
morgan.token('body', (req) => {
  if (process.env.NODE_ENV === 'production') return '-';
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    return '-';
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(req.body)) {
    sanitized[key] = CAMPOS_PRIVADOS.has(key.toLowerCase()) ? '[OCULTO]' : value;
  }
  return JSON.stringify(sanitized);
});

morgan.token('user', (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return 'guest';
});

/**
 * Middleware de logging HTTP
 */
export const httpLogger = morgan(
  ':method :url :status :response-time ms - :user - :body',
  {
    stream: logger.stream,
    skip: (req) => {
      // No loggear health check
      return req.url === '/health';
    }
  }
);

export default httpLogger;
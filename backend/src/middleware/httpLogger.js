import morgan from 'morgan';
import logger from '../config/logger.js';

// Campos que nunca van a los logs
const CAMPOS_PRIVADOS = new Set([
  'password', 'confirmpassword', 'currentpassword', 'newpassword', 'password_hash',
  'token', 'refreshtoken', 'accesstoken',
  'nombre', 'apellidos', 'email', 'telefono', 'dni', 'fecha_nacimiento',
  'motivacion', 'invitado_por', 'evento_interes', 'direccion', 'mensaje',
]);

// Body en el log: nunca en producción; en desarrollo, sin los campos privados
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

export const httpLogger = morgan(
  ':method :url :status :response-time ms - :user - :body',
  {
    stream: logger.stream,
    skip: (req) => {
      // Sin el health check
      return req.url === '/health';
    }
  }
);

export default httpLogger;
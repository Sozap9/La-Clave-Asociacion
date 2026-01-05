import morgan from 'morgan';
import logger from '../config/logger.js';

/**
 * Formato personalizado para logs HTTP
 * No muestra passwords ni tokens
 */
morgan.token('body', (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitized = { ...req.body };
    
    // Sanitizar campos sensibles
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.currentPassword) sanitized.currentPassword = '[REDACTED]';
    if (sanitized.newPassword) sanitized.newPassword = '[REDACTED]';
    if (sanitized.password_hash) sanitized.password_hash = '[REDACTED]';
    
    return JSON.stringify(sanitized);
  }
  return '-';
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
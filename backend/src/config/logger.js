import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de logs
const logsDir = path.join(__dirname, '../../logs');

/**
 * Formato personalizado para logs
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Añadir metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Añadir stack trace si es error
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

/**
 * Transportes para diferentes niveles de log
 */
const transports = [
  // Consola (solo en desarrollo muestra todo, en producción solo warn y error)
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  }),

  // Archivo para TODOS los logs (rotación diaria)
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Mantener logs de 14 días
    level: 'info',
    format: customFormat
  }),

  // Archivo solo para ERRORES (rotación diaria)
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d', // Mantener errores 30 días
    level: 'error',
    format: customFormat
  }),

  // Archivo para logs de HTTP (accesos)
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d', // Mantener 7 días
    level: 'http',
    format: customFormat
  })
];

/**
 * Logger principal
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

/**
 * Stream para Morgan (logging HTTP)
 */
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

export default logger;
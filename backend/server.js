import app from './src/app.js';
import { testConnection } from './src/config/database.js';
import dotenv from 'dotenv';
import { validateEnv } from './src/config/envValidator.js';
import logger from './src/config/logger.js';
import CronService from './src/services/cronService.js';
import PushService from './src/services/pushService.js';

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno
validateEnv();

const PORT = process.env.PORT || 5000;

/**
 * Iniciar servidor
 */
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    logger.info('Conectando a la base de datos...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }

    logger.info('✅ Conexión a MySQL establecida correctamente');
    logger.info(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    
    // ========== INICIALIZAR SERVICIOS ========== 
    logger.info('');
    logger.info('🔧 Inicializando servicios...');
    
    // Inicializar cron jobs (tareas programadas)
    CronService.init();
    
    // Inicializar servicio de push notifications
    PushService.init();
    
    logger.info('Servicios inicializados correctamente');
    logger.info('');
    // ===========================================

    // Iniciar servidor Express
    app.listen(PORT, () => {
      logger.info('');
      logger.info('========================================');
      logger.info('Servidor La Clave corriendo');
      logger.info(`Puerto: ${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`URL: http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info('========================================');
      logger.info('');
      logger.info('Servidor listo para recibir peticiones');
      logger.info('');
    });

  } catch (error) {
    logger.error('Error al iniciar el servidor', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando servidor...');
  CronService.stop(); // Detener tareas programadas
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido. Cerrando servidor...');
  CronService.stop(); // Detener tareas programadas
  process.exit(0);
});

// Iniciar servidor
startServer();
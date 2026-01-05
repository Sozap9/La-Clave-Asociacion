import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * ================================================================
 * CONFIGURACIÓN DEL SERVICIO DE EMAIL (NODEMAILER)
 * ================================================================
 */

/**
 * Crear transporter de Nodemailer
 */
const createTransporter = () => {
  // Verificar que las variables de entorno estén configuradas
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('⚠️  Configuración de email incompleta. Los emails NO se enviarán.');
    logger.warn('    Por favor configura EMAIL_HOST, EMAIL_USER y EMAIL_PASS en el archivo .env');
    
    // Retornar un transporter "mock" para desarrollo
    return {
      sendMail: async (mailOptions) => {
        logger.info('📧 [MODO DESARROLLO] Email que se enviaría:', {
          to: mailOptions.to,
          subject: mailOptions.subject
        });
        return { messageId: 'mock-message-id' };
      },
      verify: async () => {
        // ✅ IMPORTANTE: No lanzar error en modo mock
        return true;
      }
    };
  }

  // Configuración del transporter
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // ✅ CORRECTO: createTransport (sin "er")
  return nodemailer.createTransport(config);
};

const transporter = createTransporter();

/**
 * Verificar conexión con el servidor SMTP al iniciar
 */
const verifyConnection = async () => {
  // ✅ Solo verificar si hay configuración real de email
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // No hacer nada en modo mock
    return;
  }

  try {
    await transporter.verify();
    logger.info('✅ Servidor SMTP conectado y listo para enviar correos');
  } catch (error) {
    logger.error('❌ Error al conectar con el servidor SMTP:', error.message);
    logger.error('   Verifica la configuración de email en el archivo .env');
    // ✅ NO lanzar error, solo loggearlo
  }
};

// Verificar conexión al cargar el módulo
verifyConnection();

export default transporter;
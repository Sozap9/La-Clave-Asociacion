import PushService from '../services/pushService.js';
import logger from '../config/logger.js';

/**
 * ================================================================
 * CONTROLLER DE PUSH NOTIFICATIONS
 * ================================================================
 */

/**
 * Suscribir usuario a notificaciones push
 * POST /api/push/subscribe
 */
export const subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Datos de suscripción requeridos'
      });
    }

    if (!subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Formato de suscripción inválido'
      });
    }

    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Claves de suscripción incompletas'
      });
    }

    const result = await PushService.subscribe(userId, subscription);

    logger.info('Usuario suscrito a push notifications:', {
      userId,
      endpoint: subscription.endpoint.substring(0, 50) + '...'
    });

    return res.status(200).json({
      success: true,
      message: 'Suscripción a notificaciones activada correctamente',
      data: result
    });

  } catch (error) {
    logger.error('Error en subscribe:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al activar notificaciones'
    });
  }
};

/**
 * Desuscribir usuario de notificaciones push
 * POST /api/push/unsubscribe
 */
export const unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await PushService.unsubscribe(userId);

    logger.info('Usuario desuscrito de push notifications:', { userId });

    return res.status(200).json({
      success: true,
      message: 'Notificaciones desactivadas correctamente',
      data: result
    });

  } catch (error) {
    logger.error('Error en unsubscribe:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar notificaciones'
    });
  }
};

/**
 * Obtener clave pública VAPID
 * GET /api/push/vapid-key
 */
export const getVapidKey = async (req, res) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      return res.status(500).json({
        success: false,
        message: 'Claves VAPID no configuradas en el servidor'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        publicKey: vapidPublicKey
      }
    });

  } catch (error) {
    logger.error('Error en getVapidKey:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener clave VAPID'
    });
  }
};

/**
 * Enviar notificación de prueba
 * POST /api/push/test
 */
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const notification = {
      title: '🔔 Notificación de Prueba',
      body: '¡Las notificaciones push están funcionando correctamente!',
      icon: '/icon-192x192.png',
      data: {
        type: 'test',
        url: '/'
      }
    };

    const result = await PushService.sendToUser(userId, notification);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'No se pudo enviar la notificación'
      });
    }

    logger.info('Notificación de prueba enviada:', { userId });

    return res.status(200).json({
      success: true,
      message: 'Notificación de prueba enviada correctamente'
    });

  } catch (error) {
    logger.error('Error en sendTestNotification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al enviar notificación de prueba'
    });
  }
};

export default {
  subscribe,
  unsubscribe,
  getVapidKey,
  sendTestNotification
};
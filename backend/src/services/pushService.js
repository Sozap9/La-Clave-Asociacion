import webpush from 'web-push';
import { query } from '../config/database.js';
import logger from '../config/logger.js';

// Notificaciones push (PWA). Necesita claves VAPID
// (npx web-push generate-vapid-keys) y HTTPS en producción.
class PushService {
  
  // Configura web-push con las claves VAPID (desde server.js)
  static init() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@laclave.com';
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.warn('Claves VAPID no configuradas. Las notificaciones push no funcionarán.');
      logger.info('Genera claves con: npx web-push generate-vapid-keys');
      return;
    }
    
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    logger.info('Servicio de Push Notifications configurado');
  }
  
  // Guardar la suscripción al activar las notificaciones
  static async subscribe(userId, subscription) {
    try {
      const { endpoint, keys } = subscription;
      
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        throw new Error('Datos de suscripción incompletos');
      }
      
      const sql = `
        INSERT INTO push_subscriptions 
        (user_id, endpoint, keys_p256dh, keys_auth, active)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          endpoint = VALUES(endpoint),
          keys_p256dh = VALUES(keys_p256dh),
          keys_auth = VALUES(keys_auth),
          active = 1,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await query(sql, [userId, endpoint, keys.p256dh, keys.auth]);
      
      logger.info('Suscripción guardada:', { userId, endpoint: endpoint.substring(0, 50) + '...' });
      
      return { success: true, message: 'Suscripción guardada correctamente' };
      
    } catch (error) {
      logger.error('Error guardando suscripción:', error);
      throw error;
    }
  }
  
  // Borrar la suscripción al desactivarlas
  static async unsubscribe(userId) {
    try {
      const sql = `
        UPDATE push_subscriptions
        SET active = 0
        WHERE user_id = ?
      `;
      
      await query(sql, [userId]);
      
      logger.info('Suscripción desactivada:', { userId });
      
      return { success: true, message: 'Suscripción eliminada correctamente' };
      
    } catch (error) {
      logger.error('Error eliminando suscripción:', error);
      throw error;
    }
  }
  
  // A un usuario
  static async sendToUser(userId, notification) {
    try {
      const sql = `
        SELECT * FROM push_subscriptions
        WHERE user_id = ? AND active = 1
      `;
      
      const subscriptions = await query(sql, [userId]);
      
      if (subscriptions.length === 0) {
        logger.warn('Usuario sin suscripción activa:', { userId });
        return { success: false, message: 'Usuario no suscrito' };
      }
      
      const subscription = subscriptions[0];
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys_p256dh,
          auth: subscription.keys_auth
        }
      };
      
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: notification.badge || '/badge-72x72.png',
        data: notification.data || {},
        timestamp: Date.now()
      });
      
      await webpush.sendNotification(pushSubscription, payload);
      
      logger.info('Notificación enviada:', { userId, title: notification.title });
      
      return { success: true, message: 'Notificación enviada' };
      
    } catch (error) {
      // Endpoint caducado: se desactiva la suscripción
      if (error.statusCode === 410) {
        logger.warn('Endpoint inválido, desactivando suscripción:', { userId });
        await this.unsubscribe(userId);
      }
      
      logger.error('Error enviando notificación:', error);
      throw error;
    }
  }
  
  // A varios usuarios
  static async sendToMultiple(userIds, notification) {
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const userId of userIds) {
        try {
          await this.sendToUser(userId, notification);
          successCount++;
          
          // Pausa entre envíos
          await this.delay(50);
          
        } catch (error) {
          errorCount++;
        }
      }
      
      logger.info(`Notificaciones enviadas: ${successCount} exitosas, ${errorCount} errores`);
      
      return {
        success: true,
        sent: successCount,
        failed: errorCount,
        total: userIds.length
      };
      
    } catch (error) {
      logger.error('Error en envío masivo:', error);
      throw error;
    }
  }
  
  // A todos los socios activos
  static async sendToAllSocios(notification) {
    try {
      const sql = `
        SELECT DISTINCT s.user_id
        FROM socios s
        INNER JOIN push_subscriptions ps ON s.user_id = ps.user_id
        WHERE s.estado = 'activo'
          AND ps.active = 1
      `;
      
      const results = await query(sql);
      const userIds = results.map(r => r.user_id);
      
      if (userIds.length === 0) {
        logger.warn('No hay socios con notificaciones activas');
        return { success: false, message: 'No hay destinatarios' };
      }
      
      logger.info(`Enviando broadcast a ${userIds.length} socios`);
      
      return await this.sendToMultiple(userIds, notification);
      
    } catch (error) {
      logger.error('Error en broadcast:', error);
      throw error;
    }
  }
  
  // Notificaciones predefinidas
  
  // Nuevo evento publicado
  static async notifyNewEvent(event) {
    const notification = {
      title: 'Nuevo evento disponible',
      body: `${event.titulo} - ${new Date(event.fecha_evento).toLocaleDateString('es-ES')}`,
      icon: event.imagen_url || '/icon-192x192.png',
      data: {
        type: 'new_event',
        eventId: event.id,
        url: `/eventos/${event.id}`
      }
    };
    
    return await this.sendToAllSocios(notification);
  }
  
  // Recordatorio de evento (cron diario)
  static async notifyEventReminder(userId, event, booking) {
    const notification = {
      title: 'Recordatorio de evento',
      body: `Hoy es tu evento: ${event.titulo}. ¡No olvides tu código QR!`,
      icon: event.imagen_url || '/icon-192x192.png',
      data: {
        type: 'event_reminder',
        eventId: event.id,
        bookingId: booking.id,
        url: `/mis-reservas/${booking.codigo_reserva}`
      }
    };
    
    return await this.sendToUser(userId, notification);
  }
  
  // Evento cancelado
  static async notifyEventCancelled(userId, event) {
    const notification = {
      title: 'Evento cancelado',
      body: `El evento "${event.titulo}" ha sido cancelado. Se te ha reembolsado el importe.`,
      icon: '/icon-192x192.png',
      data: {
        type: 'event_cancelled',
        eventId: event.id,
        url: '/eventos'
      }
    };
    
    return await this.sendToUser(userId, notification);
  }
  
  // Reserva confirmada
  static async notifyBookingConfirmed(userId, event, booking) {
    const notification = {
      title: 'Reserva confirmada',
      body: `Tu reserva para "${event.titulo}" ha sido confirmada. Código: ${booking.codigo_reserva}`,
      icon: event.imagen_url || '/icon-192x192.png',
      data: {
        type: 'booking_confirmed',
        eventId: event.id,
        bookingId: booking.id,
        url: `/mis-reservas/${booking.codigo_reserva}`
      }
    };
    
    return await this.sendToUser(userId, notification);
  }
  
  // Pausa entre envíos
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PushService;
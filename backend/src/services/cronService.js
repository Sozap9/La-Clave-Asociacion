import cron from 'node-cron';
import logger from '../config/logger.js';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Socio from '../models/Socio.js';
import User from '../models/User.js';
import EmailService from './emailService.js';
import { query } from '../config/database.js';

/**
 * Tareas programadas (hora de Madrid): recordatorios del día (9:00), agenda
 * mensual (día 1, 8:00), morosidad (0:00), tokens caducados (3:00) y
 * reservas sin pagar (cada 15 min).
 */
class CronService {
  
  // Arranca todas las tareas (desde server.js)
  static init() {
    logger.info('Iniciando tareas programadas...');
    
    this.scheduleEventReminders();
    this.scheduleMonthlyAgenda();
    this.scheduleMorosityCheck();
    this.scheduleTokenCleanup();
    this.scheduleExpiredBookingsCleanup();
    
    logger.info('Tareas programadas iniciadas correctamente');
  }
  
  // Recordatorio a quien tiene entrada para hoy, a las 9:00
  static scheduleEventReminders() {
    cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('Ejecutando: Envío de recordatorios de eventos');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sql = `
          SELECT e.*, b.id as booking_id, b.socio_id, b.codigo_reserva,
                 u.email, u.nombre, u.apellidos, b.numero_entradas, b.qr_code_url
          FROM events e
          INNER JOIN bookings b ON e.id = b.event_id
          INNER JOIN socios s ON b.socio_id = s.id
          INNER JOIN users u ON s.user_id = u.id
          WHERE DATE(e.fecha_evento) = DATE(?)
            AND b.estado = 'confirmada'
            AND e.estado IN ('publicado', 'scheduled', 'active')
        `;
        
        const bookingsToday = await query(sql, [today]);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const booking of bookingsToday) {
          try {
            const user = {
              email: booking.email,
              nombre: booking.nombre,
              apellidos: booking.apellidos
            };
            
            const event = {
              titulo: booking.titulo,
              fecha_evento: booking.fecha_evento,
              hora_evento: booking.hora_evento,
              ubicacion: booking.ubicacion,
              direccion: booking.direccion
            };
            
            const bookingData = {
              codigo_reserva: booking.codigo_reserva,
              numero_entradas: booking.numero_entradas,
              qr_code_url: booking.qr_code_url
            };
            
            await EmailService.sendEventReminder(bookingData, event, user);
            successCount++;
            
            // Pausa entre emails para no saturar el envío
            await this.delay(100);
            
          } catch (emailError) {
            logger.error('Error enviando recordatorio:', {
              booking_id: booking.booking_id,
              error: emailError.message
            });
            errorCount++;
          }
        }
        
        logger.info(`Recordatorios enviados: ${successCount} exitosos, ${errorCount} errores`);
        
      } catch (error) {
        logger.error('Error en tarea de recordatorios:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('Tarea programada: Recordatorios de eventos (9:00 AM diario)');
  }
  
  // Agenda del mes a todos los socios, el día 1 a las 8:00
  static scheduleMonthlyAgenda() {
    cron.schedule('0 8 1 * *', async () => {
      try {
        logger.info('Ejecutando: Envío de agenda mensual');
        
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        
        const socios = await Socio.getAllActive();
        
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        const eventsSql = `
          SELECT * FROM events
          WHERE estado IN ('publicado', 'scheduled', 'active')
            AND fecha_evento >= ?
            AND fecha_evento <= ?
          ORDER BY fecha_evento ASC
        `;
        
        const events = await query(eventsSql, [firstDay, lastDay]);
        
        // Sin eventos no se envía nada
        if (events.length === 0) {
          logger.info('No hay eventos para este mes, no se envían agendas');
          return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const socio of socios) {
          try {
            const user = await User.findById(socio.user_id);
            
            await EmailService.sendMonthlyAgenda(user, events, month, year);
            successCount++;
            
            await this.delay(100);
            
          } catch (emailError) {
            logger.error('Error enviando agenda:', {
              socio_id: socio.id,
              error: emailError.message
            });
            errorCount++;
          }
        }
        
        logger.info(`Agendas mensuales enviadas: ${successCount} exitosas, ${errorCount} errores`);
        
      } catch (error) {
        logger.error('Error en tarea de agenda mensual:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('Tarea programada: Agenda mensual (1er día del mes, 8:00 AM)');
  }
  
  // Morosidad, cada día a medianoche
  static scheduleMorosityCheck() {
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Ejecutando: Detección de morosidad');
        
        const sql = `
          UPDATE socios
          SET 
            dias_morosidad = DATEDIFF(CURDATE(), proximo_pago),
            estado = CASE
              WHEN DATEDIFF(CURDATE(), proximo_pago) > 30 THEN 'moroso'
              WHEN DATEDIFF(CURDATE(), proximo_pago) > 0 THEN 'activo_pendiente'
              ELSE 'activo'
            END
          WHERE estado IN ('activo', 'activo_pendiente', 'moroso')
            AND proximo_pago IS NOT NULL
        `;
        
        const result = await query(sql);
        
        logger.info(`Actualización de morosidad: ${result.affectedRows} socios actualizados`);
        
        // Los que pasan hoy a morosos (día 30)
        const newMorososSql = `
          SELECT s.*, u.email, u.nombre, u.apellidos
          FROM socios s
          INNER JOIN users u ON s.user_id = u.id
          WHERE s.dias_morosidad = 30
            AND s.estado = 'moroso'
        `;
        
        const newMorosos = await query(newMorososSql);
        
        if (newMorosos.length > 0) {
          logger.warn(`${newMorosos.length} socios nuevos en morosidad`);
          // Pendiente: email de aviso de morosidad
        }
        
      } catch (error) {
        logger.error('Error en tarea de morosidad:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('Tarea programada: Detección de morosidad (00:00 diario)');
  }
  
  // Borra los tokens de reset caducados, a las 3:00
  static scheduleTokenCleanup() {
    cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('Ejecutando: Limpieza de tokens expirados');
        
        const sql = `
          UPDATE users
          SET 
            reset_password_token = NULL,
            reset_password_expires = NULL
          WHERE reset_password_expires < NOW()
        `;
        
        const result = await query(sql);
        
        logger.info(`Limpieza completada: ${result.affectedRows} tokens eliminados`);
        
      } catch (error) {
        logger.error('Error en tarea de limpieza de tokens:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('Tarea programada: Limpieza de tokens (03:00 AM diario)');
  }
  
  /**
   * Cada 15 min cancela las reservas esperando_pago de más de 40 min, por si
   * no llega el webhook checkout.session.expired (Stripe las caduca a los 30)
   */
  static scheduleExpiredBookingsCleanup() {
    cron.schedule('*/15 * * * *', async () => {
      try {
        const staleBookings = await query(`
          SELECT id, event_id, numero_entradas
          FROM bookings
          WHERE estado = 'esperando_pago'
            AND created_at < DATE_SUB(NOW(), INTERVAL 40 MINUTE)
        `);

        if (staleBookings.length === 0) return;

        for (const booking of staleBookings) {
          await query(
            `UPDATE bookings 
             SET estado = 'cancelada', fecha_cancelacion = NOW(), 
                 motivo_cancelacion = 'Pago no completado a tiempo (limpieza automática)'
             WHERE id = ?`,
            [booking.id],
          );
          await query(
            `UPDATE events SET entradas_disponibles = entradas_disponibles + ?,
                                entradas_reservadas = GREATEST(entradas_reservadas - ?, 0)
             WHERE id = ?`,
            [booking.numero_entradas, booking.numero_entradas, booking.event_id],
          );
        }

        logger.info(`Reservas pendientes de pago limpiadas: ${staleBookings.length}`);
      } catch (error) {
        logger.error('Error en limpieza de reservas pendientes de pago:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });

    logger.info('Tarea programada: Limpieza de reservas pendientes de pago (cada 15 min)');
  }

  // Pausa entre envíos
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Para todas las tareas (tests o apagado)
  static stop() {
    cron.getTasks().forEach((task) => task.stop());
    logger.info('Todas las tareas programadas detenidas');
  }
}

export default CronService;
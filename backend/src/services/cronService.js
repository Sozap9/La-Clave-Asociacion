import cron from 'node-cron';
import logger from '../config/logger.js';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Socio from '../models/Socio.js';
import User from '../models/User.js';
import EmailService from './emailService.js';
import { query } from '../config/database.js';

/**
 * ================================================================
 * SERVICIO DE CRON JOBS - TAREAS PROGRAMADAS
 * ================================================================
 * 
 * Este servicio ejecuta tareas automáticamente:
 * 1. Recordatorios diarios de eventos (9:00 AM)
 * 2. Agenda mensual a socios (1er día del mes, 8:00 AM)
 * 3. Detección de morosidad (diario 00:00)
 * 4. Limpieza de tokens expirados (diario 03:00 AM)
 */
class CronService {
  
  /**
   * Inicializar todas las tareas programadas
   * Se llama desde server.js al iniciar el servidor
   */
  static init() {
    logger.info('🕐 Iniciando tareas programadas...');
    
    // Inicializar cada tarea
    this.scheduleEventReminders();
    this.scheduleMonthlyAgenda();
    this.scheduleMorosityCheck();
    this.scheduleTokenCleanup();
    this.scheduleExpiredBookingsCleanup();
    
    logger.info('✅ Tareas programadas iniciadas correctamente');
  }
  
  /**
   * Enviar recordatorios de eventos del día
   * Formato cron: '0 9 * * *'
   * - 0 = minuto 0
   * - 9 = hora 9 (9:00 AM)
   * - * = todos los días
   * - * = todos los meses
   * - * = todos los días de la semana
   */
  static scheduleEventReminders() {
    cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('📧 Ejecutando: Envío de recordatorios de eventos');
        
        // Obtener fecha de HOY (sin hora)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // SQL: Buscar reservas confirmadas para eventos de HOY
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
        
        // Enviar email a cada socio con reserva hoy
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
            
            // Enviar el recordatorio
            await EmailService.sendEventReminder(bookingData, event, user);
            successCount++;
            
            // Pequeño delay entre emails (no saturar SMTP)
            await this.delay(100);
            
          } catch (emailError) {
            logger.error('Error enviando recordatorio:', {
              booking_id: booking.booking_id,
              error: emailError.message
            });
            errorCount++;
          }
        }
        
        logger.info(`✅ Recordatorios enviados: ${successCount} exitosos, ${errorCount} errores`);
        
      } catch (error) {
        logger.error('❌ Error en tarea de recordatorios:', error);
      }
    }, {
      timezone: "Europe/Madrid" // Zona horaria de España
    });
    
    logger.info('📅 Tarea programada: Recordatorios de eventos (9:00 AM diario)');
  }
  
  /**
   * Enviar agenda mensual a todos los socios
   * Formato cron: '0 8 1 * *'
   * - 0 = minuto 0
   * - 8 = hora 8 (8:00 AM)
   * - 1 = día 1 del mes
   * - * = todos los meses
   * - * = todos los días de la semana
   */
  static scheduleMonthlyAgenda() {
    cron.schedule('0 8 1 * *', async () => {
      try {
        logger.info('📧 Ejecutando: Envío de agenda mensual');
        
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // getMonth() devuelve 0-11
        
        // Obtener todos los socios activos
        const socios = await Socio.getAllActive();
        
        // Calcular primer y último día del mes
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        // SQL: Obtener eventos del mes actual
        const eventsSql = `
          SELECT * FROM events
          WHERE estado IN ('publicado', 'scheduled', 'active')
            AND fecha_evento >= ?
            AND fecha_evento <= ?
          ORDER BY fecha_evento ASC
        `;
        
        const events = await query(eventsSql, [firstDay, lastDay]);
        
        // Si no hay eventos, no enviar nada
        if (events.length === 0) {
          logger.info('ℹ️  No hay eventos para este mes, no se envían agendas');
          return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        // Enviar agenda a cada socio
        for (const socio of socios) {
          try {
            const user = await User.findById(socio.user_id);
            
            await EmailService.sendMonthlyAgenda(user, events, month, year);
            successCount++;
            
            // Delay entre emails
            await this.delay(100);
            
          } catch (emailError) {
            logger.error('Error enviando agenda:', {
              socio_id: socio.id,
              error: emailError.message
            });
            errorCount++;
          }
        }
        
        logger.info(`✅ Agendas mensuales enviadas: ${successCount} exitosas, ${errorCount} errores`);
        
      } catch (error) {
        logger.error('❌ Error en tarea de agenda mensual:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('📅 Tarea programada: Agenda mensual (1er día del mes, 8:00 AM)');
  }
  
  /**
   * Detección y actualización de socios morosos
   * Formato cron: '0 0 * * *'
   * - 0 = minuto 0
   * - 0 = hora 0 (medianoche)
   * - * = todos los días
   */
  static scheduleMorosityCheck() {
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('🔍 Ejecutando: Detección de morosidad');
        
        // SQL: Actualizar días de morosidad y estado según días pasados
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
        
        logger.info(`✅ Actualización de morosidad: ${result.affectedRows} socios actualizados`);
        
        // Buscar socios que JUSTO HOY entraron en morosidad (día 30)
        const newMorososSql = `
          SELECT s.*, u.email, u.nombre, u.apellidos
          FROM socios s
          INNER JOIN users u ON s.user_id = u.id
          WHERE s.dias_morosidad = 30
            AND s.estado = 'moroso'
        `;
        
        const newMorosos = await query(newMorososSql);
        
        if (newMorosos.length > 0) {
          logger.warn(`⚠️  ${newMorosos.length} socios nuevos en morosidad`);
          // TODO: Aquí podrías enviar email de aviso de morosidad
        }
        
      } catch (error) {
        logger.error('❌ Error en tarea de morosidad:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('📅 Tarea programada: Detección de morosidad (00:00 diario)');
  }
  
  /**
   * Limpieza de tokens de reset password expirados
   * Formato cron: '0 3 * * *'
   * - 0 = minuto 0
   * - 3 = hora 3 (3:00 AM)
   * - * = todos los días
   */
  static scheduleTokenCleanup() {
    cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('🧹 Ejecutando: Limpieza de tokens expirados');
        
        // SQL: Limpiar tokens que ya expiraron
        const sql = `
          UPDATE users
          SET 
            reset_password_token = NULL,
            reset_password_expires = NULL
          WHERE reset_password_expires < NOW()
        `;
        
        const result = await query(sql);
        
        logger.info(`✅ Limpieza completada: ${result.affectedRows} tokens eliminados`);
        
      } catch (error) {
        logger.error('❌ Error en tarea de limpieza de tokens:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });
    
    logger.info('📅 Tarea programada: Limpieza de tokens (03:00 AM diario)');
  }
  
  /**
   * Red de seguridad para el sistema de pagos: si por lo que sea el
   * webhook checkout.session.expired de Stripe no llega (caída puntual,
   * etc.), esto cancela reservas que llevan demasiado tiempo en
   * 'esperando_pago' y libera el aforo que tenían bloqueado.
   * Las Checkout Sessions expiran en Stripe a los 30 min (ver
   * config/payment.js), así que 40 min da margen de sobra.
   * Formato cron: cada 15 minutos
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
            `UPDATE events SET entradas_disponibles = entradas_disponibles + ? WHERE id = ?`,
            [booking.numero_entradas, booking.event_id],
          );
        }

        logger.info(`🧹 Reservas pendientes de pago limpiadas: ${staleBookings.length}`);
      } catch (error) {
        logger.error('❌ Error en limpieza de reservas pendientes de pago:', error);
      }
    }, {
      timezone: "Europe/Madrid"
    });

    logger.info('📅 Tarea programada: Limpieza de reservas pendientes de pago (cada 15 min)');
  }

  /**
   * Función auxiliar para crear delays entre operaciones
   * Evita saturar el servidor SMTP
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Detener todas las tareas programadas
   * Útil para testing o para apagar el servidor limpiamente
   */
  static stop() {
    cron.getTasks().forEach((task) => task.stop());
    logger.info('⏸️  Todas las tareas programadas detenidas');
  }
}

export default CronService;
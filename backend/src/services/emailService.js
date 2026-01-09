import transporter from '../config/mailer.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateQRCodeBase64 } from '../utils/qrCodeGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ================================================================
 * SERVICIO DE EMAIL - LA CLAVE ASOCIACIÓN
 * ================================================================
 */
class EmailService {
  
  /**
   * EMAIL DE BIENVENIDA
   */
  static async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: '¡Bienvenido a La Clave Asociación! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          ¡Bienvenido a La Clave!
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <h2 style="color: #8B5CF6; margin: 0 0 20px 0; font-size: 24px;">
                          ¡Hola ${user.nombre}!
                        </h2>
                        
                        <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                          Gracias por unirte a <strong>La Clave Asociación</strong>, tu puerta de entrada a las mejores experiencias nocturnas y eventos exclusivos.
                        </p>
                        
                        <div style="background-color: #2a2a2a; border-left: 4px solid #8B5CF6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #a78bfa; font-weight: bold;">
                            📋 Detalles de tu cuenta:
                          </p>
                          <p style="margin: 5px 0; font-size: 14px;">
                            <strong style="color: #8B5CF6;">Usuario:</strong> ${user.username}
                          </p>
                          <p style="margin: 5px 0; font-size: 14px;">
                            <strong style="color: #8B5CF6;">Email:</strong> ${user.email}
                          </p>
                        </div>
                        
                        <p style="line-height: 1.6; margin: 20px 0; font-size: 16px;">
                          ¡Esperamos verte pronto en nuestros eventos!
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">
                          Si no creaste esta cuenta, por favor contacta con nosotros.
                        </p>
                        <p style="margin: 0; color: #666; font-size: 12px;">
                          © ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('📧 Email de bienvenida enviado', {
        to: user.email,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar email de bienvenida:', {
        error: error.message,
        to: user.email
      });
      return { success: false, error: error.message };
    }

    
  }

  /**
   * EMAIL DE CONFIRMACIÓN DE RESERVA CON QR Y CARTEL
   * ✅ MEJORADO: Incluye imagen del cartel inline y QR adjunto
   */
  static async sendBookingConfirmation(booking, event, user) {
    try {
      const fechaEvento = new Date(event.fecha_evento).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // ===== PREPARAR IMAGEN DEL CARTEL (INLINE) =====
      let cartelAttachment = null;
      let cartelCid = null;
      
      if (event.imagen_cartel_url) {
        try {
          const cartelPath = path.join(__dirname, '../../uploads', event.imagen_cartel_url);
          if (fs.existsSync(cartelPath)) {
            cartelCid = 'cartel-' + booking.id;
            cartelAttachment = {
              filename: 'cartel-evento.jpg',
              path: cartelPath,
              cid: cartelCid
            };
          }
        } catch (err) {
          logger.warn('⚠️ No se pudo cargar imagen del cartel:', err.message);
        }
      }

      // ===== GENERAR QR CODE (ADJUNTO) =====
      let qrBuffer = null;
      try {
        const qrDataURL = await generateQRCodeBase64(booking.codigo_reserva, booking.id);
        // Convertir data URL a buffer
        const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
        qrBuffer = Buffer.from(base64Data, 'base64');
      } catch (qrError) {
        logger.warn('⚠️ No se pudo generar QR:', qrError.message);
      }

      // ===== PREPARAR ATTACHMENTS =====
      const attachments = [];
      
      if (cartelAttachment) {
        attachments.push(cartelAttachment);
      }
      
      if (qrBuffer) {
        attachments.push({
          filename: `entrada-${booking.codigo_reserva}.png`,
          content: qrBuffer,
          contentType: 'image/png'
        });
      }

      // ===== CONSTRUIR HTML DEL EMAIL =====
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: `✅ Confirmación de Reserva - ${event.titulo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    
                    <!-- HEADER -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          ✅ Reserva Confirmada
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- CONTENIDO -->
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                          ¡Hola <strong>${user.nombre}</strong>! Tu reserva ha sido confirmada exitosamente.
                        </p>
                        
                        <!-- INFORMACIÓN DEL EVENTO -->
                        <div style="background-color: #2a2a2a; padding: 25px; border-radius: 8px; margin: 30px 0;">
                          <h2 style="color: #10b981; margin: 0 0 20px 0; font-size: 24px;">
                            ${event.titulo}
                          </h2>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #10b981;">📅</span>
                            <strong style="color: #10b981; margin-right: 8px;">Fecha:</strong>
                            <span style="font-size: 15px;">${fechaEvento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #10b981;">🕐</span>
                            <strong style="color: #10b981; margin-right: 8px;">Hora:</strong>
                            <span style="font-size: 15px;">${event.hora_evento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #10b981;">📍</span>
                            <strong style="color: #10b981; margin-right: 8px;">Ubicación:</strong>
                            <span style="font-size: 15px;">${event.ubicacion}</span>
                          </div>
                        </div>

                        ${cartelCid ? `
                        <!-- IMAGEN DEL CARTEL (INLINE) -->
                        <div style="text-align: center; margin: 30px 0;">
                          <img src="cid:${cartelCid}" alt="Cartel del evento" 
                               style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #2a2a2a;">
                        </div>
                        ` : ''}
                        
                        <!-- CÓDIGO DE RESERVA -->
                        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                          <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                            Tu código de reserva
                          </p>
                          <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
                            ${booking.codigo_reserva}
                          </p>
                        </div>
                        
                        <!-- INSTRUCCIONES QR -->
                        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #92400E; font-weight: bold;">
                            📱 Tu código QR está adjunto
                          </p>
                          <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
                            Descarga el archivo adjunto <strong>"entrada-${booking.codigo_reserva}.png"</strong> 
                            y muéstralo en la entrada del evento. También puedes encontrarlo en tu perfil.
                          </p>
                        </div>
                        
                        <!-- DETALLES DE LA RESERVA -->
                        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin: 30px 0;">
                          <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">
                            📋 Detalles de tu Reserva
                          </h3>
                          <div style="color: #e5e5e5; font-size: 14px;">
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3a3a3a;">
                              <span>Número de entradas:</span>
                              <strong>${booking.numero_entradas}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3a3a3a;">
                              <span>Tipo de entrada:</span>
                              <strong>Socio</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                              <span>Estado:</span>
                              <strong style="color: #10b981;">Confirmada</strong>
                            </div>
                          </div>
                        </div>
                        
                        <!-- NOTAS IMPORTANTES -->
                        <div style="background-color: #1e293b; border-left: 4px solid #8B5CF6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #a78bfa; font-weight: bold;">
                            ℹ️ Información importante
                          </p>
                          <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                            <li>Llega con al menos 15 minutos de antelación</li>
                            <li>Presenta tu código QR a la entrada</li>
                            <li>Si necesitas cancelar, hazlo con al menos 24h de antelación</li>
                            <li>Puedes ver tus entradas en cualquier momento desde tu perfil</li>
                          </ul>
                        </div>
                        
                        <p style="text-align: center; margin: 30px 0 0 0; color: #10b981; font-size: 18px; font-weight: bold;">
                          ¡Nos vemos en el evento! 🎉
                        </p>
                      </td>
                    </tr>
                    
                    <!-- FOOTER -->
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">
                          Este es un correo automático, por favor no respondas a este mensaje.
                        </p>
                        <p style="margin: 0; color: #666; font-size: 12px;">
                          © ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        attachments: attachments
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('📧 Email de confirmación enviado con QR y cartel', {
        to: user.email,
        bookingId: booking.id,
        messageId: info.messageId,
        hasCartel: !!cartelAttachment,
        hasQR: !!qrBuffer
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar email de confirmación:', {
        error: error.message,
        to: user?.email,
        bookingId: booking?.id
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL DE RECORDATORIO DE EVENTO
   */
  static async sendEventReminder(booking, event, user) {
    try {
      const fechaEvento = new Date(event.fecha_evento).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: `⏰ Recordatorio: ${event.titulo} - Mañana`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          ⏰ ¡El evento es mañana!
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                          Hola <strong>${user.nombre}</strong>, te recordamos que mañana tienes el evento:
                        </p>
                        
                        <div style="background-color: #2a2a2a; padding: 25px; border-radius: 8px; margin: 30px 0;">
                          <h2 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 24px;">
                            ${event.titulo}
                          </h2>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #f59e0b;">📅</span>
                            <strong style="color: #f59e0b; margin-right: 8px;">Fecha:</strong>
                            <span style="font-size: 15px;">${fechaEvento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #f59e0b;">🕐</span>
                            <strong style="color: #f59e0b; margin-right: 8px;">Hora:</strong>
                            <span style="font-size: 15px;">${event.hora_evento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #f59e0b;">📍</span>
                            <strong style="color: #f59e0b; margin-right: 8px;">Ubicación:</strong>
                            <span style="font-size: 15px;">${event.ubicacion}</span>
                          </div>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                          <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                            Tu código de reserva
                          </p>
                          <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
                            ${booking.codigo_reserva}
                          </p>
                        </div>
                        
                        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #92400E; font-weight: bold;">
                            📱 Recuerda traer tu código QR
                          </p>
                          <p style="margin: 0; color: #92400E; font-size: 14px;">
                            Puedes descargarlo desde tu perfil o usar el que te enviamos en el email de confirmación.
                          </p>
                        </div>
                        
                        <p style="text-align: center; margin: 30px 0 0 0; color: #f59e0b; font-size: 18px; font-weight: bold;">
                          ¡Te esperamos! 🎉
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                        <p style="margin: 0; color: #666; font-size: 12px;">
                          © ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('📧 Email de recordatorio enviado', {
        to: user.email,
        bookingId: booking.id,
        eventId: event.id,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar email de recordatorio:', {
        error: error.message,
        to: user?.email
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL DE NUEVO EVENTO PUBLICADO
   */
  static async sendNewEventNotification(user, event) {
    try {
      const fechaEvento = new Date(event.fecha_evento).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: `🎉 Nuevo Evento: ${event.titulo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          🎉 ¡Nuevo Evento Disponible!
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                          Hola <strong>${user.nombre}</strong>, tenemos un nuevo evento que no te puedes perder:
                        </p>
                        
                        <div style="background-color: #2a2a2a; padding: 25px; border-radius: 8px; margin: 30px 0;">
                          <h2 style="color: #8B5CF6; margin: 0 0 20px 0; font-size: 24px;">
                            ${event.titulo}
                          </h2>
                          
                          ${event.descripcion_corta ? `
                          <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
                            ${event.descripcion_corta}
                          </p>
                          ` : ''}
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #8B5CF6;">📅</span>
                            <strong style="color: #8B5CF6; margin-right: 8px;">Fecha:</strong>
                            <span style="font-size: 15px;">${fechaEvento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #8B5CF6;">🕐</span>
                            <strong style="color: #8B5CF6; margin-right: 8px;">Hora:</strong>
                            <span style="font-size: 15px;">${event.hora_evento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #8B5CF6;">📍</span>
                            <strong style="color: #8B5CF6; margin-right: 8px;">Ubicación:</strong>
                            <span style="font-size: 15px;">${event.ubicacion}</span>
                          </div>

                          <div style="margin: 12px 0;">
                            <span style="color: #8B5CF6;">💰</span>
                            <strong style="color: #8B5CF6; margin-right: 8px;">Precio socios:</strong>
                            <span style="font-size: 15px; color: #10b981; font-weight: bold;">${event.precio_socio}€</span>
                          </div>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${process.env.FRONTEND_URL}/eventos" 
                             style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); 
                                    color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; 
                                    font-weight: bold; font-size: 16px;">
                            Reservar Ahora
                          </a>
                        </div>
                        
                        <p style="text-align: center; margin: 20px 0 0 0; color: #9ca3af; font-size: 14px;">
                          ¡Las plazas son limitadas, reserva cuanto antes!
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                        <p style="margin: 0; color: #666; font-size: 12px;">
                          © ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('📧 Email de nuevo evento enviado', {
        to: user.email,
        eventId: event.id,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar email de nuevo evento:', {
        error: error.message,
        to: user?.email
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL MENSUAL DE AGENDA
   */
  static async sendMonthlyAgenda(user, events, month, year) {
    try {
      const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long' });
      
      let eventsHTML = '';
      events.forEach(event => {
        const fecha = new Date(event.fecha_evento).toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short' 
        });
        
        eventsHTML += `
          <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #8B5CF6; margin: 0 0 10px 0; font-size: 18px;">
              ${event.titulo}
            </h3>
            <p style="margin: 5px 0; color: #d1d5db; font-size: 14px;">
              <strong>📅 ${fecha}</strong> | ${event.hora_evento} | 📍 ${event.ubicacion}
            </p>
            ${event.descripcion_corta ? `
            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
              ${event.descripcion_corta}
            </p>
            ` : ''}
          </div>
        `;
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: `📅 Agenda de ${monthName} ${year}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          📅 Agenda de ${monthName}
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                          Hola <strong>${user.nombre}</strong>, estos son los eventos programados para ${monthName} ${year}:
                        </p>
                        
                        ${eventsHTML}
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${process.env.FRONTEND_URL}/eventos" 
                             style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%); 
                                    color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; 
                                    font-weight: bold; font-size: 16px;">
                            Ver Todos los Eventos
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                        <p style="margin: 0; color: #666; font-size: 12px;">
                          © ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('📧 Email de agenda mensual enviado', {
        to: user.email,
        month,
        year,
        eventsCount: events.length,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar email de agenda mensual:', {
        error: error.message,
        to: user?.email
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL DE RECUPERACIÓN DE CONTRASEÑA 
   */
  static async sendPasswordReset(user, resetToken) {
    try {
      // URL del frontend para resetear contraseña
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: '🔐 Recuperación de contraseña - La Clave',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                          🔐 Recuperación de Contraseña
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                          Hola <strong>${user.nombre} ${user.apellidos}</strong>,
                        </p>
                        
                        <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                        </p>
                        
                        <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                          Para crear una nueva contraseña, haz clic en el siguiente botón:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background: #8B5CF6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Restablecer mi contraseña
                          </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #a0a0a0; line-height: 1.6; margin: 20px 0;">
                          O copia y pega este enlace en tu navegador:
                        </p>
                        <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px; word-break: break-all; margin: 15px 0; color: #8B5CF6;">
                          ${resetUrl}
                        </div>
                        
                        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0; color: #92400E; font-size: 14px;">
                            <strong>⏱️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
                          </p>
                        </div>
                        
                        <div style="background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #991B1B; font-size: 14px;">
                            <strong>⚠️ ¿No solicitaste este cambio?</strong>
                          </p>
                          <p style="margin: 0; color: #991B1B; font-size: 13px;">
                            Si no fuiste tú quien solicitó restablecer la contraseña, ignora este email. 
                            Tu contraseña actual seguirá siendo válida y nadie podrá acceder a tu cuenta.
                          </p>
                        </div>
                        
                        <p style="margin-top: 30px; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                          Si tienes algún problema, contáctanos respondiendo a este email.
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; font-weight: bold;">
                          La Clave Asociación
                        </p>
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 11px;">
                          Este es un email automático, por favor no respondas directamente.
                        </p>
                        <p style="margin: 0; color: #666; font-size: 11px;">
                          © ${new Date().getFullYear()} La Clave. Todos los derechos reservados.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      logger.info('📧 Email de password reset enviado:', {
        to: user.email,
        userId: user.id,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error enviando email de password reset:', {
        error: error.message,
        to: user.email
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * ENVÍO MASIVO DE EMAILS
   */
  static async sendBulkEmails(users, emailType, data) {
    const results = { success: 0, failed: 0, errors: [] };

    for (const user of users) {
      try {
        let result;
        
        switch (emailType) {
          case 'monthlyAgenda':
            result = await this.sendMonthlyAgenda(user, data.events, data.month, data.year);
            break;
          case 'newEvent':
            result = await this.sendNewEventNotification(user, data.event);
            break;
          case 'eventReminder':
            result = await this.sendEventReminder(data.booking, data.event, user);
            break;
          default:
            throw new Error(`Tipo desconocido: ${emailType}`);
        }
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({ email: user.email, error: result.error });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.failed++;
        results.errors.push({ email: user.email, error: error.message });
      }
    }

    logger.info(' Envío masivo completado', {
      emailType,
      totalUsers: users.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }
}

export default EmailService;
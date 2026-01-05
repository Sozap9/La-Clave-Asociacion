import transporter from '../config/mailer.js';
import logger from '../config/logger.js';

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
   * EMAIL DE CONFIRMACIÓN DE RESERVA CON QR
   */
  static async sendBookingConfirmation(booking, event, user) {
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
                    
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          ✅ Reserva Confirmada
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                          ¡Hola <strong>${user.nombre}</strong>! Tu reserva ha sido confirmada exitosamente.
                        </p>
                        
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
                        
                        <div style="text-align: center; margin: 40px 0;">
                          <p style="color: #10b981; font-weight: bold; margin: 0 0 15px 0; font-size: 16px;">
                            🎫 Presenta este código en la entrada:
                          </p>
                          <div style="background-color: #2a2a2a; padding: 30px; display: inline-block; border-radius: 8px; border: 2px dashed #10b981;">
                            <p style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #10b981; margin: 0; letter-spacing: 2px;">
                              ${booking.codigo_qr}
                            </p>
                          </div>
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
      logger.info('📧 Email de confirmación de reserva enviado', {
        to: user.email,
        bookingId: booking.id,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar email de confirmación:', {
        error: error.message,
        to: user.email
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL RECORDATORIO DEL EVENTO (DÍA DEL EVENTO)
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
        subject: `🔔 ¡Hoy es el evento! - ${event.titulo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🔔 ¡Es hoy!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="font-size: 18px;">¡Hola <strong>${user.nombre}</strong>! 🎉</p>
                        <p>Te recordamos que <strong>hoy</strong> tienes un evento confirmado:</p>
                        <h2 style="color: #f59e0b;">${event.titulo}</h2>
                        <p><strong>Hora:</strong> ${event.hora_evento}</p>
                        <p><strong>Ubicación:</strong> ${event.ubicacion}</p>
                        <div style="text-align: center; margin: 40px 0;">
                          <p style="color: #f59e0b; font-weight: bold;">🎫 Tu código:</p>
                          <p style="font-size: 32px; font-weight: bold; color: #f59e0b;">${booking.codigo_qr}</p>
                        </div>
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
      logger.info('📧 Email recordatorio enviado', { to: user.email });
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL DE CANCELACIÓN DE EVENTO
   */
  static async sendEventCancellation(event, booking, user) {
    try {
      const fechaEvento = new Date(event.fecha_evento).toLocaleDateString('es-ES');

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: `❌ Evento Cancelado - ${event.titulo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px;">
                    <tr>
                      <td style="background: #ef4444; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0;">Evento Cancelado</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p>Hola <strong>${user.nombre}</strong>,</p>
                        <p>Lamentamos informarte que el siguiente evento ha sido cancelado:</p>
                        <h2 style="color: #ef4444;">${event.titulo}</h2>
                        <p><strong>Fecha original:</strong> ${fechaEvento}</p>
                        ${event.motivo_cancelacion ? `<p><strong>Motivo:</strong> ${event.motivo_cancelacion}</p>` : ''}
                        <p>Tu reserva <strong>${booking.codigo_qr}</strong> ha sido cancelada automáticamente.</p>
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
      logger.info('📧 Email de cancelación enviado', { to: user.email });
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar cancelación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL MENSUAL CON AGENDA (PARA SOCIOS)
   */
  static async sendMonthlyAgenda(user, events, month, year) {
    try {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[month - 1];

      const eventsHtml = events.map(event => `
        <div style="background: #2a2a2a; padding: 20px; margin: 15px 0; border-radius: 8px;">
          <h3 style="color: #8B5CF6; margin: 0 0 10px 0;">${event.titulo}</h3>
          <p style="margin: 8px 0;">📅 ${new Date(event.fecha_evento).toLocaleDateString('es-ES')} - ${event.hora_evento}</p>
          <p style="margin: 8px 0;">📍 ${event.ubicacion}</p>
        </div>
      `).join('');

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: user.email,
        subject: `📅 Agenda de ${monthName} ${year} - La Clave`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px;">
                    <tr>
                      <td style="background: #8B5CF6; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0;">📅 Agenda de ${monthName}</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p>Hola <strong>${user.nombre}</strong> 👑</p>
                        <p>Aquí tienes los <strong>${events.length} eventos</strong> para ${monthName}:</p>
                        ${eventsHtml}
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
      logger.info('📧 Agenda mensual enviada', { to: user.email });
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al enviar agenda:', error);
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
        subject: `🆕 Nuevo Evento - ${event.titulo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px;">
                    <tr>
                      <td style="background: #ec4899; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0;">🆕 ¡Nuevo Evento!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <p>Hola <strong>${user.nombre}</strong> 👑</p>
                        <p>Acabamos de publicar un nuevo evento:</p>
                        <h2 style="color: #ec4899;">${event.titulo}</h2>
                        <p>📅 ${fechaEvento}</p>
                        <p>🕐 ${event.hora_evento}</p>
                        <p>📍 ${event.ubicacion}</p>
                        <p>👑 Precio Socio: <strong>${event.precio_socio}€</strong></p>
                        <p>🎟️ Entradas disponibles: ${event.entradas_disponibles}</p>
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
      logger.info('📧 Notificación de nuevo evento enviada', { to: user.email });
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al notificar nuevo evento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * NOTIFICAR AL ADMIN DE NUEVO SOCIO
   */
  static async notifyAdminNewSocio(socio, user) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      
      if (!adminEmail) {
        logger.warn('⚠️  ADMIN_EMAIL no configurado');
        return { success: false, error: 'Admin email not configured' };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"La Clave Asociación" <noreply@laclave.com>',
        to: adminEmail,
        subject: `👑 Nuevo Socio - ${user.nombre} ${user.apellidos}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px;">
                    <tr>
                      <td style="background: #f59e0b; padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0;">👑 Nuevo Socio</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2>Nuevo socio registrado</h2>
                        <p><strong>Número:</strong> ${socio.numero_socio}</p>
                        <p><strong>Nombre:</strong> ${user.nombre} ${user.apellidos}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Teléfono:</strong> ${user.telefono || 'No proporcionado'}</p>
                        <p><strong>Tipo:</strong> ${socio.tipo_membresia}</p>
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
      logger.info('📧 Notificación de socio enviada al admin');
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('❌ Error al notificar socio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * EMAIL DE RECUPERACIÓN DE CONTRASEÑA ✨ NUEVO
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

    logger.info('📧 Envío masivo completado', {
      emailType,
      totalUsers: users.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }
}

export default EmailService;
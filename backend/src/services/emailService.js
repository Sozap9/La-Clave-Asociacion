import {
  noreplyTransporter,
  supportTransporter,
  adminTransporter,
  fromNoreply,
  fromSupport,
  fromAdmin,
} from '../config/mailer.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Quita los segundos de la hora del evento para mostrarla ("17:00:00"
 * → "17:00"). La columna hora_evento viene de MySQL como "HH:MM:SS".
 * @param {String} horaEvento
 * @returns {String}
 */
const formatHora = (horaEvento) => {
  if (!horaEvento) return '';
  return horaEvento.substring(0, 5);
};

/**
 * Convierte el texto combinado de motivación (varias preguntas +
 * respuestas seguidas, cada una empezando por "¿" — ver Register.jsx:
 * combinedMotivacion) en bloques HTML de pregunta/respuesta por
 * separado, en vez de un único párrafo con todo junto.
 *
 * Divide por cada "¿" en vez de por el separador \n\n original: el
 * salto de línea doble no sobrevive siempre el trayecto completo
 * (BD → API → email), así que dividir por el inicio de cada pregunta
 * es más fiable pase lo que pase con los saltos de línea intermedios.
 *
 * @param {String} motivacion - Texto tal como llega de Register.jsx
 * @param {String} accentColor - Color de acento a juego con el email
 * @returns {String} HTML con un bloque por cada pregunta respondida
 */
const formatMotivacionAsQA = (motivacion, accentColor = '#f59e0b') => {
  if (!motivacion) return '';

  return motivacion
    .split(/(?=¿)/g)
    .map((bloque) => bloque.trim())
    .filter(Boolean)
    .map((bloque) => {
      const idx = bloque.indexOf('?');
      if (idx === -1) {
        return `<p style="margin:10px 0 0 0;font-size:14px;color:#e5e5e5;">${bloque}</p>`;
      }
      const pregunta = bloque.slice(0, idx + 1).trim();
      const respuesta = bloque.slice(idx + 1).trim();
      return `
        <p style="margin:10px 0 0 0;font-size:14px;">
          <strong style="color:${accentColor};">${pregunta}</strong><br>
          <span style="color:#e5e5e5;">${respuesta}</span>
        </p>
      `;
    })
    .join('');
};

/**
 * ================================================================
 * SERVICIO DE EMAIL - LA CLAVE 981
 * ================================================================
 */
class EmailService {
  
  /**
   * EMAIL DE BIENVENIDA
   */
  static async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: fromNoreply(),
        to: user.email,
        subject: '¡Bienvenido a La Clave 981!',
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
                      <td style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          ¡Bienvenido a La Clave!
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <h2 style="color: #F59E0B; margin: 0 0 20px 0; font-size: 24px;">
                          ¡Hola ${user.nombre}!
                        </h2>
                        
                        <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                          Gracias por unirte a <strong> La Clave 981 </strong>,tu nuevo espacio para disfrutar del arte y la cultura. 
                        </p>
                        
                        <div style="background-color: #2a2a2a; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #FBBF24; font-weight: bold;">
                            Detalles de tu cuenta:
                          </p>
                          <p style="margin: 5px 0; font-size: 14px;">
                            <strong style="color: #F59E0B;">Email:</strong> ${user.email}
                          </p>
                        </div>
                        
                        <p style="line-height: 1.6; margin: 20px 0; font-size: 16px;">
                          ¡Esperamos verte pronto!
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

      const info = await noreplyTransporter.sendMail(mailOptions);
      logger.info('Email de bienvenida enviado', {
        to: user.email,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('Error al enviar email de bienvenida:', {
        error: error.message,
        to: user.email
      });
      return { success: false, error: error.message };
    }

    
  }

  /**
   * EMAIL DE CONFIRMACIÓN DE RESERVA CON QR Y CARTEL
   * Imagen del cartel inline y QR 
   */
  static async sendBookingConfirmation(booking, event, user) {
    try {
      const fechaEvento = new Date(event.fecha_evento).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // ===== IMAGEN DEL CARTEL: URL real, no base64 =====
      // Gmail bloquea las imágenes "data:base64" incrustadas en el HTML
      // del email (medida de seguridad de Google, no algo que podamos
      // evitar desde aquí) — así que hay que enlazar a una URL real que
      // el cliente de correo pueda cargar, igual que el QR de abajo.
      //
      // BACKEND_URL en Railway ya incluye "/api" al final (igual que
      // VITE_API_URL en el frontend) — lo quitamos aquí antes de
      // construir las rutas, porque si no se duplicaba a "/api/api/..."
      // y todo devolvía 404 (visto en logs de producción).
      const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
      let cartelUrl = null;

      if (event.imagen_cartel_url) {
        try {
          const cartelPath = path.join(__dirname, '../../uploads', event.imagen_cartel_url);
          if (fs.existsSync(cartelPath)) {
            cartelUrl = `${backendUrl}${event.imagen_cartel_url}`;
          }
        } catch (err) {
          logger.warn('No se pudo comprobar la imagen del cartel:', err.message);
        }
      }

      // ===== QR: URL real servida desde /api/bookings/qr/:id/:codigo.png =====
      // Lee el QR guardado en base64 en la BD (persistente, no depende
      // del disco de Railway) y lo sirve como PNG real — ver
      // bookingController.getBookingQRImage. Por el mismo motivo que el
      // cartel: Gmail no muestra "data:base64" incrustado, tiene que
      // ser una URL HTTPS de verdad.
      // Cache-busting: Brevo cachea la imagen por URL de origen. Como la
      // URL del QR de una reserva es siempre la misma (mismo id, mismo
      // codigo_acceso), si Brevo la pidió una vez cuando el endpoint aún
      // fallaba, sirve esa copia rota para siempre en cualquier reenvío
      // futuro — aunque el backend ya esté arreglado. Añadir un parámetro
      // que cambia en cada envío obliga a Brevo a pedirla de nuevo.
      const qrUrl = `${backendUrl}/api/bookings/qr/${booking.id}/${booking.codigo_acceso}?v=${Date.now()}`;

      const mailOptions = {
        from: fromNoreply(),
        to: user.email,
        subject: `Entrada confirmada — ${event.titulo}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
              <tr>
                <td align="center" style="padding:40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">

                    <!-- HEADER VERDE -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#D97706 0%,#FCD34D 100%);padding:28px 30px;text-align:center;">
                        <p style="color:#FDE68A;margin:0 0 4px 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">La Clave 981</p>
                        <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:bold;letter-spacing:1px;">ENTRADA CONFIRMADA</h1>
                      </td>
                    </tr>

                    <!-- BLOQUE PRINCIPAL: cartel + datos -->
                    <tr>
                      <td style="padding:0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <!-- Cartel evento -->
                            ${cartelUrl ? `
                            <td width="160" style="padding:24px 0 24px 24px;vertical-align:top;">
                              <img src="${cartelUrl}" alt="${event.titulo}"
                                style="width:140px;height:140px;object-fit:cover;border-radius:10px;border:2px solid #2a2a2a;display:block;">
                            </td>
                            ` : ''}
                            <!-- Datos evento -->
                            <td style="padding:24px;vertical-align:top;color:#e5e5e5;">
                              <p style="margin:0 0 4px 0;color:#FCD34D;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Evento</p>
                              <h2 style="margin:0 0 16px 0;font-size:20px;color:#ffffff;font-weight:bold;">${event.titulo}</h2>
                              <p style="margin:0 0 8px 0;font-size:14px;color:#aaa;">
                              <strong style="color:#fff;">${fechaEvento}</strong>
                              </p>
                              <p style="margin:0 0 8px 0;font-size:14px;color:#aaa;">
                              <strong style="color:#fff;">${formatHora(event.hora_evento)}</strong>
                              </p>
                              <p style="margin:0 0 16px 0;font-size:14px;color:#aaa;">
                              <strong style="color:#fff;">${event.ubicacion || 'La Clave 981'}</strong>
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- SEPARADOR DENTADO -->
                    <tr>
                      <td style="padding:0;background-color:#111;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-top:2px dashed #2a2a2a;padding:0;"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- SECCIÓN QR -->
                    <tr>
                      <td style="padding:28px 30px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <!-- QR code inline -->
                            <td width="230" style="vertical-align:middle;text-align:center;">
                              <div style="background:#fff;padding:10px;border-radius:10px;display:inline-block;border:3px solid #D97706;">
                                <img src="${qrUrl}" alt="QR Code" width="200" height="200"
                                  style="display:block;border-radius:4px;">
                              </div>
                              <p style="margin:8px 0 0 0;color:#666;font-size:11px;">Escanea en la entrada</p>
                            </td>
                            <!-- Datos titular -->
                            <td style="padding-left:24px;vertical-align:middle;color:#e5e5e5;">
                              <p style="margin:0 0 4px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Titular</p>
                              <p style="margin:0 0 16px 0;font-size:18px;font-weight:bold;color:#fff;">
                                ${user.nombre} ${user.apellidos || ''}
                              </p>
                              <p style="margin:0 0 4px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Código de reserva</p>
                              <p style="margin:0 0 16px 0;font-size:16px;font-weight:bold;color:#FCD34D;font-family:monospace;letter-spacing:2px;">
                                ${booking.codigo_reserva}
                              </p>
                              <p style="margin:0 0 4px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Coste</p>
                              <p style="margin:0;font-size:14px;color:#fff;">
                                ${booking.precio_pagado > 0 ? `<strong style="color:#FCD34D;">${booking.precio_pagado}€</strong>` : '<strong style="color:#10b981;">Entrada gratuita</strong>'}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- BOTÓN DE RESPALDO: por si el QR no carga en el
                         cliente de correo (Brevo a veces no consigue
                         cargar imágenes generadas dinámicamente a
                         tiempo al enviar, y cachea la copia rota para
                         siempre). Mis Entradas siempre tiene el QR
                         correcto y actualizado. -->
                    <tr>
                      <td style="padding:0 30px 24px 30px;text-align:center;">
                        <p style="margin:0 0 10px 0;color:#666;font-size:12px;">
                          ¿No ves el código QR arriba?
                        </p>
                        <a href="${process.env.FRONTEND_URL}/mis-entradas?ver=${booking.id}"
                          style="display:inline-block;background:#D97706;color:#fff;text-decoration:none;
                          font-size:13px;font-weight:bold;padding:10px 24px;border-radius:8px;">
                          Ver mi entrada online
                        </a>
                      </td>
                    </tr>

                    <!-- AVISO IMPORTANTE -->
                    <tr>
                      <td style="padding:0 30px 24px 30px;">
                        <div style="background:#2a2a2a;border-left:3px solid #D97706;border-radius:6px;padding:14px 16px;">
                          <p style="margin:0 0 6px 0;color:#FCD34D;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Información importante</p>
                          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.7;">
                            • Presenta este QR en la entrada del evento.<br>
                            • Si necesitas cancelar, hazlo con al menos 24h de antelación.<br>
                            • Acceso permitido solo a mayores de 18 años.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td style="background-color:#0a0a0a;padding:20px 30px;text-align:center;border-top:1px solid #1a1a1a;">
                        <p style="margin:0 0 4px 0;color:#444;font-size:11px;">La Clave 981</p>
                        <p style="margin:0;color:#444;font-size:11px;">
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
        `
      };

      const info = await noreplyTransporter.sendMail(mailOptions);
      logger.info('Email de confirmación enviado con QR y cartel', {
        to: user.email,
        bookingId: booking.id,
        messageId: info.messageId,
        hasCartel: !!cartelUrl,
        qrUrl
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('Error al enviar email de confirmación:', {
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
        from: fromNoreply(),
        to: user.email,
        subject: `Recordatorio: ${event.titulo} - Mañana`,
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
                          ¡El evento es mañana!
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
                            <span style="color: #f59e0b;"></span>
                            <strong style="color: #f59e0b; margin-right: 8px;">Fecha:</strong>
                            <span style="font-size: 15px;">${fechaEvento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #f59e0b;"></span>
                            <strong style="color: #f59e0b; margin-right: 8px;">Hora:</strong>
                            <span style="font-size: 15px;">${formatHora(event.hora_evento)}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <span style="color: #f59e0b;"></span>
                            <strong style="color: #f59e0b; margin-right: 8px;">Ubicación:</strong>
                            <span style="font-size: 15px;">${event.ubicacion}</span>
                          </div>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                          <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                            Tu código de reserva
                          </p>
                          <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
                            ${booking.codigo_reserva}
                          </p>
                        </div>
                        
                        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 4px;">
                          <p style="margin: 0 0 10px 0; color: #92400E; font-weight: bold;">
                            Recuerda traer tu código QR
                          </p>
                          <p style="margin: 0; color: #92400E; font-size: 14px;">
                            Puedes descargarlo desde tu perfil o usar el que te enviamos en el email de confirmación.
                          </p>
                        </div>
                        
                        <p style="text-align: center; margin: 30px 0 0 0; color: #f59e0b; font-size: 18px; font-weight: bold;">
                          ¡Te esperamos!
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

      const info = await noreplyTransporter.sendMail(mailOptions);
      logger.info('Email de recordatorio enviado', {
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
        from: fromNoreply(),
        to: user.email,
        subject: `Nuevo Evento: ${event.titulo}`,
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
                      <td style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          ¡Nuevo Evento Disponible!
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 40px 30px; color: #e5e5e5;">
                        <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                          Hola <strong>${user.nombre}</strong>, tenemos un nuevo evento que no te puedes perder:
                        </p>
                        
                        <div style="background-color: #2a2a2a; padding: 25px; border-radius: 8px; margin: 30px 0;">
                          <h2 style="color: #F59E0B; margin: 0 0 20px 0; font-size: 24px;">
                            ${event.titulo}
                          </h2>
                          
                          ${event.descripcion_corta ? `
                          <p style="color: #d1d5db; line-height: 1.6; margin: 0 0 20px 0;">
                            ${event.descripcion_corta}
                          </p>
                          ` : ''}
                          
                          <div style="margin: 12px 0;">
                            <strong style="color: #F59E0B; margin-right: 8px;">Fecha:</strong>
                            <span style="font-size: 15px;">${fechaEvento}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <strong style="color: #F59E0B; margin-right: 8px;">Hora:</strong>
                            <span style="font-size: 15px;">${formatHora(event.hora_evento)}</span>
                          </div>
                          
                          <div style="margin: 12px 0;">
                            <strong style="color: #F59E0B; margin-right: 8px;">Ubicación:</strong>
                            <span style="font-size: 15px;">${event.ubicacion}</span>
                          </div>

                          <div style="margin: 12px 0;">
                            <strong style="color: #F59E0B; margin-right: 8px;">Precio socios:</strong>
                            <span style="font-size: 15px; color: #10b981; font-weight: bold;">${event.precio_socio}€</span>
                          </div>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${process.env.FRONTEND_URL}/eventos" 
                             style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); 
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

      const info = await noreplyTransporter.sendMail(mailOptions);
      logger.info('Email de nuevo evento enviado', {
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
            <h3 style="color: #F59E0B; margin: 0 0 10px 0; font-size: 18px;">
              ${event.titulo}
            </h3>
            <p style="margin: 5px 0; color: #d1d5db; font-size: 14px;">
            <strong>${fecha}</strong> | ${formatHora(event.hora_evento)} | ${event.ubicacion}
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
        from: fromNoreply(),
        to: user.email,
        subject: `Agenda de ${monthName} ${year}`,
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
                      <td style="background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                          Agenda de ${monthName}
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
                            style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); 
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

      const info = await noreplyTransporter.sendMail(mailOptions);
      logger.info('Email de agenda mensual enviado', {
        to: user.email,
        month,
        year,
        eventsCount: events.length,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('Error al enviar email de agenda mensual:', {
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
      const resetUrl = `${process.env.FRONTEND_URL}/recuperar-password?token=${resetToken}`;
      
      const mailOptions = {
        from: fromNoreply(),
        to: user.email,
        subject: 'Recuperación de contraseña - La Clave',
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
                      <td style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                          Recuperación de Contraseña
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
                          <a href="${resetUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Restablecer mi contraseña
                          </a>
                        </div>
                        
                        <p style="margin: 20px 0 0 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #FDE68A;">⏱ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
                        </p>
                        
                        <p style="margin: 16px 0 0 0; color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #FDE68A;">¿No solicitaste este cambio?</strong><br>
                          Si no fuiste tú quien solicitó restablecer la contraseña, ignora este email.
                          Tu contraseña actual seguirá siendo válida y nadie podrá acceder a tu cuenta.
                        </p>
                        
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
      
      const info = await noreplyTransporter.sendMail(mailOptions);
      logger.info(' Email de password reset enviado:', {
        to: user.email,
        userId: user.id,
        messageId: info.messageId
      });
      
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      logger.error('Error enviando email de password reset:', {
        error: error.message,
        to: user.email
      });
      return { success: false, error: error.message };
    }
  }


  /**
   * ================================================================
   * SOLICITUDES DE SOCIO 
   * ================================================================
   */

  /**
   * Confirmar al solicitante que su solicitud fue recibida
   */
  static async sendSolicitudRecibida(solicitud) {
    try {
      const mailOptions = {
        from: fromSupport(),
        to: solicitud.email,
        subject: 'Solicitud de socio recibida - La Clave Asociación 981',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
              <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#F59E0B 0%,#FBBF24 100%);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;">Solicitud Recibida</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 30px;color:#e5e5e5;">
                      <h2 style="color:#F59E0B;margin:0 0 20px 0;">¡Hola ${solicitud.nombre}!</h2>
                      <p style="line-height:1.6;font-size:16px;margin:0 0 20px 0;">
                        Hemos recibido tu solicitud para unirte a <strong>La Clave Asociación</strong>. 
                        Nuestro equipo la revisará en los próximos días y te notificaremos por email con la resolución.
                      </p>
                      <div style="background-color:#2a2a2a;border-left:4px solid #F59E0B;padding:20px;margin:30px 0;border-radius:4px;">
                        <p style="margin:0 0 10px 0;color:#FBBF24;font-weight:bold;"> Datos de tu solicitud:</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#F59E0B;">Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos}</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#F59E0B;">Email:</strong> ${solicitud.email}</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#F59E0B;">Estado:</strong> <span style="color:#f59e0b;"> Pendiente de revisión</span></p>
                      </div>
                      <p style="line-height:1.6;font-size:15px;color:#9ca3af;">
                        Mientras tanto, si tienes alguna pregunta puedes contactar con nosotros respondiendo a este email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#0a0a0a;padding:30px;text-align:center;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      };
      const info = await supportTransporter.sendMail(mailOptions);
      logger.info('Email solicitud recibida enviado', { to: solicitud.email, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sendSolicitudRecibida:', { error: error.message, to: solicitud.email });
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar a los admins que hay una nueva solicitud pendiente
   */
  static async sendAvisoNuevaSolicitudAdmins(solicitud) {
    try {
      const adminEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);

      if (adminEmails.length === 0) {
        logger.warn('ADMIN_NOTIFICATION_EMAILS no configurado — aviso no enviado');
        return { success: false, error: 'No hay emails de admin configurados' };
      }

      const adminUrl = `${process.env.FRONTEND_URL}/admin/solicitudes`;

      const mailOptions = {
        from: fromAdmin(),
        to: adminEmails.join(', '),
        subject: 'Nueva solicitud de socio pendiente',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
              <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%);padding:30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:24px;">Nueva Solicitud de Socio</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px;color:#e5e5e5;">
                      <p style="font-size:16px;margin:0 0 20px 0;">
                        Se ha recibido una nueva solicitud de membresía que requiere revisión.
                      </p>
                      <div style="background-color:#2a2a2a;padding:20px;border-radius:8px;margin:20px 0;">
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#f59e0b;">Nombre:</strong> ${solicitud.nombre} ${solicitud.apellidos}</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#f59e0b;">Email:</strong> ${solicitud.email}</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#f59e0b;">DNI:</strong> ${solicitud.dni}</p>
                        ${formatMotivacionAsQA(solicitud.motivacion)}
                      </div>
                      <div style="text-align:center;margin:30px 0;">
                        <a href="${adminUrl}" style="display:inline-block;background:#F59E0B;color:white;padding:14px 35px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
                          Ver Solicitudes Pendientes
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#0a0a0a;padding:20px;text-align:center;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;color:#666;font-size:12px;">Notificación automática — La Clave Admin</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      };
      const info = await adminTransporter.sendMail(mailOptions);
      logger.info('Aviso nueva solicitud enviado', { to: adminEmails, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('❌ Error sendAvisoNuevaSolicitudAdmins:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bienvenida al nuevo socio tras aprobación
   */
  static async sendSolicitudAprobada(user) {
    try {
      const loginUrl = `${process.env.FRONTEND_URL}/login`;
      const mailOptions = {
        from: fromSupport(),
        to: user.email,
        subject: '¡Solicitud aprobada! Bienvenido a La Clave 981',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
              <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#10b981 0%,#34d399 100%);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:32px;">¡Bienvenido, Socio!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 30px;color:#e5e5e5;">
                      <h2 style="color:#10b981;margin:0 0 20px 0;">¡Hola ${user.nombre}!</h2>
                      <p style="line-height:1.6;font-size:16px;margin:0 0 20px 0;">
                        Nos alegra comunicarte que tu solicitud de membresía ha sido <strong style="color:#10b981;">aprobada</strong>. 
                        Ya formas parte de <strong>La Clave Asociación</strong> y tienes acceso completo a todos nuestros eventos y servicios.
                      </p>
                      <div style="background-color:#2a2a2a;border-left:4px solid #10b981;padding:20px;margin:30px 0;border-radius:4px;">
                        <p style="margin:0 0 10px 0;color:#34d399;font-weight:bold;">Tu cuenta de socio:</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#10b981;">Email:</strong> ${user.email}</p>
                        <p style="margin:5px 0;font-size:14px;"><strong style="color:#10b981;">Tipo:</strong> Socio activo</p>
                      </div>
                      <div style="text-align:center;margin:30px 0;">
                        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#F59E0B 0%,#FBBF24 100%);color:white;padding:16px 40px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:16px;">
                          Acceder a mi cuenta
                        </a>
                      </div>
                    <p style="text-align:center;color:#9ca3af;font-size:14px;">¡Te esperamos en el próximo evento! </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#0a0a0a;padding:30px;text-align:center;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      };
      const info = await supportTransporter.sendMail(mailOptions);
      logger.info('Email solicitud aprobada enviado', { to: user.email, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('❌ Error sendSolicitudAprobada:', { error: error.message, to: user.email });
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar al solicitante que su solicitud fue rechazada
   */
  static async sendSolicitudRechazada(solicitud, motivoRechazo) {
    try {
      const mailOptions = {
        from: fromSupport(),
        to: solicitud.email,
        subject: 'Solicitud de socio no aprobada - La Clave Asociación 981',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
              <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#374151 0%,#4b5563 100%);padding:40px 30px;text-align:center;">
                      <h1 style="color:#fff;margin:0;font-size:28px;">Solicitud No Aprobada</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 30px;color:#e5e5e5;">
                      <p style="line-height:1.6;font-size:16px;margin:0 0 20px 0;">
                        Hola <strong>${solicitud.nombre}</strong>,
                      </p>
                      <p style="line-height:1.6;font-size:16px;margin:0 0 20px 0;">
                        Lamentamos informarte que tras revisar tu solicitud, en esta ocasión no ha sido posible aprobarte como socio de <strong>La Clave Asociación</strong>.
                      </p>
                      <div style="background-color:#2a2a2a;border-left:4px solid #ef4444;padding:20px;margin:30px 0;border-radius:4px;">
                        <p style="margin:0 0 10px 0;color:#fca5a5;font-weight:bold;">Motivo:</p>
                        <p style="margin:0;font-size:15px;line-height:1.6;color:#e5e5e5;">${motivoRechazo}</p>
                      </div>
                      <p style="line-height:1.6;font-size:15px;color:#9ca3af;">
                        Si crees que ha sido un error o deseas más información, contacta con nosotros respondiendo a este email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#0a0a0a;padding:30px;text-align:center;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;color:#666;font-size:12px;">© ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      };
      const info = await supportTransporter.sendMail(mailOptions);
      logger.info('Email solicitud rechazada enviado', { to: solicitud.email, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sendSolicitudRechazada:', { error: error.message, to: solicitud.email });
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

    logger.info('Envío masivo completado', {
      emailType,
      totalUsers: users.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }

  /**
   * ================================================================
   * NOTIFICACIÓN DE NUEVO MENSAJE DE CONTACTO (A ADMINS)
   * ================================================================
   * Se envía cuando alguien rellena el formulario público /contacto.
   * El mensaje ya está guardado en BD; este email es solo un aviso.
   */
  static async sendContactNotificationAdmin(contactData, adminEmails) {
    try {
      const adminUrl = `${process.env.FRONTEND_URL}/admin`;

      const mailOptions = {
        from: fromAdmin(),
        to: adminEmails.join(', '),
        subject: `Nuevo mensaje de contacto: ${contactData.asunto}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0a0a0a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
              <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#F59E0B 0%,#FBBF24 100%);padding:30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;">Nuevo Mensaje de Contacto</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px;color:#e5e5e5;">
                      <p style="font-size:15px;margin:0 0 20px 0;">
                        Se ha recibido un nuevo mensaje a través del formulario de contacto.
                      </p>
                      <div style="background-color:#2a2a2a;padding:20px;border-radius:8px;margin:20px 0;">
                        <p style="margin:6px 0;font-size:14px;"><strong style="color:#F59E0B;">Nombre:</strong> ${contactData.nombre}</p>
                        <p style="margin:6px 0;font-size:14px;"><strong style="color:#F59E0B;">Email:</strong> ${contactData.email}</p>
                        <p style="margin:6px 0;font-size:14px;"><strong style="color:#F59E0B;">Asunto:</strong> ${contactData.asunto}</p>
                      </div>
                      <div style="background-color:#1e1e1e;border-left:4px solid #F59E0B;padding:20px;border-radius:4px;margin:20px 0;">
                        <p style="margin:0 0 8px 0;color:#FBBF24;font-weight:bold;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Mensaje:</p>
                        <p style="margin:0;font-size:14px;line-height:1.7;color:#d1d5db;">${contactData.mensaje.replace(/\n/g, '<br>')}</p>
                      </div>
                      <p style="font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
                        Para responder, escribe directamente a: <a href="mailto:${contactData.email}" style="color:#F59E0B;">${contactData.email}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#0a0a0a;padding:20px;text-align:center;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;color:#666;font-size:12px;">Notificación automática — La Clave Admin</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      };

      const info = await adminTransporter.sendMail(mailOptions);
      logger.info('Notificación de contacto enviada a admins', {
        contactId: contactData.id,
        to: adminEmails,
        messageId: info.messageId,
      });
      return { success: true, messageId: info.messageId };

    } catch (error) {
      logger.error('Error sendContactNotificationAdmin:', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
import { noreplyTransporter, fromNoreply } from '../config/mailer.js';
import { query } from '../config/database.js';
import logger from '../config/logger.js';
import Event from '../models/Event.js';
import { ahoraEnMadrid, finEvento } from '../utils/horaMadrid.js';

// Cada avisado tiene 2 h de ventaja antes de avisar al siguiente por esa plaza
const HORAS_VENTAJA = 2;

const escapar = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const enviarAviso = async (persona, event) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const fecha = new Date(event.fecha_evento).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  await noreplyTransporter.sendMail({
    from: fromNoreply(),
    to: persona.email,
    subject: `Se ha liberado una plaza: ${event.titulo}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Se ha liberado una plaza</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px; color: #e5e5e5;">
                    <p style="line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Hola <strong>${escapar(persona.nombre)}</strong>, estabas en la lista de espera de
                      <strong style="color: #f59e0b;">${escapar(event.titulo)}</strong> (${fecha}) y ahora hay una plaza libre.
                    </p>
                    <p style="line-height: 1.6; margin: 0 0 30px 0; font-size: 15px;">
                      La plaza no queda guardada: es para el primero que reserve.
                    </p>
                    <p style="text-align: center; margin: 0;">
                      <a href="${frontendUrl}/eventos" style="display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold;">Reservar mi entrada</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                    <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} La Clave Asociación. Todos los derechos reservados.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

/**
 * Avisa por correo, por orden de llegada, a tantas personas de la lista de
 * espera como plazas libres haya, descontando las avisadas hace menos de
 * HORAS_VENTAJA que aún no han reservado.
 */
export const avisarListaEspera = async () => {
  if (process.env.BOOKINGS_ENABLED === 'false') return;

  const eventos = await query(`
    SELECT DISTINCT e.id
    FROM events e
    INNER JOIN waiting_list w ON w.event_id = e.id AND w.estado = 'esperando'
    WHERE e.estado = 'scheduled' AND e.fecha_evento >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  `);

  for (const { id } of eventos) {
    try {
      const event = await Event.findById(id);
      if (!event || finEvento(event) <= ahoraEnMadrid()) continue;

      const [{ pendientes }] = await query(
        `SELECT COUNT(*) AS pendientes FROM waiting_list
         WHERE event_id = ? AND estado = 'notificado'
           AND fecha_notificacion > DATE_SUB(NOW(), INTERVAL ${HORAS_VENTAJA} HOUR)`,
        [id],
      );

      const aAvisar = (event.entradas_disponibles_real || 0) - Number(pendientes);
      if (aAvisar <= 0) continue;

      const personas = await query(
        `SELECT w.id, u.email, u.nombre
         FROM waiting_list w
         INNER JOIN socios s ON w.socio_id = s.id
         INNER JOIN users u ON s.user_id = u.id
         WHERE w.event_id = ? AND w.estado = 'esperando' AND s.estado = 'activo'
         ORDER BY w.posicion ASC
         LIMIT ${Math.min(aAvisar, 50)}`,
        [id],
      );

      for (const persona of personas) {
        // Se marca antes de enviar: si el envío falla no se le reintenta en bucle
        await query(
          `UPDATE waiting_list SET estado = 'notificado', notificado = 1, fecha_notificacion = NOW()
           WHERE id = ? AND estado = 'esperando'`,
          [persona.id],
        );
        try {
          await enviarAviso(persona, event);
        } catch (emailError) {
          logger.error('Error enviando aviso de lista de espera:', {
            waitingId: persona.id,
            error: emailError.message,
          });
        }
      }

      if (personas.length > 0) {
        logger.info(`Lista de espera avisada: ${personas.length} persona(s) para el evento ${id}`);
      }
    } catch (error) {
      logger.error('Error avisando a la lista de espera:', { eventId: id, error: error.message });
    }
  }
};

export default { avisarListaEspera };
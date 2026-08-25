import { query } from '../config/database.js';


class EventTicketTier {
  static async getByEvent(eventId) {
    try {
      const sql = `
        SELECT * FROM event_ticket_tiers
        WHERE event_id = ?
        ORDER BY orden ASC, fecha_hora_inicio ASC
      `;
      return await query(sql, [eventId]);
    } catch (error) {
      console.error('Error en EventTicketTier.getByEvent:', error);
      throw error;
    }
  }

  /**
   * Reemplaza todas las tandas de un evento por la lista recibida.
   * Se usa al crear/editar el evento desde el admin (guarda de golpe
   * todo el set de tandas del formulario).
   * @param {Number} eventId
   * @param {Array} tandas - [{ nombre, precio, fecha_hora_inicio }]
   */
  static async replaceForEvent(eventId, tandas = []) {
    try {
      await query('DELETE FROM event_ticket_tiers WHERE event_id = ?', [eventId]);

      if (!Array.isArray(tandas) || tandas.length === 0) {
        return [];
      }

      for (let i = 0; i < tandas.length; i++) {
        const t = tandas[i];
        if (!t || !t.nombre || t.precio === undefined || t.precio === null || !t.fecha_hora_inicio) {
          continue; // fila incompleta, se ignora en vez de romper el guardado
        }
        await query(
          `INSERT INTO event_ticket_tiers
            (event_id, nombre, precio, fecha_hora_inicio, orden, activada_manualmente)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            eventId,
            t.nombre,
            parseFloat(t.precio),
            t.fecha_hora_inicio,
            i,
            t.activada_manualmente ? 1 : 0,
          ],
        );
      }

      return await this.getByEvent(eventId);
    } catch (error) {
      console.error('Error en EventTicketTier.replaceForEvent:', error);
      throw error;
    }
  }

  /**
   * Fuerza una tanda como vigente manualmente (desactiva cualquier otra
   * forzada del mismo evento, solo puede haber una a la vez).
   */
  static async activateManually(eventId, tierId) {
    try {
      await query(
        'UPDATE event_ticket_tiers SET activada_manualmente = 0 WHERE event_id = ?',
        [eventId],
      );
      const result = await query(
        'UPDATE event_ticket_tiers SET activada_manualmente = 1 WHERE id = ? AND event_id = ?',
        [tierId, eventId],
      );
      if (result.affectedRows === 0) {
        throw new Error('Tanda no encontrada para este evento');
      }
      return await this.getByEvent(eventId);
    } catch (error) {
      console.error('Error en EventTicketTier.activateManually:', error);
      throw error;
    }
  }

  /**
   * Quita cualquier forzado manual del evento, volviendo al modo
   * automático por fecha/hora.
   */
  static async deactivateManual(eventId) {
    try {
      await query(
        'UPDATE event_ticket_tiers SET activada_manualmente = 0 WHERE event_id = ?',
        [eventId],
      );
      return await this.getByEvent(eventId);
    } catch (error) {
      console.error('Error en EventTicketTier.deactivateManual:', error);
      throw error;
    }
  }

  static async resolveActiveTier(eventId) {
    try {
      const manual = await query(
        `SELECT * FROM event_ticket_tiers
         WHERE event_id = ? AND activada_manualmente = 1
         LIMIT 1`,
        [eventId],
      );
      if (manual.length > 0) return manual[0];

      const auto = await query(
        `SELECT * FROM event_ticket_tiers
         WHERE event_id = ? AND fecha_hora_inicio <= NOW()
         ORDER BY fecha_hora_inicio DESC
         LIMIT 1`,
        [eventId],
      );
      return auto.length > 0 ? auto[0] : null;
    } catch (error) {
      console.error('Error en EventTicketTier.resolveActiveTier:', error);
      throw error;
    }
  }

  /**
   * Devuelve { precio, tier_id } vigente para un evento AHORA MISMO.
   * Si no hay ninguna tanda aplicable, cae al precio_socio base
   * recibido (así los eventos sin tandas siguen funcionando igual).
   */
  static async resolveActivePrice(eventId, precioBase) {
    const tier = await this.resolveActiveTier(eventId);
    return {
      precio: tier ? parseFloat(tier.precio) : parseFloat(precioBase || 0),
      tier_id: tier ? tier.id : null,
    };
  }
}

export default EventTicketTier;
import { query } from "../config/database.js";
import logger from "../config/logger.js";

/**
 * ========================================
 * ACTIVITY LOGGER
 * ========================================
 * Registra acciones del sistema en la tabla `activity_log`
 * para alimentar el panel "Actividad Reciente" del admin.
 *
 * Diseño: fire-and-forget (no bloqueante).
 * Un fallo al escribir el log NUNCA debe romper la petición
 * principal (login, crear reserva, etc.), igual que hacemos
 * con el envío de emails. Por eso esta función no se debe
 * usar con `await` en el flujo crítico: se llama y se sigue.
 *
 * @param {Object} params
 * @param {number|null} params.userId      - ID del usuario que ejecuta la acción (null si es anónimo/sistema)
 * @param {string} params.accion           - 'crear' | 'editar' | 'actualizar' | 'eliminar' | 'login' | 'logout' | 'aprobar' | 'rechazar' | 'cancelar' | 'verificar' | otro
 * @param {string} params.entidadTipo      - 'evento' | 'socio' | 'reserva' | 'pago' | 'usuario' | 'galeria' | etc.
 * @param {number|null} [params.entidadId] - ID de la entidad afectada
 * @param {string} [params.descripcion]    - Texto legible, ej: "Juan Pérez aprobó la solicitud de María López"
 * @param {string} [params.ipAddress]      - IP de origen (normalmente req.ip)
 */
export const registrarActividad = ({
  userId = null,
  accion,
  entidadTipo,
  entidadId = null,
  descripcion = null,
  ipAddress = null,
}) => {
  const sql = `
    INSERT INTO activity_log
      (user_id, accion, entidad_tipo, entidad_id, descripcion, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // No usamos await a propósito: es fire-and-forget.
  query(sql, [userId, accion, entidadTipo, entidadId, descripcion, ipAddress]).catch(
    (error) => {
      // Un fallo aquí no debe afectar la respuesta al cliente,
      // pero sí queremos verlo en los logs de error.
      logger.error("Error al registrar actividad:", {
        message: error.message,
        accion,
        entidadTipo,
        entidadId,
      });
    }
  );
};

/**
 * Helper para extraer la IP real de la request,
 * consistente con el resto del proyecto (authController.js).
 */
export const getIpFromRequest = (req) => {
  return req.ip || req.connection?.remoteAddress || null;
};

export default registrarActividad;
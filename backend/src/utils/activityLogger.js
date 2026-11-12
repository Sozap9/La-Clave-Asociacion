import { query } from "../config/database.js";
import logger from "../config/logger.js";

// Registro en activity_log para la actividad reciente del admin. Sin await:
// un fallo aquí no puede romper la petición.
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

  query(sql, [userId, accion, entidadTipo, entidadId, descripcion, ipAddress]).catch(
    (error) => {
      logger.error("Error al registrar actividad:", {
        message: error.message,
        accion,
        entidadTipo,
        entidadId,
      });
    }
  );
};

// IP real del cliente
export const getIpFromRequest = (req) => {
  return req.ip || req.connection?.remoteAddress || null;
};

export default registrarActividad;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '../..');
const uploadsDir = path.join(backendRoot, 'uploads');

// Carpetas con documentos de identidad: fuera de /uploads público (app.js)
export const CARPETAS_PRIVADAS = ['dni', 'solicitudes'];

const noEncontrado = (res) =>
  res.status(404).json({ success: false, message: 'Documento no encontrado' });

// Envía la imagen de un DNI guardada en la base (ruta de uploads/ o base64 antiguo)
export const enviarDocumento = (res, ruta) => {
  if (!ruta) return noEncontrado(res);

  res.set('Cache-Control', 'private, no-store');

  if (ruta.startsWith('data:')) {
    const match = ruta.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
    if (!match) return noEncontrado(res);
    return res.type(match[1]).send(Buffer.from(match[2], 'base64'));
  }

  // Solo dentro de las carpetas privadas, sin salir de uploads/
  const absoluta = path.resolve(backendRoot, ruta);
  const permitida = CARPETAS_PRIVADAS.some((carpeta) =>
    absoluta.startsWith(path.join(uploadsDir, carpeta) + path.sep),
  );
  if (!permitida || !fs.existsSync(absoluta)) return noEncontrado(res);

  return res.sendFile(absoluta);
};
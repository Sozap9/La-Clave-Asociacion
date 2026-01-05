import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generar código QR para una reserva
 * @param {String} codigoReserva - Código de la reserva
 * @param {Number} bookingId - ID de la reserva
 * @returns {Promise<String>} Ruta del archivo QR generado
 */
export const generateQRCode = async (codigoReserva, bookingId) => {
  try {
    // Crear directorio si no existe
    const qrDir = path.join(__dirname, '../../uploads/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Nombre del archivo
    const filename = `qr-${bookingId}-${Date.now()}.png`;
    const filepath = path.join(qrDir, filename);

    // Datos del QR (JSON con información de la reserva)
    const qrData = JSON.stringify({
      codigo: codigoReserva,
      booking_id: bookingId,
      timestamp: new Date().toISOString()
    });

    // Generar QR code
    await QRCode.toFile(filepath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    // Retornar ruta relativa
    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    console.error('Error generando QR code:', error);
    throw error;
  }
};

/**
 * Generar QR code como base64 (útil para emails)
 * @param {String} codigoReserva - Código de la reserva
 * @param {Number} bookingId - ID de la reserva
 * @returns {Promise<String>} QR code en formato base64
 */
export const generateQRCodeBase64 = async (codigoReserva, bookingId) => {
  try {
    const qrData = JSON.stringify({
      codigo: codigoReserva,
      booking_id: bookingId,
      timestamp: new Date().toISOString()
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generando QR code base64:', error);
    throw error;
  }
};

/**
 * Verificar código QR
 * @param {String} qrData - Datos escaneados del QR
 * @returns {Object} Datos decodificados del QR
 */
export const verifyQRCode = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    
    if (!data.codigo || !data.booking_id) {
      throw new Error('QR code inválido');
    }

    return data;
  } catch (error) {
    console.error('Error verificando QR code:', error);
    throw new Error('QR code inválido o corrupto');
  }
};

/**
 * Eliminar archivo QR
 * @param {String} qrPath - Ruta del archivo QR
 * @returns {Boolean} true si se eliminó
 */
export const deleteQRCode = (qrPath) => {
  try {
    const fullPath = path.join(__dirname, '../..', qrPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando QR code:', error);
    return false;
  }
};

export default {
  generateQRCode,
  generateQRCodeBase64,
  verifyQRCode,
  deleteQRCode
};